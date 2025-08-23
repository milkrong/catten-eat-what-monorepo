import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecipeService } from '../../services/recipe.service';
import { db } from '../../config/db';
import { recipes } from '../../db/schema';
import { eq, and, like, gte, lte, desc, asc } from 'drizzle-orm';

// 模拟数据库
vi.mock('../../config/db', () => {
  return {
    db: {
      query: {
        recipes: {
          findMany: vi.fn(),
        },
      },
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => [{ count: 3 }]),
        })),
      })),
    },
  };
});

describe('RecipeService - Pagination and Filtering', () => {
  let recipeService: RecipeService;
  
  // 模拟食谱数据
  const mockRecipes = [
    {
      id: '1',
      name: '红烧肉',
      description: '经典中式菜肴',
      ingredients: [{ name: '五花肉', amount: 500, unit: 'g' }],
      steps: [{ order: 1, description: '切肉' }],
      calories: 800,
      cookingTime: 60,
      nutritionFacts: { protein: 30, carbs: 10, fat: 50, fiber: 0 },
      cuisineType: '中餐',
      dietType: ['荤食'],
      createdBy: 'user1',
      createdAt: new Date('2023-01-01').toISOString(),
      updatedAt: new Date('2023-01-01').toISOString(),
      views: 100,
    },
    {
      id: '2',
      name: '清蒸鱼',
      description: '健康的蒸鱼',
      ingredients: [{ name: '鲈鱼', amount: 1, unit: '条' }],
      steps: [{ order: 1, description: '清洗鱼' }],
      calories: 300,
      cookingTime: 30,
      nutritionFacts: { protein: 25, carbs: 5, fat: 10, fiber: 0 },
      cuisineType: '粤菜',
      dietType: ['低脂'],
      createdBy: 'user1',
      createdAt: new Date('2023-01-02').toISOString(),
      updatedAt: new Date('2023-01-02').toISOString(),
      views: 80,
    },
    {
      id: '3',
      name: '麻婆豆腐',
      description: '麻辣可口',
      ingredients: [{ name: '豆腐', amount: 300, unit: 'g' }],
      steps: [{ order: 1, description: '切豆腐' }],
      calories: 400,
      cookingTime: 20,
      nutritionFacts: { protein: 15, carbs: 10, fat: 20, fiber: 2 },
      cuisineType: '川菜',
      dietType: ['素食'],
      createdBy: 'user2',
      createdAt: new Date('2023-01-03').toISOString(),
      updatedAt: new Date('2023-01-03').toISOString(),
      views: 120,
    },
  ];

  beforeEach(() => {
    recipeService = new RecipeService();
    
    // 默认模拟返回所有食谱
    vi.mocked(db.query.recipes.findMany).mockResolvedValue(mockRecipes);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getRecipes', () => {
    it('应该返回带分页信息的食谱列表', async () => {
      const result = await recipeService.getRecipes();
      
      expect(result).toEqual({
        data: mockRecipes,
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
      
      // 验证调用了 findMany 方法，并且传递了正确的默认参数
      expect(db.query.recipes.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: expect.any(Object),
        limit: 10,
        offset: 0,
      });
    });

    it('应该使用自定义分页参数', async () => {
      // 模拟第二页的数据
      vi.mocked(db.query.recipes.findMany).mockResolvedValue([mockRecipes[2]]);
      
      const result = await recipeService.getRecipes({
        page: 2,
        limit: 2,
      });
      
      expect(result).toEqual({
        data: [mockRecipes[2]],
        pagination: {
          total: 3,
          page: 2,
          limit: 2,
          pages: 2,
        },
      });
      
      // 验证调用了 findMany 方法，并且传递了正确的分页参数
      expect(db.query.recipes.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: expect.any(Object),
        limit: 2,
        offset: 2, // (page - 1) * limit
      });
    });

    it('应该根据菜系类型进行过滤', async () => {
      // 模拟过滤后的数据
      vi.mocked(db.query.recipes.findMany).mockResolvedValue([mockRecipes[0]]);
      
      const result = await recipeService.getRecipes({
        cuisineType: '中餐',
      });
      
      expect(result).toEqual({
        data: [mockRecipes[0]],
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
      
      // 验证调用了 findMany 方法，并且传递了正确的过滤条件
      expect(db.query.recipes.findMany).toHaveBeenCalledWith({
        where: expect.any(Function), // 这里是一个复杂的条件函数
        orderBy: expect.any(Object),
        limit: 10,
        offset: 0,
      });
    });

    it('应该根据烹饪时间进行过滤', async () => {
      // 模拟过滤后的数据
      vi.mocked(db.query.recipes.findMany).mockResolvedValue([mockRecipes[1], mockRecipes[2]]);
      
      const result = await recipeService.getRecipes({
        maxCookingTime: 30,
      });
      
      expect(result).toEqual({
        data: [mockRecipes[1], mockRecipes[2]],
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
      
      // 验证调用了 findMany 方法，并且传递了正确的过滤条件
      expect(db.query.recipes.findMany).toHaveBeenCalledWith({
        where: expect.any(Function),
        orderBy: expect.any(Object),
        limit: 10,
        offset: 0,
      });
    });

    it('应该根据食谱名称进行过滤', async () => {
      // 模拟过滤后的数据
      vi.mocked(db.query.recipes.findMany).mockResolvedValue([mockRecipes[0]]);
      
      const result = await recipeService.getRecipes({
        name: '红烧',
      });
      
      expect(result).toEqual({
        data: [mockRecipes[0]],
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
      
      // 验证调用了 findMany 方法，并且传递了正确的过滤条件
      expect(db.query.recipes.findMany).toHaveBeenCalledWith({
        where: expect.any(Function),
        orderBy: expect.any(Object),
        limit: 10,
        offset: 0,
      });
    });

    it('应该根据卡路里范围进行过滤', async () => {
      // 模拟过滤后的数据
      vi.mocked(db.query.recipes.findMany).mockResolvedValue([mockRecipes[2]]);
      
      const result = await recipeService.getRecipes({
        minCalories: 350,
        maxCalories: 450,
      });
      
      expect(result).toEqual({
        data: [mockRecipes[2]],
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
      
      // 验证调用了 findMany 方法，并且传递了正确的过滤条件
      expect(db.query.recipes.findMany).toHaveBeenCalledWith({
        where: expect.any(Function),
        orderBy: expect.any(Object),
        limit: 10,
        offset: 0,
      });
    });

    it('应该根据排序字段和顺序进行排序', async () => {
      // 模拟按卡路里升序排序的数据
      vi.mocked(db.query.recipes.findMany).mockResolvedValue([
        mockRecipes[1], // 300 卡路里
        mockRecipes[2], // 400 卡路里
        mockRecipes[0], // 800 卡路里
      ]);
      
      const result = await recipeService.getRecipes({
        sortBy: 'calories',
        sortOrder: 'asc',
      });
      
      expect(result).toEqual({
        data: [
          mockRecipes[1],
          mockRecipes[2],
          mockRecipes[0],
        ],
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
      
      // 验证调用了 findMany 方法，并且传递了正确的排序参数
      expect(db.query.recipes.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: expect.any(Object), // 这里是一个排序函数
        limit: 10,
        offset: 0,
      });
    });

    it('应该处理多个过滤条件', async () => {
      // 模拟多条件过滤后的数据
      vi.mocked(db.query.recipes.findMany).mockResolvedValue([mockRecipes[1]]);
      
      const result = await recipeService.getRecipes({
        cuisineType: '粤菜',
        maxCookingTime: 30,
        maxCalories: 500,
      });
      
      expect(result).toEqual({
        data: [mockRecipes[1]],
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
      
      // 验证调用了 findMany 方法，并且传递了正确的多个过滤条件
      expect(db.query.recipes.findMany).toHaveBeenCalledWith({
        where: expect.any(Function),
        orderBy: expect.any(Object),
        limit: 10,
        offset: 0,
      });
    });

    it('应该处理空结果集', async () => {
      // 模拟没有匹配的数据
      vi.mocked(db.query.recipes.findMany).mockResolvedValue([]);
      
      // 模拟总数为 0
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => [{ count: 0 }]),
        })),
      } as any);
      
      const result = await recipeService.getRecipes({
        cuisineType: '不存在的菜系',
      });
      
      expect(result).toEqual({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0,
        },
      });
    });

    it('应该处理最后一页不满的情况', async () => {
      // 模拟总数为 25
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => [{ count: 25 }]),
        })),
      } as any);
      
      // 模拟最后一页只有 5 条数据
      vi.mocked(db.query.recipes.findMany).mockResolvedValue(mockRecipes.slice(0, 1));
      
      const result = await recipeService.getRecipes({
        page: 3,
        limit: 10,
      });
      
      expect(result).toEqual({
        data: [mockRecipes[0]],
        pagination: {
          total: 25,
          page: 3,
          limit: 10,
          pages: 3,
        },
      });
      
      // 验证调用了 findMany 方法，并且传递了正确的分页参数
      expect(db.query.recipes.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: expect.any(Object),
        limit: 10,
        offset: 20, // (page - 1) * limit
      });
    });
  });
}); 