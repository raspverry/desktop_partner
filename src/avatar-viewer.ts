import * as THREE from 'three';
import { LipsyncManager } from './lipsync-manager.js';

export class AvatarViewer {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private vrm: any;
    private mixer: THREE.AnimationMixer | null = null;
    private clock: THREE.Clock;
    private animations: Map<string, THREE.AnimationClip> = new Map();
    private currentAnimation: THREE.AnimationAction | null = null;
    private isAnimating: boolean = false;
    private lipsyncManager: LipsyncManager;
    private currentLipsync: string | null = null;
    private lipsyncIntensity: number = 0;

    constructor(container: HTMLElement) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        this.lipsyncManager = new LipsyncManager();

        this.setupRenderer(container);
        this.setupLighting();
        this.setupCamera();
        this.animate();
    }

    private setupRenderer(container: HTMLElement) {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);
    }

    private setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 5);
        this.scene.add(directionalLight);
    }

    private setupCamera() {
        this.camera.position.set(0, 1.5, 2.5);
        this.camera.lookAt(0, 1, 0);
    }

    public async loadVRM(url: string): Promise<void> {
        try {
            const loader = new THREE.GLTFLoader();
            const gltf = await loader.loadAsync(url);
            
            // GLTF 씬을 직접 사용 (VRM API 호환성 문제로 인해)
            this.vrm = gltf.scene;
            console.log('VRM 생성 완료:', this.vrm);
            
            if (this.vrm) {
                console.log('VRM 씬을 메인 씬에 추가 중...');
                this.scene.add(this.vrm);
                
                // 애니메이션 믹서 설정
                if (gltf.animations && gltf.animations.length > 0) {
                    console.log('애니메이션 믹서 설정 중...');
                    this.mixer = new THREE.AnimationMixer(this.vrm);
                    const action = this.mixer.clipAction(gltf.animations[0]);
                    action.play();
                }

                // 아바타 위치 조정
                this.vrm.position.set(0, 0, 0);
                
                // 모델을 정면으로 회전 (Y축 180도 회전)
                this.vrm.rotation.y = Math.PI;
                
                // T포즈 대신 자연스러운 포즈로 조정
                this.vrm.traverse((child: any) => {
                    if (child.isBone) {
                        // 팔을 자연스럽게 내리기
                        if (child.name && child.name.includes('Arm')) {
                            child.rotation.x = 0.2; // 팔을 살짝 앞으로
                        }
                        // 머리를 정면으로
                        if (child.name && child.name.includes('Head')) {
                            child.rotation.y = 0;
                        }
                    }
                });
                
                console.log('VRM 로드 완료:', this.vrm);
            } else {
                throw new Error('VRM 씬이 생성되지 않았습니다.');
            }
        } catch (error) {
            console.error('VRM 로드 실패:', error);
            throw error;
        }
    }

    public setEmotion(emotion: string, intensity: number = 1.0) {
        if (!this.vrm) return;

        // VRM 1.0 API 사용
        const blendShapeProxy = (this.vrm as any).blendShapeProxy;
        if (!blendShapeProxy) return;

        // 감정에 따른 BlendShape 매핑
        const emotionMap: { [key: string]: string } = {
            'happy': 'Joy',
            'sad': 'Sorrow',
            'angry': 'Angry',
            'surprised': 'Surprised',
            'neutral': 'Neutral'
        };

        const blendShapeName = emotionMap[emotion];
        if (blendShapeName && blendShapeProxy.getValue(blendShapeName) !== undefined) {
            blendShapeProxy.setValue(blendShapeName, intensity);
        }
    }

    public setBlendShape(name: string, value: number) {
        if (!this.vrm) return;

        // VRM 1.0 API 사용
        const blendShapeProxy = (this.vrm as any).blendShapeProxy;
        if (!blendShapeProxy) return;

        blendShapeProxy.setValue(name, value);
    }

    // 감정별 애니메이션 재생
    public playEmotionAnimation(emotion: string, duration: number = 2000) {
        if (!this.mixer || this.isAnimating) return;

        const animationMap: { [key: string]: string } = {
            'happy': 'happy',
            'sad': 'sad',
            'surprised': 'wave',
            'neutral': 'thinking'
        };

        const animationName = animationMap[emotion];
        if (!animationName || !this.animations.has(animationName)) {
            console.log('애니메이션을 찾을 수 없습니다:', emotion);
            return;
        }

        this.playAnimation(animationName, duration);
    }

    // 애니메이션 재생 개선
    public playAnimation(animationName: string, duration: number = 2000) {
        if (!this.mixer) return;

        const clip = this.animations.get(animationName);
        if (!clip) {
            console.log('애니메이션을 찾을 수 없습니다:', animationName);
            return;
        }

        // 현재 애니메이션 중지
        if (this.currentAnimation) {
            this.currentAnimation.stop();
        }

        // 새 애니메이션 시작
        this.currentAnimation = this.mixer.clipAction(clip);
        this.currentAnimation.setLoop(THREE.LoopOnce, 1);
        this.currentAnimation.clampWhenFinished = true;
        this.currentAnimation.play();

        this.isAnimating = true;

        // 애니메이션 완료 후 상태 초기화
        setTimeout(() => {
            this.isAnimating = false;
            if (this.currentAnimation) {
                this.currentAnimation.stop();
            }
        }, duration);
    }

    private animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        // 애니메이션 믹서 업데이트
        if (this.mixer) {
            this.mixer.update(delta);
        }

        // VRM 업데이트
        if (this.vrm && typeof this.vrm.update === 'function') {
            this.vrm.update(delta);
        }

        this.renderer.render(this.scene, this.camera);
    }

    public resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public dispose() {
        this.renderer.dispose();
        this.scene.clear();
    }

    // 카메라 컨트롤 추가
    public setupCameraControl() {
        let isMouseDown = false;
        let mouseX = 0;
        let mouseY = 0;

        const handleMouseDown = (event: MouseEvent) => {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (!isMouseDown) return;

            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;

            // 카메라 회전
            this.camera.position.x = Math.cos(deltaX * 0.01) * 2.5;
            this.camera.position.z = Math.sin(deltaX * 0.01) * 2.5;
            this.camera.lookAt(0, 1, 0);

            mouseX = event.clientX;
            mouseY = event.clientY;
        };

        const handleMouseUp = () => {
            isMouseDown = false;
        };

        // 이벤트 리스너 추가
        this.renderer.domElement.addEventListener('mousedown', handleMouseDown);
        this.renderer.domElement.addEventListener('mousemove', handleMouseMove);
        this.renderer.domElement.addEventListener('mouseup', handleMouseUp);
    }

    // 립싱크 시스템 통합
    public async playLipsync(text: string, onComplete?: () => void): Promise<void> {
        try {
            const result = await this.lipsyncManager.processSpeechRecognition(text);
            
            if (result.visemes && result.visemes.length > 0) {
                this.currentLipsync = text;
                this.lipsyncIntensity = 1.0;
                
                // 립싱크 애니메이션 재생
                for (const viseme of result.visemes) {
                    this.setLipsyncViseme(viseme.phoneme, viseme.intensity);
                    await new Promise(resolve => setTimeout(resolve, (viseme.endTime - viseme.startTime) * 1000));
                }
                
                if (onComplete) {
                    onComplete();
                }
            }
        } catch (error) {
            console.error('립싱크 재생 실패:', error);
        }
    }

    private setLipsyncViseme(viseme: string, intensity: number): void {
        if (!this.vrm) return;

        // 립싱크 리셋
        this.resetLipsync();
        
        // 새로운 립싱크 설정
        this.setBlendShape(viseme, intensity);
        this.lipsyncIntensity = intensity;
    }

    private resetLipsync(): void {
        if (!this.vrm) return;

        // 모든 립싱크 BlendShape 초기화
        const lipsyncBlendShapes = [
            'A', 'I', 'U', 'E', 'O', 'B', 'P', 'M', 'F', 'V'
        ];

        lipsyncBlendShapes.forEach(blendShape => {
            this.setBlendShape(blendShape, 0);
        });

        this.lipsyncIntensity = 0;
    }

    public async startRealtimeLipsync(audioStream: MediaStream): Promise<void> {
        try {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(audioStream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = async (event) => {
                const inputBuffer = event.inputBuffer;
                const inputData = inputBuffer.getChannelData(0);
                
                // 실시간 음성 분석 및 립싱크
                const volume = this.calculateVolume(inputData);
                if (volume > 0.1) {
                    // 립싱크 업데이트
                    this.updateRealtimeLipsync(volume);
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
        } catch (error) {
            console.error('실시간 립싱크 시작 실패:', error);
        }
    }

    public async processSpeechRecognition(transcript: string): Promise<void> {
        // 음성 인식 결과에 대한 립싱크 처리
        await this.playLipsync(transcript);
    }

    private calculateVolume(audioData: Float32Array): number {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        return Math.sqrt(sum / audioData.length);
    }

    private updateRealtimeLipsync(volume: number): void {
        // 볼륨에 따른 립싱크 강도 조정
        const intensity = Math.min(volume * 2, 1.0);
        this.setBlendShape('A', intensity);
    }
} 