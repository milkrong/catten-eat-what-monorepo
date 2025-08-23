export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  ingredients: Ingredient[] | null;
  steps: Step[] | null;
  calories: number | null;
  cookingTime: number | null;
  nutritionFacts: NutritionFacts | null;
  cuisineType: string[] | null;
  dietType: string[] | null;
  createdBy: string | null;
  views: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  isFavorite?: boolean;
  img?: string;
}
export interface DBRecipe extends Recipe {
  cooking_time: number | null;
  cuisine_type: string[] | null;
  diet_type: string[] | null;
  nutrition_facts: NutritionFacts | null;
}

export interface RecipeFilters {
  cuisine_type?: string;

  max_cooking_time?: number;
  diet_type?: string[];
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
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}
