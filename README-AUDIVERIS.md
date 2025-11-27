# Audiveris 통합 완료

## 완료된 작업

✅ **Dockerfile 수정**: Java 11과 Python 3 포함
✅ **omr-server.py 수정**: Audiveris 실행 로직 추가
✅ **에러 핸들링**: 실패 시 폴백 MusicXML 반환
✅ **다운로드 스크립트**: Audiveris JAR 파일 다운로드 시도

## 다음 단계: Audiveris JAR 파일 준비

Audiveris는 소스에서 빌드해야 합니다. 다음 중 하나를 선택하세요:

### 옵션 1: 로컬에서 빌드 (권장)

```powershell
# Java와 Gradle이 설치되어 있어야 함
cd functions
git clone https://github.com/Audiveris/audiveris.git temp-audiveris
cd temp-audiveris
gradle build -x test

# 빌드된 JAR 파일 찾기 및 복사
Get-ChildItem -Recurse -Filter "*.jar" | Where-Object { $_.FullName -like "*build/libs*" }
# 가장 큰 JAR 파일을 functions/audiveris.jar로 복사

cd ..
Remove-Item -Recurse -Force temp-audiveris
```

### 옵션 2: Docker 빌드 시 자동 빌드

```powershell
# Dockerfile.build 사용 (빌드 시간 10-20분)
gcloud builds submit --tag gcr.io/michael-jesus/omr-service functions/ --dockerfile=functions/Dockerfile.build --project=michael-jesus
```

## 배포

JAR 파일이 준비되면:

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

## 테스트

배포 후 악보 이미지를 업로드하여 실제 음표가 인식되는지 확인하세요.

