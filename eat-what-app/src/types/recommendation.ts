import type { Recipe as RecipeType } from './recipe';
import type { MealType } from './meal-plan';
import type { Settings } from '@/stores/useGlobalStore';

export type DietType = string;

export interface DietaryPreferences {
  dietType: DietType[];
  cuisineType: string[];
  allergies: string[];
  restrictions: string[];
  caloriesMin: number;
  caloriesMax: number;
  maxCookingTime: number;
  mealsPerDay: number;
  llmService?: Settings['llmService'];
  createdAt?: string;
  updatedAt?: string;
}

export interface RecommendationRequest {
  preferences: DietaryPreferences;
  mealType?: MealType;
  excludeRecipes?: string[];
}

export interface SingleRecommendation {
  recipe: RecipeType;
  reason: string;
  matchScore: number; // 0-100
  tags: string[];
}

export interface WeeklyRecommendation {
  id: string;
  startDate: string;
  endDate: string;
  days: DailyRecommendation[];
}

export interface RecommendationFeedItem extends SingleRecommendation {
  created_at: string;
  is_favorite: boolean;
}

// 偏好设置配置
export const PREFERENCE_CONFIG = {
  dietTypes: {
    label: '饮食类型',
    icon: 'leaf',
    color: '#4CAF50',
  },
  allergies: {
    label: '过敏原',
    icon: 'exclamation-triangle',
    color: '#FF5252',
  },
  targetCalories: {
    label: '目标热量',
    icon: 'fire',
    color: '#FF7043',
    unit: 'kcal',
  },
  maxCookingTime: {
    label: '烹饪时间限制',
    icon: 'clock-o',
    color: '#7E57C2',
    unit: '分钟',
  },
  cuisineTypes: {
    label: '偏好菜系',
    icon: 'cutlery',
    color: '#00BCD4',
  },
  restrictions: {
    label: '其他限制',
    icon: 'ban',
    color: '#FF5252',
  },
  mealsPerDay: {
    label: '每日餐数',
    icon: 'calendar',
    color: '#9C27B0',
    unit: '餐',
  },
} as const;

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface NutritionFacts {
  calories?: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface Recipe {
  name: string;
  calories: number;
  cookingTime: number;
  cuisineType: string[];
  dietType: string[];
  ingredients: Ingredient[];
  nutritionFacts: NutritionFacts;
  steps: string[];
  img?: string;
}

export type DailyRecommendation = Recipe[];

export interface RecommendationState {
  currentRecommendation: Recipe | null;
  dailyRecommendation: DailyRecommendation | null;
  singleLoading: boolean;
  dailyLoading: boolean;
  error: string | null;
  fetchRecommendation: (
    preferences: Partial<DietaryPreferences>,
    excludeRecipes?: string[]
  ) => Promise<void>;
  fetchDailyRecommendation: (
    preferences: Partial<DietaryPreferences>
  ) => Promise<void>;
}
