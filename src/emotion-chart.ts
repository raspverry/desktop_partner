/**
 * 감정 차트 UI 컴포넌트
 * 감정 히스토리를 시각화하고 통계를 표시합니다.
 */

import { EmotionHistoryManager, EmotionStats, EmotionData } from './emotion-history';

export class EmotionChart {
  private container: HTMLElement;
  private emotionHistory: EmotionHistoryManager;
  private chartElement: HTMLElement | null = null;
  private statsElement: HTMLElement | null = null;
  private alertsElement: HTMLElement | null = null;

  constructor(container: HTMLElement, emotionHistory: EmotionHistoryManager) {
    this.container = container;
    this.emotionHistory = emotionHistory;
    this.init();
  }

  /**
   * 차트 초기화
   */
  private init(): void {
    this.createChartContainer();
    this.createStatsContainer();
    this.createAlertsContainer();
    this.updateChart();
    this.bindEvents();
  }

  /**
   * 차트 컨테이너 생성
   */
  private createChartContainer(): void {
    this.chartElement = document.createElement('div');
    this.chartElement.className = 'emotion-chart';
    this.chartElement.innerHTML = `
      <div class="chart-header">
        <h3>감정 히스토리</h3>
        <div class="chart-controls">
          <button class="btn-refresh" onclick="this.updateChart()">새로고침</button>
          <button class="btn-clear" onclick="this.clearHistory()">초기화</button>
        </div>
      </div>
      <div class="chart-content">
        <div class="emotion-timeline"></div>
        <div class="emotion-distribution"></div>
      </div>
    `;
    this.container.appendChild(this.chartElement);
  }

  /**
   * 통계 컨테이너 생성
   */
  private createStatsContainer(): void {
    this.statsElement = document.createElement('div');
    this.statsElement.className = 'emotion-stats';
    this.statsElement.innerHTML = `
      <div class="stats-header">
        <h4>감정 통계</h4>
      </div>
      <div class="stats-content">
        <div class="stat-item">
          <span class="stat-label">총 분석 수:</span>
          <span class="stat-value" id="total-entries">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">주요 감정:</span>
          <span class="stat-value" id="dominant-emotion">-</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">평균 신뢰도:</span>
          <span class="stat-value" id="avg-confidence">0%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">최근 트렌드:</span>
          <span class="stat-value" id="recent-trend">-</span>
        </div>
      </div>
    `;
    this.container.appendChild(this.statsElement);
  }

  /**
   * 알림 컨테이너 생성
   */
  private createAlertsContainer(): void {
    this.alertsElement = document.createElement('div');
    this.alertsElement.className = 'emotion-alerts';
    this.alertsElement.innerHTML = `
      <div class="alerts-header">
        <h4>감정 알림</h4>
      </div>
      <div class="alerts-content" id="alerts-list">
        <div class="no-alerts">현재 알림이 없습니다.</div>
      </div>
    `;
    this.container.appendChild(this.alertsElement);
  }

  /**
   * 차트 업데이트
   */
  updateChart(): void {
    this.updateTimeline();
    this.updateDistribution();
    this.updateStats();
    this.updateAlerts();
  }

  /**
   * 타임라인 업데이트
   */
  private updateTimeline(): void {
    const timelineElement = this.chartElement?.querySelector('.emotion-timeline');
    if (!timelineElement) return;

    const recentEmotions = this.emotionHistory.getRecentEmotions(20);
    
    if (recentEmotions.length === 0) {
      timelineElement.innerHTML = '<div class="no-data">감정 데이터가 없습니다.</div>';
      return;
    }

    const timelineHTML = recentEmotions.map(emotion => {
      const time = new Date(emotion.timestamp).toLocaleTimeString();
      const confidencePercent = Math.round(emotion.confidence * 100);
      const emotionClass = this.getEmotionClass(emotion.emotion);
      
      return `
        <div class="timeline-item ${emotionClass}">
          <div class="timeline-time">${time}</div>
          <div class="timeline-emotion">${this.getEmotionDisplayName(emotion.emotion)}</div>
          <div class="timeline-confidence">${confidencePercent}%</div>
          <div class="timeline-text">${emotion.text.substring(0, 30)}${emotion.text.length > 30 ? '...' : ''}</div>
        </div>
      `;
    }).join('');

    timelineElement.innerHTML = `
      <div class="timeline-header">
        <span>시간</span>
        <span>감정</span>
        <span>신뢰도</span>
        <span>텍스트</span>
      </div>
      <div class="timeline-items">
        ${timelineHTML}
      </div>
    `;
  }

  /**
   * 감정 분포 업데이트
   */
  private updateDistribution(): void {
    const distributionElement = this.chartElement?.querySelector('.emotion-distribution');
    if (!distributionElement) return;

    const stats = this.emotionHistory.getEmotionStats();
    const distribution = stats.emotionDistribution;

    if (Object.keys(distribution).length === 0) {
      distributionElement.innerHTML = '<div class="no-data">분포 데이터가 없습니다.</div>';
      return;
    }

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const distributionHTML = Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)
      .map(([emotion, count]) => {
        const percentage = Math.round((count / total) * 100);
        const emotionClass = this.getEmotionClass(emotion);
        
        return `
          <div class="distribution-item">
            <div class="distribution-label">
              <span class="emotion-icon ${emotionClass}"></span>
              <span>${this.getEmotionDisplayName(emotion)}</span>
            </div>
            <div class="distribution-bar">
              <div class="bar-fill ${emotionClass}" style="width: ${percentage}%"></div>
            </div>
            <div class="distribution-count">${count} (${percentage}%)</div>
          </div>
        `;
      }).join('');

    distributionElement.innerHTML = `
      <div class="distribution-header">
        <h5>감정 분포</h5>
      </div>
      <div class="distribution-items">
        ${distributionHTML}
      </div>
    `;
  }

  /**
   * 통계 업데이트
   */
  private updateStats(): void {
    const stats = this.emotionHistory.getEmotionStats();
    
    const totalEntries = document.getElementById('total-entries');
    const dominantEmotion = document.getElementById('dominant-emotion');
    const avgConfidence = document.getElementById('avg-confidence');
    const recentTrend = document.getElementById('recent-trend');

    if (totalEntries) totalEntries.textContent = stats.totalEntries.toString();
    if (dominantEmotion) dominantEmotion.textContent = this.getEmotionDisplayName(stats.dominantEmotion);
    if (avgConfidence) avgConfidence.textContent = `${Math.round(stats.averageConfidence * 100)}%`;
    if (recentTrend) {
      const trendText = this.getTrendDisplayName(stats.recentTrend);
      const trendClass = this.getTrendClass(stats.recentTrend);
      recentTrend.textContent = trendText;
      recentTrend.className = `stat-value ${trendClass}`;
    }
  }

  /**
   * 알림 업데이트
   */
  private updateAlerts(): void {
    const alertsList = document.getElementById('alerts-list');
    if (!alertsList) return;

    const alerts = this.emotionHistory.getEmotionAlerts();
    
    if (alerts.length === 0) {
      alertsList.innerHTML = '<div class="no-alerts">현재 알림이 없습니다.</div>';
      return;
    }

    const alertsHTML = alerts.map(alert => `
      <div class="alert-item">
        <span class="alert-icon">⚠️</span>
        <span class="alert-text">${alert}</span>
      </div>
    `).join('');

    alertsList.innerHTML = alertsHTML;
  }

  /**
   * 감정 클래스 반환
   */
  private getEmotionClass(emotion: string): string {
    const emotionClasses: Record<string, string> = {
      'happy': 'emotion-happy',
      'joy': 'emotion-joy',
      'excited': 'emotion-excited',
      'content': 'emotion-content',
      'sad': 'emotion-sad',
      'angry': 'emotion-angry',
      'fear': 'emotion-fear',
      'disgust': 'emotion-disgust',
      'surprise': 'emotion-surprise',
      'neutral': 'emotion-neutral'
    };
    return emotionClasses[emotion] || 'emotion-neutral';
  }

  /**
   * 감정 표시 이름 반환
   */
  private getEmotionDisplayName(emotion: string): string {
    const displayNames: Record<string, string> = {
      'happy': '행복',
      'joy': '기쁨',
      'excited': '흥분',
      'content': '만족',
      'sad': '슬픔',
      'angry': '분노',
      'fear': '두려움',
      'disgust': '혐오',
      'surprise': '놀람',
      'neutral': '중립'
    };
    return displayNames[emotion] || emotion;
  }

  /**
   * 트렌드 표시 이름 반환
   */
  private getTrendDisplayName(trend: string): string {
    const trendNames: Record<string, string> = {
      'improving': '개선 중',
      'declining': '악화 중',
      'stable': '안정적'
    };
    return trendNames[trend] || trend;
  }

  /**
   * 트렌드 클래스 반환
   */
  private getTrendClass(trend: string): string {
    const trendClasses: Record<string, string> = {
      'improving': 'trend-improving',
      'declining': 'trend-declining',
      'stable': 'trend-stable'
    };
    return trendClasses[trend] || 'trend-stable';
  }

  /**
   * 이벤트 바인딩
   */
  private bindEvents(): void {
    // 감정 추가 이벤트 리스너
    window.addEventListener('emotionAdded', () => {
      this.updateChart();
    });

    // 새로고침 버튼 이벤트
    const refreshBtn = this.chartElement?.querySelector('.btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.updateChart());
    }

    // 초기화 버튼 이벤트
    const clearBtn = this.chartElement?.querySelector('.btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('감정 히스토리를 초기화하시겠습니까?')) {
          this.emotionHistory.clearHistory();
          this.updateChart();
        }
      });
    }
  }

  /**
   * 차트 제거
   */
  destroy(): void {
    if (this.chartElement) {
      this.container.removeChild(this.chartElement);
    }
    if (this.statsElement) {
      this.container.removeChild(this.statsElement);
    }
    if (this.alertsElement) {
      this.container.removeChild(this.alertsElement);
    }
  }
} 