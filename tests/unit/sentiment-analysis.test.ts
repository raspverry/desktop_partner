// 감정 분석 단위 테스트
import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeSentimentSimple } from '../../src/script';

describe('감정 분석 시스템', () => {
    describe('간단한 감정 분석', () => {
        it('긍정적인 텍스트를 올바르게 분류해야 함', () => {
            const result = analyzeSentimentSimple('오늘 정말 좋은 하루였어요!');
            expect(result.emotion).toBe('POSITIVE');
            expect(result.score).toBeGreaterThan(0.5);
        });

        it('부정적인 텍스트를 올바르게 분류해야 함', () => {
            const result = analyzeSentimentSimple('오늘 정말 힘든 하루였어요.');
            expect(result.emotion).toBe('NEGATIVE');
            expect(result.score).toBeGreaterThan(0.5);
        });

        it('중립적인 텍스트를 올바르게 분류해야 함', () => {
            const result = analyzeSentimentSimple('오늘 날씨가 흐렸습니다.');
            expect(result.emotion).toBe('NEUTRAL');
        });

        it('빈 문자열을 처리해야 함', () => {
            const result = analyzeSentimentSimple('');
            expect(result.emotion).toBe('NEUTRAL');
            expect(result.score).toBe(0);
        });

        it('특수문자가 포함된 텍스트를 처리해야 함', () => {
            const result = analyzeSentimentSimple('정말 좋은 하루!!! 😊');
            expect(result.emotion).toBe('POSITIVE');
        });
    });

    describe('키워드 매칭', () => {
        it('긍정 키워드를 정확히 인식해야 함', () => {
            const positiveWords = ['좋아', '행복', '기뻐', '감사', '사랑'];
            positiveWords.forEach(word => {
                const result = analyzeSentimentSimple(`오늘 ${word}해요`);
                expect(result.emotion).toBe('POSITIVE');
            });
        });

        it('부정 키워드를 정확히 인식해야 함', () => {
            const negativeWords = ['싫어', '슬퍼', '화나', '짜증', '힘들'];
            negativeWords.forEach(word => {
                const result = analyzeSentimentSimple(`오늘 ${word}해요`);
                expect(result.emotion).toBe('NEGATIVE');
            });
        });
    });
}); 