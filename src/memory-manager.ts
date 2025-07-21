/**
 * 메모리 관리 시스템
 * Mem0.ai를 통한 벡터 기반 메모리 저장 및 검색을 관리합니다.
 */

export interface MemoryItem {
  id: string;
  content: string;
  metadata: {
    type: 'conversation' | 'emotion' | 'action' | 'preference';
    timestamp: number;
    emotion?: string;
    confidence?: number;
    userId?: string;
    tags?: string[];
  };
  embedding?: number[];
}

export interface MemorySearchResult {
  id: string;
  content: string;
  metadata: any;
  similarity: number;
}

export interface MemoryStats {
  total_memories: number;
  conversation_count: number;
  emotion_count: number;
  action_count: number;
  preference_count: number;
  last_updated: number;
}

export class MemoryManager {
  private mem0Client: any = null;
  private isInitialized: boolean = false;
  private readonly memoryServiceUrl: string;
  private readonly userId: string;

  constructor(userId: string = 'default', memoryServiceUrl: string = 'http://localhost:8001') {
    this.userId = userId;
    this.memoryServiceUrl = memoryServiceUrl;
    this.initialize();
  }

  /**
   * 메모리 시스템 초기화
   */
  private async initialize(): Promise<void> {
    try {
      // Mem0.ai 클라이언트 초기화 (실제 구현에서는 Mem0 SDK 사용)
      this.mem0Client = {
        store: this.storeMemory.bind(this),
        search: this.searchMemory.bind(this),
        delete: this.deleteMemory.bind(this),
        getStats: this.getMemoryStats.bind(this)
      };

      this.isInitialized = true;
      console.log('메모리 관리 시스템 초기화 완료');
    } catch (error) {
      console.error('메모리 시스템 초기화 실패:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 메모리 저장
   */
  async storeMemory(content: string, metadata: Partial<MemoryItem['metadata']> = {}): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('메모리 시스템이 초기화되지 않았습니다.');
      return false;
    }

    try {
      const memoryItem: MemoryItem = {
        id: this.generateId(),
        content: content,
        metadata: {
          type: 'conversation',
          timestamp: Date.now(),
          userId: this.userId,
          ...metadata
        }
      };

      // 실제 구현에서는 Mem0.ai API 호출
      const response = await fetch(`${this.memoryServiceUrl}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryItem)
      });

      if (response.ok) {
        console.log('메모리 저장 완료:', memoryItem.id);
        return true;
      } else {
        console.error('메모리 저장 실패:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('메모리 저장 중 오류:', error);
      return false;
    }
  }

  /**
   * 메모리 검색
   */
  async searchMemory(query: string, limit: number = 10, type?: string): Promise<MemorySearchResult[]> {
    if (!this.isInitialized) {
      console.warn('메모리 시스템이 초기화되지 않았습니다.');
      return [];
    }

    try {
      const searchParams = new URLSearchParams({
        query: query,
        limit: limit.toString(),
        userId: this.userId
      });

      if (type) {
        searchParams.append('type', type);
      }

      const response = await fetch(`${this.memoryServiceUrl}/search?${searchParams}`);
      
      if (response.ok) {
        const results = await response.json();
        return results.map((item: any) => ({
          id: item.id,
          content: item.content,
          metadata: item.metadata,
          similarity: item.similarity || 0
        }));
      } else {
        console.error('메모리 검색 실패:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('메모리 검색 중 오류:', error);
      return [];
    }
  }

  /**
   * 메모리 삭제
   */
  async deleteMemory(id: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('메모리 시스템이 초기화되지 않았습니다.');
      return false;
    }

    try {
      const response = await fetch(`${this.memoryServiceUrl}/delete/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('메모리 삭제 완료:', id);
        return true;
      } else {
        console.error('메모리 삭제 실패:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('메모리 삭제 중 오류:', error);
      return false;
    }
  }

  /**
   * 대화 저장
   */
  async storeConversation(userMessage: string, aiResponse: string, emotion?: string): Promise<boolean> {
    const conversationContent = `사용자: ${userMessage}\nAI: ${aiResponse}`;
    
    const metadata = {
      type: 'conversation' as const,
      emotion: emotion,
      userMessage: userMessage,
      aiResponse: aiResponse
    };

    return await this.storeMemory(conversationContent, metadata);
  }

  /**
   * 감정 메모리 저장
   */
  async storeEmotion(emotion: string, confidence: number, context: string): Promise<boolean> {
    const emotionContent = `감정: ${emotion} (신뢰도: ${confidence.toFixed(2)})\n컨텍스트: ${context}`;
    
    const metadata = {
      type: 'emotion' as const,
      emotion: emotion,
      confidence: confidence,
      context: context
    };

    return await this.storeMemory(emotionContent, metadata);
  }

  /**
   * 사용자 행동 저장
   */
  async storeAction(action: string, details: string): Promise<boolean> {
    const actionContent = `행동: ${action}\n상세: ${details}`;
    
    const metadata = {
      type: 'action' as const,
      action: action,
      details: details
    };

    return await this.storeMemory(actionContent, metadata);
  }

  /**
   * 사용자 선호도 저장
   */
  async storePreference(category: string, value: string, strength: number = 1.0): Promise<boolean> {
    const preferenceContent = `선호도: ${category} = ${value} (강도: ${strength})`;
    
    const metadata = {
      type: 'preference' as const,
      category: category,
      value: value,
      strength: strength
    };

    return await this.storeMemory(preferenceContent, metadata);
  }

  /**
   * 컨텍스트 검색
   */
  async searchContext(query: string, limit: number = 5): Promise<MemorySearchResult[]> {
    return await this.searchMemory(query, limit, 'conversation');
  }

  /**
   * 감정 패턴 검색
   */
  async searchEmotionPatterns(emotion?: string, limit: number = 10): Promise<MemorySearchResult[]> {
    const searchQuery = emotion ? `감정: ${emotion}` : '감정';
    return await this.searchMemory(searchQuery, limit, 'emotion');
  }

  /**
   * 사용자 행동 패턴 검색
   */
  async searchActionPatterns(action?: string, limit: number = 10): Promise<MemorySearchResult[]> {
    const searchQuery = action ? `행동: ${action}` : '행동';
    return await this.searchMemory(searchQuery, limit, 'action');
  }

  /**
   * 사용자 선호도 검색
   */
  async searchPreferences(category?: string, limit: number = 10): Promise<MemorySearchResult[]> {
    const searchQuery = category ? `선호도: ${category}` : '선호도';
    return await this.searchMemory(searchQuery, limit, 'preference');
  }

  /**
   * 메모리 통계 가져오기
   */
  async getMemoryStats(): Promise<MemoryStats | null> {
    if (!this.isInitialized) {
      console.warn('메모리 시스템이 초기화되지 않았습니다.');
      return null;
    }

    try {
      const response = await fetch(`${this.memoryServiceUrl}/stats?userId=${this.userId}`);
      
      if (response.ok) {
        const stats = await response.json();
        return {
          total_memories: stats.total_memories || 0,
          conversation_count: stats.conversation_count || 0,
          emotion_count: stats.emotion_count || 0,
          action_count: stats.action_count || 0,
          preference_count: stats.preference_count || 0,
          last_updated: stats.last_updated || Date.now()
        };
      } else {
        console.error('메모리 통계 가져오기 실패:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('메모리 통계 가져오기 중 오류:', error);
      return null;
    }
  }

  /**
   * 메모리 정리
   */
  async cleanupOldMemories(daysOld: number = 30): Promise<number> {
    if (!this.isInitialized) {
      console.warn('메모리 시스템이 초기화되지 않았습니다.');
      return 0;
    }

    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      
      const response = await fetch(`${this.memoryServiceUrl}/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          cutoffTime: cutoffTime
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`오래된 메모리 정리 완료: ${result.deletedCount}개 삭제`);
        return result.deletedCount || 0;
      } else {
        console.error('메모리 정리 실패:', response.statusText);
        return 0;
      }
    } catch (error) {
      console.error('메모리 정리 중 오류:', error);
      return 0;
    }
  }

  /**
   * 메모리 백업
   */
  async backupMemories(): Promise<string | null> {
    if (!this.isInitialized) {
      console.warn('메모리 시스템이 초기화되지 않았습니다.');
      return null;
    }

    try {
      const response = await fetch(`${this.memoryServiceUrl}/backup?userId=${this.userId}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('메모리 백업 완료:', result.backupId);
        return result.backupId;
      } else {
        console.error('메모리 백업 실패:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('메모리 백업 중 오류:', error);
      return null;
    }
  }

  /**
   * 메모리 복원
   */
  async restoreMemories(backupId: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('메모리 시스템이 초기화되지 않았습니다.');
      return false;
    }

    try {
      const response = await fetch(`${this.memoryServiceUrl}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          backupId: backupId
        })
      });

      if (response.ok) {
        console.log('메모리 복원 완료:', backupId);
        return true;
      } else {
        console.error('메모리 복원 실패:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('메모리 복원 중 오류:', error);
      return false;
    }
  }

  /**
   * ID 생성
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 시스템 상태 확인
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 메모리 시스템 정리
   */
  dispose(): void {
    this.isInitialized = false;
    this.mem0Client = null;
  }
} 