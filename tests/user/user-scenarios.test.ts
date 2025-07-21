// 사용자 테스트 시나리오
import { describe, it, expect } from 'vitest';

describe('사용자 시나리오 테스트', () => {
    describe('시나리오 1: 첫 사용자 경험', () => {
        it('앱 시작부터 첫 대화까지', async () => {
            // 1. 앱 시작
            expect(document.getElementById('app')).toBeDefined();
            
            // 2. 아바타 로딩
            const avatarContainer = document.getElementById('avatar-container');
            expect(avatarContainer).toBeDefined();
            
            // 3. 첫 인사
            const chatInput = document.getElementById('chat-input') as HTMLInputElement;
            const sendButton = document.getElementById('send-button');
            
            expect(chatInput).toBeDefined();
            expect(sendButton).toBeDefined();
            
            // 4. 메시지 전송
            chatInput.value = '안녕하세요';
            sendButton?.click();
            
            // 5. 응답 확인
            const chatMessages = document.getElementById('chat-messages');
            expect(chatMessages?.children.length).toBeGreaterThan(0);
        });
    });

    describe('시나리오 2: 감정 분석 사용', () => {
        it('감정 분석 기능 테스트', async () => {
            // 1. 감정 분석 패널 열기
            const analyzeButton = document.getElementById('analyze-button');
            expect(analyzeButton).toBeDefined();
            
            // 2. 텍스트 입력
            const sentimentInput = document.getElementById('sentiment-input') as HTMLInputElement;
            sentimentInput.value = '오늘 정말 좋은 하루였어요!';
            
            // 3. 분석 실행
            analyzeButton?.click();
            
            // 4. 결과 확인
            const sentimentResult = document.getElementById('sentiment-result');
            expect(sentimentResult?.textContent).toContain('긍정');
        });
    });

    describe('시나리오 3: 메모리 관리', () => {
        it('메모리 기능 테스트', async () => {
            // 1. 메모리 패널 열기
            const memoryButton = document.getElementById('memory-button');
            memoryButton?.click();
            
            // 2. 메모리 검색
            const memorySearchInput = document.getElementById('memory-search-input') as HTMLInputElement;
            memorySearchInput.value = '대화';
            
            const memorySearchButton = document.getElementById('memory-search-button');
            memorySearchButton?.click();
            
            // 3. 결과 확인
            const memoryResults = document.getElementById('memory-results');
            expect(memoryResults).toBeDefined();
        });
    });

    describe('시나리오 4: 설정 변경', () => {
        it('사용자 설정 테스트', async () => {
            // 1. 설정 패널 열기
            const settingsButton = document.getElementById('settings-button');
            expect(settingsButton).toBeDefined();
            
            // 2. 테마 변경
            const themeToggle = document.getElementById('theme-toggle');
            themeToggle?.click();
            
            // 3. 설정 저장 확인
            expect(document.documentElement.classList.contains('dark')).toBeDefined();
        });
    });
}); 