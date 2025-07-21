// AI Partner Desktop 애플리케이션 진입점
import { invoke } from "@tauri-apps/api/core";
import { emotionHistory } from './emotion-history';

// 전역 타입 선언
declare global {
    interface Window {
        initializeApp: () => void;
        showNotification: (message: string, type: string) => void;
        performanceMonitor: any;
        avatarCustomizer: any;
        agentManager: any;
        emotionHistory: any;
    }
}

// 애플리케이션 초기화
async function initializeApplication() {
    try {
        console.log('AI Partner Desktop 애플리케이션 초기화 시작...');
        
        // 성능 모니터링 시작
        if (window.performanceMonitor) {
            window.performanceMonitor.startMonitoring();
        }
        
        // 감정 히스토리 초기화
        window.emotionHistory = emotionHistory;
        console.log('감정 히스토리 시스템 초기화 완료');
        
        // 애플리케이션 초기화 함수 호출
        if (typeof window.initializeApp === 'function') {
            window.initializeApp();
        } else {
            console.warn('initializeApp 함수를 찾을 수 없습니다. script.ts가 로드되었는지 확인하세요.');
        }
        
        console.log('애플리케이션 초기화 완료');
        
    } catch (error) {
        console.error('애플리케이션 초기화 실패:', error);
        
        // 사용자에게 오류 알림
        if (typeof window.showNotification === 'function') {
            window.showNotification('애플리케이션 초기화 중 오류가 발생했습니다.', 'error');
        }
    }
}

// DOM 로드 완료 시 애플리케이션 초기화
window.addEventListener("DOMContentLoaded", () => {
    // 로딩 화면 표시
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
    
    // 애플리케이션 초기화
    initializeApplication().then(() => {
        // 로딩 화면 숨기기
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }).catch((error) => {
        console.error('초기화 실패:', error);
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    });
});

// Tauri 명령어 예제 (참고용)
async function greet(name: string): Promise<string> {
    try {
        return await invoke("greet", { name });
    } catch (error) {
        console.error('Tauri 명령어 실행 실패:', error);
        return `안녕하세요, ${name}님!`;
    }
}

// 전역 함수로 노출 (필요시 사용)
(window as any).greet = greet;
