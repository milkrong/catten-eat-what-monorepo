export interface MealPlan {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  recipe_id: string;
  created_at: string | null;
  updated_at: string | null;
}
