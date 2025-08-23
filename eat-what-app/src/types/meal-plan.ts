import type { Recipe } from './recipe';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlan {
  id: string;
  date: string;
  mealType: MealType;
  recipe: Recipe;
  portions: number;
  notes?: string;
}

export type DailyMealPlan = Record<MealType, MealPlan[]>;

export const mealType_CONFIG = {
  breakfast: {
    label: '早餐',
    color: '#FFB74D',
    icon: 'coffee',
    timeRange: '06:00 - 09:00',
  },
  lunch: {
    label: '午餐',
    color: '#4CAF50',
    icon: 'cutlery',
    timeRange: '11:30 - 13:30',
  },
  dinner: {
    label: '晚餐',
    color: '#7E57C2',
    icon: 'moon-o',
    timeRange: '17:30 - 19:30',
  },
  snack: {
    label: '加餐',
    color: '#FF7043',
    icon: 'cookie',
    timeRange: '14:00 - 16:00',
  },
} as const;
