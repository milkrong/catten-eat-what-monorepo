// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from './middlewares/auth';
import { recipeRoutes } from './routes/recipe.routes';
import { mealPlanRoutes } from './routes/meal-plan.routes';
import {supabase} from './config/supabase';
import { WarmupSchedulerService } from './services/warmup-scheduler.service';
import { recommendationRoutes } from './routes/recommendation.routes';
import { userRoutes } from './routes/user.routes';
import { PreferenceValidationError } from './types/errors';
import { CacheService } from './services/cache.service';
import { RecipeService } from './services/recipe.service';
import authRoutes from './routes/auth.routes';
import { adminRoutes } from './routes/admin.routes';

const app = new Hono().basePath('/api');

// 创建必要的服务实例
const cacheService = new CacheService();
const recipeService = new RecipeService();

// 创建预热调度器
const warmupScheduler = new WarmupSchedulerService(
  cacheService,
  supabase,
  recipeService,
  {
    initialDelay: 5000, // 服务启动5秒后开始预热
    warmupInterval: 30, // 每30分钟预热一次
    popularRecipeCount: 50, // 预热50个热门食谱
    recentRecipeCount: 30, // 预热30个最新食谱
    popularCuisineTypes: ['chinese', 'western', 'japanese', 'korean'], // 热门菜系
  }
);

// 启动预热调度器
warmupScheduler.start();

// 全局中间件
app.use('*', logger());
app.use('*', prettyJSON());
app.use(
  '*',
  cors({
    origin: '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 健康检查 - 无需认证
app.get('/health', (c) => c.json({ status: 'ok' }));

// 认证路由
app.route('/auth', authRoutes);

// 需要认证的路由
app.use('/recipes/*', authMiddleware);
app.route('/recipes', recipeRoutes);
app.use('/recommendations/*', authMiddleware);
app.route('/recommendations', recommendationRoutes);
app.use('/users/*', authMiddleware);
app.route('/users', userRoutes);
app.use('/meal-plans/*', authMiddleware);
app.route('/meal-plans', mealPlanRoutes);

// Mount admin routes under /api/admin
app.route('/api/admin', adminRoutes);

// 全局错误处理
app.onError((err, c) => {
  console.log('xxxx error:', err);
  if (err instanceof HTTPException) {
    return c.json(
      {
        message: err.message,
        code: err.status,
      },
      err.status
    );
  }

  if (err instanceof PreferenceValidationError) {
    return c.json(
      {
        message: err.message,
        code: 400,
        details: err.details,
      },
      400
    );
  }

  console.error(`[Error] ${err}`);
  return c.json(
    {
      message: 'Internal Server Error',
      code: 500,
    },
    500
  );
});

// 404处理
app.notFound((c) => {
  return c.json(
    {
      message: 'Not Found',
      code: 404,
    },
    404
  );
});

export default {
  port: parseInt(process.env.PORT || '3000'),
  fetch: app.fetch,
};
