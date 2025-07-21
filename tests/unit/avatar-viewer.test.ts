// 아바타 뷰어 단위 테스트
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AvatarViewer } from '../../src/avatar-viewer';

describe('아바타 뷰어', () => {
    let avatarViewer: AvatarViewer;
    let mockContainer: HTMLElement;

    beforeEach(() => {
        mockContainer = document.createElement('div');
        avatarViewer = new AvatarViewer(mockContainer);
    });

    describe('초기화', () => {
        it('올바르게 초기화되어야 함', () => {
            expect(avatarViewer).toBeDefined();
            expect(mockContainer.children.length).toBeGreaterThan(0);
        });

        it('씬이 설정되어야 함', () => {
            expect(avatarViewer['scene']).toBeDefined();
            expect(avatarViewer['camera']).toBeDefined();
            expect(avatarViewer['renderer']).toBeDefined();
        });
    });

    describe('감정 설정', () => {
        it('감정을 올바르게 설정해야 함', () => {
            const emotions = ['happy', 'sad', 'angry', 'surprised', 'neutral'];
            emotions.forEach(emotion => {
                expect(() => avatarViewer.setEmotion(emotion)).not.toThrow();
            });
        });

        it('강도를 조절할 수 있어야 함', () => {
            expect(() => avatarViewer.setEmotion('happy', 0.5)).not.toThrow();
            expect(() => avatarViewer.setEmotion('sad', 1.0)).not.toThrow();
        });
    });

    describe('BlendShape 설정', () => {
        it('BlendShape를 올바르게 설정해야 함', () => {
            expect(() => avatarViewer.setBlendShape('Joy', 0.8)).not.toThrow();
            expect(() => avatarViewer.setBlendShape('Sorrow', 0.6)).not.toThrow();
        });
    });

    describe('애니메이션 재생', () => {
        it('애니메이션을 재생할 수 있어야 함', () => {
            expect(() => avatarViewer.playAnimation('wave')).not.toThrow();
            expect(() => avatarViewer.playAnimation('thinking')).not.toThrow();
        });
    });

    describe('리사이즈', () => {
        it('창 크기 변경에 대응해야 함', () => {
            const originalWidth = window.innerWidth;
            const originalHeight = window.innerHeight;
            
            // 창 크기 변경 시뮬레이션
            Object.defineProperty(window, 'innerWidth', { value: 800 });
            Object.defineProperty(window, 'innerHeight', { value: 600 });
            
            expect(() => avatarViewer.resize()).not.toThrow();
            
            // 원래 크기로 복원
            Object.defineProperty(window, 'innerWidth', { value: originalWidth });
            Object.defineProperty(window, 'innerHeight', { value: originalHeight });
        });
    });
}); 