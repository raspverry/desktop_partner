# Windows 배포 스크립트
param(
    [string]$Platform = "windows"
)

Write-Host "�� AI Partner Desktop 앱 배포 시작..." -ForegroundColor Green

# 1. 의존성 설치
Write-Host "�� 의존성 설치 중..." -ForegroundColor Yellow
npm install

# 2. 타입 체크
Write-Host "🔍 타입 체크 중..." -ForegroundColor Yellow
npm run type-check

# 3. 린트 검사
Write-Host "🔧 린트 검사 중..." -ForegroundColor Yellow
npm run lint

# 4. 테스트 실행
Write-Host "�� 테스트 실행 중..." -ForegroundColor Yellow
npm run test

# 5. 빌드
Write-Host "🏗️ 빌드 중..." -ForegroundColor Yellow
npm run build

# 6. 플랫폼별 배포
switch ($Platform) {
    "windows" {
        Write-Host "�� Windows 배포 중..." -ForegroundColor Green
        npm run deploy:windows
    }
    "macos" {
        Write-Host "🍎 macOS 배포 중..." -ForegroundColor Green
        npm run deploy:macos
    }
    "linux" {
        Write-Host "🐧 Linux 배포 중..." -ForegroundColor Green
        npm run deploy:linux
    }
    default {
        Write-Host "❌ 지원하지 않는 플랫폼: $Platform" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ 배포 완료!" -ForegroundColor Green 