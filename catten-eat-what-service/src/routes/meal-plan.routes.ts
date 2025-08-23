// src/routes/meal-plan.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { MealPlanService } from '../services/meal-plan.service';
import type { MealPlan } from '../types';

// 创建MealPlan服务实例
const mealPlanService = new MealPlanService();

// 验证Schema
const createMealPlanSchema = z.object({
  date: z.string().datetime(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  recipeId: z.string().uuid(),
});

const generateMealPlanSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  preferences: z.object({
    cuisineTypes: z.array(z.string()),
    dietTypes: z.array(z.string()),
    maxCookingTime: z.number().optional(),
    caloriesPerDay: z.number().optional(),
  }),
});

const app = new Hono();

// 获取用户的膳食计划
app.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    if (!startDate || !endDate) {
      return c.json({ error: '请提供开始和结束日期' }, 400);
    }

    const mealPlans = await mealPlanService.getMealPlans(
      userId,
      new Date(startDate),
      new Date(endDate)
    );

    return c.json(mealPlans);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 创建单个膳食计划
app.post('/', zValidator('json', createMealPlanSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const mealPlanData = await c.req.json();

    const mealPlan = await mealPlanService.createMealPlan({
      ...mealPlanData,
      userId,
    });

    return c.json(mealPlan, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 生成膳食计划
app.post('/generate', zValidator('json', generateMealPlanSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { startDate, endDate, preferences } = await c.req.json();

    const mealPlans = await mealPlanService.generateMealPlans(
      userId,
      new Date(startDate),
      new Date(endDate),
      preferences
    );

    return c.json(mealPlans, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 更新膳食计划
app.put('/:id', zValidator('json', createMealPlanSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const mealPlanData = await c.req.json<MealPlan>();

    // 检查权限
    const existingMealPlan = await mealPlanService.getMealPlanById(id);
    if (!existingMealPlan) {
      return c.json({ error: '膳食计划不存在' }, 404);
    }
    if (existingMealPlan.userId !== userId) {
      return c.json({ error: '没有权限修改此膳食计划' }, 403);
    }

    const updatedMealPlan = await mealPlanService.updateMealPlan(
      id,
      mealPlanData
    );
    return c.json(updatedMealPlan);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 删除膳食计划
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');

    // 检查权限
    const existingMealPlan = await mealPlanService.getMealPlanById(id);
    if (!existingMealPlan) {
      return c.json({ error: '膳食计划不存在' }, 404);
    }
    if (existingMealPlan.userId !== userId) {
      return c.json({ error: '没有权限删除此膳食计划' }, 403);
    }

    await mealPlanService.deleteMealPlan(id);
    return c.json({ message: '删除成功' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export { app as mealPlanRoutes };
