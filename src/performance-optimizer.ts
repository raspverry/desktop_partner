/**
 * 성능 최적화 시스템
 * 렌더링 품질 자동 조정, 메모리 정리, 지연 로딩, 캐시 관리를 통해 성능을 최적화합니다.
 */

import { PerformanceMonitor, PerformanceMetrics } from './performance-monitor';
import * as THREE from 'three';

export interface OptimizationSettings {
  adaptiveRendering: boolean;
  memoryCleanupInterval: number; // ms
  cacheSize: number; // MB
  lazyLoading: boolean;
  qualityLevels: {
    high: RenderQualitySettings;
    medium: RenderQualitySettings;
    low: RenderQualitySettings;
  };
}

export interface RenderQualitySettings {
  shadowQuality: 'high' | 'medium' | 'low' | 'none';
  antialiasing: boolean;
  textureQuality: 'high' | 'medium' | 'low';
  animationFrameSkip: number; // 프레임 스킵 수
  maxLights: number;
  maxParticles: number;
}

export interface CacheItem {
  key: string;
  data: any;
  size: number; // bytes
  timestamp: number;
  accessCount: number;
}

export class PerformanceOptimizer {
  private performanceMonitor: PerformanceMonitor;
  private settings: OptimizationSettings;
  private cache: Map<string, CacheItem> = new Map();
  private currentQualityLevel: 'high' | 'medium' | 'low' = 'high';
  private optimizationInterval: number | null = null;
  private isOptimizing: boolean = false;

  constructor(performanceMonitor: PerformanceMonitor) {
    this.performanceMonitor = performanceMonitor;
    this.settings = this.getDefaultSettings();
    this.initializeOptimization();
  }

  /**
   * 기본 설정 가져오기
   */
  private getDefaultSettings(): OptimizationSettings {
    return {
      adaptiveRendering: true,
      memoryCleanupInterval: 30000, // 30초
      cacheSize: 100, // 100MB
      lazyLoading: true,
      qualityLevels: {
        high: {
          shadowQuality: 'high',
          antialiasing: true,
          textureQuality: 'high',
          animationFrameSkip: 0,
          maxLights: 4,
          maxParticles: 1000
        },
        medium: {
          shadowQuality: 'medium',
          antialiasing: true,
          textureQuality: 'medium',
          animationFrameSkip: 1,
          maxLights: 2,
          maxParticles: 500
        },
        low: {
          shadowQuality: 'low',
          antialiasing: false,
          textureQuality: 'low',
          animationFrameSkip: 2,
          maxLights: 1,
          maxParticles: 100
        }
      }
    };
  }

  /**
   * 최적화 초기화
   */
  private initializeOptimization(): void {
    // 성능 모니터링 이벤트 리스너
    window.addEventListener('performanceAlert', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.handlePerformanceAlert(customEvent.detail.alerts);
    });

    // 주기적 최적화
    this.startPeriodicOptimization();
  }

  /**
   * 성능 알림 처리
   */
  private handlePerformanceAlert(alerts: any[]): void {
    alerts.forEach(alert => {
      switch (alert.metric) {
        case 'fps':
          this.optimizeRendering();
          break;
        case 'memoryUsage':
          this.cleanupMemory();
          break;
        case 'cpuUsage':
          this.optimizeProcessing();
          break;
      }
    });
  }

  /**
   * 렌더링 최적화
   */
  private optimizeRendering(): void {
    const stats = this.performanceMonitor.getPerformanceStats();
    const currentFps = stats.current.fps;

    // FPS에 따른 품질 레벨 조정
    if (currentFps < 30 && this.currentQualityLevel !== 'low') {
      this.setQualityLevel('low');
    } else if (currentFps < 45 && this.currentQualityLevel === 'high') {
      this.setQualityLevel('medium');
    } else if (currentFps > 55 && this.currentQualityLevel !== 'high') {
      this.setQualityLevel('high');
    }

    // 아바타 렌더링 최적화
    this.optimizeAvatarRendering();
  }

  /**
   * 품질 레벨 설정
   */
  private setQualityLevel(level: 'high' | 'medium' | 'low'): void {
    if (this.currentQualityLevel === level) return;

    this.currentQualityLevel = level;
    const settings = this.settings.qualityLevels[level];

    // Three.js 렌더링 설정 적용
    if (window.avatarViewer?.renderer) {
      const renderer = window.avatarViewer.renderer;
      
      // 그림자 품질
      switch (settings.shadowQuality) {
        case 'high':
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          break;
        case 'medium':
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFShadowMap;
          break;
        case 'low':
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.BasicShadowMap;
          break;
        case 'none':
          renderer.shadowMap.enabled = false;
          break;
      }

      // 안티앨리어싱
      renderer.antialias = settings.antialiasing;
    }

    // 애니메이션 프레임 스킵 설정
    if (window.avatarViewer) {
      window.avatarViewer.setAnimationFrameSkip(settings.animationFrameSkip);
    }

    console.log(`렌더링 품질 레벨 변경: ${level}`);
  }

  /**
   * 아바타 렌더링 최적화
   */
  private optimizeAvatarRendering(): void {
    if (!window.avatarViewer) return;

    const settings = this.settings.qualityLevels[this.currentQualityLevel];

    // 조명 수 조정
    const scene = window.avatarViewer.scene;
    if (scene) {
      const lights = scene.children.filter((child: any) => child.type === 'Light');
      if (lights.length > settings.maxLights) {
        // 불필요한 조명 제거
        lights.slice(settings.maxLights).forEach((light: any) => {
          scene.remove(light);
        });
      }
    }

    // 파티클 시스템 최적화
    this.optimizeParticleSystems(settings.maxParticles);

    // 텍스처 품질 조정
    this.optimizeTextures(settings.textureQuality);
  }

  /**
   * 파티클 시스템 최적화
   */
  private optimizeParticleSystems(maxParticles: number): void {
    // 파티클 시스템이 있다면 파티클 수 제한
    // 실제 구현에서는 파티클 시스템에 따라 조정
  }

  /**
   * 텍스처 품질 최적화
   */
  private optimizeTextures(quality: 'high' | 'medium' | 'low'): void {
    if (!window.avatarViewer?.scene) return;

    const scene = window.avatarViewer.scene;
    
    scene.traverse((object: any) => {
      if (object.material && object.material.map) {
        const texture = object.material.map;
        
        switch (quality) {
          case 'high':
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            break;
          case 'medium':
            texture.minFilter = THREE.LinearMipmapNearestFilter;
            texture.magFilter = THREE.LinearFilter;
            break;
          case 'low':
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
            break;
        }
      }
    });
  }

  /**
   * 메모리 정리
   */
  private cleanupMemory(): void {
    // 캐시 정리
    this.cleanupCache();

    // 불필요한 리소스 해제
    this.disposeUnusedResources();

    // 가비지 컬렉션 유도
    if ('gc' in window) {
      (window as any).gc();
    }

    console.log('메모리 정리 완료');
  }

  /**
   * 캐시 정리
   */
  private cleanupCache(): void {
    const maxCacheSize = this.settings.cacheSize * 1024 * 1024; // MB to bytes
    let currentCacheSize = 0;
    const cacheItems: CacheItem[] = [];

    // 캐시 크기 계산
    this.cache.forEach(item => {
      currentCacheSize += item.size;
      cacheItems.push(item);
    });

    // 캐시 크기가 제한을 초과하면 LRU 방식으로 정리
    if (currentCacheSize > maxCacheSize) {
      // 접근 횟수와 시간을 기준으로 정렬
      cacheItems.sort((a, b) => {
        const aScore = a.accessCount / (Date.now() - a.timestamp);
        const bScore = b.accessCount / (Date.now() - b.timestamp);
        return aScore - bScore;
      });

      // 가장 낮은 점수의 아이템부터 제거
      for (const item of cacheItems) {
        this.cache.delete(item.key);
        currentCacheSize -= item.size;
        
        if (currentCacheSize <= maxCacheSize * 0.8) {
          break;
        }
      }
    }
  }

  /**
   * 사용하지 않는 리소스 해제
   */
  private disposeUnusedResources(): void {
    if (!window.avatarViewer?.scene) return;

    const scene = window.avatarViewer.scene;
    
    scene.traverse((object: any) => {
      // 사용하지 않는 지오메트리 해제
      if (object.geometry && !object.geometry.isDisposed) {
        object.geometry.dispose();
      }

      // 사용하지 않는 머티리얼 해제
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material: any) => {
            this.disposeMaterial(material);
          });
        } else {
          this.disposeMaterial(object.material);
        }
      }
    });
  }

  /**
   * 머티리얼 해제
   */
  private disposeMaterial(material: any): void {
    if (!material) return;

    // 텍스처 해제
    Object.keys(material).forEach(key => {
      const value = material[key];
      if (value && value.isTexture) {
        value.dispose();
      }
    });

    // 머티리얼 해제
    material.dispose();
  }

  /**
   * 처리 최적화
   */
  private optimizeProcessing(): void {
    const stats = this.performanceMonitor.getPerformanceStats();
    const currentCpu = stats.current.cpuUsage;

    if (currentCpu > 80) {
      // 백그라운드 작업 일시 중지
      this.pauseBackgroundTasks();
    } else if (currentCpu < 50) {
      // 백그라운드 작업 재개
      this.resumeBackgroundTasks();
    }
  }

  /**
   * 백그라운드 작업 일시 중지
   */
  private pauseBackgroundTasks(): void {
    // 불필요한 애니메이션 일시 중지
    if (window.avatarViewer) {
      window.avatarViewer.pauseNonEssentialAnimations();
    }

    // 주기적 업데이트 간격 늘리기
    this.adjustUpdateIntervals(true);
  }

  /**
   * 백그라운드 작업 재개
   */
  private resumeBackgroundTasks(): void {
    // 애니메이션 재개
    if (window.avatarViewer) {
      window.avatarViewer.resumeAnimations();
    }

    // 주기적 업데이트 간격 복원
    this.adjustUpdateIntervals(false);
  }

  /**
   * 업데이트 간격 조정
   */
  private adjustUpdateIntervals(reduceFrequency: boolean): void {
    // 성능 모니터링 간격 조정
    if (this.performanceMonitor) {
      if (reduceFrequency) {
        // 모니터링 간격을 늘려 CPU 부하 감소
        this.performanceMonitor.stopMonitoring();
        setTimeout(() => {
          this.performanceMonitor.startMonitoring();
        }, 5000); // 5초 후 재시작
      }
    }
  }

  /**
   * 주기적 최적화 시작
   */
  private startPeriodicOptimization(): void {
    this.optimizationInterval = window.setInterval(() => {
      if (this.isOptimizing) return;

      this.isOptimizing = true;
      
      try {
        // 메모리 정리
        this.cleanupMemory();
        
        // 성능 통계 확인
        const stats = this.performanceMonitor.getPerformanceStats();
        
        // 자동 품질 조정
        if (this.settings.adaptiveRendering) {
          this.adaptiveQualityAdjustment(stats);
        }
        
      } finally {
        this.isOptimizing = false;
      }
    }, this.settings.memoryCleanupInterval);
  }

  /**
   * 적응형 품질 조정
   */
  private adaptiveQualityAdjustment(stats: any): void {
    const { current, average } = stats;
    
    // 평균 FPS가 낮으면 품질 낮추기
    if (average.fps < 40 && this.currentQualityLevel !== 'low') {
      this.setQualityLevel('low');
    } else if (average.fps < 50 && this.currentQualityLevel === 'high') {
      this.setQualityLevel('medium');
    }
    
    // 메모리 사용량이 높으면 캐시 정리
    if (current.memoryUsage > this.settings.cacheSize * 0.8) {
      this.cleanupCache();
    }
  }

  /**
   * 캐시에 데이터 저장
   */
  setCache(key: string, data: any, size?: number): void {
    const estimatedSize = size || this.estimateDataSize(data);
    
    const cacheItem: CacheItem = {
      key,
      data,
      size: estimatedSize,
      timestamp: Date.now(),
      accessCount: 0
    };

    this.cache.set(key, cacheItem);
  }

  /**
   * 캐시에서 데이터 가져오기
   */
  getCache(key: string): any {
    const item = this.cache.get(key);
    if (item) {
      item.accessCount++;
      item.timestamp = Date.now();
      return item.data;
    }
    return null;
  }

  /**
   * 데이터 크기 추정
   */
  private estimateDataSize(data: any): number {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  }

  /**
   * 지연 로딩
   */
  async lazyLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
    // 캐시에서 먼저 확인
    const cached = this.getCache(key);
    if (cached) {
      return cached;
    }

    // 로딩 시작
    const result = await loader();
    
    // 캐시에 저장
    this.setCache(key, result);
    
    return result;
  }

  /**
   * 최적화 설정 업데이트
   */
  updateSettings(newSettings: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // 설정 변경에 따른 즉시 최적화
    if (newSettings.adaptiveRendering !== undefined) {
      const stats = this.performanceMonitor.getPerformanceStats();
      this.adaptiveQualityAdjustment(stats);
    }
  }

  /**
   * 현재 품질 레벨 가져오기
   */
  getCurrentQualityLevel(): 'high' | 'medium' | 'low' {
    return this.currentQualityLevel;
  }

  /**
   * 성능 통계 가져오기
   */
  getOptimizationStats(): {
    qualityLevel: string;
    cacheSize: number;
    cacheItems: number;
    isOptimizing: boolean;
  } {
    let totalCacheSize = 0;
    this.cache.forEach(item => {
      totalCacheSize += item.size;
    });

    return {
      qualityLevel: this.currentQualityLevel,
      cacheSize: Math.round(totalCacheSize / 1024 / 1024), // MB
      cacheItems: this.cache.size,
      isOptimizing: this.isOptimizing
    };
  }

  /**
   * 최적화 중지
   */
  stopOptimization(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
    this.isOptimizing = false;
  }

  /**
   * 최적화 정리
   */
  dispose(): void {
    this.stopOptimization();
    this.cache.clear();
  }
} 