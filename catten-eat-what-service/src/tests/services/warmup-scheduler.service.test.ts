import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WarmupSchedulerService } from '../../services/warmup-scheduler.service';

describe('WarmupSchedulerService', () => {
  let warmupScheduler: WarmupSchedulerService;
  let mockCacheService: any;
  let mockSupabase: any;
  let mockRecipeService: any;

  beforeEach(() => {
    mockCacheService = {
      getLastWarmupTime: vi.fn(),
      setLastWarmupTime: vi.fn(),
      getTotalCachedRecipes: vi.fn(),
      getCacheSize: vi.fn(),
    };

    mockSupabase = {};
    mockRecipeService = {};

    warmupScheduler = new WarmupSchedulerService(
      mockCacheService,
      mockSupabase,
      mockRecipeService,
      {
        initialDelay: 0,
        warmupInterval: 1,
        popularRecipeCount: 10,
        recentRecipeCount: 10,
        popularCuisineTypes: ['chinese'],
      }
    );

    // Mock setTimeout and setInterval
    vi.useFakeTimers();
  });

  it('should start warmup scheduler', () => {
    warmupScheduler.start();
    expect(setTimeout).toHaveBeenCalled();
  });

  // ... 其他测试用例
});
