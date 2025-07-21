// 전체 대화 플로우 통합 테스트
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AIConversationSystem } from '../../src/ai-conversation';
import { AvatarViewer } from '../../src/avatar-viewer';
import { MemoryManager } from '../../src/memory-manager';

describe('전체 대화 플로우', () => {
    let aiConversation: AIConversationSystem;
    let avatarViewer: AvatarViewer;
    let memoryManager: MemoryManager;
    let mockContainer: HTMLElement;

    beforeEach(() => {
        mockContainer = document.createElement('div');
        aiConversation = new AIConversationSystem();
        avatarViewer = new AvatarViewer(mockContainer);
        memoryManager = new MemoryManager();
    });

    afterEach(() => {
        mockContainer.remove();
    });

    describe('감정 분석과 아바타 반응', () => {
        it('긍정적인 메시지에 대해 아바타가 기뻐해야 함', async () => {
            const message = '오늘 정말 좋은 하루였어요!';
            
            // AI 응답 생성
            const response = await aiConversation.processUserInput(message);
            expect(response).toBeDefined();

            // 아바타 감정 설정
            avatarViewer.setEmotion('happy');
            
            // 메모리에 저장
            const saved = await memoryManager.storeConversation(message, response, 'happy');
            expect(saved).toBe(true);
        });

        it('부정적인 메시지에 대해 아바타가 슬퍼해야 함', async () => {
            const message = '오늘 정말 힘든 하루였어요.';
            
            const response = await aiConversation.processUserInput(message);
            expect(response).toBeDefined();

            avatarViewer.setEmotion('sad');
            
            const saved = await memoryManager.storeConversation(message, response, 'sad');
            expect(saved).toBe(true);
        });
    });

    describe('메모리 연동', () => {
        it('이전 대화를 기억해야 함', async () => {
            const message1 = '내 이름은 김철수입니다.';
            const message2 = '내 이름이 뭐였지?';

            // 첫 번째 대화 저장
            await aiConversation.processUserInput(message1);
            
            // 두 번째 대화에서 이전 정보 참조
            const response2 = await aiConversation.processUserInput(message2);
            expect(response2).toContain('김철수');
        });
    });

    describe('도구 호출', () => {
        it('계산 요청을 처리해야 함', async () => {
            const message = '1 + 1을 계산해줘';
            
            const response = await aiConversation.processUserInput(message);
            expect(response).toContain('계산');
        });

        it('검색 요청을 처리해야 함', async () => {
            const message = '날씨 정보를 찾아줘';
            
            const response = await aiConversation.processUserInput(message);
            expect(response).toContain('검색');
        });
    });
}); 