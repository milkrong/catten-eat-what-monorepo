import { embeddingService } from './embedding.service';
import { qdrantService } from './qdrant.service';
import type { DietaryPreferences } from '../types/preferences';
import { RecipeService } from './recipe.service';

// 导入 DrizzleORM 相关内容
import { db } from '../config/db';
import { eq, inArray } from 'drizzle-orm';
import { recipes, preferences as userPreferences, favorites, type Recipe } from '../db/schema';

// 创建RecipeService实例
const recipeService = new RecipeService();

export class VectorRecommendationService {
  /**
   * 获取基于向量的今日推荐
   */
  async getDailyRecommendations(options: {
    userId?: string;
    query?: string;
    limit?: number;
    page?: number;
    dietaryPreferences?: DietaryPreferences;
  }) {
    const {
      userId,
      query,
      limit = 10,
      page = 1,
      dietaryPreferences
    } = options;
    
    let queryVector: number[];
    
    // 1. 确定查询向量
    if (query) {
      // 基于查询文本生成向量
      queryVector = await embeddingService.getEmbedding(query);
    } else if (userId) {
      // 获取用户偏好向量
      queryVector = await this.getUserPreferenceVector(userId);
    } else {
      // 使用基于当前上下文的向量
      const now = new Date();
      const month = now.getMonth() + 1;
      
      // 根据月份确定季节
      let season = '';
      if (month >= 3 && month <= 5) {
        season = '春季';
      } else if (month >= 6 && month <= 8) {
        season = '夏季';
      } else if (month >= 9 && month <= 11) {
        season = '秋季';
      } else {
        season = '冬季';
      }
      
      // 根据时间确定餐点
      const hour = now.getHours();
      let mealType = '';
      if (hour >= 6 && hour < 10) {
        mealType = '早餐';
      } else if (hour >= 10 && hour < 14) {
        mealType = '午餐';
      } else if (hour >= 14 && hour < 17) {
        mealType = '下午茶';
      } else if (hour >= 17 && hour < 21) {
        mealType = '晚餐';
      } else {
        mealType = '宵夜';
      }
      
      queryVector = await embeddingService.getContextBasedVector({
        season,
        mealType
      });
    }
    
    // 2. 获取向量搜索结果
    const searchResults = await qdrantService.searchSimilar(
      queryVector,
      limit,
      (page - 1) * limit
    );
    
    // 3. 根据搜索结果获取完整的食谱信息
    const recipeIds = searchResults.map(result => result.id);
    
    // 使用 DrizzleORM 替换 Supabase 查询
    const recipesData = await db.query.recipes.findMany({
      where: inArray(recipes.id, recipeIds as string[])
    });
    
    // 4. 应用饮食偏好过滤（如果有）
    let filteredRecipes = recipesData;
    if (dietaryPreferences) {
      filteredRecipes = this.filterRecipesByPreferences(recipesData, dietaryPreferences);
    }
    
    // 5. 按照原搜索结果的顺序排序
    const orderedRecipes = recipeIds
      .map(id => filteredRecipes.find(recipe => recipe.id === id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);
    
    return {
      recipes: orderedRecipes,
      title: '今日推荐'
    };
  }
  
  /**
   * 获取用户偏好向量
   */
  private async getUserPreferenceVector(userId: string): Promise<number[]> {
    // 1. 获取用户偏好 - 使用 DrizzleORM
    const preferencesData = await db.query.preferences.findFirst({
      where: eq(userPreferences.id, userId)
    });
    
    if (!preferencesData) {
      // 没有找到用户偏好，使用默认上下文向量
      return await embeddingService.getContextBasedVector({});
    }
    
    // 2. 获取用户最近喜欢的食谱 - 使用 DrizzleORM
    const favoriteRecipesData = await db.query.favorites.findMany({
      where: eq(favorites.userId, userId),
      orderBy: (favorites, { desc }) => [desc(favorites.createdAt)],
      limit: 5
    });
    
    // 3. 构建用户偏好文本
    let preferenceText = '';
    
    // 添加饮食类型偏好
    if (preferencesData.dietType && preferencesData.dietType.length > 0) {
      preferenceText += `饮食类型: ${preferencesData.dietType.join(', ')}. `;
    }
    
    // 添加菜系偏好
    if (preferencesData.cuisineType && preferencesData.cuisineType.length > 0) {
      preferenceText += `偏好菜系: ${preferencesData.cuisineType.join(', ')}. `;
    }
    
    // 添加饮食限制
    if (preferencesData.restrictions && preferencesData.restrictions.length > 0) {
      preferenceText += `饮食限制: ${preferencesData.restrictions.join(', ')}. `;
    }
    
    // 添加过敏源
    if (preferencesData.allergies && preferencesData.allergies.length > 0) {
      preferenceText += `过敏源: ${preferencesData.allergies.join(', ')}. `;
    }
    
    // 4. 获取偏好向量
    const userVector = await embeddingService.getEmbedding(preferenceText);
    
    // 5. 如果有最近喜欢的食谱，可以考虑混合这些向量
    if (favoriteRecipesData && favoriteRecipesData.length > 0) {
      const recipeIds = favoriteRecipesData.map(fav => fav.recipeId);
      
      // 使用 DrizzleORM 查询
      const recipesData = await db.query.recipes.findMany({
        where: inArray(recipes.id, recipeIds as string[])
      });
      
      if (recipesData && recipesData.length > 0) {
        // 为每个食谱获取向量，然后计算平均值
        const vectors: number[][] = [];
        
        for (const recipe of recipesData) {
          const recipeText = embeddingService.prepareRecipeText(recipe);
          const recipeVector = await embeddingService.getEmbedding(recipeText);
          vectors.push(recipeVector);
        }
        
        // 计算用户偏好和食谱向量的加权平均
        // 这里给用户偏好更高的权重(0.7)，食谱向量更低的权重(0.3)
        const combinedVector = this.combineVectors([userVector, ...vectors], [0.7, ...Array(vectors.length).fill(0.3 / vectors.length)]);
        return combinedVector;
      }
    }
    
    return userVector;
  }
  
  /**
   * 将多个向量组合成一个向量，使用给定的权重
   */
  private combineVectors(vectors: number[][], weights: number[]): number[] {
    const dimension = vectors[0].length;
    const result = new Array(dimension).fill(0);
    
    for (let i = 0; i < vectors.length; i++) {
      const weight = weights[i];
      const vector = vectors[i];
      
      for (let j = 0; j < dimension; j++) {
        result[j] += vector[j] * weight;
      }
    }
    
    return result;
  }
  
  /**
   * 根据饮食偏好过滤食谱
   */
  private filterRecipesByPreferences(
    recipes: Recipe[],
    preferences: DietaryPreferences
  ): Recipe[] {
    return recipes.filter(recipe => {
      // 过滤饮食类型
      if (
        preferences.dietType &&
        preferences.dietType.length > 0 &&
        recipe.dietType
      ) {
        const hasMatchingDietType = preferences.dietType.some(dt =>
          recipe.dietType?.includes(dt)
        );
        if (!hasMatchingDietType) {
          return false;
        }
      }
      
      // 过滤菜系
      if (
        preferences.cuisineType &&
        preferences.cuisineType.length > 0 &&
        recipe.cuisineType
      ) {
        const hasMatchingCuisine = preferences.cuisineType.includes(
          recipe.cuisineType
        );
        if (!hasMatchingCuisine) {
          return false;
        }
      }
      
      // 过滤卡路里
      if (
        preferences.caloriesMin &&
        recipe.calories &&
        recipe.calories < preferences.caloriesMin
      ) {
        return false;
      }
      
      if (
        preferences.caloriesMax &&
        recipe.calories &&
        recipe.calories > preferences.caloriesMax
      ) {
        return false;
      }
      
      // 过滤烹饪时间
      if (
        preferences.maxCookingTime &&
        recipe.cookingTime &&
        recipe.cookingTime > preferences.maxCookingTime
      ) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * 获取相似食谱
   */
  async getSimilarRecipes(recipeId: string, limit = 5): Promise<{ recipes: Recipe[]; title: string }> {
    try {
      // 1. 初始化向量数据库
      await qdrantService.initialize();
      
      // 2. 从数据库获取食谱
      const recipe = await recipeService.getRecipeById(recipeId);
      
      if (!recipe) {
        throw new Error('食谱不存在');
      }
      
      // 3. 获取食谱的向量表示
      const recipeText = embeddingService.prepareRecipeText(recipe);
      const recipeVector = await embeddingService.getEmbedding(recipeText);
      
      // 4. 在向量数据库中搜索相似食谱
      const searchResults = await qdrantService.searchSimilar(recipeVector, limit + 1);
      
      // 5. 过滤掉原始食谱，获取相似食谱
      const similarRecipeIds = searchResults
        .filter((result) => {
          return result.id !== recipeId;
        })
        .slice(0, limit)
        .map((result) => {
          return result.id;
        });
      
      // 6. 获取完整的食谱信息 - 使用 DrizzleORM
      const similarRecipes = await db.query.recipes.findMany({
        where: inArray(recipes.id, similarRecipeIds as string[])
      });
      
      // 7. 按搜索结果顺序排序
      const orderedSimilarRecipes = similarRecipeIds
        .map((id) => {
          return similarRecipes.find((recipe) => {
            return recipe.id === id;
          });
        })
        .filter((recipe) => {
          return recipe !== undefined;
        });
      
      return {
        recipes: orderedSimilarRecipes,
        title: '相似食谱'
      };
    } catch (error) {
      console.error('获取相似食谱失败:', error);
      throw error;
    }
  }
}

// 创建单例
const vectorRecommendationService = new VectorRecommendationService();
export { vectorRecommendationService }; 