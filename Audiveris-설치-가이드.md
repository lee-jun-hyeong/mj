# Audiveris 설치 및 배포 가이드

## 1단계: Audiveris JAR 파일 다운로드

### 방법 1: PowerShell 스크립트 사용 (Windows)

```powershell
cd functions
.\download-audiveris.ps1
```

### 방법 2: 수동 다운로드

1. https://github.com/Audiveris/audiveris/releases 접속
2. 최신 릴리스의 JAR 파일 다운로드
3. `functions/` 디렉토리에 `audiveris.jar` 또는 `audiveris-*.jar` 이름으로 저장

**중요**: 파일 이름이 `audiveris-`로 시작해야 Dockerfile의 `COPY audiveris-*.jar` 명령이 작동합니다.

## 2단계: Docker 이미지 빌드 및 배포

```powershell
# Docker 이미지 빌드
gcloud builds submit --tag gcr.io/michael-jesus/omr-service functions/ --project=michael-jesus

# Cloud Run에 배포 (메모리 4Gi로 증가)
gcloud run deploy omr-service \
  --image gcr.io/michael-jesus/omr-service \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --memory 4Gi \
  --timeout 300 \
  --project=michael-jesus
```

## 3단계: 테스트

배포 후 악보 이미지를 업로드하여 실제 음표가 인식되는지 확인하세요.

## 문제 해결

### Audiveris JAR 파일을 찾을 수 없음

- `functions/` 디렉토리에 `audiveris-*.jar` 파일이 있는지 확인
- 파일 이름이 `audiveris-`로 시작하는지 확인

### 메모리 부족 오류

- Cloud Run 메모리를 4Gi 이상으로 설정
- 복잡한 악보는 더 많은 메모리가 필요할 수 있음

### 타임아웃 오류

- Cloud Run 타임아웃을 300초(5분) 이상으로 설정
- 복잡한 악보는 처리 시간이 오래 걸릴 수 있음

## 참고

- Audiveris는 Java 11+ 필요
- 첫 실행 시 모델 파일 다운로드로 시간이 걸릴 수 있음
- Cloud Run 사용량에 따라 비용 발생

