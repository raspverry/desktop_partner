// 에러 처리 시스템
export interface ErrorInfo {
    type: string;
    message: string;
    stack?: string;
    timestamp: number;
    userAction?: string;
    recoverable: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorRecoveryStrategy {
    errorType: string;
    recoveryAction: () => Promise<boolean>;
    maxRetries: number;
    backoffMs: number;
}

export class ErrorHandler {
    private errorLog: ErrorInfo[] = [];
    private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();
    private maxErrorLogSize: number = 100;
    private isRecovering: boolean = false;

    constructor() {
        this.initializeRecoveryStrategies();
        this.setupGlobalErrorHandlers();
    }

    // 복구 전략 초기화
    private initializeRecoveryStrategies(): void {
        // 네트워크 오류 복구
        this.registerRecoveryStrategy({
            errorType: 'network',
            recoveryAction: async () => {
                try {
                    const response = await fetch('/health', { method: 'GET' });
                    return response.ok;
                } catch {
                    return false;
                }
            },
            maxRetries: 3,
            backoffMs: 1000
        });

        // 모델 로딩 오류 복구
        this.registerRecoveryStrategy({
            errorType: 'model_loading',
            recoveryAction: async () => {
                try {
                    // 모델 재로딩 시도
                    if (typeof (window as any).reloadModel === 'function') {
                        await (window as any).reloadModel();
                        return true;
                    }
                    return false;
                } catch {
                    return false;
                }
            },
            maxRetries: 2,
            backoffMs: 2000
        });

        // 메모리 부족 오류 복구
        this.registerRecoveryStrategy({
            errorType: 'memory',
            recoveryAction: async () => {
                try {
                    // 메모리 정리
                    if (typeof (window as any).cleanupMemory === 'function') {
                        (window as any).cleanupMemory();
                    }
                    
                    // 가비지 컬렉션 강제 실행
                    if ('gc' in window) {
                        (window as any).gc();
                    }
                    
                    return true;
                } catch {
                    return false;
                }
            },
            maxRetries: 1,
            backoffMs: 500
        });
    }

    // 전역 에러 핸들러 설정
    private setupGlobalErrorHandlers(): void {
        // JavaScript 에러 처리
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                stack: event.error?.stack,
                timestamp: Date.now(),
                userAction: 'page_interaction',
                recoverable: true,
                severity: 'medium'
            });
        });

        // Promise 에러 처리
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Promise rejection',
                stack: event.reason?.stack,
                timestamp: Date.now(),
                userAction: 'async_operation',
                recoverable: true,
                severity: 'medium'
            });
        });

        // 리소스 로딩 에러 처리
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'resource',
                    message: `리소스 로딩 실패: ${(event.target as any)?.src || 'unknown'}`,
                    timestamp: Date.now(),
                    userAction: 'resource_loading',
                    recoverable: true,
                    severity: 'low'
                });
            }
        }, true);
    }

    // 에러 처리 메인 함수
    public handleError(errorInfo: ErrorInfo): void {
        console.error('에러 발생:', errorInfo);

        // 에러 로그에 추가
        this.errorLog.push(errorInfo);
        if (this.errorLog.length > this.maxErrorLogSize) {
            this.errorLog.shift();
        }

        // 사용자에게 알림
        this.notifyUser(errorInfo);

        // 복구 시도
        if (errorInfo.recoverable && !this.isRecovering) {
            this.attemptRecovery(errorInfo);
        }

        // 심각한 에러인 경우 추가 처리
        if (errorInfo.severity === 'critical') {
            this.handleCriticalError(errorInfo);
        }
    }

    // 사용자 알림
    private notifyUser(errorInfo: ErrorInfo): void {
        const messages = {
            low: '일시적인 문제가 발생했습니다.',
            medium: '문제가 발생했습니다. 자동으로 복구를 시도합니다.',
            high: '중요한 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
            critical: '심각한 오류가 발생했습니다. 페이지를 새로고침해주세요.'
        };

        const message = messages[errorInfo.severity];
        
        // 전역 알림 함수가 있는 경우 사용
        if (typeof (window as any).showNotification === 'function') {
            (window as any).showNotification(message, 'error');
        } else {
            // 기본 알림
            alert(message);
        }
    }

    // 복구 시도
    private async attemptRecovery(errorInfo: ErrorInfo): Promise<void> {
        const strategy = this.recoveryStrategies.get(errorInfo.type);
        if (!strategy) {
            console.log('복구 전략이 없습니다:', errorInfo.type);
            return;
        }

        this.isRecovering = true;
        let retryCount = 0;

        while (retryCount < strategy.maxRetries) {
            try {
                console.log(`복구 시도 ${retryCount + 1}/${strategy.maxRetries}`);
                
                const success = await strategy.recoveryAction();
                if (success) {
                    console.log('복구 성공');
                    this.notifyUser({
                        type: 'recovery',
                        message: '문제가 해결되었습니다.',
                        timestamp: Date.now(),
                        recoverable: false,
                        severity: 'low'
                    });
                    break;
                }
            } catch (recoveryError) {
                console.error('복구 시도 실패:', recoveryError);
            }

            retryCount++;
            if (retryCount < strategy.maxRetries) {
                await this.delay(strategy.backoffMs * retryCount);
            }
        }

        if (retryCount >= strategy.maxRetries) {
            console.error('복구 실패');
            this.notifyUser({
                type: 'recovery_failed',
                message: '자동 복구에 실패했습니다. 수동으로 다시 시도해주세요.',
                timestamp: Date.now(),
                recoverable: false,
                severity: 'high'
            });
        }

        this.isRecovering = false;
    }

    // 심각한 에러 처리
    private handleCriticalError(errorInfo: ErrorInfo): void {
        console.error('심각한 에러:', errorInfo);
        
        // 에러 정보를 서버에 전송 (선택사항)
        this.sendErrorToServer(errorInfo);
        
        // 사용자에게 심각한 에러 알림
        this.notifyUser({
            type: 'critical_error',
            message: '심각한 오류가 발생했습니다. 개발팀에 문의해주세요.',
            timestamp: Date.now(),
            recoverable: false,
            severity: 'critical'
        });
    }

    // 에러를 서버에 전송
    private async sendErrorToServer(errorInfo: ErrorInfo): Promise<void> {
        try {
            await fetch('/api/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorInfo)
            });
        } catch (error) {
            console.error('에러 전송 실패:', error);
        }
    }

    // 복구 전략 등록
    public registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
        this.recoveryStrategies.set(strategy.errorType, strategy);
    }

    // 수동 복구 시도
    public async manualRecovery(errorType: string): Promise<boolean> {
        const strategy = this.recoveryStrategies.get(errorType);
        if (!strategy) {
            return false;
        }

        try {
            return await strategy.recoveryAction();
        } catch {
            return false;
        }
    }

    // 에러 로그 조회
    public getErrorLog(): ErrorInfo[] {
        return [...this.errorLog];
    }

    // 최근 에러 조회
    public getRecentErrors(count: number = 10): ErrorInfo[] {
        return this.errorLog.slice(-count);
    }

    // 에러 통계
    public getErrorStats(): {
        total: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        recoverable: number;
        unrecoverable: number;
    } {
        const stats = {
            total: this.errorLog.length,
            byType: {} as Record<string, number>,
            bySeverity: {} as Record<string, number>,
            recoverable: 0,
            unrecoverable: 0
        };

        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            
            if (error.recoverable) {
                stats.recoverable++;
            } else {
                stats.unrecoverable++;
            }
        });

        return stats;
    }

    // 에러 로그 초기화
    public clearErrorLog(): void {
        this.errorLog = [];
    }

    // 지연 함수
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 안전한 함수 실행
    public async safeExecute<T>(
        fn: () => Promise<T>,
        errorType: string = 'unknown',
        userAction: string = 'function_execution'
    ): Promise<T | null> {
        try {
            return await fn();
        } catch (error) {
            this.handleError({
                type: errorType,
                message: error instanceof Error ? error.message : '알 수 없는 오류',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: Date.now(),
                userAction,
                recoverable: true,
                severity: 'medium'
            });
            return null;
        }
    }

    // 안전한 동기 함수 실행
    public safeExecuteSync<T>(
        fn: () => T,
        errorType: string = 'unknown',
        userAction: string = 'function_execution'
    ): T | null {
        try {
            return fn();
        } catch (error) {
            this.handleError({
                type: errorType,
                message: error instanceof Error ? error.message : '알 수 없는 오류',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: Date.now(),
                userAction,
                recoverable: true,
                severity: 'medium'
            });
            return null;
        }
    }
}

// 전역 에러 핸들러 인스턴스
export const errorHandler = new ErrorHandler();

// 전역 함수로 노출
(window as any).errorHandler = errorHandler; 