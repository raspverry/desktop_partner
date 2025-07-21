/**
 * 카메라 제어 UI 컴포넌트
 * 카메라 모드 선택, 줌 컨트롤, 자동 회전 토글 기능을 제공합니다.
 */

import { CameraController } from './camera-controller';

export class CameraUI {
  private container: HTMLElement;
  private cameraController: CameraController;
  private uiElement: HTMLElement | null = null;
  private isVisible: boolean = false;

  constructor(container: HTMLElement, cameraController: CameraController) {
    this.container = container;
    this.cameraController = cameraController;
    this.createUI();
  }

  /**
   * UI 생성
   */
  private createUI(): void {
    this.uiElement = document.createElement('div');
    this.uiElement.className = 'camera-controls';
    this.uiElement.innerHTML = `
      <div class="camera-controls-header">
        <i class="fas fa-camera" aria-hidden="true"></i>
        <span>카메라 제어</span>
        <button class="camera-close-btn" aria-label="카메라 컨트롤 닫기">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
      
      <div class="camera-controls-content">
        <!-- 카메라 모드 선택 -->
        <div class="camera-section">
          <h4>카메라 모드</h4>
          <div class="camera-modes">
            <button class="camera-mode-btn active" data-mode="default">
              <i class="fas fa-eye" aria-hidden="true"></i>
              <span>기본</span>
            </button>
            <button class="camera-mode-btn" data-mode="closeup">
              <i class="fas fa-search-plus" aria-hidden="true"></i>
              <span>클로즈업</span>
            </button>
            <button class="camera-mode-btn" data-mode="full">
              <i class="fas fa-expand" aria-hidden="true"></i>
              <span>전체</span>
            </button>
            <button class="camera-mode-btn" data-mode="side">
              <i class="fas fa-arrows-alt-h" aria-hidden="true"></i>
              <span>측면</span>
            </button>
            <button class="camera-mode-btn" data-mode="low">
              <i class="fas fa-arrow-up" aria-hidden="true"></i>
              <span>낮은 각도</span>
            </button>
          </div>
        </div>

        <!-- 줌 컨트롤 -->
        <div class="camera-section">
          <h4>줌 컨트롤</h4>
          <div class="zoom-controls">
            <button class="zoom-btn zoom-out" aria-label="줌 아웃">
              <i class="fas fa-search-minus" aria-hidden="true"></i>
            </button>
            <div class="zoom-slider-container">
              <input type="range" class="zoom-slider" min="1" max="20" value="5" step="0.1">
              <span class="zoom-value">5.0</span>
            </div>
            <button class="zoom-btn zoom-in" aria-label="줌 인">
              <i class="fas fa-search-plus" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <!-- 자동 회전 -->
        <div class="camera-section">
          <h4>자동 회전</h4>
          <div class="auto-rotate-controls">
            <label class="toggle-switch">
              <input type="checkbox" class="auto-rotate-toggle">
              <span class="toggle-slider"></span>
            </label>
            <span class="auto-rotate-label">자동 회전</span>
          </div>
        </div>

        <!-- 카메라 리셋 -->
        <div class="camera-section">
          <button class="camera-reset-btn" aria-label="카메라 리셋">
            <i class="fas fa-undo" aria-hidden="true"></i>
            <span>카메라 리셋</span>
          </button>
        </div>

        <!-- 카메라 정보 -->
        <div class="camera-section">
          <h4>카메라 정보</h4>
          <div class="camera-info">
            <div class="info-item">
              <span class="info-label">모드:</span>
              <span class="info-value" id="current-mode">기본</span>
            </div>
            <div class="info-item">
              <span class="info-label">거리:</span>
              <span class="info-value" id="current-distance">5.0</span>
            </div>
            <div class="info-item">
              <span class="info-label">FOV:</span>
              <span class="info-value" id="current-fov">60°</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.uiElement);
    this.bindEvents();
    this.updateCameraInfo();
  }

  /**
   * 이벤트 바인딩
   */
  private bindEvents(): void {
    if (!this.uiElement) return;

    // 닫기 버튼
    const closeBtn = this.uiElement.querySelector('.camera-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // 카메라 모드 버튼들
    const modeButtons = this.uiElement.querySelectorAll('.camera-mode-btn');
    modeButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const target = event.currentTarget as HTMLElement;
        const mode = target.dataset.mode;
        if (mode) {
          this.setCameraMode(mode);
        }
      });
    });

    // 줌 컨트롤
    const zoomInBtn = this.uiElement.querySelector('.zoom-in');
    const zoomOutBtn = this.uiElement.querySelector('.zoom-out');
    const zoomSlider = this.uiElement.querySelector('.zoom-slider') as HTMLInputElement;

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.cameraController.zoomIn();
        this.updateZoomSlider();
        this.updateCameraInfo();
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.cameraController.zoomOut();
        this.updateZoomSlider();
        this.updateCameraInfo();
      });
    }

    if (zoomSlider) {
      zoomSlider.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        const distance = parseFloat(target.value);
        this.cameraController.setZoom(distance);
        this.updateZoomValue();
        this.updateCameraInfo();
      });
    }

    // 자동 회전 토글
    const autoRotateToggle = this.uiElement.querySelector('.auto-rotate-toggle') as HTMLInputElement;
    if (autoRotateToggle) {
      autoRotateToggle.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        this.cameraController.setAutoRotate(target.checked);
      });
    }

    // 카메라 리셋
    const resetBtn = this.uiElement.querySelector('.camera-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.cameraController.resetCamera();
        this.updateZoomSlider();
        this.updateCameraInfo();
        this.updateModeButtons();
      });
    }
  }

  /**
   * 카메라 모드 설정
   */
  private setCameraMode(modeName: string): void {
    this.cameraController.setCameraMode(modeName);
    this.updateModeButtons();
    this.updateCameraInfo();
  }

  /**
   * 모드 버튼 상태 업데이트
   */
  private updateModeButtons(): void {
    if (!this.uiElement) return;

    const currentMode = this.cameraController.getCurrentMode();
    const modeButtons = this.uiElement.querySelectorAll('.camera-mode-btn');

    modeButtons.forEach(button => {
      const target = button as HTMLElement;
      const mode = target.dataset.mode;
      
      if (mode === currentMode) {
        target.classList.add('active');
      } else {
        target.classList.remove('active');
      }
    });
  }

  /**
   * 줌 슬라이더 업데이트
   */
  private updateZoomSlider(): void {
    if (!this.uiElement) return;

    const zoomSlider = this.uiElement.querySelector('.zoom-slider') as HTMLInputElement;
    const cameraInfo = this.cameraController.getCameraInfo();
    
    if (zoomSlider) {
      zoomSlider.value = cameraInfo.distance.toString();
    }
  }

  /**
   * 줌 값 업데이트
   */
  private updateZoomValue(): void {
    if (!this.uiElement) return;

    const zoomValue = this.uiElement.querySelector('.zoom-value');
    const cameraInfo = this.cameraController.getCameraInfo();
    
    if (zoomValue) {
      zoomValue.textContent = cameraInfo.distance.toFixed(1);
    }
  }

  /**
   * 카메라 정보 업데이트
   */
  private updateCameraInfo(): void {
    if (!this.uiElement) return;

    const cameraInfo = this.cameraController.getCameraInfo();
    const currentMode = this.uiElement.querySelector('#current-mode');
    const currentDistance = this.uiElement.querySelector('#current-distance');
    const currentFov = this.uiElement.querySelector('#current-fov');

    if (currentMode) {
      const modeNames: { [key: string]: string } = {
        'default': '기본',
        'closeup': '클로즈업',
        'full': '전체',
        'side': '측면',
        'low': '낮은 각도'
      };
      currentMode.textContent = modeNames[cameraInfo.mode] || cameraInfo.mode;
    }

    if (currentDistance) {
      currentDistance.textContent = cameraInfo.distance.toFixed(1);
    }

    if (currentFov) {
      currentFov.textContent = `${cameraInfo.fov}°`;
    }
  }

  /**
   * UI 표시
   */
  show(): void {
    if (this.uiElement) {
      this.uiElement.style.display = 'block';
      this.isVisible = true;
      this.updateCameraInfo();
    }
  }

  /**
   * UI 숨기기
   */
  hide(): void {
    if (this.uiElement) {
      this.uiElement.style.display = 'none';
      this.isVisible = false;
    }
  }

  /**
   * UI 토글
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * UI 정리
   */
  dispose(): void {
    if (this.uiElement) {
      this.uiElement.remove();
      this.uiElement = null;
    }
  }
} 