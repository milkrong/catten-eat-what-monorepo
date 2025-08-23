export type LLMService = "coze" | "deepseek" | "siliconflow" | "ark" | "custom" | "dify";

export interface DietaryPreferences {
  id: string;
  dietType?: string[];
  cuisineType?: string[];
  allergies?: string[];
  restrictions?: string[];
  caloriesMin?: number;
  caloriesMax?: number;
  maxCookingTime?: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RecommendationRequest {
  preferences: DietaryPreferences;
  mealType?: "breakfast" | "lunch" | "dinner";
  excludeRecipes?: string[];
  provider?: LLMService;
  userId?: string;
}
