
import { db } from "./db";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { 
  users, bookmarks, apiTokens, systemSettings,
  type User, type InsertUser, type Bookmark, type InsertBookmark, 
  type ApiToken, type SystemSetting
} from "@shared/schema";

export interface IStorage {
  // Users (in addition to auth/storage.ts)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserAdmin(id: number, isAdmin: boolean): Promise<User>;
  
  // Bookmarks
  getBookmarks(options: { 
    userId?: number, // If provided, filter by user
    page: number, 
    limit: number,
    search?: string,
    isPublic?: boolean // If true, only public. If undefined, all.
  }): Promise<{ items: (Bookmark & { username?: string })[], total: number }>;
  
  getBookmark(id: number): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark & { userId: number }): Promise<Bookmark>;
  updateBookmark(id: number, updates: Partial<InsertBookmark>): Promise<Bookmark>;
  deleteBookmark(id: number): Promise<void>;

  // API Tokens
  getApiTokens(userId: number): Promise<ApiToken[]>;
  createApiToken(userId: number, token: string, label?: string): Promise<ApiToken>;
  deleteApiToken(id: number): Promise<void>;
  getUserByToken(token: string): Promise<User | undefined>;

  // System Settings
  getSystemSetting(key: string): Promise<string | undefined>;
  setSystemSetting(key: string, value: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUserAdmin(id: number, isAdmin: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isAdmin })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Bookmark methods
  async getBookmarks(options: { 
    userId?: number, 
    page: number, 
    limit: number,
    search?: string,
    isPublic?: boolean 
  }): Promise<{ items: (Bookmark & { username?: string })[], total: number }> {
    const offset = (options.page - 1) * options.limit;
    
    // Build where clause
    const conditions = [];
    if (options.userId) {
      conditions.push(eq(bookmarks.userId, options.userId));
    }
    if (options.isPublic !== undefined) {
      conditions.push(eq(bookmarks.isPublic, options.isPublic));
    }
    if (options.search) {
      conditions.push(
        // Simple search in title, url, description
        sql`(${bookmarks.title} ILIKE ${`%${options.search}%`} OR ${bookmarks.url} ILIKE ${`%${options.search}%`} OR ${bookmarks.description} ILIKE ${`%${options.search}%`})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(whereClause);
      
    const total = Number(countResult.count);
    
    // Join with users to get username for public feed
    const items = await db
      .select({
        ...bookmarks,
        username: users.username,
      })
      .from(bookmarks)
      .leftJoin(users, eq(bookmarks.userId, users.id))
      .where(whereClause)
      .limit(options.limit)
      .offset(offset)
      .orderBy(desc(bookmarks.createdAt));

    return { items, total };
  }

  async getBookmark(id: number): Promise<Bookmark | undefined> {
    const [bookmark] = await db.select().from(bookmarks).where(eq(bookmarks.id, id));
    return bookmark;
  }

  async createBookmark(bookmark: InsertBookmark & { userId: number }): Promise<Bookmark> {
    const [newBookmark] = await db.insert(bookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async updateBookmark(id: number, updates: Partial<InsertBookmark>): Promise<Bookmark> {
    const [updated] = await db
      .update(bookmarks)
      .set(updates)
      .where(eq(bookmarks.id, id))
      .returning();
    return updated;
  }

  async deleteBookmark(id: number): Promise<void> {
    await db.delete(bookmarks).where(eq(bookmarks.id, id));
  }

  // API Token methods
  async getApiTokens(userId: number): Promise<ApiToken[]> {
    return await db.select().from(apiTokens).where(eq(apiTokens.userId, userId));
  }

  async createApiToken(userId: number, token: string, label?: string): Promise<ApiToken> {
    const [newToken] = await db.insert(apiTokens).values({ userId, token, label }).returning();
    return newToken;
  }

  async deleteApiToken(id: number): Promise<void> {
    await db.delete(apiTokens).where(eq(apiTokens.id, id));
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    // Join tokens with user to get user info
    const result = await db
      .select({ user: users })
      .from(apiTokens)
      .innerJoin(users, eq(apiTokens.userId, users.id))
      .where(eq(apiTokens.token, token))
      .limit(1);
      
    return result[0]?.user;
  }

  // System Settings methods
  async getSystemSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting?.value;
  }

  async setSystemSetting(key: string, value: string): Promise<void> {
    await db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value },
      });
  }
}

export const storage = new DatabaseStorage();
