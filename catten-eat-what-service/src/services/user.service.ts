import { eq, and } from 'drizzle-orm';
import { db } from '../config/db';
import { profiles, preferences, settings, favorites } from '../db/schema';
import type { ProfileWithRelations } from '../db/schema';
import type { NewPreference } from '../types/preference';
import type { NewSetting } from '../types/setting';

export class UserService {
  async getUserInfo(userId: string) {
    const userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      with: {
        preferences: true,
        settings: true,
        favorites: {
          with: {
            recipe: true,
          },
        },
      },
    }) as ProfileWithRelations | null;

    if (!userProfile) {
      return null;
    }

    const { preferences, settings, favorites, ...profile } = userProfile;

    return {
      profile: {
        id: profile.id,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      preferences,
      settings,
      favorites,
    };
  }

  async getProfile(userId: string) {
    return await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });
  }

  async updateProfile(userId: string, updates: Partial<typeof profiles.$inferInsert>) {
    const [updated] = await db
      .update(profiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();
    console.log('updated', updated);
    return updated;
  }

  async getFavorites(userId: string) {
    return await db.query.favorites.findMany({
      where: eq(favorites.userId, userId),
      with: {
        recipe: true,
      },
    });
  }

  async addFavorite(userId: string, recipeId: string) {
    const [favorite] = await db
      .insert(favorites)
      .values({
        userId,
        recipeId,
      })
      .returning();

    return favorite;
  }

  async removeFavorite(userId: string, recipeId: string) {
    await db
      .delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.recipeId, recipeId)
      ));
  }

  async getPreferences(userId: string) {
    return await db.query.preferences.findFirst({
      where: eq(preferences.id, userId),
    });
  }

  async upsertPreferences(userId: string, updates: NewPreference) {
    const [updated] = await db
      .insert(preferences)
      .values({
        ...updates,
        id: userId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: preferences.id,
        set: {
          ...updates,
          updatedAt: new Date(),
        },
      })
      .returning();

    return updated;
  }

  async getSettings(userId: string) {
    return await db.query.settings.findFirst({
      where: eq(settings.userId, userId),
      columns: {
        apiKey: false,
      },
    });
  }

  async upsertSettings(userId: string, updates: NewSetting) {
    const [updated] = await db
      .insert(settings)
      .values({
        ...updates,
        userId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: settings.userId,
        set: {
          ...updates,
          updatedAt: new Date(),
        },
      })
      .returning();

    return updated;
  }

  async createProfile(userId: string, data: Partial<typeof profiles.$inferInsert>) {
    const [profile] = await db
      .insert(profiles)
      .values({
        id: userId,
        username: data.username,
        avatarUrl: data.avatarUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return profile;
  }
} 