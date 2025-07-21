/**
 * 성능 모니터링 시스템
 * FPS, 메모리 사용량, CPU 사용률, 응답 시간을 추적하고 최적화를 관리합니다.
 */

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;
  renderTime: number;
  timestamp: number;
}

export interface PerformanceThresholds {
  minFps: number;
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // %
  maxResponseTime: number; // ms
  maxRenderTime: number; // ms
}

export interface PerformanceAlert {
  type: 'warning' | 'error' | 'critical';
  message: string;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring: boolean = false;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private thresholds: PerformanceThresholds;
  private maxMetricsHistory: number = 1000;
  private monitoringInterval: number | null = null;

  constructor() {
    this.thresholds = {
      minFps: 30,
      maxMemoryUsage: 4000, // 4GB
      maxCpuUsage: 80,
      maxResponseTime: 3000, // 3초
      maxRenderTime: 16.67 // 60fps 기준
    };
  }

  /**
   * 성능 모니터링 시작
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    
    // FPS 모니터링
    this.monitorFPS();
    
    // 시스템 리소스 모니터링
    this.monitoringInterval = window.setInterval(() => {
      this.collectSystemMetrics();
    }, 1000); // 1초마다 수집

    console.log('성능 모니터링 시작');
  }

  /**
   * 성능 모니터링 중지
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('성능 모니터링 중지');
  }

  /**
   * FPS 모니터링
   */
  private monitorFPS(): void {
    const measureFPS = () => {
      if (!this.isMonitoring) return;

      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;
      
      this.frameCount++;
      
      // 1초마다 FPS 계산
      if (deltaTime >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / deltaTime);
        this.updateMetric('fps', fps);
        
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * 시스템 메트릭 수집
   */
  private collectSystemMetrics(): void {
    // 메모리 사용량 (가능한 경우)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsageMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      this.updateMetric('memoryUsage', memoryUsageMB);
    }

    // CPU 사용률 (추정)
    this.estimateCpuUsage();

    // 렌더링 시간 측정
    this.measureRenderTime();
  }

  /**
   * CPU 사용률 추정
   */
  private estimateCpuUsage(): void {
    // 간단한 CPU 사용률 추정
    const startTime = performance.now();
    
    // 짧은 계산 작업으로 CPU 부하 측정
    let result = 0;
    for (let i = 0; i < 100000; i++) {
      result += Math.sqrt(i);
    }
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    // 실행 시간을 기반으로 CPU 사용률 추정
    const estimatedCpuUsage = Math.min(100, (executionTime / 10) * 100);
    this.updateMetric('cpuUsage', estimatedCpuUsage);
  }

  /**
   * 렌더링 시간 측정
   */
  private measureRenderTime(): void {
    const startTime = performance.now();
    
    // 다음 프레임에서 렌더링 시간 측정
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      this.updateMetric('renderTime', renderTime);
    });
  }

  /**
   * 메트릭 업데이트
   */
  private updateMetric(key: keyof PerformanceMetrics, value: number): void {
    const metric: PerformanceMetrics = {
      fps: key === 'fps' ? value : this.getCurrentMetric('fps'),
      memoryUsage: key === 'memoryUsage' ? value : this.getCurrentMetric('memoryUsage'),
      cpuUsage: key === 'cpuUsage' ? value : this.getCurrentMetric('cpuUsage'),
      responseTime: key === 'responseTime' ? value : this.getCurrentMetric('responseTime'),
      renderTime: key === 'renderTime' ? value : this.getCurrentMetric('renderTime'),
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    
    // 히스토리 크기 제한
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // 성능 알림 확인
    this.checkPerformanceAlerts(metric);
  }

  /**
   * 현재 메트릭 값 가져오기
   */
  private getCurrentMetric(key: keyof PerformanceMetrics): number {
    const lastMetric = this.metrics[this.metrics.length - 1];
    return lastMetric ? lastMetric[key] : 0;
  }

  /**
   * 성능 알림 확인
   */
  private checkPerformanceAlerts(metric: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // FPS 체크
    if (metric.fps < this.thresholds.minFps) {
      alerts.push({
        type: metric.fps < this.thresholds.minFps / 2 ? 'critical' : 'warning',
        message: `FPS가 낮습니다: ${metric.fps} (목표: ${this.thresholds.minFps})`,
        metric: 'fps',
        value: metric.fps,
        threshold: this.thresholds.minFps,
        timestamp: Date.now()
      });
    }

    // 메모리 사용량 체크
    if (metric.memoryUsage > this.thresholds.maxMemoryUsage) {
      alerts.push({
        type: metric.memoryUsage > this.thresholds.maxMemoryUsage * 1.5 ? 'critical' : 'warning',
        message: `메모리 사용량이 높습니다: ${metric.memoryUsage}MB (제한: ${this.thresholds.maxMemoryUsage}MB)`,
        metric: 'memoryUsage',
        value: metric.memoryUsage,
        threshold: this.thresholds.maxMemoryUsage,
        timestamp: Date.now()
      });
    }

    // CPU 사용률 체크
    if (metric.cpuUsage > this.thresholds.maxCpuUsage) {
      alerts.push({
        type: metric.cpuUsage > this.thresholds.maxCpuUsage * 1.2 ? 'critical' : 'warning',
        message: `CPU 사용률이 높습니다: ${metric.cpuUsage.toFixed(1)}% (제한: ${this.thresholds.maxCpuUsage}%)`,
        metric: 'cpuUsage',
        value: metric.cpuUsage,
        threshold: this.thresholds.maxCpuUsage,
        timestamp: Date.now()
      });
    }

    // 응답 시간 체크
    if (metric.responseTime > this.thresholds.maxResponseTime) {
      alerts.push({
        type: metric.responseTime > this.thresholds.maxResponseTime * 2 ? 'critical' : 'warning',
        message: `응답 시간이 느립니다: ${metric.responseTime}ms (제한: ${this.thresholds.maxResponseTime}ms)`,
        metric: 'responseTime',
        value: metric.responseTime,
        threshold: this.thresholds.maxResponseTime,
        timestamp: Date.now()
      });
    }

    // 렌더링 시간 체크
    if (metric.renderTime > this.thresholds.maxRenderTime) {
      alerts.push({
        type: metric.renderTime > this.thresholds.maxRenderTime * 2 ? 'critical' : 'warning',
        message: `렌더링 시간이 느립니다: ${metric.renderTime.toFixed(2)}ms (제한: ${this.thresholds.maxRenderTime}ms)`,
        metric: 'renderTime',
        value: metric.renderTime,
        threshold: this.thresholds.maxRenderTime,
        timestamp: Date.now()
      });
    }

    // 새로운 알림 추가
    this.alerts.push(...alerts);
    
    // 알림 히스토리 제한
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // 알림 이벤트 발생
    if (alerts.length > 0) {
      this.dispatchPerformanceAlert(alerts);
    }
  }

  /**
   * 성능 알림 이벤트 발생
   */
  private dispatchPerformanceAlert(alerts: PerformanceAlert[]): void {
    const event = new CustomEvent('performanceAlert', {
      detail: { alerts }
    });
    window.dispatchEvent(event);
  }

  /**
   * 응답 시간 측정
   */
  measureResponseTime<T>(operation: () => Promise<T> | T): Promise<T> {
    const startTime = performance.now();
    
    return Promise.resolve(operation()).then(result => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      this.updateMetric('responseTime', responseTime);
      return result;
    });
  }

  /**
   * 성능 최적화 권장사항 생성
   */
  generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const recentMetrics = this.metrics.slice(-10);
    
    if (recentMetrics.length === 0) return recommendations;

    const avgFps = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const avgCpu = recentMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / recentMetrics.length;

    if (avgFps < this.thresholds.minFps) {
      recommendations.push('FPS 개선: 렌더링 품질을 낮추거나 불필요한 애니메이션을 줄이세요.');
    }

    if (avgMemory > this.thresholds.maxMemoryUsage * 0.8) {
      recommendations.push('메모리 최적화: 사용하지 않는 리소스를 정리하거나 메모리 캐시를 줄이세요.');
    }

    if (avgCpu > this.thresholds.maxCpuUsage * 0.8) {
      recommendations.push('CPU 최적화: 백그라운드 작업을 줄이거나 계산 집약적 작업을 최적화하세요.');
    }

    return recommendations;
  }

  /**
   * 성능 통계 가져오기
   */
  getPerformanceStats(): {
    current: PerformanceMetrics;
    average: PerformanceMetrics;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const current = this.metrics[this.metrics.length - 1] || this.getDefaultMetrics();
    const average = this.calculateAverageMetrics();
    const alerts = this.alerts.slice(-10); // 최근 10개 알림
    const recommendations = this.generateOptimizationRecommendations();

    return {
      current,
      average,
      alerts,
      recommendations
    };
  }

  /**
   * 평균 메트릭 계산
   */
  private calculateAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return this.getDefaultMetrics();
    }

    const sum = this.metrics.reduce((acc, metric) => ({
      fps: acc.fps + metric.fps,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      cpuUsage: acc.cpuUsage + metric.cpuUsage,
      responseTime: acc.responseTime + metric.responseTime,
      renderTime: acc.renderTime + metric.renderTime,
      timestamp: 0
    }), this.getDefaultMetrics());

    const count = this.metrics.length;
    return {
      fps: Math.round(sum.fps / count),
      memoryUsage: Math.round(sum.memoryUsage / count),
      cpuUsage: Math.round(sum.cpuUsage / count),
      responseTime: Math.round(sum.responseTime / count),
      renderTime: Math.round(sum.renderTime * 100) / 100,
      timestamp: Date.now()
    };
  }

  /**
   * 기본 메트릭 값
   */
  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      memoryUsage: 0,
      cpuUsage: 0,
      responseTime: 0,
      renderTime: 0,
      timestamp: Date.now()
    };
  }

  /**
   * 임계값 설정
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * 메트릭 히스토리 정리
   */
  clearMetricsHistory(): void {
    this.metrics = [];
    this.alerts = [];
  }

  /**
   * 모니터링 상태 확인
   */
  getMonitoringStatus(): boolean {
    return this.isMonitoring;
  }
} 