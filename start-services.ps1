# AI Partner 서비스 시작 스크립트
Write-Host "🤖 AI Partner 서비스 시작 중..." -ForegroundColor Green

# Docker가 실행 중인지 확인
try {
    docker version | Out-Null
    Write-Host "✅ Docker가 실행 중입니다." -ForegroundColor Green
} catch {
    Write-Host "❌ Docker가 실행되지 않았습니다. Docker Desktop을 시작해주세요." -ForegroundColor Red
    exit 1
}

# 환경 변수 파일 확인
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env 파일이 없습니다. env.example을 복사하여 API 키를 설정해주세요." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "📝 .env 파일을 생성했습니다. API 키를 설정한 후 다시 실행해주세요." -ForegroundColor Yellow
    exit 1
}

# 기존 컨테이너 중지 및 제거
Write-Host "🧹 기존 컨테이너 정리 중..." -ForegroundColor Yellow
docker-compose down 2>$null

# 서비스 빌드 및 시작
Write-Host "🚀 서비스 빌드 및 시작 중..." -ForegroundColor Green
docker-compose up --build -d

# 서비스 상태 확인
Write-Host "⏳ 서비스 시작 대기 중..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 헬스 체크
Write-Host "🔍 서비스 상태 확인 중..." -ForegroundColor Green

try {
    $memoryResponse = Invoke-RestMethod -Uri "http://localhost:8001/health" -Method Get -TimeoutSec 5
    Write-Host "✅ 메모리 서비스: 정상" -ForegroundColor Green
} catch {
    Write-Host "❌ 메모리 서비스: 연결 실패" -ForegroundColor Red
}

try {
    $agentResponse = Invoke-RestMethod -Uri "http://localhost:8002/health" -Method Get -TimeoutSec 5
    Write-Host "✅ 에이전트 서비스: 정상" -ForegroundColor Green
} catch {
    Write-Host "❌ 에이전트 서비스: 연결 실패" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 AI Partner 서비스가 시작되었습니다!" -ForegroundColor Green
Write-Host "📊 메모리 서비스: http://localhost:8001" -ForegroundColor Cyan
Write-Host "🤖 에이전트 서비스: http://localhost:8002" -ForegroundColor Cyan
Write-Host "🗄️  Qdrant: http://localhost:6333" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 서비스를 중지하려면: docker-compose down" -ForegroundColor Yellow
Write-Host "📋 로그 확인: docker-compose logs -f" -ForegroundColor Yellow 