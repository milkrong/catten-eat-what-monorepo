export interface DietaryPreferences {
  id: string;
  dietType: string[] | null;
  cuisineType: string[] | null;
  allergies: string[] | null;
  restrictions: string[] | null;
  caloriesMin: number | null;
  caloriesMax: number | null;
  maxCookingTime: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface RecommendationRequest {
  preferences: DietaryPreferences;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  excludeRecipes?: string[];
  provider?: 'dify' | 'coze' | 'ollama' | 'deepseek';
}
