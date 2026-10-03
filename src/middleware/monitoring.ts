/**
 * Monitoring & Observability Middleware
 * Tracks API performance, errors, and system health
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface Metrics {
  requestCount: number;
  errorCount: number;
  totalResponseTime: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  lastErrors: Array<{ timestamp: string; endpoint: string; status: number; message: string }>;
}

class MonitoringService {
  private metrics: Metrics = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    lastErrors: [],
  };

  private responseTimes: number[] = [];

  /**
   * Middleware to track request metrics
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.recordMetric(req, res, duration);
      });

      next();
    };
  }

  private recordMetric(req: Request, res: Response, duration: number): void {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += duration;
    this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.requestCount;

    this.responseTimes.push(duration);
    if (this.responseTimes.length > 10000) {
      this.responseTimes.shift();
    }

    this.updatePercentiles();

    if (res.statusCode >= 400) {
      this.metrics.errorCount++;
      this.metrics.lastErrors.push({
        timestamp: new Date().toISOString(),
        endpoint: `${req.method} ${req.path}`,
        status: res.statusCode,
        message: res.statusMessage || 'Unknown error',
      });

      if (this.metrics.lastErrors.length > 50) {
        this.metrics.lastErrors.shift();
      }
    }

    // Log slow requests
    if (duration > 2000) {
      console.warn(
        `[slow-request] ${req.method} ${req.path} took ${duration}ms (${res.statusCode})`
      );
    }
  }

  private updatePercentiles(): void {
    if (this.responseTimes.length === 0) return;

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p99Index = Math.ceil(sorted.length * 0.99) - 1;

    this.metrics.p95ResponseTime = sorted[Math.max(0, p95Index)];
    this.metrics.p99ResponseTime = sorted[Math.max(0, p99Index)];
  }

  /**
   * Get current metrics
   */
  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      lastErrors: [],
    };
    this.responseTimes = [];
  }

  /**
   * Log metrics summary
   */
  logSummary(): void {
    const errorRate = this.metrics.requestCount > 0 
      ? ((this.metrics.errorCount / this.metrics.requestCount) * 100).toFixed(2)
      : '0.00';

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║ SafetyLink Core - Metrics Summary                              ║
╚════════════════════════════════════════════════════════════════╝

📊 Traffic:
  Total Requests: ${this.metrics.requestCount}
  Errors: ${this.metrics.errorCount} (${errorRate}%)

⏱️  Response Time:
  Average: ${this.metrics.avgResponseTime.toFixed(2)}ms
  p95: ${this.metrics.p95ResponseTime.toFixed(2)}ms
  p99: ${this.metrics.p99ResponseTime.toFixed(2)}ms

❌ Last Errors:
${this.metrics.lastErrors.slice(-5).map(
  (e) => `  ${e.timestamp} - ${e.endpoint} (${e.status}): ${e.message}`
).join('\n')}

`);
  }
}

export const monitoringService = new MonitoringService();
