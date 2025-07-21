// 테스트 설정
import { vi } from 'vitest';

// DOM 환경 설정
Object.defineProperty(window, 'innerWidth', { value: 1024 });
Object.defineProperty(window, 'innerHeight', { value: 768 });

// WebGL 모킹
const mockWebGLRenderingContext = {
  createBuffer: vi.fn(),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  createShader: vi.fn(),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  createProgram: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  useProgram: vi.fn(),
  getAttribLocation: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  drawArrays: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  viewport: vi.fn(),
};

const mockCanvas = {
  getContext: vi.fn(() => mockWebGLRenderingContext),
  width: 1024,
  height: 768,
};

Object.defineProperty(window, 'HTMLCanvasElement', {
  value: class {
    getContext() {
      return mockWebGLRenderingContext;
    }
  },
});

// Three.js 모킹
vi.mock('three', () => ({
  Scene: vi.fn(),
  PerspectiveCamera: vi.fn(),
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    domElement: mockCanvas,
  })),
  Clock: vi.fn(() => ({
    getDelta: vi.fn(() => 0.016),
  })),
  AmbientLight: vi.fn(),
  DirectionalLight: vi.fn(),
  PointLight: vi.fn(),
  Color: vi.fn(),
  PCFSoftShadowMap: 'PCFSoftShadowMap',
  sRGBEncoding: 'sRGBEncoding',
}));

// Transformers.js 모킹
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(() => Promise.resolve({
    classifier: vi.fn(() => Promise.resolve([{ label: 'POSITIVE', score: 0.8 }])),
  })),
}));

// Tauri API 모킹
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
  app: {
    getVersion: vi.fn(() => Promise.resolve('1.0.0')),
  },
})); 