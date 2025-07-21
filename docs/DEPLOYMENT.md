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