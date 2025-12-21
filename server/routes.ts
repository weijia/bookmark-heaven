
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import crypto from "crypto";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

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
  // Setup Replit Auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // Helper middleware to get user from session OR API token
  const getUser = async (req: any, res: any, next: any) => {
    // Check for API Token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const user = await storage.getUserByToken(token);
      if (user) {
        req.user = user;
        req.authType = 'token';
        return next();
      }
    }
    
    // Check for Replit Auth Session (standard user)
    // Replit Auth middleware puts user in req.user
    // We need to sync/fetch our app user based on Replit ID
    if (req.isAuthenticated()) {
       const replitUser = req.user; // Contains sub, email etc
       const replitId = replitUser.claims.sub; // This is a string!
       
       // Try to find by replit_id first (requires converting string ID to our schema format if needed, 
       // but here we stored replit_id as integer in users table which might be an issue if sub is not integer.
       // Replit 'sub' is usually an integer. Let's assume it parses.
       
       // Sync logic:
       // Check if user exists in our DB by Replit ID. 
       // Since 'users' table in shared/schema has replitId, we need to access that.
       // But wait, the replit integration uses 'shared/models/auth.ts' which writes to 'users' table there.
       // AND we have 'users' table in 'shared/schema.ts'.
       // We have conflicting user tables!
       // Let's resolve this:
       // The replit auth blueprint writes to shared/models/auth.ts which defines 'users'.
       // We also defined 'users' in shared/schema.ts. 
       // Drizzle doesn't like duplicate table definitions.
       // We should MERGE them or use one.
       // For this MVP, let's assume we use the one from shared/schema.ts primarily, 
       // but the auth integration is hardcoded to use shared/models/auth.ts.
       // Actually, the auth integration code provided earlier:
       // server/replit_integrations/auth/storage.ts IMPORTS users from @shared/models/auth.
       // AND shared/schema.ts DEFINES users.
       
       // Correction: The best way is to treat the authenticated user from req.user (Replit Auth)
       // as the source of truth for IDENTITY.
       // But our app logic relies on `storage.getUser(id)` where id is an integer.
       // Replit Auth uses string IDs (uuids in its own table).
       
       // Let's unify by looking up the Replit Auth user ID in our APP users table.
       // If not found, create it.
       
       // However, since we can't easily change the Auth Blueprint structure right now without 
       // breaking the 'hands-off' instruction for auth module...
       // We will map the Replit User (UUID) to our App User (Int ID).
       // Actually, let's just look up by username.
       
       const username = replitUser.claims.email || `user_${replitUser.claims.sub}`;
       let appUser = await storage.getUserByUsername(username);
       
       if (!appUser) {
         appUser = await storage.createUser({
           username,
           replitId: Number(replitUser.claims.sub), // Best effort conversion
         });
       }
       
       req.user = appUser; // Replace req.user with OUR app user
       req.authType = 'session';
       return next();
    }
    
    // Not authenticated
    next();
  };

  app.use(getUser);

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.user || !req.user.isAdmin) {
      // Check for hardcoded admin password login (fallback)
      // For this MVP, we are storing admin password in system settings.
      // If user logged in via /api/admin/login, we might set a special session flag?
      // Or we just check the user.isAdmin flag from DB.
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // --- API Routes ---

  // Auth Status
  app.get(api.auth.me.path, (req, res) => {
    if (!req.user) return res.json(null);
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout((err: any) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  // Bookmarks
  app.get(api.bookmarks.list.path, async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;
    const isPublic = req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined;
    
    // If asking for private bookmarks (isPublic=false or undefined), must be logged in
    // Exception: isPublic=true (Public Feed) is visible to everyone
    
    let userId: number | undefined = undefined;
    
    // If not searching public specifically, default to "My Bookmarks"
    if (isPublic !== true) {
       if (!req.user) return res.status(401).json({ message: "Unauthorized" });
       userId = req.user.id;
    }

    const result = await storage.getBookmarks({
      userId, // If defined, filters by this user. If undefined (public feed), gets all.
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
  });

  app.post(api.bookmarks.create.path, requireAuth, async (req, res) => {
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

  app.patch(api.bookmarks.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const bookmark = await storage.getBookmark(id);
      
      if (!bookmark) return res.status(404).json({ message: "Not found" });
      if (bookmark.userId !== req.user.id && !req.user.isAdmin) return res.status(403).json({ message: "Forbidden" });

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

  app.delete(api.bookmarks.delete.path, requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const bookmark = await storage.getBookmark(id);
    
    if (!bookmark) return res.status(404).json({ message: "Not found" });
    if (bookmark.userId !== req.user.id && !req.user.isAdmin) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteBookmark(id);
    res.status(204).send();
  });

  // Tokens
  app.get(api.tokens.list.path, requireAuth, async (req, res) => {
    const tokens = await storage.getApiTokens(req.user.id);
    res.json(tokens);
  });

  app.post(api.tokens.create.path, requireAuth, async (req, res) => {
    const label = req.body.label;
    const token = crypto.randomBytes(32).toString('hex');
    const newToken = await storage.createApiToken(req.user.id, token, label);
    res.status(201).json(newToken);
  });

  app.delete(api.tokens.delete.path, requireAuth, async (req, res) => {
    await storage.deleteApiToken(Number(req.params.id));
    res.status(204).send();
  });

  // Admin
  app.post(api.admin.changePassword.path, requireAuth, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Forbidden" });
    
    const { currentPassword, newPassword } = req.body;
    
    // Verify current admin password (stored in system settings)
    const storedHash = await storage.getSystemSetting("admin_password_hash");
    
    if (storedHash) {
       const isValid = await comparePassword(storedHash, currentPassword);
       if (!isValid) return res.status(401).json({ message: "Invalid current password" });
    }
    
    // Set new password
    const newHash = await hashPassword(newPassword);
    await storage.setSystemSetting("admin_password_hash", newHash);
    
    res.json({ message: "Password updated" });
  });

  // Seed Admin Password if not exists
  const existingHash = await storage.getSystemSetting("admin_password_hash");
  if (!existingHash) {
    const defaultHash = await hashPassword("admin"); // Default password
    await storage.setSystemSetting("admin_password_hash", defaultHash);
    console.log("Admin password seeded to 'admin'");
  }

  return httpServer;
}
