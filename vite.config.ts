import { defineConfig } from 'vite';

export default defineConfig({
  // 성능 최적화 설정
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          transformers: ['@xenova/transformers'],
          tauri: ['@tauri-apps/api']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // 개발 서버 최적화
  server: {
    hmr: {
      overlay: false
    }
  },
  
  // CSS 최적화
  css: {
    devSourcemap: false
  },
  
  // 의존성 최적화
  optimizeDeps: {
    include: ['three', '@xenova/transformers']
  }
});

