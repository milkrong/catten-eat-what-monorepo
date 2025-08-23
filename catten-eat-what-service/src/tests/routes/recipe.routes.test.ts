import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { recipeRoutes } from '../../routes/recipe.routes';
import { Recipe } from '../../types/recipe';

describe('Recipe Routes', () => {
  let app: Hono;
  let mockRecipeService: any;

  const mockRecipes: Recipe[] = [
    {
      id: '1',
      name: '食谱1',
      description: '这是食谱1的描述',
      ingredients: [{ name: '食材1', amount: 100, unit: 'g' }],
      steps: [{ order: 1, description: '步骤1' }],
      calories: 200,
      cooking_time: 30,
      nutrition_facts: { protein: 10, carbs: 20, fat: 5, fiber: 3 },
      cuisine_type: ['chinese food'],
      diet_type: ['vegetarian'],
      created_by: 'user1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      views: 0,
    },
    {
      id: '2',
      name: '食谱2',
      description: '这是食谱2的描述',
      ingredients: [{ name: '食材2', amount: 200, unit: 'ml' }],
      steps: [{ order: 1, description: '步骤1' }],
      calories: 300,
      cooking_time: 45,
      nutrition_facts: { protein: 15, carbs: 25, fat: 8, fiber: 4 },
      cuisine_type: ['western food'],
      diet_type: ['keto'],
      created_by: 'user2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      views: 0,
    },
  ];

  beforeEach(() => {
    app = new Hono();

    // Mock RecipeService
    mockRecipeService = {
      getRecipes: vi.fn(),
      getRecipeById: vi.fn(),
      createRecipe: vi.fn(),
      updateRecipe: vi.fn(),
      deleteRecipe: vi.fn(),
    };

    app.route('/recipes', recipeRoutes);
  });

  describe('GET /recipes', () => {
    it('should return recipes list', async () => {
      mockRecipeService.getRecipes.mockResolvedValue(mockRecipes);

      const res = await app.request('/recipes');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toEqual(mockRecipes);
    });
  });

  // ... 其他测试用例
});
