// src/services/cache-warmup-progress.service.ts
import { Redis } from '@upstash/redis';

// 预热任务状态
export type WarmupTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed';

// 预热任务类型
export type WarmupTaskType =
  | 'popular_recipes'
  | 'recent_recipes'
  | 'cuisine_type'
  | 'recipe_stats';

// 预热任务进度
export interface TaskProgress {
  taskId: string;
  taskType: WarmupTaskType;
  status: WarmupTaskStatus;
  total: number;
  completed: number;
  failed: number;
  startTime: string;
  endTime?: string;
  error?: string;
  details: {
    currentItem?: string;
    lastProcessedItem?: string;
    processingSpeed?: number; // 每秒处理数量
    estimatedTimeRemaining?: number; // 预计剩余时间（秒）
  };
}

// 预热会话
export interface WarmupSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  status: WarmupTaskStatus;
  progress: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
  };
  tasks: Record<string, TaskProgress>;
}

export class CacheWarmupProgressService {
  private redis: Redis;
  private readonly SESSIONS_KEY = 'cache:warmup:sessions';

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
  }

  // 创建新的预热会话
  async createSession(): Promise<string> {
    const sessionId = `warmup_${Date.now()}`;
    const session: WarmupSession = {
      sessionId,
      startTime: new Date().toISOString(),
      status: 'pending',
      progress: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
      },
      tasks: {},
    };

    await this.redis.hset(this.SESSIONS_KEY, {
      [sessionId]: JSON.stringify(session),
    });

    return sessionId;
  }

  // 创建新任务
  async createTask(
    sessionId: string,
    taskType: WarmupTaskType,
    total: number
  ): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const taskId = `${taskType}_${Date.now()}`;
    const task: TaskProgress = {
      taskId,
      taskType,
      status: 'pending',
      total,
      completed: 0,
      failed: 0,
      startTime: new Date().toISOString(),
      details: {},
    };

    session.tasks[taskId] = task;
    session.progress.totalTasks++;

    await this.updateSession(session);
    return taskId;
  }

  // 更新任务进度
  async updateTaskProgress(
    sessionId: string,
    taskId: string,
    update: Partial<TaskProgress>
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const task = session.tasks[taskId];
    if (!task) throw new Error('Task not found');

    // 更新任务状态
    Object.assign(task, update);

    // 计算处理速度
    if (task.status === 'in_progress') {
      const elapsedTime =
        (new Date().getTime() - new Date(task.startTime).getTime()) / 1000;
      task.details.processingSpeed = task.completed / elapsedTime;

      // 计算预计剩余时间
      if (task.details.processingSpeed > 0) {
        task.details.estimatedTimeRemaining =
          (task.total - task.completed) / task.details.processingSpeed;
      }
    }

    // 如果任务完成或失败，设置结束时间
    if (['completed', 'failed'].includes(task.status)) {
      task.endTime = new Date().toISOString();
    }

    // 更新会话进度
    this.updateSessionProgress(session);
    await this.updateSession(session);
  }

  // 更新会话进度统计
  private updateSessionProgress(session: WarmupSession): void {
    const progress = {
      totalTasks: Object.keys(session.tasks).length,
      completedTasks: 0,
      failedTasks: 0,
    };

    for (const task of Object.values(session.tasks)) {
      if (task.status === 'completed') progress.completedTasks++;
      if (task.status === 'failed') progress.failedTasks++;
    }

    session.progress = progress;

    // 更新会话状态
    if (progress.failedTasks > 0) {
      session.status = 'failed';
    } else if (progress.completedTasks === progress.totalTasks) {
      session.status = 'completed';
      session.endTime = new Date().toISOString();
    } else if (progress.completedTasks > 0) {
      session.status = 'in_progress';
    }
  }

  // 获取会话信息
  async getSession(sessionId: string): Promise<WarmupSession | null> {
    const sessionJson = await this.redis.hget<string>(
      this.SESSIONS_KEY,
      sessionId
    );
    return sessionJson ? JSON.parse(sessionJson) : null;
  }

  // 更新会话信息
  private async updateSession(session: WarmupSession): Promise<void> {
    await this.redis.hset(this.SESSIONS_KEY, {
      [session.sessionId]: JSON.stringify(session),
    });
  }

  // 获取最近的预热会话列表
  async getRecentSessions(limit: number = 10): Promise<WarmupSession[]> {
    const sessions = await this.redis.hgetall<Record<string, string>>(
      this.SESSIONS_KEY
    );
    if (!sessions) return [];

    return Object.values(sessions)
      .map((s) => JSON.parse(s))
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
      .slice(0, limit);
  }

  // 清理旧会话记录
  async cleanupOldSessions(
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<void> {
    const sessions = await this.redis.hgetall<Record<string, string>>(
      this.SESSIONS_KEY
    );
    if (!sessions) return;

    const now = Date.now();
    const deleteSessions = Object.entries(sessions)
      .filter(([_, sessionJson]) => {
        const session: WarmupSession = JSON.parse(sessionJson);
        const sessionTime = new Date(session.startTime).getTime();
        return now - sessionTime > maxAge;
      })
      .map(([sessionId]) => sessionId);

    if (deleteSessions.length > 0) {
      await this.redis.hdel(this.SESSIONS_KEY, ...deleteSessions);
    }
  }
}
