// 접근성 개선 시스템
export interface AccessibilitySettings {
    screenReader: boolean;
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    keyboardNavigation: boolean;
    voiceCommands: boolean;
    colorBlindSupport: boolean;
}

export class AccessibilityManager {
    private settings: AccessibilitySettings;
    private isEnabled: boolean = true;

    constructor() {
        this.settings = this.getDefaultSettings();
        this.applySettings();
    }

    // 기본 접근성 설정
    private getDefaultSettings(): AccessibilitySettings {
        return {
            screenReader: false,
            highContrast: false,
            largeText: false,
            reducedMotion: false,
            keyboardNavigation: true,
            voiceCommands: false,
            colorBlindSupport: false
        };
    }

    // 설정 적용
    private applySettings(): void {
        const root = document.documentElement;
        
        // 고대비 모드
        if (this.settings.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // 큰 텍스트
        if (this.settings.largeText) {
            root.classList.add('large-text');
        } else {
            root.classList.remove('large-text');
        }

        // 모션 감소
        if (this.settings.reducedMotion) {
            root.classList.add('reduced-motion');
        } else {
            root.classList.remove('reduced-motion');
        }

        // 색맹 지원
        if (this.settings.colorBlindSupport) {
            root.classList.add('color-blind-support');
        } else {
            root.classList.remove('color-blind-support');
        }

        // 스크린 리더 지원
        this.setupScreenReaderSupport();
        
        // 음성 명령 지원
        this.setupVoiceCommands();
    }

    // 스크린 리더 지원 설정
    private setupScreenReaderSupport(): void {
        if (!this.settings.screenReader) return;

        // ARIA 라벨 추가
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (!button.getAttribute('aria-label')) {
                button.setAttribute('aria-label', button.textContent || '버튼');
            }
        });

        // 포커스 표시 개선
        const focusableElements = document.querySelectorAll('button, input, textarea, select, a, [tabindex]');
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.classList.add('focus-visible');
            });
            element.addEventListener('blur', () => {
                element.classList.remove('focus-visible');
            });
        });
    }

    // 음성 명령 지원 설정
    private setupVoiceCommands(): void {
        if (!this.settings.voiceCommands) return;

        // 음성 명령 인식
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.lang = 'ko-KR';

        recognition.onresult = (event) => {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
            this.processVoiceCommand(command);
        };

        recognition.start();
    }

    // 음성 명령 처리
    private processVoiceCommand(command: string): void {
        if (command.includes('메시지 전송') || command.includes('보내기')) {
            const sendButton = document.getElementById('send-button');
            if (sendButton) sendButton.click();
        } else if (command.includes('음성 인식') || command.includes('마이크')) {
            const micButton = document.getElementById('mic-button');
            if (micButton) micButton.click();
        } else if (command.includes('메모리') || command.includes('기억')) {
            const memoryButton = document.getElementById('memory-button');
            if (memoryButton) memoryButton.click();
        } else if (command.includes('감정 분석') || command.includes('분석')) {
            const analyzeButton = document.getElementById('analyze-button');
            if (analyzeButton) analyzeButton.click();
        } else if (command.includes('도움말') || command.includes('help')) {
            this.showAccessibilityHelp();
        }
    }

    // 접근성 도움말 표시
    private showAccessibilityHelp(): void {
        const helpContent = `
            음성 명령 목록:
            - "메시지 전송" 또는 "보내기": 메시지 전송
            - "음성 인식" 또는 "마이크": 음성 인식 시작/중지
            - "메모리" 또는 "기억": 메모리 패널 열기
            - "감정 분석" 또는 "분석": 감정 분석 실행
            - "도움말" 또는 "help": 이 도움말 표시
        `;
        alert(helpContent);
    }

    // 설정 업데이트
    updateSettings(settings: Partial<AccessibilitySettings>): void {
        this.settings = { ...this.settings, ...settings };
        this.applySettings();
    }

    // 현재 설정 가져오기
    getSettings(): AccessibilitySettings {
        return this.settings;
    }

    // 접근성 활성화/비활성화
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        if (!enabled) {
            // 접근성 기능 비활성화
            document.documentElement.classList.remove(
                'high-contrast', 'large-text', 'reduced-motion', 'color-blind-support'
            );
        } else {
            this.applySettings();
        }
    }
} 