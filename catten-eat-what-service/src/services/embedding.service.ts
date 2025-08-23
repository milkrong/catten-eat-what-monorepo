import { OpenAIService } from './openai-like.service';
import type { Recipe } from '../types/recipe';

export class EmbeddingService {
  private siliconflowService: OpenAIService;
  
  constructor() {
    this.siliconflowService = new OpenAIService({
      apiKey: process.env.SILICONFLOW_API_KEY!,
      apiEndpoint: process.env.SILICONFLOW_API_ENDPOINT!,
      model: process.env.SILICONFLOW_EMBEDDING_MODEL || process.env.SILICONFLOW_MODEL!,
    });
  }

  /**
   * 获取文本的向量表示
   */
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.siliconflowService.createEmbedding(text);
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error getting embedding from SiliconFlow:', error);
      throw error;
    }
  }

  /**
   * 基于食谱生成文本描述用于向量化
   */
  prepareRecipeText(recipe: Recipe): string {
    const ingredients = (recipe.ingredients as { name: string }[])?.map(i => i.name).join(', ') || '';
    
    return `
      菜名: ${recipe.name}
      食材: ${ingredients}
      烹饪方法: ${recipe.steps || ''}
      菜系: ${recipe.cuisineType || ''}
      口味特点: ${recipe.description || ''}
      制作难度: ${recipe.cookingTime || ''}
      热量: ${recipe.calories || ''}
      烹饪时间: ${recipe.cookingTime || ''}
      餐点类型: ${recipe.cuisineType || ''}
      特殊饮食: ${recipe.dietType?.join(', ') || ''}
    `.trim();
  }

  /**
   * 生成上下文感知的查询向量
   */
  async getContextBasedVector(context: {
    season?: string;
    holiday?: string;
    mealType?: string;
    timeOfDay?: string;
  }): Promise<number[]> {
    const { season, holiday, mealType, timeOfDay } = context;
    
    let contextText = '';
    
    if (season) {
      contextText += `${season}季节适合的食谱，使用当季食材。`;
    }
    
    if (holiday) {
      contextText += `适合${holiday}的传统或创新食谱。`;
    }
    
    if (mealType) {
      contextText += `适合作为${mealType}的食谱。`;
    }
    
    if (timeOfDay) {
      contextText += `适合在${timeOfDay}食用的餐点。`;
    }
    
    // 如果没有任何上下文信息，使用通用描述
    if (!contextText) {
      contextText = '美味健康的家常菜谱推荐';
    }
    
    return await this.getEmbedding(contextText);
  }
}

// 创建单例
const embeddingService = new EmbeddingService();
export { embeddingService }; 