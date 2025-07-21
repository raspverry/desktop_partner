// 키보드 단축키 시스템
export interface Shortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    action: () => void;
}

export class KeyboardShortcutManager {
    private shortcuts: Map<string, Shortcut> = new Map();
    private isEnabled: boolean = true;

    constructor() {
        this.setupDefaultShortcuts();
        this.initializeEventListeners();
    }

    // 기본 단축키 설정
    private setupDefaultShortcuts(): void {
        this.registerShortcut({
            key: 'Enter',
            description: '메시지 전송',
            action: () => {
                const sendButton = document.getElementById('send-button');
                if (sendButton) sendButton.click();
            }
        });

        this.registerShortcut({
            key: 'Space',
            description: '음성 인식 토글',
            action: () => {
                const micButton = document.getElementById('mic-button');
                if (micButton) micButton.click();
            }
        });

        this.registerShortcut({
            key: 'Escape',
            description: '모달 닫기',
            action: () => {
                const modals = document.querySelectorAll('.modal.active, .memory-panel.active');
                modals.forEach(modal => modal.classList.remove('active'));
            }
        });

        this.registerShortcut({
            key: 'm',
            description: '메모리 패널 토글',
            action: () => {
                const memoryPanel = document.getElementById('memory-panel');
                if (memoryPanel) {
                    memoryPanel.classList.toggle('active');
                }
            }
        });

        this.registerShortcut({
            key: 'c',
            description: '채팅 패널 토글',
            action: () => {
                const chatContainer = document.getElementById('chat-container');
                if (chatContainer) {
                    chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
                }
            }
        });

        this.registerShortcut({
            key: 'a',
            description: '감정 분석 패널 토글',
            action: () => {
                const sentimentPanel = document.getElementById('sentiment-panel');
                if (sentimentPanel) {
                    sentimentPanel.style.display = sentimentPanel.style.display === 'none' ? 'block' : 'none';
                }
            }
        });

        this.registerShortcut({
            key: 'r',
            description: '아바타 리셋',
            action: () => {
                if (window.avatarViewer) {
                    window.avatarViewer.setEmotion('neutral');
                }
            }
        });

        this.registerShortcut({
            key: 'h',
            description: '도움말 표시',
            action: () => {
                this.showHelp();
            }
        });

        // Ctrl + 단축키
        this.registerShortcut({
            key: 's',
            ctrl: true,
            description: '설정 저장',
            action: () => {
                this.saveSettings();
            }
        });

        this.registerShortcut({
            key: 'l',
            ctrl: true,
            description: '설정 로드',
            action: () => {
                this.loadSettings();
            }
        });

        this.registerShortcut({
            key: 'e',
            ctrl: true,
            description: '프로필 내보내기',
            action: () => {
                this.exportProfile();
            }
        });

        this.registerShortcut({
            key: 'i',
            ctrl: true,
            description: '프로필 가져오기',
            action: () => {
                this.importProfile();
            }
        });
    }

    // 이벤트 리스너 초기화
    private initializeEventListeners(): void {
        document.addEventListener('keydown', (event) => {
            if (!this.isEnabled) return;

            const key = event.key.toLowerCase();
            const ctrl = event.ctrlKey;
            const shift = event.shiftKey;
            const alt = event.altKey;

            // 입력 필드에 포커스가 있으면 단축키 비활성화
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }

            const shortcutKey = this.getShortcutKey(key, ctrl, shift, alt);
            const shortcut = this.shortcuts.get(shortcutKey);

            if (shortcut) {
                event.preventDefault();
                shortcut.action();
            }
        });
    }

    // 단축키 등록
    registerShortcut(shortcut: Shortcut): void {
        const key = this.getShortcutKey(shortcut.key, shortcut.ctrl, shortcut.shift, shortcut.alt);
        this.shortcuts.set(key, shortcut);
    }

    // 단축키 키 생성
    private getShortcutKey(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean): string {
        const modifiers = [];
        if (ctrl) modifiers.push('ctrl');
        if (shift) modifiers.push('shift');
        if (alt) modifiers.push('alt');
        modifiers.push(key);
        return modifiers.join('+');
    }

    // 단축키 비활성화/활성화
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    // 도움말 표시
    private showHelp(): void {
        const helpContent = Array.from(this.shortcuts.values())
            .map(shortcut => {
                const key = this.getShortcutKey(shortcut.key, shortcut.ctrl, shortcut.shift, shortcut.alt);
                return `${key}: ${shortcut.description}`;
            })
            .join('\n');

        alert(`키보드 단축키:\n\n${helpContent}`);
    }

    // 설정 저장
    private saveSettings(): void {
        // 설정 저장 로직
        console.log('설정 저장됨');
        showNotification('설정이 저장되었습니다.', 'success');
    }

    // 설정 로드
    private loadSettings(): void {
        // 설정 로드 로직
        console.log('설정 로드됨');
        showNotification('설정이 로드되었습니다.', 'success');
    }

    // 프로필 내보내기
    private exportProfile(): void {
        // 프로필 내보내기 로직
        console.log('프로필 내보내기');
        showNotification('프로필이 내보내기되었습니다.', 'success');
    }

    // 프로필 가져오기
    private importProfile(): void {
        // 프로필 가져오기 로직
        console.log('프로필 가져오기');
        showNotification('프로필이 가져오기되었습니다.', 'success');
    }

    // 사용 가능한 단축키 목록 가져오기
    getShortcuts(): Shortcut[] {
        return Array.from(this.shortcuts.values());
    }
} 