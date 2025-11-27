# 빠른 시작 가이드

## Cloud Run 배포 (필수)

### 1. gcloud 인증

터미널에서 다음 명령어 실행:
```bash
gcloud auth login
```
브라우저가 열리면 Google 계정으로 로그인하세요.

### 2. Cloud Run 배포

인증 후 다음 명령어 실행:

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

### 3. 서비스 URL 확인 및 환경 변수 설정

```bash
# 서비스 URL 확인
SERVICE_URL=$(gcloud run services describe omr-service \
  --platform managed \
  --region asia-northeast3 \
  --format 'value(status.url)' \
  --project=michael-jesus)

echo "서비스 URL: $SERVICE_URL"
```

**Firebase Console에서 환경 변수 설정:**
1. https://console.firebase.google.com/project/michael-jesus/functions/env 접속
2. "환경 변수 추가" 클릭
3. 이름: `OMR_SERVICE_URL`
4. 값: 위에서 확인한 서비스 URL 입력
5. 저장

### 4. Functions 재배포

```bash
npm run deploy:functions
```

## 현재 상태

✅ **완료된 작업:**
- 모든 앱 기능 구현 완료
- MusicXML 파싱 및 렌더링 구현
- OMR 처리 구조 완료
- Functions 배포 완료

⏳ **대기 중:**
- Cloud Run 배포 (gcloud 인증 필요)
- Functions 환경 변수 설정

## 테스트

Cloud Run 배포 후:
1. 앱에서 악보 이미지 업로드
2. OMR 처리 확인 (현재는 플레이스홀더 MusicXML 반환)
3. Functions 로그 확인: `firebase functions:log`

## 실제 Audiveris 통합

현재는 플레이스홀더 MusicXML을 반환합니다. 실제 Audiveris를 통합하려면:
1. `functions/omr-server.py`의 `process_omr` 함수 수정
2. Audiveris Docker 이미지 준비
3. Cloud Run 재배포

