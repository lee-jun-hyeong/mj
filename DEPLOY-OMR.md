# Audiveris OMR 서비스 배포 가이드

## 1. Cloud Run에 OMR 서비스 배포

### 방법 1: 스크립트 사용 (권장)

```bash
chmod +x cloud-run-deploy.sh
./cloud-run-deploy.sh
```

### 방법 2: 수동 배포

```bash
# 1. Docker 이미지 빌드
gcloud builds submit --tag gcr.io/michael-jesus/omr-service functions/

# 2. Cloud Run에 배포
gcloud run deploy omr-service \
  --image gcr.io/michael-jesus/omr-service \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 300 \
  --project=michael-jesus
```

## 2. 서비스 URL 확인

```bash
gcloud run services describe omr-service \
  --platform managed \
  --region asia-northeast3 \
  --format 'value(status.url)' \
  --project=michael-jesus
```

## 3. Functions 환경 변수 설정

Firebase Console에서:
1. Firebase Console > Functions > 환경 변수로 이동
2. `OMR_SERVICE_URL` 추가
3. Cloud Run 서비스 URL 입력 (예: `https://omr-service-xxxxx-xx.a.run.app`)

또는 gcloud CLI로:
```bash
gcloud functions deploy processOMR \
  --set-env-vars OMR_SERVICE_URL=https://omr-service-xxxxx-xx.a.run.app \
  --region=asia-northeast3
```

## 4. Functions 재배포

```bash
npm run deploy:functions
```

## 5. 테스트

1. 앱에서 악보 이미지 업로드
2. OMR 처리 확인
3. Functions 로그 확인: `firebase functions:log`

## 참고

- 현재는 플레이스홀더 MusicXML을 반환합니다
- 실제 Audiveris 통합 시 `functions/omr-server.py`를 수정하세요
- Audiveris Docker 이미지는 별도로 준비해야 합니다

