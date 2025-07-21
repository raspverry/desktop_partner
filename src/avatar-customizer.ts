// 아바타 커스터마이징 시스템
export interface AvatarCustomization {
    skinColor: string;
    hairColor: string;
    hairStyle: string;
    eyeColor: string;
    clothing: string;
    accessories: string[];
    height: number;
    weight: number;
}

export interface BlendShapeAdjustment {
    name: string;
    value: number;
    category: 'face' | 'body' | 'hair' | 'clothing';
}

export class AvatarCustomizer {
    private currentCustomization: AvatarCustomization;
    private blendShapeAdjustments: Map<string, BlendShapeAdjustment> = new Map();
    private avatarViewer: any; // AvatarViewer 인스턴스

    constructor(initialCustomization?: Partial<AvatarCustomization>) {
        this.currentCustomization = {
            skinColor: '#FFD700',
            hairColor: '#8B4513',
            hairStyle: 'default',
            eyeColor: '#000000',
            clothing: 'casual',
            accessories: [],
            height: 1.0,
            weight: 1.0,
            ...initialCustomization
        };
    }

    // 아바타 뷰어 설정
    public setAvatarViewer(viewer: any): void {
        this.avatarViewer = viewer;
    }

    // 기본 커스터마이징 설정
    public setCustomization(customization: Partial<AvatarCustomization>): void {
        this.currentCustomization = { ...this.currentCustomization, ...customization };
        this.applyCustomization();
    }

    // 개별 속성 설정
    public setSkinColor(color: string): void {
        this.currentCustomization.skinColor = color;
        this.applySkinColor();
    }

    public setHairColor(color: string): void {
        this.currentCustomization.hairColor = color;
        this.applyHairColor();
    }

    public setHairStyle(style: string): void {
        this.currentCustomization.hairStyle = style;
        this.applyHairStyle();
    }

    public setEyeColor(color: string): void {
        this.currentCustomization.eyeColor = color;
        this.applyEyeColor();
    }

    public setClothing(clothing: string): void {
        this.currentCustomization.clothing = clothing;
        this.applyClothing();
    }

    public addAccessory(accessory: string): void {
        if (!this.currentCustomization.accessories.includes(accessory)) {
            this.currentCustomization.accessories.push(accessory);
            this.applyAccessories();
        }
    }

    public removeAccessory(accessory: string): void {
        const index = this.currentCustomization.accessories.indexOf(accessory);
        if (index > -1) {
            this.currentCustomization.accessories.splice(index, 1);
            this.applyAccessories();
        }
    }

    public setHeight(height: number): void {
        this.currentCustomization.height = Math.max(0.8, Math.min(1.2, height));
        this.applyHeight();
    }

    public setWeight(weight: number): void {
        this.currentCustomization.weight = Math.max(0.8, Math.min(1.2, weight));
        this.applyWeight();
    }

    // BlendShape 조정
    public setBlendShape(name: string, value: number, category: BlendShapeAdjustment['category'] = 'face'): void {
        const adjustment: BlendShapeAdjustment = {
            name,
            value: Math.max(0, Math.min(1, value)),
            category
        };
        
        this.blendShapeAdjustments.set(name, adjustment);
        this.applyBlendShape(name, value);
    }

    public getBlendShape(name: string): number {
        return this.blendShapeAdjustments.get(name)?.value || 0;
    }

    // 전체 커스터마이징 적용
    private applyCustomization(): void {
        this.applySkinColor();
        this.applyHairColor();
        this.applyHairStyle();
        this.applyEyeColor();
        this.applyClothing();
        this.applyAccessories();
        this.applyHeight();
        this.applyWeight();
    }

    // 개별 적용 메서드들
    private applySkinColor(): void {
        if (!this.avatarViewer) return;
        
        // VRM 머티리얼에 스킨 컬러 적용
        this.avatarViewer.vrm?.traverse((child: any) => {
            if (child.isMesh && child.material) {
                if (child.material.name?.includes('skin') || child.material.name?.includes('body')) {
                    child.material.color.setHex(parseInt(this.currentCustomization.skinColor.replace('#', '0x')));
                }
            }
        });
    }

    private applyHairColor(): void {
        if (!this.avatarViewer) return;
        
        this.avatarViewer.vrm?.traverse((child: any) => {
            if (child.isMesh && child.material) {
                if (child.material.name?.includes('hair')) {
                    child.material.color.setHex(parseInt(this.currentCustomization.hairColor.replace('#', '0x')));
                }
            }
        });
    }

    private applyHairStyle(): void {
        if (!this.avatarViewer) return;
        
        // 헤어 스타일에 따른 BlendShape 조정
        const hairStyles: { [key: string]: { [key: string]: number } } = {
            'short': { 'Hair_Short': 1.0, 'Hair_Long': 0.0 },
            'long': { 'Hair_Short': 0.0, 'Hair_Long': 1.0 },
            'ponytail': { 'Hair_Ponytail': 1.0, 'Hair_Long': 0.5 },
            'default': { 'Hair_Default': 1.0 }
        };

        const style = hairStyles[this.currentCustomization.hairStyle];
        if (style) {
            Object.entries(style).forEach(([blendShape, value]) => {
                this.setBlendShape(blendShape, value, 'hair');
            });
        }
    }

    private applyEyeColor(): void {
        if (!this.avatarViewer) return;
        
        this.avatarViewer.vrm?.traverse((child: any) => {
            if (child.isMesh && child.material) {
                if (child.material.name?.includes('eye')) {
                    child.material.color.setHex(parseInt(this.currentCustomization.eyeColor.replace('#', '0x')));
                }
            }
        });
    }

    private applyClothing(): void {
        if (!this.avatarViewer) return;
        
        // 의상 스타일에 따른 메시 표시/숨김
        const clothingMeshes = ['casual', 'formal', 'sport'];
        clothingMeshes.forEach(style => {
            this.avatarViewer.vrm?.traverse((child: any) => {
                if (child.isMesh && child.name?.includes(`clothing_${style}`)) {
                    child.visible = (style === this.currentCustomization.clothing);
                }
            });
        });
    }

    private applyAccessories(): void {
        if (!this.avatarViewer) return;
        
        // 모든 액세서리 숨기기
        this.avatarViewer.vrm?.traverse((child: any) => {
            if (child.isMesh && child.name?.includes('accessory_')) {
                child.visible = false;
            }
        });

        // 선택된 액세서리만 표시
        this.currentCustomization.accessories.forEach(accessory => {
            this.avatarViewer.vrm?.traverse((child: any) => {
                if (child.isMesh && child.name?.includes(`accessory_${accessory}`)) {
                    child.visible = true;
                }
            });
        });
    }

    private applyHeight(): void {
        if (!this.avatarViewer) return;
        
        // 전체 스케일 조정
        this.avatarViewer.vrm.scale.setScalar(this.currentCustomization.height);
    }

    private applyWeight(): void {
        if (!this.avatarViewer) return;
        
        // 몸체 BlendShape 조정
        const weightBlendShapes = ['Body_Thin', 'Body_Normal', 'Body_Thick'];
        const weight = this.currentCustomization.weight;
        
        if (weight < 0.9) {
            this.setBlendShape('Body_Thin', 1.0 - weight, 'body');
            this.setBlendShape('Body_Normal', weight, 'body');
        } else if (weight > 1.1) {
            this.setBlendShape('Body_Normal', 2.0 - weight, 'body');
            this.setBlendShape('Body_Thick', weight - 1.0, 'body');
        } else {
            this.setBlendShape('Body_Normal', 1.0, 'body');
        }
    }

    private applyBlendShape(name: string, value: number): void {
        if (!this.avatarViewer) return;
        
        // AvatarViewer의 setBlendShape 메서드 호출
        if (this.avatarViewer.setBlendShape) {
            this.avatarViewer.setBlendShape(name, value);
        }
    }

    // 프리셋 적용
    public applyPreset(presetName: string): void {
        const presets: { [key: string]: Partial<AvatarCustomization> } = {
            'casual': {
                clothing: 'casual',
                accessories: ['watch'],
                hairStyle: 'default'
            },
            'formal': {
                clothing: 'formal',
                accessories: ['glasses'],
                hairStyle: 'short'
            },
            'sport': {
                clothing: 'sport',
                accessories: ['cap'],
                hairStyle: 'ponytail'
            },
            'cute': {
                hairColor: '#FF69B4',
                eyeColor: '#4169E1',
                accessories: ['ribbon'],
                hairStyle: 'long'
            }
        };

        const preset = presets[presetName];
        if (preset) {
            this.setCustomization(preset);
        }
    }

    // 커스터마이징 저장
    public saveCustomization(): string {
        return JSON.stringify({
            customization: this.currentCustomization,
            blendShapes: Array.from(this.blendShapeAdjustments.entries())
        });
    }

    // 커스터마이징 로드
    public loadCustomization(savedData: string): void {
        try {
            const data = JSON.parse(savedData);
            this.currentCustomization = data.customization;
            
            this.blendShapeAdjustments.clear();
            data.blendShapes.forEach(([name, adjustment]: [string, BlendShapeAdjustment]) => {
                this.blendShapeAdjustments.set(name, adjustment);
            });
            
            this.applyCustomization();
        } catch (error) {
            console.error('커스터마이징 로드 실패:', error);
        }
    }

    // 현재 커스터마이징 조회
    public getCurrentCustomization(): AvatarCustomization {
        return { ...this.currentCustomization };
    }

    // BlendShape 조정 조회
    public getBlendShapeAdjustments(): BlendShapeAdjustment[] {
        return Array.from(this.blendShapeAdjustments.values());
    }

    // 리셋
    public reset(): void {
        this.currentCustomization = {
            skinColor: '#FFD700',
            hairColor: '#8B4513',
            hairStyle: 'default',
            eyeColor: '#000000',
            clothing: 'casual',
            accessories: [],
            height: 1.0,
            weight: 1.0
        };
        this.blendShapeAdjustments.clear();
        this.applyCustomization();
    }
}

// 전역 아바타 커스터마이저 인스턴스
export const avatarCustomizer = new AvatarCustomizer(); 