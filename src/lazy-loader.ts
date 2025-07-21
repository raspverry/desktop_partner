// 지연 로딩 시스템
export interface LoadableItem {
    id: string;
    priority: number;
    load: () => Promise<any>;
    dependencies?: string[];
}

export class LazyLoader {
    private items: Map<string, LoadableItem> = new Map();
    private loadedItems: Map<string, any> = new Map();
    private loadingItems: Set<string> = new Set();
    private maxConcurrent: number = 3;
    private currentLoading: number = 0;

    constructor() {
        this.startLoading();
    }

    // 로딩 항목 등록
    register(item: LoadableItem): void {
        this.items.set(item.id, item);
    }

    // 항목 로딩 요청
    async loadItem(id: string): Promise<any> {
        // 이미 로드된 항목
        if (this.loadedItems.has(id)) {
            return this.loadedItems.get(id);
        }

        // 로딩 중인 항목
        if (this.loadingItems.has(id)) {
            return this.waitForItem(id);
        }

        const item = this.items.get(id);
        if (!item) {
            throw new Error(`Item not found: ${id}`);
        }

        // 의존성 확인
        if (item.dependencies) {
            for (const dep of item.dependencies) {
                await this.loadItem(dep);
            }
        }

        // 로딩 시작
        this.loadingItems.add(id);
        this.currentLoading++;

        try {
            const result = await item.load();
            this.loadedItems.set(id, result);
            return result;
        } finally {
            this.loadingItems.delete(id);
            this.currentLoading--;
        }
    }

    // 항목 로딩 대기
    private async waitForItem(id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const checkLoaded = () => {
                if (this.loadedItems.has(id)) {
                    resolve(this.loadedItems.get(id));
                } else if (!this.loadingItems.has(id)) {
                    reject(new Error(`Failed to load item: ${id}`));
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
        });
    }

    // 백그라운드 로딩 시작
    private startLoading(): void {
        const loadNext = async () => {
            if (this.currentLoading >= this.maxConcurrent) {
                setTimeout(loadNext, 100);
                return;
            }

            const unloadedItems = Array.from(this.items.values())
                .filter(item => !this.loadedItems.has(item.id) && !this.loadingItems.has(item.id))
                .sort((a, b) => b.priority - a.priority);

            if (unloadedItems.length > 0) {
                const item = unloadedItems[0];
                this.loadItem(item.id).catch(console.error);
            }

            setTimeout(loadNext, 1000);
        };

        loadNext();
    }

    // 로딩 상태 확인
    isLoading(id: string): boolean {
        return this.loadingItems.has(id);
    }

    isLoaded(id: string): boolean {
        return this.loadedItems.has(id);
    }

    // 로딩 진행률
    getLoadingProgress(): number {
        const total = this.items.size;
        const loaded = this.loadedItems.size;
        return total > 0 ? loaded / total : 0;
    }

    // 메모리 정리
    cleanup(): void {
        this.loadedItems.clear();
        this.loadingItems.clear();
    }
} 