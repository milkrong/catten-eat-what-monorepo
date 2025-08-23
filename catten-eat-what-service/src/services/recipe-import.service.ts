import xlsx from 'xlsx';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { supabase } from '../config/supabase';
import { embeddingService } from './embedding.service';
import { qdrantService } from './qdrant.service';
import type { Recipe } from '../types/recipe';

export class RecipeImportService {
  /**
   * 从Excel文件导入食谱
   */
  async importFromExcel(filePath: string): Promise<{
    total: number;
    success: number;
    failed: number;
    failures: { recipe: string; error: string }[];
  }> {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const recipes = xlsx.utils.sheet_to_json(sheet);
      
      return await this.processRecipes(recipes);
    } catch (error) {
      console.error('Failed to import recipes from Excel:', error);
      throw error;
    }
  }

  /**
   * 从URL导入食谱
   */
  async importFromUrl(url: string): Promise<{
    total: number;
    success: number;
    failed: number;
    failures: { recipe: string; error: string }[];
  }> {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const recipes: any[] = [];
      
      // 这里需要根据实际网页结构编写抓取逻辑
      // 这是一个简单的示例，假设食谱在一个特定的容器里
      $('.recipe-card').each((_, element) => {
        const recipe = {
          name: $(element).find('.recipe-title').text().trim(),
          description: $(element).find('.recipe-description').text().trim(),
          ingredients: $(element).find('.ingredients').text().trim(),
          steps: $(element).find('.instructions').text().trim(),
          cookingTime: Number.parseInt($(element).find('.cooking-time').text()) || null,
          calories: Number.parseInt($(element).find('.calories').text()) || null,
          cuisineType: $(element).find('.cuisine-type').text().trim() || null,
          dietType: $(element).find('.diet-type').text().trim().split(',').map(s => s.trim()) || null,
          img: $(element).find('img').attr('src') || null
        };
        
        recipes.push(recipe);
      });
      
      return await this.processRecipes(recipes);
    } catch (error) {
      console.error('Failed to import recipes from URL:', error);
      throw error;
    }
  }

  /**
   * 处理和向量化食谱
   */
  private async processRecipes(recipesData: any[]): Promise<{
    total: number;
    success: number;
    failed: number;
    failures: { recipe: string; error: string }[];
  }> {
    const results = {
      total: recipesData.length,
      success: 0,
      failed: 0,
      failures: [] as { recipe: string; error: string }[]
    };

    for (const recipeData of recipesData) {
      try {
        // 1. 保存食谱到Supabase
        const { data: recipe, error } = await supabase
          .from('recipes')
          .insert({
            name: recipeData.name,
            description: recipeData.description || null,
            ingredients: recipeData.ingredients || {},
            steps: recipeData.steps || [],
            calories: recipeData.calories || null,
            cookingTime: recipeData.cookingTime || null,
            cuisineType: recipeData.cuisineType || null,
            dietType: recipeData.dietType || null,
            img: recipeData.img || null,
            created_by: 'admin',
          })
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        // 2. 准备食谱文本用于向量化
        const recipeText = embeddingService.prepareRecipeText(recipe);
        
        // 3. 获取向量表示
        const vector = await embeddingService.getEmbedding(recipeText);
        
        // 4. 存储到向量数据库
        await qdrantService.addOrUpdateRecipe(recipe.id, vector, {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          img: recipe.img,
          cookingTime: recipe.cookingTime,
          calories: recipe.calories,
          cuisineType: recipe.cuisineType,
          dietType: recipe.dietType,
        });
        
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.failures.push({
          recipe: recipeData.name || 'Unknown',
          error: error.message || 'Unknown error'
        });
      }
    }
    
    return results;
  }
}

// 创建单例
const recipeImportService = new RecipeImportService();
export { recipeImportService }; 