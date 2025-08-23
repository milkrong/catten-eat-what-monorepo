import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, date } from 'drizzle-orm/pg-core';
import { relations, type InferModel } from 'drizzle-orm';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username').unique(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const profilesRelations = relations(profiles, ({ one, many }: { one: any; many: any }) => ({
  preferences: one(preferences, {
    fields: [profiles.id],
    references: [preferences.id],
  }),
  settings: one(settings, {
    fields: [profiles.id],
    references: [settings.userId],
  }),
  favorites: many(favorites),
}));

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  ingredients: jsonb('ingredients'),
  steps: jsonb('steps'),
  calories: integer('calories'),
  cookingTime: integer('cooking_time'),
  nutritionFacts: jsonb('nutrition_facts'),
  cuisineType: text('cuisine_type'),
  dietType: text('diet_type').array(),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  views: integer('views').default(0),
  img: text('img')
});

export const recipesRelations = relations(recipes, ({ many }: { many: any }) => ({
  favorites: many(favorites),
}));

export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const favoritesRelations = relations(favorites, ({ one }: { one: any }) => ({
  profile: one(profiles, {
    fields: [favorites.userId],
    references: [profiles.id],
  }),
  recipe: one(recipes, {
    fields: [favorites.recipeId],
    references: [recipes.id],
  }),
}));

export const mealPlans = pgTable('meal_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  mealType: text('meal_type').notNull(),
  recipeId: uuid('recipe_id').references(() => recipes.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
  profile: one(profiles, {
    fields: [mealPlans.userId],
    references: [profiles.id],
  }),
  recipe: one(recipes, {
    fields: [mealPlans.recipeId],
    references: [recipes.id],
  }),
}));

export const preferences = pgTable('preferences', {
  id: uuid('id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  dietType: text('diet_type').array(),
  restrictions: text('restrictions').array(),
  allergies: text('allergies').array(),
  caloriesMin: integer('calories_min'),
  caloriesMax: integer('calories_max'),
  maxCookingTime: integer('max_cooking_time'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  cuisineType: text('cuisine_type').array(),
  mealsPerDay: integer('meals_per_day')
});

export const preferencesRelations = relations(preferences, ({ one }: { one: any }) => ({
  profile: one(profiles, {
    fields: [preferences.id],
    references: [profiles.id],
  }),
}));

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id).unique().notNull(),
  llmService: text('llm_service').notNull(),
  modelName: text('model_name'),
  isPaid: boolean('is_paid').default(true),
  apiKey: text('api_key'),
  apiEndpoint: text('api_endpoint'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const settingsRelations = relations(settings, ({ one }: { one: any }) => ({
  profile: one(profiles, {
    fields: [settings.userId],
    references: [profiles.id],
  }),
}));

export type Profile = InferModel<typeof profiles>;
export type ProfileWithRelations = Profile & {
  preferences: Preference | null;
  settings: Setting | null;
  favorites: (Favorite & { recipe: Recipe })[];
};

export type Recipe = InferModel<typeof recipes>;
export type Preference = InferModel<typeof preferences>;
export type Setting = InferModel<typeof settings>;
export type Favorite = InferModel<typeof favorites>;
export type MealPlan = InferModel<typeof mealPlans>;
export type MealPlanWithRelations = MealPlan & {
  recipe: Recipe | null;
  profile: Profile | null;
}; 