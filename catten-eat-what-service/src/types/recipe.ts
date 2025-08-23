import type { InferModel } from 'drizzle-orm';
import type { recipes } from '../db/schema';

export type Recipe = InferModel<typeof recipes>;
export type NewRecipe = InferModel<typeof recipes, 'insert'>;

export interface RecipeFilters {
  cuisineType?: string;
  maxCookingTime?: number;
  dietType?: string[];
  createdBy?: string;
  page?: number;
  limit?: number;
  name?: string;
  minCalories?: number;
  maxCalories?: number;
  sortBy?: 'name' | 'createdAt' | 'views' | 'cookingTime' | 'calories';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Step {
  order: number;
  description: string;
}

export interface NutritionFacts {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}
