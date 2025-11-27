#!/bin/bash
# Cloud Run에 Audiveris OMR 서비스 배포 스크립트

PROJECT_ID="michael-jesus"
SERVICE_NAME="omr-service"
REGION="asia-northeast3"

echo "Audiveris OMR 서비스를 Cloud Run에 배포합니다..."

# Docker 이미지 빌드
echo "Docker 이미지 빌드 중..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --project=${PROJECT_ID} \
  functions/

# Cloud Run에 배포
echo "Cloud Run에 배포 중..."
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 300 \
  --project=${PROJECT_ID}

# 서비스 URL 가져오기
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --format 'value(status.url)' \
  --project=${PROJECT_ID})

echo "배포 완료!"
echo "서비스 URL: ${SERVICE_URL}"
echo ""
echo "Functions에 환경 변수 설정:"
echo "firebase functions:config:set omr.service_url=\"${SERVICE_URL}\""

