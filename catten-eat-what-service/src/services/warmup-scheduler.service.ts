// src/services/warmup-scheduler.service.ts
import { CacheWarmupService } from './cache-warmup.service';
import { CacheService } from './cache.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { RecipeService } from './recipe.service';

export class WarmupSchedulerService {
  private warmupService: CacheWarmupService;
  private intervalId: NodeJS.Timer | null = null;

  constructor(
    private cacheService: CacheService,
    private supabase: SupabaseClient,
    private recipeService: RecipeService,
    private config: {
      initialDelay: number;
      warmupInterval: number;
      popularRecipeCount: number;
      recentRecipeCount: number;
      popularCuisineTypes: string[];
    }
  ) {
    this.warmupService = new CacheWarmupService(
      this.supabase,
      this.cacheService,
      this.recipeService,
      {
        popularRecipeCount: config.popularRecipeCount,
        recentRecipeCount: config.recentRecipeCount,
        popularCuisineTypes: config.popularCuisineTypes,
      }
    );
  }

  // 启动调度器
  start() {
    console.log('Starting warmup scheduler...');

    // 延迟首次预热，避免服务启动时负载过大
    setTimeout(() => {
      // 执行首次预热
      this.warmupService.warmup();

      // 设置定期预热
      this.intervalId = setInterval(
        () => this.warmupService.warmup(),
        this.config.warmupInterval * 60 * 1000
      );
    }, this.config.initialDelay);
  }

  // 停止调度器
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // 获取预热状态
  async getStatus() {
    return await this.warmupService.getWarmupStatus();
  }

  // 手动触发预热
  async manualWarmup() {
    await this.warmupService.warmup();
  }
}
