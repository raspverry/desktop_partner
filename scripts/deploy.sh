#!/bin/bash

# 배포 스크립트
set -e

echo "�� AI Partner Desktop 앱 배포 시작..."

# 1. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 2. 타입 체크
echo "🔍 타입 체크 중..."
npm run type-check

# 3. 린트 검사
echo "🔧 린트 검사 중..."
npm run lint

# 4. 단위 테스트
echo "🧪 단위 테스트 실행 중..."
npm run test:unit

# 5. 통합 테스트
echo "🔗 통합 테스트 실행 중..."
npm run test:integration

# 6. 빌드
echo "🏗️ 빌드 중..."
npm run build

# 7. 플랫폼별 배포
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "🪟 Windows 배포 중..."
    npm run deploy:windows
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "�� macOS 배포 중..."
    npm run deploy:macos
else
    echo "�� Linux 배포 중..."
    npm run deploy:linux
fi

echo "✅ 배포 완료!" 