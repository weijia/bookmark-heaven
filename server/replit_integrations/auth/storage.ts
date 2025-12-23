import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(replitId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(replitId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitId, replitId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.replitId) {
      throw new Error("replitId is required for upserting user");
    }
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.replitId,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
