import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
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

  // --- Bookmarks ---
  app.get(api.bookmarks.list.path, async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string;
      const isPublic = req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined;
      
      let userId: string | undefined = undefined;
      
      // If asking for non-public bookmarks, must be authenticated
      if (isPublic !== true) {
        if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
        userId = req.user.claims.sub;
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

  app.post(api.bookmarks.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.bookmarks.create.input.parse(req.body);
      const bookmark = await storage.createBookmark({
        ...input,
        userId: req.user.claims.sub
      });
      res.status(201).json(bookmark);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.bookmarks.update.path, isAuthenticated, async (req: any, res) => {
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

  app.delete(api.bookmarks.delete.path, isAuthenticated, async (req: any, res) => {
    const id = Number(req.params.id);
    const bookmark = await storage.getBookmark(id);
    
    if (!bookmark) return res.status(404).json({ message: "Not found" });
    if (bookmark.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteBookmark(id);
    res.status(204).send();
  });

  // --- API Tokens ---
  app.get(api.tokens.list.path, isAuthenticated, async (req: any, res) => {
    const tokens = await storage.getApiTokens(req.user.claims.sub);
    res.json(tokens);
  });

  app.post(api.tokens.create.path, isAuthenticated, async (req: any, res) => {
    const label = req.body.label;
    const token = crypto.randomBytes(32).toString('hex');
    const newToken = await storage.createApiToken(req.user.claims.sub, token, label);
    res.status(201).json(newToken);
  });

  app.delete(api.tokens.delete.path, isAuthenticated, async (req: any, res) => {
    await storage.deleteApiToken(Number(req.params.id));
    res.status(204).send();
  });

  // --- Admin ---
  app.post(api.admin.changePassword.path, isAuthenticated, async (req: any, res) => {
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
