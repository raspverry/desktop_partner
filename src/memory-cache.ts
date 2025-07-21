// 메모리 캐시 시스템
export interface CacheItem<T> {
    key: string;
    value: T;
    timestamp: number;
    size: number;
    accessCount: number;
}

export class MemoryCache<T> {
    private cache: Map<string, CacheItem<T>> = new Map();
    private maxSize: number;
    private maxAge: number;
    private currentSize: number = 0;

    constructor(maxSize: number = 100 * 1024 * 1024, maxAge: number = 30 * 60 * 1000) { // 100MB, 30분
        this.maxSize = maxSize;
        this.maxAge = maxAge;
    }

    // 캐시에 항목 추가
    set(key: string, value: T, size: number = 0): void {
        // 기존 항목 제거
        this.delete(key);

        const item: CacheItem<T> = {
            key,
            value,
            timestamp: Date.now(),
            size,
            accessCount: 0
        };

        // 캐시 크기 확인
        if (this.currentSize + size > this.maxSize) {
            this.evictItems();
        }

        this.cache.set(key, item);
        this.currentSize += size;
    }

    // 캐시에서 항목 가져오기
    get(key: string): T | null {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        // 만료 확인
        if (Date.now() - item.timestamp > this.maxAge) {
            this.delete(key);
            return null;
        }

        // 접근 횟수 증가
        item.accessCount++;
        item.timestamp = Date.now();

        return item.value;
    }

    // 캐시에서 항목 제거
    delete(key: string): boolean {
        const item = this.cache.get(key);
        if (item) {
            this.currentSize -= item.size;
            this.cache.delete(key);
            return true;
        }
        return false;
    }

    // 캐시 정리
    clear(): void {
        this.cache.clear();
        this.currentSize = 0;
    }

    // LRU 기반 항목 제거
    private evictItems(): void {
        const items = Array.from(this.cache.values());
        
        // 접근 횟수와 시간을 기준으로 정렬
        items.sort((a, b) => {
            const aScore = a.accessCount / (Date.now() - a.timestamp + 1);
            const bScore = b.accessCount / (Date.now() - b.timestamp + 1);
            return aScore - bScore;
        });

        // 가장 낮은 점수의 항목들 제거
        for (const item of items) {
            if (this.currentSize <= this.maxSize * 0.8) {
                break;
            }
            this.delete(item.key);
        }
    }

    // 캐시 통계
    getStats(): any {
        return {
            size: this.currentSize,
            itemCount: this.cache.size,
            maxSize: this.maxSize,
            hitRate: this.calculateHitRate()
        };
    }

    // 히트율 계산
    private calculateHitRate(): number {
        // 간단한 히트율 계산 (실제로는 더 정교한 추적 필요)
        return this.cache.size / Math.max(this.cache.size + 1, 1);
    }

    // 만료된 항목 정리
    cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.maxAge) {
                this.delete(key);
            }
        }
    }
} 