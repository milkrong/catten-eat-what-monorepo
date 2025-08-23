// src/services/cache.service.ts
import { Redis } from '@upstash/redis';
import { Recipe, MealPlan } from '../types';

interface CacheOptions {
  ex?: number;
  nx?: boolean;
}

export class CacheService {
  private redis: Redis;
  private lastWarmupTime: Date | null = null;
  private totalCachedRecipes = 0;

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  // 生成缓存键
  private generateKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // 设置缓存
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      if (options?.ex) {
        await this.redis.set(key, value, { ex: options.ex });
      } else if (options?.nx) {
        await this.redis.set(key, value, { nx: true });
      } else {
        await this.redis.set(key, value);
      }
      this.totalCachedRecipes++;
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  // 删除缓存
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.totalCachedRecipes--;
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // 清除包含特定前缀的所有缓存
  async clearByPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${prefix}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache clear by prefix error:', error);
    }
  }

  // 食谱相关的缓存方法
  async getRecipe(id: string): Promise<Recipe | null> {
    return this.get<Recipe>(this.generateKey('recipe', id));
  }

  async setRecipe(recipe: Recipe): Promise<void> {
    await this.set(this.generateKey('recipe', recipe.id), recipe);
  }

  async invalidateRecipe(id: string): Promise<void> {
    await this.del(this.generateKey('recipe', id));
  }

  // 食谱列表缓存
  async getRecipeList(key: string): Promise<Recipe[] | null> {
    return this.get<Recipe[]>(this.generateKey('recipe-list', key));
  }

  async setRecipeList(key: string, recipes: Recipe[]): Promise<void> {
    await this.set(this.generateKey('recipe-list', key), recipes);
  }

  // 膳食计划相关的缓存方法
  async getMealPlan(id: string): Promise<MealPlan | null> {
    return this.get<MealPlan>(this.generateKey('meal-plan', id));
  }

  async setMealPlan(mealPlan: MealPlan): Promise<void> {
    await this.set(this.generateKey('meal-plan', mealPlan.id), mealPlan);
  }

  async invalidateMealPlan(id: string): Promise<void> {
    await this.del(this.generateKey('meal-plan', id));
  }

  // 用户膳食计划列表缓存
  async getUserMealPlans(
    userId: string,
    dateKey: string
  ): Promise<MealPlan[] | null> {
    return this.get<MealPlan[]>(
      this.generateKey(`meal-plans:${userId}`, dateKey)
    );
  }

  async setUserMealPlans(
    userId: string,
    dateKey: string,
    mealPlans: MealPlan[]
  ): Promise<void> {
    await this.set(
      this.generateKey(`meal-plans:${userId}`, dateKey),
      mealPlans
    );
  }

  async flushAll(): Promise<void> {
    try {
      await this.redis.flushall();
      this.totalCachedRecipes = 0;
    } catch (error) {
      console.error('Error flushing cache:', error);
      throw error;
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      // 获取所有键
      const keys = await this.redis.keys('*');

      // 如果没有键，返回0
      if (!keys.length) return 0;

      // 获取所有键的内存使用情况
      const sizes = await Promise.all(
        keys.map(async (key) => {
          const value = await this.redis.get(key);
          // 计算字符串形式的值的近似内存使用
          return value ? JSON.stringify(value).length : 0;
        })
      );

      // 计算总大小（字节）
      return sizes.reduce((total, size) => total + size, 0);
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  async setLastWarmupTime(time: Date): Promise<void> {
    await this.set('lastWarmupTime', time.toISOString(), {
      ex: 86400 * 30, // 30 days expiration
    });
  }

  async getLastWarmupTime(): Promise<Date | null> {
    const timeStr = await this.get<string>('lastWarmupTime');
    return timeStr ? new Date(timeStr) : null;
  }

  getTotalCachedRecipes(): number {
    return this.totalCachedRecipes;
  }

  // 不需要显式关闭连接，因为使用的是 REST API
  async close(): Promise<void> {
    // REST API 不需要关闭连接
  }
}
