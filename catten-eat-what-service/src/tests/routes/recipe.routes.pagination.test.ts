import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { recipeRoutes } from '../../routes/recipe.routes';
import { Recipe } from '../../types/recipe';
import { RecipeService } from '../../services/recipe.service';

// 模拟 RecipeService
vi.mock('../../services/recipe.service', () => {
  return {
    RecipeService: vi.fn().mockImplementation(() => ({
      getRecipes: vi.fn(),
      getRecipeById: vi.fn(),
      createRecipe: vi.fn(),
      updateRecipe: vi.fn(),
      deleteRecipe: vi.fn(),
    })),
  };
});

describe('Recipe Routes - Pagination and Filtering', () => {
  let app: Hono;
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

  // 模拟分页响应
  const mockPaginatedResponse = {
    data: mockRecipes,
    pagination: {
      total: 3,
      page: 1,
      limit: 10,
      pages: 1,
    },
  };

  beforeEach(() => {
    app = new Hono();
    
    // 重置模拟函数
    vi.clearAllMocks();
    
    // 获取 RecipeService 实例
    recipeService = new RecipeService();
    
    // 设置默认的模拟返回值
    vi.mocked(recipeService.getRecipes).mockResolvedValue(mockPaginatedResponse);
    
    // 添加中间件来模拟认证
    app.use('*', async (c, next) => {
      c.set('userId', 'user1');
      await next();
    });
    
    // 添加路由
    app.route('/recipes', recipeRoutes);
  });

  describe('GET /recipes', () => {
    it('应该返回带分页信息的食谱列表', async () => {
      const res = await app.request('/recipes');
      
      expect(res.status).toBe(200);
      
      const responseBody = await res.json();
      expect(responseBody).toEqual({
        success: true,
        data: {
          recipes: mockRecipes,
          pagination: {
            total: 3,
            page: 1,
            limit: 10,
            pages: 1,
          },
        },
      });
      
      // 验证调用了 getRecipes 方法，并且传递了正确的默认参数
      expect(recipeService.getRecipes).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        createdBy: 'user1',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('应该使用查询参数进行分页', async () => {
      // 模拟第二页的响应
      const page2Response = {
        data: [mockRecipes[2]],
        pagination: {
          total: 3,
          page: 2,
          limit: 2,
          pages: 2,
        },
      };
      
      vi.mocked(recipeService.getRecipes).mockResolvedValue(page2Response);
      
      const res = await app.request('/recipes?page=2&limit=2');
      
      expect(res.status).toBe(200);
      
      const responseBody = await res.json();
      expect(responseBody).toEqual({
        success: true,
        data: {
          recipes: [mockRecipes[2]],
          pagination: {
            total: 3,
            page: 2,
            limit: 2,
            pages: 2,
          },
        },
      });
      
      // 验证调用了 getRecipes 方法，并且传递了正确的分页参数
      expect(recipeService.getRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 2,
        })
      );
    });

    it('应该根据菜系类型进行过滤', async () => {
      const filteredResponse = {
        data: [mockRecipes[0]],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      };
      
      vi.mocked(recipeService.getRecipes).mockResolvedValue(filteredResponse);
      
      const res = await app.request('/recipes?cuisineType=中餐');
      
      expect(res.status).toBe(200);
      
      const responseBody = await res.json();
      expect(responseBody).toEqual({
        success: true,
        data: {
          recipes: [mockRecipes[0]],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            pages: 1,
          },
        },
      });
      
      // 验证调用了 getRecipes 方法，并且传递了正确的过滤参数
      expect(recipeService.getRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          cuisineType: '中餐',
        })
      );
    });

    it('应该根据烹饪时间进行过滤', async () => {
      const filteredResponse = {
        data: [mockRecipes[1], mockRecipes[2]],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          pages: 1,
        },
      };
      
      vi.mocked(recipeService.getRecipes).mockResolvedValue(filteredResponse);
      
      const res = await app.request('/recipes?maxCookingTime=30');
      
      expect(res.status).toBe(200);
      
      const responseBody = await res.json();
      expect(responseBody).toEqual({
        success: true,
        data: {
          recipes: [mockRecipes[1], mockRecipes[2]],
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
            pages: 1,
          },
        },
      });
      
      // 验证调用了 getRecipes 方法，并且传递了正确的过滤参数
      expect(recipeService.getRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          maxCookingTime: 30,
        })
      );
    });

    it('应该根据食谱名称进行过滤', async () => {
      const filteredResponse = {
        data: [mockRecipes[0]],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      };
      
      vi.mocked(recipeService.getRecipes).mockResolvedValue(filteredResponse);
      
      const res = await app.request('/recipes?name=红烧');
      
      expect(res.status).toBe(200);
      
      const responseBody = await res.json();
      expect(responseBody).toEqual({
        success: true,
        data: {
          recipes: [mockRecipes[0]],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            pages: 1,
          },
        },
      });
      
      // 验证调用了 getRecipes 方法，并且传递了正确的过滤参数
      expect(recipeService.getRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '红烧',
        })
      );
    });

    it('应该根据卡路里范围进行过滤', async () => {
      const filteredResponse = {
        data: [mockRecipes[2]],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      };
      
      vi.mocked(recipeService.getRecipes).mockResolvedValue(filteredResponse);
      
      const res = await app.request('/recipes?minCalories=350&maxCalories=450');
      
      expect(res.status).toBe(200);
      
      const responseBody = await res.json();
      expect(responseBody).toEqual({
        success: true,
        data: {
          recipes: [mockRecipes[2]],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            pages: 1,
          },
        },
      });
      
      // 验证调用了 getRecipes 方法，并且传递了正确的过滤参数
      expect(recipeService.getRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          minCalories: 350,
          maxCalories: 450,
        })
      );
    });

    it('应该根据排序字段和顺序进行排序', async () => {
      // 按卡路里升序排序的响应
      const sortedResponse = {
        data: [mockRecipes[1], mockRecipes[2], mockRecipes[0]],
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          pages: 1,
        },
      };
      
      vi.mocked(recipeService.getRecipes).mockResolvedValue(sortedResponse);
      
      const res = await app.request('/recipes?sortBy=calories&sortOrder=asc');
      
      expect(res.status).toBe(200);
      
      const responseBody = await res.json();
      expect(responseBody).toEqual({
        success: true,
        data: {
          recipes: [mockRecipes[1], mockRecipes[2], mockRecipes[0]],
          pagination: {
            total: 3,
            page: 1,
            limit: 10,
            pages: 1,
          },
        },
      });
      
      // 验证调用了 getRecipes 方法，并且传递了正确的排序参数
      expect(recipeService.getRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'calories',
          sortOrder: 'asc',
        })
      );
    });

    it('应该处理多个过滤条件', async () => {
      const filteredResponse = {
        data: [mockRecipes[1]],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      };
      
      vi.mocked(recipeService.getRecipes).mockResolvedValue(filteredResponse);
      
      const res = await app.request('/recipes?cuisineType=粤菜&maxCookingTime=30&maxCalories=500');
      
      expect(res.status).toBe(200);
      
      const responseBody = await res.json();
      expect(responseBody).toEqual({
        success: true,
        data: {
          recipes: [mockRecipes[1]],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            pages: 1,
          },
        },
      });
      
      // 验证调用了 getRecipes 方法，并且传递了正确的多个过滤参数
      expect(recipeService.getRecipes).toHaveBeenCalledWith(
        expect.objectContaining({
          cuisineType: '粤菜',
          maxCookingTime: 30,
          maxCalories: 500,
        })
      );
    });

    it('应该处理错误情况', async () => {
      // 模拟服务抛出错误
      vi.mocked(recipeService.getRecipes).mockRejectedValue(new Error('数据库错误'));
      
      const res = await app.request('/recipes');
      
      expect(res.status).toBe(500);
      
      const responseBody = await res.json();
      expect(responseBody).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '数据库错误',
        },
      });
    });
  });
}); 