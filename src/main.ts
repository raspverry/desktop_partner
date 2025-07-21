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
        
        // 감정 히스토리 초기화
        window.emotionHistory = emotionHistory;
        console.log('감정 히스토리 시스템 초기화 완료');
        
        // script.ts가 로드될 때까지 대기
        let attempts = 0;
        const maxAttempts = 50; // 5초 대기
        
        while (!window.initializeApp && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.initializeApp) {
            window.initializeApp();
            console.log('애플리케이션 초기화 완료');
        } else {
            console.error('initializeApp 함수를 찾을 수 없습니다.');
            throw new Error('초기화 함수 로드 실패');
        }
        
    } catch (error) {
        console.error('애플리케이션 초기화 실패:', error);
        throw error;
    }
}

// DOM 로드 완료 시 애플리케이션 초기화
window.addEventListener("DOMContentLoaded", () => {
    const loadingScreen = document.getElementById('loading-screen');
    
    initializeApplication()
        .then(() => {
            console.log('초기화 성공, 로딩 화면 숨김');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        })
        .catch((error) => {
            console.error('초기화 실패:', error);
            if (loadingScreen) {
                const loadingText = loadingScreen.querySelector('.loading-text');
                if (loadingText) {
                    loadingText.textContent = '초기화 중 오류가 발생했습니다.';
                }
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
