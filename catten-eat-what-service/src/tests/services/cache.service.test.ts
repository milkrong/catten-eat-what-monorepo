import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheService } from '../../services/cache.service';
import { Recipe } from '../../types/recipe';

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedis: any;

  beforeEach(() => {
    // Mock Redis 客户端
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      keys: vi.fn(),
      flushall: vi.fn(),
    };

    vi.mock('@upstash/redis', () => ({
      Redis: vi.fn(() => mockRedis),
    }));

    cacheService = new CacheService();
  });

  const mockRecipe: Recipe = {
    id: '1',
    name: '测试食谱',
    description: '这是测试食谱的描述',
    ingredients: [{ name: '食材1', amount: 100, unit: 'g' }],
    steps: [{ order: 1, description: '步骤1' }],
    calories: 200,
    cookingTime: 30,
    nutritionFacts: { protein: 10, carbs: 20, fat: 5, fiber: 3 },
    cuisineType: 'chinese',
    dietType: ['vegetarian'],
    createdBy: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    img: null,
    views: 0,
  };

  describe('getRecipe', () => {
    it('should get recipe from cache', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(mockRecipe));
      const recipe = await cacheService.getRecipe('1');
      expect(recipe).toEqual(mockRecipe);
    });

    it('should return null when recipe not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      const recipe = await cacheService.getRecipe('1');
      expect(recipe).toBeNull();
    });
  });

  // ... 其他测试用例
});
