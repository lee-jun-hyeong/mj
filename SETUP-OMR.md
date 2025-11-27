# OMR 서비스 설정 가이드

## 현재 상태

Functions의 OMR 처리 로직은 구현되었지만, Cloud Run 서비스가 배포되지 않아 현재는 로컬 플레이스홀더 MusicXML을 반환합니다.

## Cloud Run 배포 방법

### 1. gcloud 인증 (필요시)

```bash
gcloud auth login
gcloud config set project michael-jesus
```

### 2. Cloud Run 배포

```bash
# Docker 이미지 빌드 및 배포
gcloud builds submit --tag gcr.io/michael-jesus/omr-service functions/ --project=michael-jesus

# Cloud Run에 배포
gcloud run deploy omr-service \
  --image gcr.io/michael-jesus/omr-service \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 300 \
  --project=michael-jesus
```

### 3. 서비스 URL 확인

```bash
gcloud run services describe omr-service \
  --platform managed \
  --region asia-northeast3 \
  --format 'value(status.url)' \
  --project=michael-jesus
```

### 4. Functions 환경 변수 설정

Firebase Console에서:
1. https://console.firebase.google.com/project/michael-jesus/functions/env
2. "환경 변수 추가" 클릭
3. 이름: `OMR_SERVICE_URL`
4. 값: Cloud Run 서비스 URL (예: `https://omr-service-xxxxx-xx.a.run.app`)
5. 저장

### 5. Functions 재배포

```bash
npm run deploy:functions
```

## 현재 작동 방식

- Cloud Run URL이 설정되지 않으면: 로컬 플레이스홀더 MusicXML 반환
- Cloud Run URL이 설정되면: Cloud Run 서비스 호출 (현재는 플레이스홀더 MusicXML 반환)
- 실제 Audiveris 통합: `functions/omr-server.py` 수정 필요

## 다음 단계

실제 Audiveris를 통합하려면 `functions/omr-server.py`의 `process_omr` 함수를 수정하여 Audiveris를 호출하도록 구현하세요.

