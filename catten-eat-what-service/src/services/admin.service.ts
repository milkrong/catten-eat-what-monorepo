// src/services/admin.service.ts
import { CacheWarmupProgressService } from './cache-warmup-progress.service';
import type { WarmupSchedulerService } from './warmup-scheduler.service';
import { qdrantService } from './qdrant.service';

class AdminService {
  private progressService: CacheWarmupProgressService;

  constructor() {
    this.progressService = new CacheWarmupProgressService();
  }

  async getCacheStatus(warmupScheduler: WarmupSchedulerService) {
    return warmupScheduler.getStatus();
  }

  async triggerManualWarmup(warmupScheduler: WarmupSchedulerService) {
    return await warmupScheduler.manualWarmup();
  }

  async getWarmupSessions(limit: number) {
    return await this.progressService.getRecentSessions(limit);
  }

  async getWarmupSession(sessionId: string) {
    return await this.progressService.getSession(sessionId);
  }

  async getWarmupSummary() {
    const sessions = await this.progressService.getRecentSessions(1);
    if (sessions.length === 0) {
      return {
        status: 'no_recent_sessions',
        lastRun: null,
      };
    }

    const latestSession = sessions[0];
    return {
      status: latestSession.status,
      progress: latestSession.progress,
      startTime: latestSession.startTime,
      endTime: latestSession.endTime,
      duration: latestSession.endTime
        ? new Date(latestSession.endTime).getTime() -
          new Date(latestSession.startTime).getTime()
        : null,
      taskSummary: Object.values(latestSession.tasks).map((task) => ({
        type: task.taskType,
        status: task.status,
        progress: `${task.completed}/${task.total}`,
        failed: task.failed,
        estimatedTimeRemaining: task.details.estimatedTimeRemaining,
      })),
    };
  }

  async getVectorDbStatus() {
    await qdrantService.initialize();
    const count = await qdrantService.count();
    
    return {
      success: true,
      status: 'connected',
      recipeCount: count
    };
  }
}

export const adminService = new AdminService(); 