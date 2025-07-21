/**
 * 감정 히스토리 관리자
 * 사용자의 감정 변화를 추적하고 패턴을 분석합니다.
 */

export interface EmotionData {
  emotion: string;
  confidence: number;
  timestamp: number;
  text: string;
  intensity: number;
}

export interface EmotionPattern {
  dominantEmotion: string;
  averageConfidence: number;
  emotionCount: number;
  timeRange: {
    start: number;
    end: number;
  };
}

export interface EmotionStats {
  totalEntries: number;
  dominantEmotion: string;
  averageConfidence: number;
  emotionDistribution: Record<string, number>;
  recentTrend: 'improving' | 'declining' | 'stable';
}

export class EmotionHistoryManager {
  private emotions: EmotionData[] = [];
  private readonly maxEntries = 1000; // 최대 저장 개수
  private readonly storageKey = 'emotion_history';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 새로운 감정 데이터 추가
   */
  addEmotion(emotion: string, confidence: number, text: string, intensity: number = 1.0): void {
    const emotionData: EmotionData = {
      emotion,
      confidence,
      timestamp: Date.now(),
      text,
      intensity
    };

    this.emotions.push(emotionData);

    // 최대 개수 제한
    if (this.emotions.length > this.maxEntries) {
      this.emotions = this.emotions.slice(-this.maxEntries);
    }

    this.saveToStorage();
    this.dispatchEmotionAddedEvent(emotionData);
  }

  /**
   * 최근 감정 데이터 조회
   */
  getRecentEmotions(count: number = 10): EmotionData[] {
    return this.emotions.slice(-count);
  }

  /**
   * 특정 시간 범위의 감정 데이터 조회
   */
  getEmotionsInRange(startTime: number, endTime: number): EmotionData[] {
    return this.emotions.filter(
      emotion => emotion.timestamp >= startTime && emotion.timestamp <= endTime
    );
  }

  /**
   * 감정 통계 계산
   */
  getEmotionStats(timeRange?: { start: number; end: number }): EmotionStats {
    const targetEmotions = timeRange 
      ? this.getEmotionsInRange(timeRange.start, timeRange.end)
      : this.emotions;

    if (targetEmotions.length === 0) {
      return {
        totalEntries: 0,
        dominantEmotion: 'neutral',
        averageConfidence: 0,
        emotionDistribution: {},
        recentTrend: 'stable'
      };
    }

    // 감정 분포 계산
    const emotionCount: Record<string, number> = {};
    let totalConfidence = 0;

    targetEmotions.forEach(emotion => {
      emotionCount[emotion.emotion] = (emotionCount[emotion.emotion] || 0) + 1;
      totalConfidence += emotion.confidence;
    });

    // 가장 많이 나타난 감정 찾기
    const dominantEmotion = Object.entries(emotionCount).reduce(
      (a, b) => emotionCount[a[0]] > emotionCount[b[0]] ? a : b
    )[0];

    // 최근 트렌드 계산
    const recentTrend = this.calculateRecentTrend();

    return {
      totalEntries: targetEmotions.length,
      dominantEmotion,
      averageConfidence: totalConfidence / targetEmotions.length,
      emotionDistribution: emotionCount,
      recentTrend
    };
  }

  /**
   * 감정 패턴 분석
   */
  analyzeEmotionPatterns(timeRange?: { start: number; end: number }): EmotionPattern[] {
    const targetEmotions = timeRange 
      ? this.getEmotionsInRange(timeRange.start, timeRange.end)
      : this.emotions;

    if (targetEmotions.length === 0) return [];

    const patterns: EmotionPattern[] = [];
    const windowSize = 10; // 패턴 분석 윈도우 크기

    for (let i = 0; i <= targetEmotions.length - windowSize; i++) {
      const window = targetEmotions.slice(i, i + windowSize);
      const emotionCount: Record<string, number> = {};
      let totalConfidence = 0;

      window.forEach(emotion => {
        emotionCount[emotion.emotion] = (emotionCount[emotion.emotion] || 0) + 1;
        totalConfidence += emotion.confidence;
      });

      const dominantEmotion = Object.entries(emotionCount).reduce(
        (a, b) => emotionCount[a[0]] > emotionCount[b[0]] ? a : b
      )[0];

      patterns.push({
        dominantEmotion,
        averageConfidence: totalConfidence / window.length,
        emotionCount: window.length,
        timeRange: {
          start: window[0].timestamp,
          end: window[window.length - 1].timestamp
        }
      });
    }

    return patterns;
  }

  /**
   * 감정 변화 알림 생성
   */
  getEmotionAlerts(): string[] {
    const alerts: string[] = [];
    const recentEmotions = this.getRecentEmotions(5);

    if (recentEmotions.length < 3) return alerts;

    // 급격한 감정 변화 감지
    const recentEmotion = recentEmotions[recentEmotions.length - 1];
    const previousEmotion = recentEmotions[recentEmotions.length - 3];

    if (recentEmotion.emotion !== previousEmotion.emotion) {
      alerts.push(`감정이 ${previousEmotion.emotion}에서 ${recentEmotion.emotion}로 변화했습니다.`);
    }

    // 낮은 신뢰도 감지
    if (recentEmotion.confidence < 0.5) {
      alerts.push('감정 분석의 신뢰도가 낮습니다.');
    }

    // 부정적 감정 지속 감지
    const negativeEmotions = ['sad', 'angry', 'fear', 'disgust'];
    const recentNegativeCount = recentEmotions.filter(
      e => negativeEmotions.includes(e.emotion)
    ).length;

    if (recentNegativeCount >= 3) {
      alerts.push('최근 부정적 감정이 지속되고 있습니다.');
    }

    return alerts;
  }

  /**
   * 최근 트렌드 계산
   */
  private calculateRecentTrend(): 'improving' | 'declining' | 'stable' {
    const recentEmotions = this.getRecentEmotions(10);
    if (recentEmotions.length < 5) return 'stable';

    const positiveEmotions = ['happy', 'joy', 'excited', 'content'];
    const negativeEmotions = ['sad', 'angry', 'fear', 'disgust'];

    const firstHalf = recentEmotions.slice(0, Math.floor(recentEmotions.length / 2));
    const secondHalf = recentEmotions.slice(Math.floor(recentEmotions.length / 2));

    const firstPositiveCount = firstHalf.filter(e => positiveEmotions.includes(e.emotion)).length;
    const secondPositiveCount = secondHalf.filter(e => positiveEmotions.includes(e.emotion)).length;

    if (secondPositiveCount > firstPositiveCount) return 'improving';
    if (secondPositiveCount < firstPositiveCount) return 'declining';
    return 'stable';
  }

  /**
   * 로컬 스토리지에서 데이터 로드
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.emotions = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('감정 히스토리 로드 실패:', error);
      this.emotions = [];
    }
  }

  /**
   * 로컬 스토리지에 데이터 저장
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.emotions));
    } catch (error) {
      console.warn('감정 히스토리 저장 실패:', error);
    }
  }

  /**
   * 감정 추가 이벤트 발생
   */
  private dispatchEmotionAddedEvent(emotionData: EmotionData): void {
    const event = new CustomEvent('emotionAdded', {
      detail: {
        emotion: emotionData,
        stats: this.getEmotionStats(),
        alerts: this.getEmotionAlerts()
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * 히스토리 초기화
   */
  clearHistory(): void {
    this.emotions = [];
    localStorage.removeItem(this.storageKey);
  }

  /**
   * 특정 감정 데이터 삭제
   */
  removeEmotion(timestamp: number): void {
    this.emotions = this.emotions.filter(e => e.timestamp !== timestamp);
    this.saveToStorage();
  }
}

// 전역 인스턴스 생성
export const emotionHistory = new EmotionHistoryManager(); 