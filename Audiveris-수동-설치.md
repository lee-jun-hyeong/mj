# Audiveris 수동 설치 가이드

## 현재 상황

Audiveris는 GitHub 릴리스에 미리 빌드된 JAR 파일을 제공하지 않습니다.
소스 코드에서 직접 빌드해야 합니다.

## 방법 1: 수동으로 JAR 파일 다운로드 및 빌드

### 1단계: Audiveris 소스 다운로드

```powershell
cd functions
git clone https://github.com/Audiveris/audiveris.git temp-audiveris
```

### 2단계: Gradle로 빌드

```powershell
cd temp-audiveris
# Gradle이 설치되어 있어야 함
gradle build -x test
```

### 3단계: JAR 파일 복사

```powershell
# 빌드된 JAR 파일 찾기
Get-ChildItem -Recurse -Filter "*.jar" | Where-Object { $_.FullName -like "*build/libs*" }

# functions 디렉토리로 복사
Copy-Item "build/libs/audiveris-*.jar" "../audiveris.jar"
cd ..
Remove-Item -Recurse -Force temp-audiveris
```

## 방법 2: Docker 빌드 시 자동 빌드

`Dockerfile.build`를 사용하여 Docker 이미지 빌드 시 자동으로 Audiveris를 빌드합니다:

```powershell
# Dockerfile.build로 빌드
gcloud builds submit --tag gcr.io/michael-jesus/omr-service functions/ --dockerfile=functions/Dockerfile.build --project=michael-jesus
```

**주의**: 이 방법은 빌드 시간이 매우 오래 걸립니다 (10-20분).

## 방법 3: 사전 빌드된 JAR 사용 (권장)

다른 사용자가 빌드한 JAR 파일을 사용하거나, 로컬에서 빌드한 후 `functions/` 디렉토리에 `audiveris.jar`로 저장:

```powershell
# functions/ 디렉토리에 audiveris.jar 파일이 있어야 함
# 파일 이름은 audiveris-*.jar 형식이어야 함
```

## 빠른 시작 (권장)

1. **로컬에서 빌드** (Java와 Gradle 필요):
   ```powershell
   git clone https://github.com/Audiveris/audiveris.git
   cd audiveris
   gradle build -x test
   # build/libs/audiveris-*.jar 파일을 functions/audiveris.jar로 복사
   ```

2. **또는 Docker 빌드 사용**:
   ```powershell
   gcloud builds submit --tag gcr.io/michael-jesus/omr-service functions/ --dockerfile=functions/Dockerfile.build --project=michael-jesus
   ```

## 다음 단계

JAR 파일이 준비되면:

```powershell
# Docker 이미지 빌드
gcloud builds submit --tag gcr.io/michael-jesus/omr-service functions/ --project=michael-jesus

# Cloud Run에 배포
gcloud run deploy omr-service \
  --image gcr.io/michael-jesus/omr-service \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --memory 4Gi \
  --timeout 300 \
  --project=michael-jesus
```

