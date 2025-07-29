/**
 * Feedback Collection System
 * 
 * Comprehensive system for collecting, storing, and analyzing
 * user feedback from testing sessions and production usage.
 */

import { z } from 'zod';

/**
 * Feedback types and categories
 */
export enum FeedbackType {
  USABILITY = 'usability',
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  GENERAL = 'general',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
}

export enum FeedbackCategory {
  AUTHENTICATION = 'authentication',
  RAFFLE_STATUS = 'raffle_status',
  PARTICIPATION = 'participation',
  LEADERBOARD = 'leaderboard',
  FRAMES = 'frames',
  NAVIGATION = 'navigation',
  DESIGN = 'design',
  MOBILE = 'mobile',
}

export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum FeedbackStatus {
  NEW = 'new',
  REVIEWED = 'reviewed',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  WONT_FIX = 'wont_fix',
}

/**
 * Feedback data structures
 */
export interface UserTestingSession {
  id: string;
  participantId: string;
  moderatorId: string;
  testDate: Date;
  duration: number; // minutes
  completedTasks: string[];
  failedTasks: string[];
  overallRating: number; // 1-5
  notes: string;
  recordingUrl?: string;
  environment: 'staging' | 'production' | 'local';
}

export interface FeedbackItem {
  id: string;
  sessionId?: string;
  userId?: string;
  type: FeedbackType;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  title: string;
  description: string;
  stepsToReproduce?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: BrowserInfo;
  deviceInfo?: DeviceInfo;
  screenshots?: string[];
  videoUrl?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  userAgent: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  screenResolution: string;
  viewport: string;
}

export interface TaskMetrics {
  taskId: string;
  taskName: string;
  completionRate: number;
  averageTime: number;
  errorRate: number;
  satisfactionScore: number;
  commonIssues: string[];
}

export interface UserSatisfactionMetrics {
  overallSatisfaction: number;
  easeOfUse: number;
  valueProposition: number;
  trustworthiness: number;
  likelihoodToRecommend: number;
  likelihoodToUse: number;
}

/**
 * Validation schemas
 */
export const FeedbackItemSchema = z.object({
  type: z.nativeEnum(FeedbackType),
  category: z.nativeEnum(FeedbackCategory),
  priority: z.nativeEnum(FeedbackPriority),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  stepsToReproduce: z.array(z.string()).optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  tags: z.array(z.string()).default([]),
  screenshots: z.array(z.string()).optional(),
  videoUrl: z.string().url().optional(),
});

export const UserTestingSessionSchema = z.object({
  participantId: z.string(),
  moderatorId: z.string(),
  duration: z.number().positive(),
  completedTasks: z.array(z.string()),
  failedTasks: z.array(z.string()),
  overallRating: z.number().min(1).max(5),
  notes: z.string(),
  recordingUrl: z.string().url().optional(),
  environment: z.enum(['staging', 'production', 'local']),
});

/**
 * Feedback collection service
 */
export class FeedbackCollectionService {
  /**
   * Submit feedback from user testing session
   */
  static async submitTestingFeedback(
    sessionData: Omit<UserTestingSession, 'id' | 'testDate'>,
    feedbackItems: Omit<FeedbackItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>[]
  ): Promise<{ sessionId: string; feedbackIds: string[] }> {
    // Validate session data
    const validatedSession = UserTestingSessionSchema.parse(sessionData);
    
    // Create session record
    const sessionId = await this.createTestingSession(validatedSession);
    
    // Create feedback items
    const feedbackIds = await Promise.all(
      feedbackItems.map(item => 
        this.createFeedbackItem({
          ...item,
          sessionId,
          status: FeedbackStatus.NEW,
        })
      )
    );
    
    // Generate session report
    await this.generateSessionReport(sessionId);
    
    return { sessionId, feedbackIds };
  }

  /**
   * Submit production feedback from users
   */
  static async submitProductionFeedback(
    userId: string,
    feedbackData: Omit<FeedbackItem, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'userId'>
  ): Promise<string> {
    // Add browser and device info
    const browserInfo = this.getBrowserInfo();
    const deviceInfo = this.getDeviceInfo();
    
    const feedbackItem: Omit<FeedbackItem, 'id' | 'createdAt' | 'updatedAt'> = {
      ...feedbackData,
      userId,
      status: FeedbackStatus.NEW,
      browserInfo,
      deviceInfo,
    };
    
    // Validate feedback
    FeedbackItemSchema.parse({
      type: feedbackItem.type,
      category: feedbackItem.category,
      priority: feedbackItem.priority,
      title: feedbackItem.title,
      description: feedbackItem.description,
      stepsToReproduce: feedbackItem.stepsToReproduce,
      expectedBehavior: feedbackItem.expectedBehavior,
      actualBehavior: feedbackItem.actualBehavior,
      tags: feedbackItem.tags,
      screenshots: feedbackItem.screenshots,
      videoUrl: feedbackItem.videoUrl,
    });
    
    const feedbackId = await this.createFeedbackItem(feedbackItem);
    
    // Auto-categorize and prioritize
    await this.autoCategorize(feedbackId);
    
    // Notify team if high priority
    if (feedbackItem.priority === FeedbackPriority.HIGH || feedbackItem.priority === FeedbackPriority.CRITICAL) {
      await this.notifyTeam(feedbackId);
    }
    
    return feedbackId;
  }

  /**
   * Create testing session record
   */
  private static async createTestingSession(
    sessionData: Omit<UserTestingSession, 'id' | 'testDate'>
  ): Promise<string> {
    const session: UserTestingSession = {
      id: this.generateId(),
      testDate: new Date(),
      ...sessionData,
    };
    
    // Store in database (implementation depends on your database choice)
    await this.storeSession(session);
    
    return session.id;
  }

  /**
   * Create feedback item record
   */
  private static async createFeedbackItem(
    feedbackData: Omit<FeedbackItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const feedback: FeedbackItem = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...feedbackData,
    };
    
    // Store in database
    await this.storeFeedback(feedback);
    
    return feedback.id;
  }

  /**
   * Auto-categorize feedback based on content
   */
  private static async autoCategorize(feedbackId: string): Promise<void> {
    const feedback = await this.getFeedbackById(feedbackId);
    if (!feedback) return;
    
    const content = `${feedback.title} ${feedback.description}`.toLowerCase();
    
    // Auto-detect category based on keywords
    const categoryKeywords = {
      [FeedbackCategory.AUTHENTICATION]: ['login', 'wallet', 'connect', 'auth', 'farcaster'],
      [FeedbackCategory.RAFFLE_STATUS]: ['status', 'tickets', 'raffle', 'progress'],
      [FeedbackCategory.PARTICIPATION]: ['participate', 'engage', 'like', 'comment', 'recast'],
      [FeedbackCategory.LEADERBOARD]: ['leaderboard', 'ranking', 'position', 'competitor'],
      [FeedbackCategory.FRAMES]: ['frame', 'embed', 'cast'],
      [FeedbackCategory.NAVIGATION]: ['navigate', 'menu', 'button', 'link', 'page'],
      [FeedbackCategory.DESIGN]: ['design', 'ui', 'color', 'layout', 'visual'],
      [FeedbackCategory.MOBILE]: ['mobile', 'phone', 'responsive', 'touch'],
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        await this.updateFeedbackCategory(feedbackId, category as FeedbackCategory);
        break;
      }
    }
    
    // Auto-detect priority based on keywords
    const priorityKeywords = {
      [FeedbackPriority.CRITICAL]: ['crash', 'broken', 'security', 'data loss'],
      [FeedbackPriority.HIGH]: ['error', 'bug', 'fail', 'issue', 'problem'],
      [FeedbackPriority.MEDIUM]: ['improve', 'enhance', 'suggestion'],
      [FeedbackPriority.LOW]: ['minor', 'cosmetic', 'nice to have'],
    };
    
    for (const [priority, keywords] of Object.entries(priorityKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        await this.updateFeedbackPriority(feedbackId, priority as FeedbackPriority);
        break;
      }
    }
  }

  /**
   * Generate session report
   */
  private static async generateSessionReport(sessionId: string): Promise<void> {
    const session = await this.getSessionById(sessionId);
    const feedback = await this.getFeedbackBySessionId(sessionId);
    
    if (!session) return;
    
    const report = {
      sessionId,
      participant: session.participantId,
      date: session.testDate,
      duration: session.duration,
      completionRate: session.completedTasks.length / (session.completedTasks.length + session.failedTasks.length),
      overallRating: session.overallRating,
      issuesFound: feedback.length,
      criticalIssues: feedback.filter(f => f.priority === FeedbackPriority.CRITICAL).length,
      highPriorityIssues: feedback.filter(f => f.priority === FeedbackPriority.HIGH).length,
      categories: this.groupBy(feedback, 'category'),
      summary: this.generateSessionSummary(session, feedback),
    };
    
    await this.storeSessionReport(sessionId, report);
  }

  /**
   * Analyze feedback trends
   */
  static async analyzeFeedbackTrends(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalFeedback: number;
    byType: Record<FeedbackType, number>;
    byCategory: Record<FeedbackCategory, number>;
    byPriority: Record<FeedbackPriority, number>;
    topIssues: Array<{ description: string; count: number }>;
    satisfactionTrend: Array<{ date: Date; score: number }>;
  }> {
    const feedback = await this.getFeedbackInDateRange(startDate, endDate);
    const sessions = await this.getSessionsInDateRange(startDate, endDate);
    
    return {
      totalFeedback: feedback.length,
      byType: this.groupBy(feedback, 'type'),
      byCategory: this.groupBy(feedback, 'category'),
      byPriority: this.groupBy(feedback, 'priority'),
      topIssues: this.getTopIssues(feedback),
      satisfactionTrend: this.calculateSatisfactionTrend(sessions),
    };
  }

  /**
   * Generate feedback insights
   */
  static async generateInsights(): Promise<{
    criticalIssues: FeedbackItem[];
    userPainPoints: string[];
    improvementOpportunities: string[];
    satisfactionScore: number;
    recommendationScore: number;
  }> {
    const recentFeedback = await this.getRecentFeedback(30); // Last 30 days
    const recentSessions = await this.getRecentSessions(30);
    
    const criticalIssues = recentFeedback.filter(f => 
      f.priority === FeedbackPriority.CRITICAL || f.priority === FeedbackPriority.HIGH
    );
    
    const userPainPoints = this.extractPainPoints(recentFeedback);
    const improvementOpportunities = this.identifyImprovements(recentFeedback);
    
    const satisfactionScore = this.calculateAverageSatisfaction(recentSessions);
    const recommendationScore = this.calculateRecommendationScore(recentSessions);
    
    return {
      criticalIssues,
      userPainPoints,
      improvementOpportunities,
      satisfactionScore,
      recommendationScore,
    };
  }

  /**
   * Helper methods
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getBrowserInfo(): BrowserInfo {
    if (typeof window === 'undefined') {
      return { name: 'Unknown', version: 'Unknown', userAgent: 'Server' };
    }
    
    const userAgent = window.navigator.userAgent;
    // Parse browser info from user agent
    // This is a simplified implementation
    return {
      name: 'Chrome', // Parse from userAgent
      version: '120.0', // Parse from userAgent
      userAgent,
    };
  }

  private static getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        os: 'Unknown',
        screenResolution: 'Unknown',
        viewport: 'Unknown',
      };
    }
    
    return {
      type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      os: window.navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  }

  private static groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private static getTopIssues(feedback: FeedbackItem[]): Array<{ description: string; count: number }> {
    const issues = feedback.reduce((acc, item) => {
      const key = item.title.toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(issues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([description, count]) => ({ description, count }));
  }

  private static calculateSatisfactionTrend(sessions: UserTestingSession[]): Array<{ date: Date; score: number }> {
    const dailyScores = sessions.reduce((acc, session) => {
      const date = session.testDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0 };
      }
      acc[date].total += session.overallRating;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
    
    return Object.entries(dailyScores)
      .map(([date, { total, count }]) => ({
        date: new Date(date),
        score: total / count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private static extractPainPoints(feedback: FeedbackItem[]): string[] {
    // Extract common pain points from feedback descriptions
    // This is a simplified implementation
    const painPointKeywords = [
      'confusing', 'unclear', 'difficult', 'frustrating', 'slow',
      'hard to find', 'not intuitive', 'complicated', 'error',
    ];
    
    return feedback
      .filter(f => f.type === FeedbackType.USABILITY || f.type === FeedbackType.BUG)
      .map(f => f.description.toLowerCase())
      .filter(desc => painPointKeywords.some(keyword => desc.includes(keyword)))
      .slice(0, 10); // Top 10 pain points
  }

  private static identifyImprovements(feedback: FeedbackItem[]): string[] {
    return feedback
      .filter(f => f.type === FeedbackType.FEATURE_REQUEST)
      .map(f => f.title)
      .slice(0, 10); // Top 10 improvement opportunities
  }

  private static calculateAverageSatisfaction(sessions: UserTestingSession[]): number {
    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, session) => sum + session.overallRating, 0) / sessions.length;
  }

  private static calculateRecommendationScore(sessions: UserTestingSession[]): number {
    // Simplified NPS-like calculation based on overall rating
    if (sessions.length === 0) return 0;
    
    const promoters = sessions.filter(s => s.overallRating >= 4).length;
    const detractors = sessions.filter(s => s.overallRating <= 2).length;
    
    return ((promoters - detractors) / sessions.length) * 100;
  }

  // Database interaction methods (to be implemented based on your database choice)
  private static async storeSession(session: UserTestingSession): Promise<void> {
    // Implementation depends on your database
  }

  private static async storeFeedback(feedback: FeedbackItem): Promise<void> {
    // Implementation depends on your database
  }

  private static async getFeedbackById(id: string): Promise<FeedbackItem | null> {
    // Implementation depends on your database
    return null;
  }

  private static async getSessionById(id: string): Promise<UserTestingSession | null> {
    // Implementation depends on your database
    return null;
  }

  private static async getFeedbackBySessionId(sessionId: string): Promise<FeedbackItem[]> {
    // Implementation depends on your database
    return [];
  }

  private static async updateFeedbackCategory(id: string, category: FeedbackCategory): Promise<void> {
    // Implementation depends on your database
  }

  private static async updateFeedbackPriority(id: string, priority: FeedbackPriority): Promise<void> {
    // Implementation depends on your database
  }

  private static async storeSessionReport(sessionId: string, report: any): Promise<void> {
    // Implementation depends on your database
  }

  private static async getFeedbackInDateRange(startDate: Date, endDate: Date): Promise<FeedbackItem[]> {
    // Implementation depends on your database
    return [];
  }

  private static async getSessionsInDateRange(startDate: Date, endDate: Date): Promise<UserTestingSession[]> {
    // Implementation depends on your database
    return [];
  }

  private static async getRecentFeedback(days: number): Promise<FeedbackItem[]> {
    // Implementation depends on your database
    return [];
  }

  private static async getRecentSessions(days: number): Promise<UserTestingSession[]> {
    // Implementation depends on your database
    return [];
  }

  private static generateSessionSummary(session: UserTestingSession, feedback: FeedbackItem[]): string {
    return `Session completed with ${session.overallRating}/5 rating. Found ${feedback.length} issues.`;
  }

  private static async notifyTeam(feedbackId: string): Promise<void> {
    // Send notification to development team
    console.log(`High priority feedback received: ${feedbackId}`);
  }
}