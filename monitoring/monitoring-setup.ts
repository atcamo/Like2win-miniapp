/**
 * Production Monitoring Setup
 * 
 * Comprehensive monitoring system for tracking application health,
 * performance, user experience, and business metrics.
 */

import { config } from '@/lib/config';

/**
 * Monitoring configuration interface
 */
export interface MonitoringConfig {
  environment: 'staging' | 'production';
  alerting: AlertingConfig;
  metrics: MetricsConfig;
  logging: LoggingConfig;
  dashboards: DashboardConfig;
}

export interface AlertingConfig {
  channels: {
    slack: string;
    email: string[];
    pagerduty?: string;
    webhook?: string;
  };
  thresholds: AlertThresholds;
  escalation: EscalationRules;
}

export interface AlertThresholds {
  // Application performance
  responseTime: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  availability: { warning: number; critical: number };
  
  // Database performance
  dbResponseTime: { warning: number; critical: number };
  dbConnectionPool: { warning: number; critical: number };
  slowQueries: { warning: number; critical: number };
  
  // User experience
  authSuccessRate: { warning: number; critical: number };
  participationSuccessRate: { warning: number; critical: number };
  pageLoadTime: { warning: number; critical: number };
  
  // Business metrics
  userSignupRate: { warning: number; critical: number };
  participationRate: { warning: number; critical: number };
  errorBudget: { warning: number; critical: number };
}

export interface EscalationRules {
  immediate: string[]; // Critical alerts
  within5min: string[]; // High priority alerts
  within15min: string[]; // Medium priority alerts
  daily: string[]; // Low priority alerts
}

export interface MetricsConfig {
  collection: {
    interval: number;
    retention: number;
    aggregation: string[];
  };
  customMetrics: CustomMetric[];
}

export interface CustomMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels: string[];
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  structured: boolean;
  sampling: number;
  retention: number;
}

export interface DashboardConfig {
  overview: OverviewDashboard;
  technical: TechnicalDashboard;
  business: BusinessDashboard;
  alerts: AlertsDashboard;
}

/**
 * Production monitoring configuration
 */
export const productionMonitoringConfig: MonitoringConfig = {
  environment: 'production',
  
  alerting: {
    channels: {
      slack: '#alerts-like2win',
      email: ['devops@like2win.app', 'tech-lead@like2win.app'],
      pagerduty: process.env.PAGERDUTY_INTEGRATION_KEY,
      webhook: process.env.ALERT_WEBHOOK_URL,
    },
    
    thresholds: {
      // Application performance (99.9% SLA target)
      responseTime: { warning: 500, critical: 1000 }, // milliseconds
      errorRate: { warning: 1, critical: 5 }, // percentage
      availability: { warning: 99.5, critical: 99.0 }, // percentage
      
      // Database performance
      dbResponseTime: { warning: 100, critical: 500 }, // milliseconds
      dbConnectionPool: { warning: 70, critical: 90 }, // percentage utilization
      slowQueries: { warning: 5, critical: 20 }, // queries per minute
      
      // User experience
      authSuccessRate: { warning: 95, critical: 90 }, // percentage
      participationSuccessRate: { warning: 92, critical: 85 }, // percentage
      pageLoadTime: { warning: 2000, critical: 4000 }, // milliseconds
      
      // Business metrics
      userSignupRate: { warning: 50, critical: 25 }, // percentage of baseline
      participationRate: { warning: 70, critical: 50 }, // percentage of baseline
      errorBudget: { warning: 80, critical: 95 }, // percentage consumed
    },
    
    escalation: {
      immediate: ['tech-lead@like2win.app', 'devops@like2win.app'],
      within5min: ['team@like2win.app'],
      within15min: ['product@like2win.app'],
      daily: ['management@like2win.app'],
    },
  },
  
  metrics: {
    collection: {
      interval: 15, // seconds
      retention: 90, // days
      aggregation: ['1m', '5m', '15m', '1h', '1d'],
    },
    
    customMetrics: [
      {
        name: 'like2win_raffle_participations_total',
        type: 'counter',
        description: 'Total number of raffle participations',
        labels: ['user_type', 'engagement_type', 'raffle_id'],
      },
      {
        name: 'like2win_authentication_attempts_total',
        type: 'counter',
        description: 'Total authentication attempts',
        labels: ['method', 'success', 'user_agent'],
      },
      {
        name: 'like2win_ticket_distribution_total',
        type: 'counter',
        description: 'Total tickets distributed',
        labels: ['raffle_id', 'user_type'],
      },
      {
        name: 'like2win_api_request_duration_seconds',
        type: 'histogram',
        description: 'API request duration in seconds',
        labels: ['method', 'endpoint', 'status_code'],
      },
      {
        name: 'like2win_database_query_duration_seconds',
        type: 'histogram',
        description: 'Database query duration in seconds',
        labels: ['query_type', 'table'],
      },
      {
        name: 'like2win_user_sessions_active',
        type: 'gauge',
        description: 'Number of active user sessions',
        labels: ['auth_method'],
      },
      {
        name: 'like2win_raffle_status',
        type: 'gauge',
        description: 'Current raffle status',
        labels: ['raffle_id', 'status'],
      },
    ],
  },
  
  logging: {
    level: 'info',
    structured: true,
    sampling: 1.0, // 100% in production
    retention: 30, // days
  },
  
  dashboards: {
    overview: {
      name: 'Like2Win Overview',
      panels: [
        'system_health',
        'user_activity',
        'business_metrics',
        'recent_alerts',
      ],
    },
    technical: {
      name: 'Technical Metrics',
      panels: [
        'api_performance',
        'database_performance',
        'infrastructure_metrics',
        'error_tracking',
      ],
    },
    business: {
      name: 'Business Metrics',
      panels: [
        'user_acquisition',
        'raffle_participation',
        'engagement_metrics',
        'revenue_impact',
      ],
    },
    alerts: {
      name: 'Alerts & Incidents',
      panels: [
        'active_alerts',
        'alert_history',
        'incident_timeline',
        'escalation_status',
      ],
    },
  },
};

/**
 * Dashboard panel definitions
 */
interface OverviewDashboard {
  name: string;
  panels: string[];
}

interface TechnicalDashboard {
  name: string;
  panels: string[];
}

interface BusinessDashboard {
  name: string;
  panels: string[];
}

interface AlertsDashboard {
  name: string;
  panels: string[];
}

/**
 * Monitoring service class
 */
export class MonitoringService {
  private config: MonitoringConfig;
  
  constructor(config: MonitoringConfig) {
    this.config = config;
  }
  
  /**
   * Initialize monitoring system
   */
  async initialize(): Promise<void> {
    console.log('Initializing monitoring system...');
    
    // Set up metrics collection
    await this.setupMetricsCollection();
    
    // Configure alerting
    await this.setupAlerting();
    
    // Create dashboards
    await this.createDashboards();
    
    // Start health checks
    await this.startHealthChecks();
    
    console.log('Monitoring system initialized successfully');
  }
  
  /**
   * Set up metrics collection
   */
  private async setupMetricsCollection(): Promise<void> {
    // Configure custom metrics
    for (const metric of this.config.metrics.customMetrics) {
      await this.registerMetric(metric);
    }
    
    // Set up automatic collection
    setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.metrics.collection.interval * 1000);
  }
  
  /**
   * Configure alerting rules
   */
  private async setupAlerting(): Promise<void> {
    const alerts = this.generateAlertRules();
    
    for (const alert of alerts) {
      await this.createAlertRule(alert);
    }
  }
  
  /**
   * Generate alert rules from configuration
   */
  private generateAlertRules(): AlertRule[] {
    const rules: AlertRule[] = [];
    
    // Application performance alerts
    rules.push({
      name: 'HighResponseTime',
      condition: `avg(like2win_api_request_duration_seconds) > ${this.config.alerting.thresholds.responseTime.warning / 1000}`,
      duration: '2m',
      severity: 'warning',
      annotations: {
        summary: 'High API response time detected',
        description: 'Average response time is above {{ $value }}ms',
      },
    });
    
    rules.push({
      name: 'CriticalResponseTime', 
      condition: `avg(like2win_api_request_duration_seconds) > ${this.config.alerting.thresholds.responseTime.critical / 1000}`,
      duration: '1m',
      severity: 'critical',
      annotations: {
        summary: 'Critical API response time detected',
        description: 'Average response time is critically high: {{ $value }}ms',
      },
    });
    
    // Error rate alerts
    rules.push({
      name: 'HighErrorRate',
      condition: `rate(like2win_api_errors_total[5m]) * 100 > ${this.config.alerting.thresholds.errorRate.warning}`,
      duration: '2m',
      severity: 'warning',
      annotations: {
        summary: 'High error rate detected',
        description: 'Error rate is {{ $value }}%',
      },
    });
    
    // Database alerts
    rules.push({
      name: 'SlowDatabaseQueries',
      condition: `avg(like2win_database_query_duration_seconds) > ${this.config.alerting.thresholds.dbResponseTime.warning / 1000}`,
      duration: '5m',
      severity: 'warning',
      annotations: {
        summary: 'Slow database queries detected',
        description: 'Average query time is {{ $value }}ms',
      },
    });
    
    // Business metric alerts
    rules.push({
      name: 'LowAuthenticationSuccessRate',
      condition: `rate(like2win_authentication_success_total[10m]) / rate(like2win_authentication_attempts_total[10m]) * 100 < ${this.config.alerting.thresholds.authSuccessRate.warning}`,
      duration: '5m',
      severity: 'warning',
      annotations: {
        summary: 'Low authentication success rate',
        description: 'Authentication success rate is {{ $value }}%',
      },
    });
    
    return rules;
  }
  
  /**
   * Create monitoring dashboards
   */
  private async createDashboards(): Promise<void> {
    // Create overview dashboard
    await this.createOverviewDashboard();
    
    // Create technical dashboard
    await this.createTechnicalDashboard();
    
    // Create business dashboard
    await this.createBusinessDashboard();
    
    // Create alerts dashboard
    await this.createAlertsDashboard();
  }
  
  /**
   * Start automated health checks
   */
  private async startHealthChecks(): Promise<void> {
    // API health check
    setInterval(async () => {
      await this.checkAPIHealth();
    }, 30000); // Every 30 seconds
    
    // Database health check
    setInterval(async () => {
      await this.checkDatabaseHealth();
    }, 60000); // Every minute
    
    // External services health check
    setInterval(async () => {
      await this.checkExternalServicesHealth();
    }, 120000); // Every 2 minutes
  }
  
  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      // Collect application metrics
      const appMetrics = await this.getApplicationMetrics();
      await this.recordMetrics('application', appMetrics);
      
      // Collect database metrics
      const dbMetrics = await this.getDatabaseMetrics();
      await this.recordMetrics('database', dbMetrics);
      
      // Collect user activity metrics
      const userMetrics = await this.getUserActivityMetrics();
      await this.recordMetrics('user_activity', userMetrics);
      
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }
  
  /**
   * Check API health
   */
  private async checkAPIHealth(): Promise<void> {
    try {
      const start = Date.now();
      const response = await fetch('/api/health');
      const duration = Date.now() - start;
      
      const isHealthy = response.ok;
      
      await this.recordMetric('like2win_api_health', isHealthy ? 1 : 0);
      await this.recordMetric('like2win_api_health_check_duration_ms', duration);
      
      if (!isHealthy) {
        await this.triggerAlert('APIHealthCheckFailed', {
          status: response.status,
          duration,
        });
      }
      
    } catch (error) {
      await this.recordMetric('like2win_api_health', 0);
      await this.triggerAlert('APIHealthCheckError', { error: error.message });
    }
  }
  
  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<void> {
    try {
      const start = Date.now();
      // Perform simple database query
      await this.performHealthQuery();
      const duration = Date.now() - start;
      
      await this.recordMetric('like2win_database_health', 1);
      await this.recordMetric('like2win_database_health_check_duration_ms', duration);
      
    } catch (error) {
      await this.recordMetric('like2win_database_health', 0);
      await this.triggerAlert('DatabaseHealthCheckFailed', { error: error.message });
    }
  }
  
  /**
   * Check external services health
   */
  private async checkExternalServicesHealth(): Promise<void> {
    const services = [
      { name: 'farcaster_hub', url: config.farcaster.hubUrl },
      { name: 'onchainkit_api', url: 'https://api.onchainkit.xyz/health' },
    ];
    
    for (const service of services) {
      try {
        const start = Date.now();
        const response = await fetch(service.url, { timeout: 10000 });
        const duration = Date.now() - start;
        
        const isHealthy = response.ok;
        
        await this.recordMetric(`like2win_external_service_health`, isHealthy ? 1 : 0, {
          service: service.name,
        });
        
        await this.recordMetric(`like2win_external_service_response_time_ms`, duration, {
          service: service.name,
        });
        
        if (!isHealthy) {
          await this.triggerAlert('ExternalServiceUnhealthy', {
            service: service.name,
            status: response.status,
          });
        }
        
      } catch (error) {
        await this.recordMetric(`like2win_external_service_health`, 0, {
          service: service.name,
        });
        
        await this.triggerAlert('ExternalServiceError', {
          service: service.name,
          error: error.message,
        });
      }
    }
  }
  
  /**
   * Record a metric value
   */
  async recordMetric(name: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    // Implementation depends on your metrics backend (Prometheus, DataDog, etc.)
    console.log(`Metric: ${name}=${value}`, labels);
  }
  
  /**
   * Record multiple metrics
   */
  async recordMetrics(category: string, metrics: Record<string, number>): Promise<void> {
    for (const [name, value] of Object.entries(metrics)) {
      await this.recordMetric(`like2win_${category}_${name}`, value);
    }
  }
  
  /**
   * Trigger an alert
   */
  async triggerAlert(alertName: string, context: Record<string, any>): Promise<void> {
    const alert = {
      name: alertName,
      timestamp: new Date().toISOString(),
      context,
      environment: this.config.environment,
    };
    
    // Send to configured channels
    await this.sendSlackAlert(alert);
    await this.sendEmailAlert(alert);
    
    if (this.config.alerting.channels.pagerduty) {
      await this.sendPagerDutyAlert(alert);
    }
  }
  
  /**
   * Implementation stubs for specific monitoring backends
   */
  private async registerMetric(metric: CustomMetric): Promise<void> {
    console.log(`Registering metric: ${metric.name}`);
  }
  
  private async createAlertRule(rule: AlertRule): Promise<void> {
    console.log(`Creating alert rule: ${rule.name}`);
  }
  
  private async createOverviewDashboard(): Promise<void> {
    console.log('Creating overview dashboard');
  }
  
  private async createTechnicalDashboard(): Promise<void> {
    console.log('Creating technical dashboard');
  }
  
  private async createBusinessDashboard(): Promise<void> {
    console.log('Creating business dashboard');
  }
  
  private async createAlertsDashboard(): Promise<void> {
    console.log('Creating alerts dashboard');
  }
  
  private async getApplicationMetrics(): Promise<Record<string, number>> {
    // Return current application metrics
    return {
      memory_usage_mb: process.memoryUsage().heapUsed / 1024 / 1024,
      cpu_usage_percent: process.cpuUsage().user / 1000000,
      active_connections: 0, // Get from connection pool
    };
  }
  
  private async getDatabaseMetrics(): Promise<Record<string, number>> {
    // Return database metrics
    return {
      connection_pool_active: 0,
      connection_pool_idle: 0,
      slow_queries_count: 0,
    };
  }
  
  private async getUserActivityMetrics(): Promise<Record<string, number>> {
    // Return user activity metrics
    return {
      active_sessions: 0,
      new_signups_1h: 0,
      participations_1h: 0,
    };
  }
  
  private async performHealthQuery(): Promise<void> {
    // Perform simple database health check
  }
  
  private async sendSlackAlert(alert: any): Promise<void> {
    console.log('Sending Slack alert:', alert.name);
  }
  
  private async sendEmailAlert(alert: any): Promise<void> {
    console.log('Sending email alert:', alert.name);
  }
  
  private async sendPagerDutyAlert(alert: any): Promise<void> {
    console.log('Sending PagerDuty alert:', alert.name);
  }
}

/**
 * Alert rule interface
 */
interface AlertRule {
  name: string;
  condition: string;
  duration: string;
  severity: 'info' | 'warning' | 'critical';
  annotations: {
    summary: string;
    description: string;
  };
}

/**
 * Initialize monitoring for production
 */
export async function initializeProductionMonitoring(): Promise<MonitoringService> {
  const monitoring = new MonitoringService(productionMonitoringConfig);
  await monitoring.initialize();
  return monitoring;
}

/**
 * Export monitoring configuration for external tools
 */
export function exportMonitoringConfig(): MonitoringConfig {
  return productionMonitoringConfig;
}