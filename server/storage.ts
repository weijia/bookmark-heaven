import { getDbInstance as getDb } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { 
  bookmarks, apiTokens, systemSettings,
  type Bookmark, type InsertBookmark, 
  type ApiToken, type SystemSetting
} from "@shared/schema";
import { users, type User } from "@shared/models/auth";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(username: string, email: string, passwordHash: string): Promise<User>;
  
  // Bookmarks
  getBookmarks(options: { 
    userId?: number,
    page: number, 
    limit: number,
    search?: string,
    isPublic?: boolean
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
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(username: string, email: string, passwordHash: string): Promise<User> {
    const [user] = await getDb().insert(users).values({ username, email, passwordHash }).returning();
    return user;
  }

  async getBookmarks(options: { 
    userId?: number, 
    page: number, 
    limit: number,
    search?: string,
    isPublic?: boolean 
  }): Promise<{ items: (Bookmark & { username?: string })[], total: number }> {
    const offset = (options.page - 1) * options.limit;
    
    const conditions = [];
    if (options.userId) {
      conditions.push(eq(bookmarks.userId, options.userId));
    }
    if (options.isPublic !== undefined) {
      conditions.push(eq(bookmarks.isPublic, options.isPublic));
    }
    if (options.search) {
      conditions.push(
        sql`(${bookmarks.title} ILIKE ${`%${options.search}%`} OR ${bookmarks.url} ILIKE ${`%${options.search}%`} OR ${bookmarks.description} ILIKE ${`%${options.search}%`})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await getDb()
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(whereClause);
      
    const total = Number(countResult.count);
    
    const items = await getDb()
      .select({
        ...bookmarks,
        username: users.firstName,
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
    const [bookmark] = await getDb().select().from(bookmarks).where(eq(bookmarks.id, id));
    return bookmark;
  }

  async createBookmark(bookmark: InsertBookmark & { userId: number }): Promise<Bookmark> {
    const [newBookmark] = await getDb().insert(bookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async updateBookmark(id: number, updates: Partial<InsertBookmark>): Promise<Bookmark> {
    const [updated] = await getDb()
      .update(bookmarks)
      .set(updates)
      .where(eq(bookmarks.id, id))
      .returning();
    return updated;
  }

  async deleteBookmark(id: number): Promise<void> {
    await getDb().delete(bookmarks).where(eq(bookmarks.id, id));
  }

  async getApiTokens(userId: number): Promise<ApiToken[]> {
    return await getDb().select().from(apiTokens).where(eq(apiTokens.userId, userId));
  }

  async createApiToken(userId: number, token: string, label?: string): Promise<ApiToken> {
    const [newToken] = await getDb().insert(apiTokens).values({ userId, token, label }).returning();
    return newToken;
  }

  async deleteApiToken(id: number): Promise<void> {
    await getDb().delete(apiTokens).where(eq(apiTokens.id, id));
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    const result = await db
      .select({ user: users })
      .from(apiTokens)
      .innerJoin(users, eq(apiTokens.userId, users.id))
      .where(eq(apiTokens.token, token))
      .limit(1);
      
    return result[0]?.user;
  }

  async getSystemSetting(key: string): Promise<string | undefined> {
    const [setting] = await getDb().select().from(systemSettings).where(eq(systemSettings.key, key));
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
