import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../types/recipe';

describe('RecipeService', () => {
  let recipeService: RecipeService;
  let mockSupabase: any;

  beforeEach(() => {
    // 创建 mock supabase 客户端
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [mockRecipe],
              error: null,
            })),
          })),
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: mockRecipe,
              error: null,
            })),
          })),
          limit: vi.fn(() => ({
            data: [mockRecipe],
            error: null,
          })),
        })),
      })),
      rpc: vi.fn(() => ({
        data: null,
        error: null,
      })),
    };

    recipeService = new RecipeService(mockSupabase);
  });

  const mockRecipe: Recipe = {
    id: '1',
    name: '测试食谱',
    description: '这是一个测试食谱',
    ingredients: [{ name: '食材1', amount: 100, unit: 'g' }],
    steps: [{ order: 1, description: '步骤1' }],
    calories: 200,
    cooking_time: 30,
    nutrition_facts: { protein: 10, carbs: 20, fat: 5, fiber: 3 },
    cuisine_type: 'chinese',
    diet_type: ['vegetarian'],
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    views: 0,
  };

  describe('getPopularRecipes', () => {
    it('should return popular recipes', async () => {
      const recipes = await recipeService.getPopularRecipes(10);
      expect(recipes).toHaveLength(1);
      expect(recipes[0]).toEqual(mockRecipe);
    });

    it('should handle errors', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: null,
              error: new Error('Database error'),
            })),
          })),
        })),
      }));

      await expect(recipeService.getPopularRecipes(10)).rejects.toThrow(
        'Database error'
      );
    });
  });

  // ... 其他测试用例
});
