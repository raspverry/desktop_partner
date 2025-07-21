# AI Partner Desktop API 문서

## 개요

AI Partner Desktop은 3D 아바타와 AI 대화 시스템을 결합한 데스크탑 애플리케이션입니다.

## 핵심 컴포넌트

### 1. AvatarViewer

3D 아바타 렌더링 및 애니메이션을 담당하는 클래스입니다.

#### 메서드

```typescript
// 아바타 로딩
async loadVRM(url: string): Promise<void>

// 감정 설정
setEmotion(emotion: string, intensity?: number): void

// BlendShape 설정
setBlendShape(name: string, value: number): void

// 애니메이션 재생
playAnimation(animationName: string): void

// 렌더링 품질 설정
setRenderQuality(quality: 'high' | 'medium' | 'low'): void
```

#### 사용 예시

```typescript
const avatarViewer = new AvatarViewer(container);
await avatarViewer.loadVRM('/avatar/model.vrm');
avatarViewer.setEmotion('happy', 0.8);
```

### 2. AIConversationSystem

AI 대화 처리를 담당하는 클래스입니다.

#### 메서드

```typescript
// 사용자 입력 처리
async processUserInput(input: string): Promise<string>

// 스트리밍 응답 시작
async startStreamingResponse(input: string): Promise<ReadableStream>

// 스트리밍 중지
stopStreaming(): void
```

#### 사용 예시

```typescript
const aiConversation = new AIConversationSystem();
const response = await aiConversation.processUserInput('안녕하세요');
```

### 3. MemoryManager

메모리 관리를 담당하는 클래스입니다.

#### 메서드

```typescript
// 메모리 저장
async storeMemory(content: string, metadata?: any): Promise<boolean>

// 메모리 검색
async searchMemory(query: string, limit?: number): Promise<MemoryItem[]>

// 대화 저장
async storeConversation(userMessage: string, aiResponse: string, emotion: string): Promise<boolean>
```

### 4. AgentManager

도구 호출 및 워크플로우를 담당하는 클래스입니다.

#### 메서드

```typescript
// 도구 실행
async executeTool(toolName: string, parameters: any): Promise<AgentResponse>

// 워크플로우 실행
async executeWorkflow(workflowName: string, inputData: any): Promise<AgentResponse>
```

## 이벤트 시스템

### 사용자 정의 이벤트

```typescript
// 감정 분석 완료 이벤트
window.addEventListener('sentimentAnalysisComplete', (event) => {
    console.log('감정 분석 결과:', event.detail);
});

// 아바타 로딩 완료 이벤트
window.addEventListener('avatarLoaded', (event) => {
    console.log('아바타 로딩 완료');
});

// AI 응답 완료 이벤트
window.addEventListener('aiResponseComplete', (event) => {
    console.log('AI 응답 완료:', event.detail);
});
```

## 설정 시스템

### 환경 변수

```bash
# OpenAI API 키
OPENAI_API_KEY=your-api-key

# Qdrant 데이터베이스 설정
QDRANT_HOST=localhost
QDRANT_PORT=6333

# 메모리 서비스 설정
MEMORY_SERVICE_URL=http://localhost:8001

# 에이전트 서비스 설정
AGENT_SERVICE_URL=http://localhost:8002
```

### 사용자 설정

```typescript
// 설정 업데이트
userProfile.updateSettings({
    voiceEnabled: true,
    lipsyncEnabled: true,
    animationSpeed: 1.0
});

// 선호도 업데이트
userProfile.updatePreferences({
    conversationStyle: 'friendly',
    language: 'ko',
    theme: 'dark'
});
```

## 성능 최적화

### 렌더링 최적화

```typescript
// 렌더링 품질 자동 조정
avatarViewer.setRenderQuality('adaptive');

// 프레임 스킵 설정
avatarViewer.setFrameSkip(2);

// 메모리 정리
avatarViewer.dispose();
```

### 메모리 최적화

```typescript
// 캐시 정리
memoryCache.clear();

// 불필요한 리소스 제거
performanceOptimizer.cleanupMemory();
```

## 에러 처리

### 에러 타입

```typescript
interface ErrorInfo {
    type: string;
    message: string;
    stack?: string;
    timestamp: number;
    userAction?: string;
    recoverable: boolean;
}
```

### 에러 복구

```typescript
// 자동 복구 시도
errorHandler.attemptRecovery(error);

// 수동 복구
errorHandler.manualRecovery(error);
```

## 테스트

### 단위 테스트

```bash
# 단위 테스트 실행
npm run test:unit

# 특정 테스트 실행
npm run test:unit -- --grep "감정 분석"
```

### 통합 테스트

```bash
# 통합 테스트 실행
npm run test:integration

# 사용자 시나리오 테스트
npm run test:user
```

## 배포

### 빌드

```bash
# 개발 빌드
npm run build

# 프로덕션 빌드
npm run build:all
```

### 배포

```bash
# Windows 배포
npm run deploy:windows

# macOS 배포
npm run deploy:macos

# Linux 배포
npm run deploy:linux
```
```

```markdown:desktop_partner/docs/DEPLOYMENT.md
# 배포 가이드

## 시스템 요구사항

### 최소 요구사항

- **OS**: Windows 10, macOS 10.15+, Ubuntu 18.04+
- **CPU**: Intel i3 또는 AMD Ryzen 3 (2.0GHz 이상)
- **RAM**: 4GB 이상
- **GPU**: OpenGL 3.3 지원 그래픽 카드
- **저장공간**: 2GB 이상

### 권장 요구사항

- **OS**: Windows 11, macOS 12+, Ubuntu 20.04+
- **CPU**: Intel i5 또는 AMD Ryzen 5 (3.0GHz 이상)
- **RAM**: 8GB 이상
- **GPU**: OpenGL 4.0 지원 그래픽 카드
- **저장공간**: 5GB 이상

## 개발 환경 설정

### 1. 필수 도구 설치

```bash
# Node.js (v18 이상)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Rust (Tauri 요구사항)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Python (서비스 요구사항)
python --version  # 3.8 이상
```

### 2. 프로젝트 설정

```bash
# 저장소 클론
git clone https://github.com/your-repo/ai-partner-desktop.git
cd ai-partner-desktop

# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env
# .env 파일 편집
```

### 3. 서비스 시작

```bash
# Docker Compose로 서비스 시작
docker-compose up -d

# 또는 개별 서비스 시작
cd services/memory && python main.py &
cd services/agent && python main.py &
cd services/lipsync && python main.py &
```

## 빌드 프로세스

### 1. 개발 빌드

```bash
# 프론트엔드 빌드
npm run build

# Tauri 개발 빌드
npm run tauri dev
```

### 2. 프로덕션 빌드

```bash
# 전체 빌드 (테스트 포함)
npm run build:all

# 플랫폼별 빌드
npm run deploy:windows
npm run deploy:macos
npm run deploy:linux
```

### 3. 배포 패키지 생성

```bash
# Windows 인스톨러
npm run tauri build -- --target x86_64-pc-windows-msvc

# macOS 앱 번들
npm run tauri build -- --target x86_64-apple-darwin

# Linux 앱 이미지
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

## 배포 환경 설정

### 1. 서버 환경

```bash
# 시스템 패키지 업데이트
sudo apt update && sudo apt upgrade

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 환경 변수 설정

```bash
# 프로덕션 환경 변수
export NODE_ENV=production
export OPENAI_API_KEY=your-production-api-key
export QDRANT_HOST=your-qdrant-host
export QDRANT_PORT=6333
export MEMORY_SERVICE_URL=http://your-memory-service
export AGENT_SERVICE_URL=http://your-agent-service
```

### 3. 서비스 배포

```bash
# Docker Compose 배포
docker-compose -f docker-compose.prod.yml up -d

# 개별 서비스 배포
docker build -t ai-partner-memory services/memory/
docker build -t ai-partner-agent services/agent/
docker build -t ai-partner-lipsync services/lipsync/

docker run -d --name memory-service ai-partner-memory
docker run -d --name agent-service ai-partner-agent
docker run -d --name lipsync-service ai-partner-lipsync
```

## 모니터링 및 로그

### 1. 로그 확인

```bash
# Docker 로그
docker-compose logs -f

# 개별 서비스 로그
docker logs memory-service
docker logs agent-service
docker logs lipsync-service
```

### 2. 성능 모니터링

```bash
# 시스템 리소스 확인
htop
free -h
df -h

# 네트워크 연결 확인
netstat -tulpn
```

### 3. 헬스 체크

```bash
# 서비스 상태 확인
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
```

## 업데이트 프로세스

### 1. 코드 업데이트

```bash
# 최신 코드 가져오기
git pull origin main

# 의존성 업데이트
npm install

# 빌드
npm run build:all
```

### 2. 서비스 업데이트

```bash
# Docker 이미지 재빌드
docker-compose build

# 서비스 재시작
docker-compose up -d
```

### 3. 롤백

```bash
# 이전 버전으로 롤백
git checkout v1.0.0
npm run build:all
docker-compose up -d
```

## 보안 고려사항

### 1. API 키 관리

```bash
# 환경 변수로 API 키 관리
export OPENAI_API_KEY=your-secure-api-key

# .env 파일 보안
chmod 600 .env
```

### 2. 네트워크 보안

```bash
# 방화벽 설정
sudo ufw allow 8001
sudo ufw allow 8002
sudo ufw allow 8003
```

### 3. 데이터 백업

```bash
# Qdrant 데이터 백업
docker exec qdrant qdrant backup /backup

# 사용자 데이터 백업
tar -czf user-data-backup.tar.gz data/
```

## 문제 해결

### 1. 일반적인 문제

```bash
# 포트 충돌 해결
sudo lsof -i :8001
sudo kill -9 <PID>

# 메모리 부족 해결
sudo swapoff -a
sudo swapon -a
```

### 2. 로그 분석

```bash
# 에러 로그 필터링
docker-compose logs | grep ERROR

# 성능 로그 분석
docker-compose logs | grep "performance"
```

### 3. 디버깅

```bash
# 개발 모드로 실행
NODE_ENV=development npm run tauri dev

# 디버그 로그 활성화
DEBUG=* npm run dev
```
```

마지막으로 최종 README를 업데이트하겠습니다:

```markdown:desktop_partner/README.md
# AI Partner Desktop

🤖 **3D 아바타와 AI 대화 시스템을 결합한 데스크탑 애플리케이션**

## ✨ 주요 기능

### �� 3D 아바타 시스템
- **VRM 아바타 지원**: AliciaSolid_vrm-0.51.vrm 포함
- **실시간 애니메이션**: 감정별 표정 변화 및 제스처
- **립싱크 시스템**: 음성 인식과 동기화된 입 모양
- **카메라 제어**: 마우스/터치로 자유로운 시점 조작

### 🧠 AI 대화 시스템
- **Transformers.js**: 로컬 감정 분석 및 텍스트 처리
- **ChatGPT API**: 복잡한 대화 처리
- **스트리밍 응답**: 실시간 AI 응답 표시
- **프롬프트 분류**: 간단/복잡/도구 호출 자동 분류

### �� 메모리 관리
- **Mem0.ai 통합**: 벡터 기반 메모리 저장
- **대화 이력**: 사용자별 대화 저장 및 검색
- **컨텍스트 검색**: 관련 이전 대화 자동 참조
- **개인화**: 사용자 선호도 기반 응답

### ��️ 에이전트 시스템
- **smolagents**: Python 마이크로서비스
- **도구 호출**: 웹 검색, 계산, 번역 등
- **워크플로우**: 복잡한 작업 자동화
- **REST API**: 외부 서비스 연동

### �� 사용자 경험
- **반응형 디자인**: 모바일/데스크탑 대응
- **다크/라이트 모드**: 테마 자동 전환
- **키보드 단축키**: 효율적인 조작
- **접근성**: 스크린 리더, 고대비 모드 지원

## �� 빠른 시작

### 1. 설치

```bash
# 저장소 클론
git clone https://github.com/your-repo/ai-partner-desktop.git
cd ai-partner-desktop

# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env
# .env 파일 편집
```

### 2. 서비스 시작

```bash
# Docker Compose로 서비스 시작
docker-compose up -d

# 또는 개별 서비스 시작
cd services/memory && python main.py &
cd services/agent && python main.py &
cd services/lipsync && python main.py &
```

### 3. 개발 서버 실행

```bash
# 개발 모드
npm run tauri dev

# 또는 웹 모드
npm run dev
```

## 📁 프로젝트 구조

```
desktop_partner/
├── src/                    # 프론트엔드 소스
│   ├── avatar-viewer.ts   # 3D 아바타 시스템
│   ├── ai-conversation.ts # AI 대화 시스템
│   ├── memory-manager.ts  # 메모리 관리
│   ├── agent-manager.ts   # 에이전트 시스템
│   └── ...
├── services/              # 백엔드 서비스
│   ├── memory/           # 메모리 서비스
│   ├── agent/            # 에이전트 서비스
│   └── lipsync/          # 립싱크 서비스
├── tests/                # 테스트 파일
│   ├── unit/             # 단위 테스트
│   ├── integration/      # 통합 테스트
│   └── user/             # 사용자 테스트
├── docs/                 # 문서
└── scripts/              # 배포 스크립트
```

## 🧪 테스트

```bash
# 전체 테스트 실행
npm test

# 단위 테스트
npm run test:unit

# 통합 테스트
npm run test:integration

# 사용자 테스트
npm run test:user

# 커버리지 리포트
npm run test:coverage
```

## �� 배포

```bash
# 전체 빌드
npm run build:all

# 플랫폼별 배포
npm run deploy:windows
npm run deploy:macos
npm run deploy:linux
```

## ��️ 기술 스택

### 프론트엔드
- **Tauri**: 데스크탑 앱 프레임워크
- **TypeScript**: 타입 안전성
- **Three.js**: 3D 렌더링
- **@pixiv/three-vrm**: VRM 아바타 지원
- **Transformers.js**: 로컬 AI 모델

### 백엔드
- **FastAPI**: Python 웹 프레임워크
- **Qdrant**: 벡터 데이터베이스
- **Docker**: 컨테이너화
- **smolagents**: AI 에이전트

### 개발 도구
- **Vite**: 빌드 도구
- **Vitest**: 테스트 프레임워크
- **ESLint**: 코드 품질
- **Prettier**: 코드 포맷팅

## �� 성능 지표

### 목표 성능
- **응답 시간**: 평균 2초 이내
- **메모리 사용량**: 4GB 이하
- **CPU 사용률**: 평균 20% 이하
- **에러율**: 1% 이하
- **감정 분석 정확도**: 85% 이상
- **아바타 애니메이션**: 60fps 유지

### 최적화 기능
- **적응형 렌더링**: 성능에 따른 품질 조정
- **지연 로딩**: 필요시에만 리소스 로드
- **메모리 캐시**: LRU 기반 캐시 시스템
- **코드 분할**: 동적 임포트 최적화

## �� 기여하기

### 개발 환경 설정

```bash
# 포크 및 클론
git clone https://github.com/your-username/ai-partner-desktop.git
cd ai-partner-desktop

# 브랜치 생성
git checkout -b feature/your-feature

# 개발 및 테스트
npm run dev
npm test

# 커밋 및 푸시
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

### 코딩 가이드라인

- **TypeScript**: 엄격한 타입 체크 사용
- **ESLint**: 코드 품질 규칙 준수
- **Prettier**: 일관된 코드 포맷팅
- **테스트**: 새로운 기능에 대한 테스트 작성

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- **Three.js**: 3D 렌더링 엔진
- **@pixiv/three-vrm**: VRM 아바타 지원
- **Transformers.js**: 로컬 AI 모델
- **Tauri**: 데스크탑 앱 프레임워크
- **FastAPI**: Python 웹 프레임워크

## �� 지원

- **이슈**: [GitHub Issues](https://github.com/your-repo/ai-partner-desktop/issues)
- **문서**: [API 문서](docs/API.md)
- **배포**: [배포 가이드](docs/DEPLOYMENT.md)

---

**AI Partner Desktop** - 🤖 인간과 AI의 자연스러운 대화를 위한 3D 아바타 시스템
```
