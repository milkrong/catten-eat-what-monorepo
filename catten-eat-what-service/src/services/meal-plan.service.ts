// src/services/meal-plan.service.ts
import { eq, and, desc, gte, lte, type SQL } from 'drizzle-orm';
import { db } from '../config/db';
import { mealPlans } from '../db/schema';
import type { MealPlan, MealPlanWithRelations } from '../db/schema';
import { RecipeService } from './recipe.service';

export type NewMealPlan = typeof mealPlans.$inferInsert;

export class MealPlanService {
  private recipeService: RecipeService;

  constructor() {
    this.recipeService = new RecipeService();
  }

  async getMealPlans(userId: string, startDate?: Date, endDate?: Date): Promise<MealPlanWithRelations[]> {
    const baseCondition = eq(mealPlans.userId, userId);
    
    const whereClause = startDate && endDate
      ? and(
          baseCondition,
          gte(mealPlans.date, startDate.toISOString().split('T')[0]),
          lte(mealPlans.date, endDate.toISOString().split('T')[0])
        )
      : baseCondition;

    return await db.query.mealPlans.findMany({
      where: whereClause,
      with: {
        recipe: true,
        profile: true,
      },
      orderBy: desc(mealPlans.date),
    });
  }

  async getMealPlansByDate(userId: string, date: Date) {
    return await db.query.mealPlans.findMany({
      where: and(
        eq(mealPlans.userId, userId),
        eq(mealPlans.date, date.toISOString().split('T')[0])
      ),
      with: {
        recipe: true,
      },
    });
  }

  async createMealPlan(mealPlan: NewMealPlan) {
    const [created] = await db
      .insert(mealPlans)
      .values({
        ...mealPlan,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return created;
  }

  async updateMealPlan(id: string, updates: Partial<NewMealPlan>) {
    const [updated] = await db
      .update(mealPlans)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(mealPlans.id, id))
      .returning();

    return updated;
  }

  async deleteMealPlan(id: string) {
    await db
      .delete(mealPlans)
      .where(eq(mealPlans.id, id));
  }

  async deleteMealPlansByDate(userId: string, date: Date) {
    await db
      .delete(mealPlans)
      .where(and(
        eq(mealPlans.userId, userId),
        eq(mealPlans.date, date.toISOString().split('T')[0])
      ));
  }

  async generateMealPlans(
    userId: string,
    startDate: Date,
    endDate: Date,
    preferences: {
      cuisine_type: string[];
      diet_type: string[];
      max_cooking_time?: number;
      calories_per_day?: number;
    }
  ) {
    try {
      // 计算需要生成的天数
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
      const mealPlans: MealPlan[] = [];

      // 获取已使用的食谱ID列表
      const usedRecipeIds: string[] = [];

      // 为每一天生成膳食计划
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);

        // 为每一餐生成推荐
        for (const mealType of mealTypes) {
          // 获取推荐食谱
          const recipes = await this.recipeService.getRecommendedRecipes({
            dietTypes: preferences.diet_type,
            cuisineTypes: preferences.cuisine_type,
            maxCookingTime: preferences.max_cooking_time,
            excludeIds: usedRecipeIds,
          });

          if (recipes.length === 0) {
            continue;
          }

          // 随机选择一个食谱
          const recipe = recipes[Math.floor(Math.random() * recipes.length)];
          usedRecipeIds.push(recipe.id);

          // 创建膳食计划
          if (!userId || !recipe.id) {
            throw new Error('Invalid user_id or recipe_id');
          }
          const mealPlan = await this.createMealPlan({
            userId,
            date: currentDate.toISOString(),
            mealType: mealType,
            recipeId: recipe.id,
          });

          mealPlans.push({
            ...mealPlan,
            userId,
            recipeId: recipe.id,
          });
        }
      }

      return mealPlans;
    } catch (error) {
      console.error('Generate meal plans error:', error);
      throw new Error('生成膳食计划失败');
    }
  }

  async getMealPlanById(id: string) {
    return await db.query.mealPlans.findFirst({
      where: eq(mealPlans.id, id),
      with: {
        recipe: true,
      },
    });
  }
}
