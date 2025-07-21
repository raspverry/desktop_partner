// AI 대화 시스템 단위 테스트
import { describe, it, expect, beforeEach } from 'vitest';
import { AIConversationSystem } from '../../src/ai-conversation';

describe('AI 대화 시스템', () => {
    let aiConversation: AIConversationSystem;

    beforeEach(() => {
        aiConversation = new AIConversationSystem();
    });

    describe('프롬프트 분류', () => {
        it('간단한 응답이 필요한 프롬프트를 분류해야 함', () => {
            const simplePrompts = ['안녕', '고마워', '좋아', '응'];
            simplePrompts.forEach(prompt => {
                const result = aiConversation['classifyPrompt'](prompt);
                expect(result).toBe('simple');
            });
        });

        it('도구 호출이 필요한 프롬프트를 분류해야 함', () => {
            const toolPrompts = ['검색', '찾아', '계산', '번역'];
            toolPrompts.forEach(prompt => {
                const result = aiConversation['classifyPrompt'](prompt);
                expect(result).toBe('tool');
            });
        });

        it('복잡한 대화가 필요한 프롬프트를 분류해야 함', () => {
            const complexPrompts = ['인생의 의미', '철학적 질문', '복잡한 문제'];
            complexPrompts.forEach(prompt => {
                const result = aiConversation['classifyPrompt'](prompt);
                expect(result).toBe('complex');
            });
        });
    });

    describe('간단한 응답 생성', () => {
        it('인사에 대한 응답을 생성해야 함', async () => {
            const response = await aiConversation['generateSimpleResponse']('안녕');
            expect(response).toContain('안녕');
        });

        it('감사에 대한 응답을 생성해야 함', async () => {
            const response = await aiConversation['generateSimpleResponse']('고마워');
            expect(response).toContain('천만에요');
        });
    });

    describe('메시지 처리', () => {
        it('사용자 입력을 처리해야 함', async () => {
            const response = await aiConversation.processUserInput('안녕하세요');
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
        });

        it('빈 입력을 처리해야 함', async () => {
            const response = await aiConversation.processUserInput('');
            expect(response).toBeDefined();
        });
    });
}); 