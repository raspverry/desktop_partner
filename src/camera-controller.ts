/**
 * 카메라 제어 시스템
 * 3D 아바타의 시점을 조작하고 자동 카메라 모드를 관리합니다.
 */

import * as THREE from 'three';

export interface CameraSettings {
  fov: number;
  near: number;
  far: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
}

export interface CameraMode {
  name: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  transitionTime: number;
}

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3;
  private currentMode: string = 'default';
  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private distance: number = 5;
  private phi: number = Math.PI / 2; // 수직 각도
  private theta: number = 0; // 수평 각도
  private minDistance: number = 1;
  private maxDistance: number = 20;
  private minPolarAngle: number = 0;
  private maxPolarAngle: number = Math.PI;
  private autoRotate: boolean = false;
  private autoRotateSpeed: number = 0.5;
  private transitionAnimation: number | null = null;

  // 카메라 모드 정의
  private cameraModes: Map<string, CameraMode> = new Map();

  constructor(camera: THREE.PerspectiveCamera, target: THREE.Vector3 = new THREE.Vector3(0, 1, 0)) {
    this.camera = camera;
    this.target = target;
    this.initializeCameraModes();
    this.updateCameraPosition();
  }

  /**
   * 카메라 모드 초기화
   */
  private initializeCameraModes(): void {
    // 기본 모드
    this.cameraModes.set('default', {
      name: '기본',
      position: new THREE.Vector3(0, 1.5, 5),
      target: new THREE.Vector3(0, 1, 0),
      fov: 60,
      transitionTime: 1.0
    });

    // 클로즈업 모드
    this.cameraModes.set('closeup', {
      name: '클로즈업',
      position: new THREE.Vector3(0, 1.2, 2),
      target: new THREE.Vector3(0, 1.2, 0),
      fov: 45,
      transitionTime: 0.8
    });

    // 전체 모드
    this.cameraModes.set('full', {
      name: '전체',
      position: new THREE.Vector3(0, 2, 8),
      target: new THREE.Vector3(0, 1, 0),
      fov: 75,
      transitionTime: 1.2
    });

    // 측면 모드
    this.cameraModes.set('side', {
      name: '측면',
      position: new THREE.Vector3(4, 1.5, 0),
      target: new THREE.Vector3(0, 1, 0),
      fov: 60,
      transitionTime: 1.0
    });

    // 낮은 각도 모드
    this.cameraModes.set('low', {
      name: '낮은 각도',
      position: new THREE.Vector3(0, 0.5, 3),
      target: new THREE.Vector3(0, 1.5, 0),
      fov: 50,
      transitionTime: 0.9
    });
  }

  /**
   * 마우스 이벤트 설정
   */
  setupMouseControls(container: HTMLElement): void {
    // 마우스 다운
    container.addEventListener('mousedown', (event) => {
      this.isDragging = true;
      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
      container.style.cursor = 'grabbing';
    });

    // 마우스 이동
    container.addEventListener('mousemove', (event) => {
      if (!this.isDragging) return;

      const deltaX = event.clientX - this.previousMousePosition.x;
      const deltaY = event.clientY - this.previousMousePosition.y;

      this.theta -= deltaX * 0.01;
      this.phi += deltaY * 0.01;

      // 수직 각도 제한
      this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi));

      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };

      this.updateCameraPosition();
    });

    // 마우스 업
    container.addEventListener('mouseup', () => {
      this.isDragging = false;
      container.style.cursor = 'grab';
    });

    // 마우스 휠 (줌)
    container.addEventListener('wheel', (event) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      this.distance += event.deltaY * zoomSpeed;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
      this.updateCameraPosition();
    });

    // 마우스 리브
    container.addEventListener('mouseleave', () => {
      this.isDragging = false;
      container.style.cursor = 'grab';
    });
  }

  /**
   * 터치 이벤트 설정
   */
  setupTouchControls(container: HTMLElement): void {
    let touchStartDistance: number = 0;
    let touchStartTheta: number = 0;
    let touchStartPhi: number = 0;

    // 터치 시작
    container.addEventListener('touchstart', (event) => {
      event.preventDefault();
      
      if (event.touches.length === 1) {
        // 단일 터치 - 회전
        const touch = event.touches[0];
        this.previousMousePosition = {
          x: touch.clientX,
          y: touch.clientY
        };
        touchStartTheta = this.theta;
        touchStartPhi = this.phi;
      } else if (event.touches.length === 2) {
        // 이중 터치 - 줌
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        touchStartDistance = Math.sqrt(
          Math.pow(touch1.clientX - touch2.clientX, 2) +
          Math.pow(touch1.clientY - touch2.clientY, 2)
        );
      }
    });

    // 터치 이동
    container.addEventListener('touchmove', (event) => {
      event.preventDefault();
      
      if (event.touches.length === 1) {
        // 단일 터치 - 회전
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.previousMousePosition.x;
        const deltaY = touch.clientY - this.previousMousePosition.y;

        this.theta = touchStartTheta - deltaX * 0.01;
        this.phi = touchStartPhi + deltaY * 0.01;
        this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi));

        this.updateCameraPosition();
      } else if (event.touches.length === 2) {
        // 이중 터치 - 줌
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch1.clientX - touch2.clientX, 2) +
          Math.pow(touch1.clientY - touch2.clientY, 2)
        );

        const zoomFactor = touchStartDistance / currentDistance;
        this.distance *= zoomFactor;
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
        
        touchStartDistance = currentDistance;
        this.updateCameraPosition();
      }
    });

    // 터치 종료
    container.addEventListener('touchend', (event) => {
      event.preventDefault();
    });
  }

  /**
   * 카메라 위치 업데이트
   */
  private updateCameraPosition(): void {
    const x = this.distance * Math.sin(this.phi) * Math.cos(this.theta);
    const y = this.distance * Math.cos(this.phi);
    const z = this.distance * Math.sin(this.phi) * Math.sin(this.theta);

    this.camera.position.set(
      this.target.x + x,
      this.target.y + y,
      this.target.z + z
    );

    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
  }

  /**
   * 카메라 모드 변경
   */
  setCameraMode(modeName: string, animate: boolean = true): void {
    const mode = this.cameraModes.get(modeName);
    if (!mode) {
      console.warn(`카메라 모드 '${modeName}'을 찾을 수 없습니다.`);
      return;
    }

    this.currentMode = modeName;

    if (animate) {
      this.animateToMode(mode);
    } else {
      this.camera.position.copy(mode.position);
      this.camera.lookAt(mode.target);
      this.target.copy(mode.target);
      this.camera.fov = mode.fov;
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld();
    }

    console.log(`카메라 모드 변경: ${mode.name}`);
  }

  /**
   * 카메라 모드로 애니메이션
   */
  private animateToMode(mode: CameraMode): void {
    if (this.transitionAnimation) {
      cancelAnimationFrame(this.transitionAnimation);
    }

    const startPosition = this.camera.position.clone();
    const startTarget = this.target.clone();
    const startFov = this.camera.fov;
    const duration = mode.transitionTime * 1000; // 밀리초
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 이징 함수 (부드러운 전환)
      const easeProgress = this.easeInOutCubic(progress);

      // 위치 보간
      this.camera.position.lerpVectors(startPosition, mode.position, easeProgress);
      
      // 타겟 보간
      this.target.lerpVectors(startTarget, mode.target, easeProgress);
      
      // FOV 보간
      this.camera.fov = startFov + (mode.fov - startFov) * easeProgress;
      
      this.camera.lookAt(this.target);
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld();

      if (progress < 1) {
        this.transitionAnimation = requestAnimationFrame(animate);
      } else {
        this.transitionAnimation = null;
      }
    };

    this.transitionAnimation = requestAnimationFrame(animate);
  }

  /**
   * 이징 함수 (부드러운 전환)
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * 자동 회전 설정
   */
  setAutoRotate(enabled: boolean, speed: number = 0.5): void {
    this.autoRotate = enabled;
    this.autoRotateSpeed = speed;
  }

  /**
   * 자동 회전 업데이트
   */
  updateAutoRotate(deltaTime: number): void {
    if (!this.autoRotate) return;

    this.theta += this.autoRotateSpeed * deltaTime;
    this.updateCameraPosition();
  }

  /**
   * 줌 설정
   */
  setZoom(distance: number): void {
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, distance));
    this.updateCameraPosition();
  }

  /**
   * 줌 인/아웃
   */
  zoomIn(factor: number = 1.2): void {
    this.distance = Math.max(this.minDistance, this.distance / factor);
    this.updateCameraPosition();
  }

  zoomOut(factor: number = 1.2): void {
    this.distance = Math.min(this.maxDistance, this.distance * factor);
    this.updateCameraPosition();
  }

  /**
   * 카메라 리셋
   */
  resetCamera(): void {
    this.theta = 0;
    this.phi = Math.PI / 2;
    this.distance = 5;
    this.updateCameraPosition();
  }

  /**
   * 카메라 설정 가져오기
   */
  getCameraSettings(): CameraSettings {
    return {
      fov: this.camera.fov,
      near: this.camera.near,
      far: this.camera.far,
      position: this.camera.position.clone(),
      target: this.target.clone(),
      minDistance: this.minDistance,
      maxDistance: this.maxDistance,
      minPolarAngle: this.minPolarAngle,
      maxPolarAngle: this.maxPolarAngle
    };
  }

  /**
   * 카메라 설정 적용
   */
  applyCameraSettings(settings: Partial<CameraSettings>): void {
    if (settings.fov !== undefined) this.camera.fov = settings.fov;
    if (settings.near !== undefined) this.camera.near = settings.near;
    if (settings.far !== undefined) this.camera.far = settings.far;
    if (settings.position !== undefined) this.camera.position.copy(settings.position);
    if (settings.target !== undefined) this.target.copy(settings.target);
    if (settings.minDistance !== undefined) this.minDistance = settings.minDistance;
    if (settings.maxDistance !== undefined) this.maxDistance = settings.maxDistance;
    if (settings.minPolarAngle !== undefined) this.minPolarAngle = settings.minPolarAngle;
    if (settings.maxPolarAngle !== undefined) this.maxPolarAngle = settings.maxPolarAngle;

    this.camera.updateProjectionMatrix();
    this.updateCameraPosition();
  }

  /**
   * 사용 가능한 카메라 모드 목록
   */
  getAvailableModes(): string[] {
    return Array.from(this.cameraModes.keys());
  }

  /**
   * 현재 카메라 모드
   */
  getCurrentMode(): string {
    return this.currentMode;
  }

  /**
   * 카메라 상태 정보
   */
  getCameraInfo(): any {
    return {
      mode: this.currentMode,
      position: this.camera.position.toArray(),
      target: this.target.toArray(),
      distance: this.distance,
      fov: this.camera.fov,
      autoRotate: this.autoRotate
    };
  }

  /**
   * 카메라 정리
   */
  dispose(): void {
    if (this.transitionAnimation) {
      cancelAnimationFrame(this.transitionAnimation);
      this.transitionAnimation = null;
    }
  }
} 