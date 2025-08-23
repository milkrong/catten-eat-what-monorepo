// src/services/cache-warmup.service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Recipe } from '../types/recipe';
import { CacheService } from './cache.service';
import { RecipeService } from './recipe.service';

interface CacheWarmupConfig {
  popularRecipeCount: number;
  recentRecipeCount: number;
  popularCuisineTypes: string[];
}

export class CacheWarmupService {
  private supabase: SupabaseClient;
  private cacheService: CacheService;
  private recipeService: RecipeService;
  private config: CacheWarmupConfig;

  constructor(
    supabase: SupabaseClient,
    cacheService: CacheService,
    recipeService: RecipeService,
    config: CacheWarmupConfig
  ) {
    this.supabase = supabase;
    this.cacheService = cacheService;
    this.recipeService = recipeService;
    this.config = config;
  }

  async warmupPopularRecipes(): Promise<void> {
    try {
      const popularRecipes = await this.recipeService.getPopularRecipes(
        this.config.popularRecipeCount
      );
      await this.cacheRecipes(popularRecipes, 'popular');
    } catch (error) {
      console.error('Error warming up popular recipes:', error);
      throw error;
    }
  }

  async warmupRecentRecipes(): Promise<void> {
    try {
      const recentRecipes = await this.recipeService.getRecentRecipes(
        this.config.recentRecipeCount
      );
      await this.cacheRecipes(recentRecipes, 'recent');
    } catch (error) {
      console.error('Error warming up recent recipes:', error);
      throw error;
    }
  }

  async warmupPopularCuisines(): Promise<void> {
    try {
      for (const cuisineType of this.config.popularCuisineTypes) {
        const recipes = await this.recipeService.getRecipesByCuisine(
          cuisineType,
          10
        );
        await this.cacheRecipes(recipes, `cuisine:${cuisineType}`);
      }
    } catch (error) {
      console.error('Error warming up cuisine recipes:', error);
      throw error;
    }
  }

  private async cacheRecipes(
    recipes: Recipe[],
    category: string
  ): Promise<void> {
    try {
      const cachePromises = recipes.map((recipe) =>
        this.cacheService.set(
          `recipe:${category}:${recipe.id}`,
          JSON.stringify(recipe),
          {
            ex: 3600, // 1 hour expiration
          }
        )
      );
      await Promise.all(cachePromises);
    } catch (error) {
      console.error(`Error caching ${category} recipes:`, error);
      throw error;
    }
  }

  async warmupAll(): Promise<void> {
    try {
      await Promise.all([
        this.warmupPopularRecipes(),
        this.warmupRecentRecipes(),
        this.warmupPopularCuisines(),
      ]);
    } catch (error) {
      console.error('Error during cache warmup:', error);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.cacheService.flushAll();
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  async refreshCache(): Promise<void> {
    try {
      await this.clearCache();
      await this.warmupAll();
    } catch (error) {
      console.error('Error refreshing cache:', error);
      throw error;
    }
  }

  async getWarmupStatus(): Promise<{
    lastWarmupTime: Date | null;
    totalCachedRecipes: number;
    cacheSize: number;
  }> {
    const [lastWarmupTime, totalCachedRecipes, cacheSize] = await Promise.all([
      this.cacheService.getLastWarmupTime(),
      this.cacheService.getTotalCachedRecipes(),
      this.cacheService.getCacheSize(),
    ]);

    return {
      lastWarmupTime,
      totalCachedRecipes,
      cacheSize,
    };
  }

  async warmup(): Promise<void> {
    console.log('Starting cache warmup...');
    try {
      // 记录开始时间
      const startTime = Date.now();

      // 执行所有预热任务
      await this.warmupAll();

      // 计算耗时
      const duration = Date.now() - startTime;
      console.log(`Cache warmup completed in ${duration}ms`);

      // 更新最后预热时间
      await this.cacheService.setLastWarmupTime(new Date());
    } catch (error) {
      console.error('Cache warmup failed:', error);
      throw error;
    }
  }
}
