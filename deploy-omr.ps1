# Cloud Run OMR 서비스 배포 스크립트 (PowerShell)

$PROJECT_ID = "michael-jesus"
$SERVICE_NAME = "omr-service"
$REGION = "asia-northeast3"

Write-Host "Audiveris OMR 서비스를 Cloud Run에 배포합니다..." -ForegroundColor Green

# gcloud 인증 확인
Write-Host "`n1. gcloud 인증 확인 중..." -ForegroundColor Yellow
$authList = gcloud auth list 2>&1
if ($authList -match "No credentialed accounts") {
    Write-Host "gcloud 인증이 필요합니다. 다음 명령어를 실행하세요:" -ForegroundColor Red
    Write-Host "  gcloud auth login" -ForegroundColor Yellow
    Write-Host "`n인증 후 이 스크립트를 다시 실행하세요." -ForegroundColor Yellow
    exit 1
}

# 프로젝트 설정
Write-Host "`n2. 프로젝트 설정 중..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Docker 이미지 빌드
Write-Host "`n3. Docker 이미지 빌드 중..." -ForegroundColor Yellow
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME functions/ --project=$PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "이미지 빌드 실패" -ForegroundColor Red
    exit 1
}

# Cloud Run에 배포
Write-Host "`n4. Cloud Run에 배포 중..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --memory 2Gi `
  --timeout 300 `
  --project=$PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "배포 실패" -ForegroundColor Red
    exit 1
}

# 서비스 URL 가져오기
Write-Host "`n5. 서비스 URL 확인 중..." -ForegroundColor Yellow
$SERVICE_URL = gcloud run services describe $SERVICE_NAME `
  --platform managed `
  --region $REGION `
  --format 'value(status.url)' `
  --project=$PROJECT_ID

Write-Host "`n배포 완료!" -ForegroundColor Green
Write-Host "서비스 URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "`n다음 단계:" -ForegroundColor Yellow
Write-Host "1. Firebase Console 접속: https://console.firebase.google.com/project/michael-jesus/functions/env" -ForegroundColor White
Write-Host "2. 환경 변수 추가:" -ForegroundColor White
Write-Host "   - 이름: OMR_SERVICE_URL" -ForegroundColor White
Write-Host "   - 값: $SERVICE_URL" -ForegroundColor White
Write-Host "3. Functions 재배포: npm run deploy:functions" -ForegroundColor White

