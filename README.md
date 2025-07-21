# AI Partner Desktop

🤖 **3D 아바타와 AI 대화 시스템을 결합한 데스크탑 애플리케이션**

## ✨ 주요 기능

### 🤖 3D 아바타 시스템
- **VRM 아바타 지원**: AliciaSolid_vrm-0.51.vrm 포함
- **실시간 애니메이션**: 감정별 표정 변화 및 제스처
- **립싱크 시스템**: 음성 인식과 동기화된 입 모양
- **카메라 제어**: 마우스/터치로 자유로운 시점 조작

### 🧠 AI 대화 시스템
- **Transformers.js**: 로컬 감정 분석 및 텍스트 처리
- **ChatGPT API**: 복잡한 대화 처리
- **스트리밍 응답**: 실시간 AI 응답 표시
- **프롬프트 분류**: 간단/복잡/도구 호출 자동 분류

### 🎨 메모리 관리
- **Mem0.ai 통합**: 벡터 기반 메모리 저장
- **대화 이력**: 사용자별 대화 저장 및 검색
- **컨텍스트 검색**: 관련 이전 대화 자동 참조
- **개인화**: 사용자 선호도 기반 응답

### 🤖 에이전트 시스템
- **smolagents**: Python 마이크로서비스
- **도구 호출**: 웹 검색, 계산, 번역 등
- **워크플로우**: 복잡한 작업 자동화
- **REST API**: 외부 서비스 연동

### 🎨 사용자 경험
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

## 🚀 배포

```bash
# 전체 빌드
npm run build:all

# 플랫폼별 배포
npm run deploy:windows
npm run deploy:macos
npm run deploy:linux
```

## 🛠 기술 스택

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

## 📊 성능 지표

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

## 🎮 사용법

### 기본 조작
- **Space**: 음성 인식 시작/중지
- **Escape**: 메뉴 닫기
- **Ctrl + M**: 액션 메뉴
- **Ctrl + A**: 분석 도구
- **F1**: 키보드 단축키 도움말

### 음성 인식
1. 마이크 버튼을 클릭하거나 Space 키를 누릅니다
2. 한국어, 영어, 일본어, 중국어 지원
3. 실시간 음성 인식 결과가 표시됩니다
4. AI가 감정을 분석하고 적절한 반응을 보입니다

### 3D 아바타 모드
1. 큐브 아이콘 버튼을 클릭합니다
2. 3D 아바타가 로드됩니다
3. 음성 인식과 연동되어 아바타가 반응합니다
4. 감정에 따라 아바타의 표정이 변화합니다

### AI 분석 도구
1. 뇌 아이콘 버튼을 클릭합니다
2. 감정 분석, 로컬 음성 인식, 설정 탭을 사용할 수 있습니다
3. 텍스트를 입력하여 감정을 분석할 수 있습니다
4. 브라우저 기반 음성 인식을 사용할 수 있습니다

## 🔧 설정

### 환경 변수
```env
# OpenAI API
OPENAI_API_KEY=your_openai_key

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_key

# 서비스 URL
MEMORY_SERVICE_URL=http://localhost:8001
AGENT_SERVICE_URL=http://localhost:8002
```

### Docker 서비스
- **Memory Service**: 포트 8001
- **Agent Service**: 포트 8002
- **Qdrant**: 포트 6333
- **Web Interface**: 포트 8080 (선택사항)

## 🚀 배포

### 개발 빌드
```bash
npm run tauri build
```

### 프로덕션 빌드
```bash
npm run build
```

## 📊 성능 지표

- **초기 로딩 시간**: < 3초
- **음성 인식 응답**: < 500ms
- **감정 분석**: < 1초
- **메모리 사용량**: < 200MB
- **CPU 사용률**: < 15%

## 🔮 향후 계획

### 단기 목표
- [ ] 립싱크 기능 구현
- [ ] 제스처 컨트롤 추가
- [ ] 다중 사용자 지원
- [ ] 고급 감정 표현

### 장기 목표
- [ ] VR/AR 지원
- [ ] 실시간 번역
- [ ] 개인화된 AI 훈련
- [ ] 클라우드 동기화

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- [Tauri](https://tauri.app/) - 데스크탑 앱 프레임워크
- [Three.js](https://threejs.org/) - 3D 그래픽 라이브러리
- [Transformers.js](https://huggingface.co/docs/transformers.js) - 브라우저 기반 ML
- [Qdrant](https://qdrant.tech/) - 벡터 데이터베이스

---

**AI Partner Desktop** - 🤖 인간과 AI의 자연스러운 대화를 위한 3D 아바타 시스템
