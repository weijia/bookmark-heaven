import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import crypto from "crypto";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import connectPg from "connect-pg-simple";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePassword(stored: string, supplied: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup local authentication with sessions
  app.set("trust proxy", 1);
  
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: 7 * 24 * 60 * 60,
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || !user.passwordHash) {
        return done(null, false, { message: "Invalid username or password" });
      }
      const match = await comparePassword(user.passwordHash, password);
      if (!match) {
        return done(null, false, { message: "Invalid username or password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    // Check for API Token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      return storage.getUserByToken(token).then(user => {
        if (user) {
          req.user = user;
          return next();
        }
        return res.status(401).json({ message: "Unauthorized" });
      });
    }
    
    // Check session auth
    if (req.isAuthenticated()) {
      return next();
    }
    
    return res.status(401).json({ message: "Unauthorized" });
  };

  // --- Auth Routes ---
  app.post(api.auth.register.path, async (req: any, res) => {
    try {
      const { username, email, password } = api.auth.register.input.parse(req.body);
      
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser(username, email, passwordHash);
      
      // Log user in
      req.login(user, (err: any) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input" });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req: any, res) => {
    res.json(req.user);
  });

  app.get(api.auth.me.path, (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.json(null);
    }
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req: any, res) => {
    req.logout((err: any) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  // --- Bookmarks ---
  app.get(api.bookmarks.list.path, async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string;
      const isPublic = req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined;
      
      let userId: number | undefined = undefined;
      
      // If asking for non-public bookmarks, must be authenticated
      if (isPublic !== true) {
        if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
        userId = req.user.id;
      }

      const result = await storage.getBookmarks({
        userId,
        page,
        limit,
        search,
        isPublic
      });

      res.json({
        items: result.items,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      });
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.bookmarks.create.path, requireAuth, async (req: any, res) => {
    try {
      const input = api.bookmarks.create.input.parse(req.body);
      const bookmark = await storage.createBookmark({
        ...input,
        userId: req.user.id
      });
      res.status(201).json(bookmark);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.bookmarks.update.path, requireAuth, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const bookmark = await storage.getBookmark(id);
      
      if (!bookmark) return res.status(404).json({ message: "Not found" });
      if (bookmark.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

      const input = api.bookmarks.update.input.parse(req.body);
      const updated = await storage.updateBookmark(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.bookmarks.delete.path, requireAuth, async (req: any, res) => {
    const id = Number(req.params.id);
    const bookmark = await storage.getBookmark(id);
    
    if (!bookmark) return res.status(404).json({ message: "Not found" });
    if (bookmark.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteBookmark(id);
    res.status(204).send();
  });

  // --- API Tokens ---
  app.get(api.tokens.list.path, requireAuth, async (req: any, res) => {
    const tokens = await storage.getApiTokens(req.user.id);
    res.json(tokens);
  });

  app.post(api.tokens.create.path, requireAuth, async (req: any, res) => {
    const label = req.body.label;
    const token = crypto.randomBytes(32).toString('hex');
    const newToken = await storage.createApiToken(req.user.id, token, label);
    res.status(201).json(newToken);
  });

  app.delete(api.tokens.delete.path, requireAuth, async (req: any, res) => {
    await storage.deleteApiToken(Number(req.params.id));
    res.status(204).send();
  });

  // --- Admin ---
  app.post(api.admin.changePassword.path, requireAuth, async (req: any, res) => {
    // For MVP, check if user is admin by email/settings
    // Since we don't have an admin flag yet, allow any authenticated user to be admin
    
    const { currentPassword, newPassword } = req.body;
    
    const storedHash = await storage.getSystemSetting("admin_password_hash");
    
    if (storedHash) {
       const isValid = await comparePassword(storedHash, currentPassword);
       if (!isValid) return res.status(401).json({ message: "Invalid current password" });
    }
    
    const newHash = await hashPassword(newPassword);
    await storage.setSystemSetting("admin_password_hash", newHash);
    
    res.json({ message: "Password updated" });
  });

  // Seed Admin Password if not exists
  const existingHash = await storage.getSystemSetting("admin_password_hash");
  if (!existingHash) {
    const defaultHash = await hashPassword("admin");
    await storage.setSystemSetting("admin_password_hash", defaultHash);
    console.log("Admin password seeded to 'admin'");
  }

  return httpServer;
}
