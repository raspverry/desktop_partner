// 사용자 프로필 시스템
export interface UserProfile {
    id: string;
    name: string;
    avatar: string;
    preferences: {
        conversationStyle: 'casual' | 'formal' | 'friendly';
        language: 'ko' | 'en' | 'ja' | 'zh';
        theme: 'light' | 'dark' | 'auto';
        notifications: boolean;
        autoSave: boolean;
    };
    settings: {
        voiceEnabled: boolean;
        lipsyncEnabled: boolean;
        animationSpeed: number;
        avatarScale: number;
        cameraSensitivity: number;
    };
    statistics: {
        totalConversations: number;
        totalMessages: number;
        favoriteTopics: string[];
        averageSessionTime: number;
        lastActive: Date;
    };
    customizations: {
        avatarOutfit: string;
        avatarHair: string;
        avatarAccessories: string[];
        customColors: {
            primary: string;
            secondary: string;
            accent: string;
        };
    };
}

export class UserProfileManager {
    private currentProfile: UserProfile | null = null;
    private storageKey = 'ai_partner_user_profile';

    constructor() {
        this.loadProfile();
    }

    // 기본 프로필 생성
    private createDefaultProfile(): UserProfile {
        return {
            id: this.generateUserId(),
            name: '사용자',
            avatar: 'AliciaSolid_vrm-0.51.vrm',
            preferences: {
                conversationStyle: 'friendly',
                language: 'ko',
                theme: 'auto',
                notifications: true,
                autoSave: true
            },
            settings: {
                voiceEnabled: true,
                lipsyncEnabled: true,
                animationSpeed: 1.0,
                avatarScale: 1.0,
                cameraSensitivity: 1.0
            },
            statistics: {
                totalConversations: 0,
                totalMessages: 0,
                favoriteTopics: [],
                averageSessionTime: 0,
                lastActive: new Date()
            },
            customizations: {
                avatarOutfit: 'default',
                avatarHair: 'default',
                avatarAccessories: [],
                customColors: {
                    primary: '#667eea',
                    secondary: '#764ba2',
                    accent: '#f093fb'
                }
            }
        };
    }

    // 프로필 로드
    private loadProfile(): void {
        try {
            const savedProfile = localStorage.getItem(this.storageKey);
            if (savedProfile) {
                this.currentProfile = JSON.parse(savedProfile);
                this.currentProfile.lastActive = new Date();
            } else {
                this.currentProfile = this.createDefaultProfile();
                this.saveProfile();
            }
        } catch (error) {
            console.error('프로필 로드 실패:', error);
            this.currentProfile = this.createDefaultProfile();
        }
    }

    // 프로필 저장
    private saveProfile(): void {
        try {
            if (this.currentProfile) {
                localStorage.setItem(this.storageKey, JSON.stringify(this.currentProfile));
            }
        } catch (error) {
            console.error('프로필 저장 실패:', error);
        }
    }

    // 프로필 업데이트
    updateProfile(updates: Partial<UserProfile>): void {
        if (this.currentProfile) {
            this.currentProfile = { ...this.currentProfile, ...updates };
            this.saveProfile();
        }
    }

    // 설정 업데이트
    updateSettings(settings: Partial<UserProfile['settings']>): void {
        if (this.currentProfile) {
            this.currentProfile.settings = { ...this.currentProfile.settings, ...settings };
            this.saveProfile();
        }
    }

    // 선호도 업데이트
    updatePreferences(preferences: Partial<UserProfile['preferences']>): void {
        if (this.currentProfile) {
            this.currentProfile.preferences = { ...this.currentProfile.preferences, ...preferences };
            this.saveProfile();
        }
    }

    // 통계 업데이트
    updateStatistics(statistics: Partial<UserProfile['statistics']>): void {
        if (this.currentProfile) {
            this.currentProfile.statistics = { ...this.currentProfile.statistics, ...statistics };
            this.currentProfile.statistics.lastActive = new Date();
            this.saveProfile();
        }
    }

    // 커스터마이징 업데이트
    updateCustomizations(customizations: Partial<UserProfile['customizations']>): void {
        if (this.currentProfile) {
            this.currentProfile.customizations = { ...this.currentProfile.customizations, ...customizations };
            this.saveProfile();
        }
    }

    // 현재 프로필 가져오기
    getCurrentProfile(): UserProfile | null {
        return this.currentProfile;
    }

    // 사용자 ID 생성
    private generateUserId(): string {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 프로필 내보내기
    exportProfile(): string {
        return JSON.stringify(this.currentProfile, null, 2);
    }

    // 프로필 가져오기
    importProfile(profileData: string): boolean {
        try {
            const profile = JSON.parse(profileData);
            this.currentProfile = profile;
            this.saveProfile();
            return true;
        } catch (error) {
            console.error('프로필 가져오기 실패:', error);
            return false;
        }
    }

    // 프로필 초기화
    resetProfile(): void {
        this.currentProfile = this.createDefaultProfile();
        this.saveProfile();
    }
} 