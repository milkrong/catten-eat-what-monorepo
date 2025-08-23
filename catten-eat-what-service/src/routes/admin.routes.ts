// src/routes/admin.routes.ts
import { Hono } from 'hono';
import { CacheWarmupProgressService } from '../services/cache-warmup-progress.service';
import type { WarmupSchedulerService } from '../services/warmup-scheduler.service';
import { recipeImportService } from '../services/recipe-import.service';
import { qdrantService } from '../services/qdrant.service';
import { tmpdir } from 'node:os';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { adminService } from '../services/admin.service';

// Define custom Variables for Hono context
type Variables = {
  tempFilePath: string;
};

const app = new Hono<{ Variables: Variables }>();
const progressService = new CacheWarmupProgressService();

// Helper function to safely extract error message
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// 文件上传处理中间件
const fileUpload = async (c: any, next: any) => {
  const formData = await c.req.formData();
  const file = formData.get('file');
  
  if (!file || !(file instanceof File)) {
    return c.json({ success: false, message: '未提供有效的文件' }, 400);
  }
  
  const tempFilePath = join(tmpdir(), `${randomUUID()}-${file.name}`);
  
  try {
    // 写入临时文件
    const fileStream = createWriteStream(tempFilePath);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
      fileStream.write(buffer);
      fileStream.end();
    });
    
    // 将文件路径存储在请求对象中
    c.set('tempFilePath', tempFilePath);
    
    await next();
    
    // 清理临时文件
    await fs.unlink(tempFilePath).catch(() => {});
  } catch (error) {
    console.error('文件上传处理错误:', error);
    return c.json({
      success: false,
      message: '文件处理失败',
      error: getErrorMessage(error)
    }, 500);
  }
};

export const initAdminRoutes = (warmupScheduler: WarmupSchedulerService) => {
  // Basic cache status and manual warmup endpoints
  app.get('/cache/status', async (c) => {
    return c.json(await adminService.getCacheStatus(warmupScheduler));
  });

  app.post('/cache/warmup', async (c) => {
    await adminService.triggerManualWarmup(warmupScheduler);
    return c.json({ message: 'Cache warmup triggered' });
  });

  // Detailed warmup session management
  app.get('/cache/warmup/sessions', async (c) => {
    const limit = Number.parseInt(c.req.query('limit') || '10');
    const sessions = await adminService.getWarmupSessions(limit);
    return c.json(sessions);
  });

  app.get('/cache/warmup/sessions/:sessionId', async (c) => {
    const sessionId = c.req.param('sessionId');
    const session = await adminService.getWarmupSession(sessionId);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json(session);
  });

  app.get('/cache/warmup/summary', async (c) => {
    try {
      const summary = await adminService.getWarmupSummary();
      return c.json(summary);
    } catch (error) {
      return c.json({
        success: false,
        message: '获取缓存状态失败',
        error: getErrorMessage(error)
      }, 500);
    }
  });

  // 添加食谱导入接口
  app.post('/recipes/import/excel', fileUpload, async (c) => {
    try {
      const tempFilePath = c.get('tempFilePath');
      
      if (!tempFilePath) {
        return c.json({ success: false, message: '文件未找到' }, 400);
      }
      
      const result = await recipeImportService.importFromExcel(tempFilePath);
      
      return c.json({
        success: true,
        message: `成功导入 ${result.success} 个食谱，失败 ${result.failed} 个`,
        data: result
      });
    } catch (error) {
      return c.json({
        success: false, 
        message: '导入失败', 
        error: getErrorMessage(error)
      }, 500);
    }
  });

  app.post('/recipes/import/url', async (c) => {
    try {
      const body = await c.req.json();
      const { url } = body;
      
      if (!url) {
        return c.json({ success: false, message: '未提供URL' }, 400);
      }
      
      const result = await recipeImportService.importFromUrl(url);
      
      return c.json({
        success: true,
        message: `成功导入 ${result.success} 个食谱，失败 ${result.failed} 个`,
        data: result
      });
    } catch (error) {
      return c.json({
        success: false,
        message: '导入失败',
        error: getErrorMessage(error)
      }, 500);
    }
  });

  // 添加向量数据库状态接口
  app.get('/vector-db/status', async (c) => {
    try {
      const status = await adminService.getVectorDbStatus();
      return c.json(status);
    } catch (error) {
      return c.json({
        success: false,
        status: 'error',
        message: getErrorMessage(error)
      }, 500);
    }
  });

  return app;
};

export { app as adminRoutes };
