import { QdrantClient } from '@qdrant/js-client-rest';
import { Logger } from '../utils/logger';

const logger = new Logger('QdrantService');

export interface QdrantConfig {
  url: string;
  apiKey?: string;
  collectionName: string;
  vectorDimension: number;
}

export class QdrantService {
  private client: QdrantClient;
  private collectionName: string;
  private vectorDimension: number;

  constructor(config: QdrantConfig) {
    this.client = new QdrantClient({
      url: config.url,
      apiKey: config.apiKey,
    });
    this.collectionName = config.collectionName;
    this.vectorDimension = config.vectorDimension;
  }

  async initialize(): Promise<void> {
    try {
      // 检查集合是否存在，不存在则创建
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === this.collectionName);

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorDimension,
            distance: 'Cosine'
          }
        });
        logger.info(`Collection ${this.collectionName} created successfully`);
      }
    } catch (error) {
      logger.error('Failed to initialize Qdrant:', error);
      throw error;
    }
  }

  async addOrUpdateRecipe(recipeId: string, vector: number[], payload: any): Promise<void> {
    try {
      await this.client.upsert(this.collectionName, {
        points: [{
          id: recipeId,
          vector: vector,
          payload: payload
        }]
      });
      logger.info(`Recipe ${recipeId} added/updated in vector database`);
    } catch (error) {
      logger.error(`Failed to add/update recipe ${recipeId}:`, error);
      throw error;
    }
  }

  async searchSimilar(vector: number[], limit: number, offset?: number) {
    try {
      const effectiveOffset = offset ?? 0;
      const results = await this.client.search(this.collectionName, {
        vector: vector,
        limit: limit,
        offset: effectiveOffset
      });
      return results;
    } catch (error) {
      logger.error('Failed to search similar recipes:', error);
      throw error;
    }
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        points: [recipeId]
      });
      logger.info(`Recipe ${recipeId} deleted from vector database`);
    } catch (error) {
      logger.error(`Failed to delete recipe ${recipeId}:`, error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const countResult = await this.client.count(this.collectionName);
      return countResult.count;
    } catch (error) {
      logger.error('Failed to count recipes in vector database:', error);
      throw error;
    }
  }
}

// 创建单例实例
const qdrantService = new QdrantService({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
  collectionName: process.env.QDRANT_COLLECTION || 'recipes',
  vectorDimension: 1536 // SiliconFlow标准embedding维度
});

export { qdrantService }; 