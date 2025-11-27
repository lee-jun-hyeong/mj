# Audiveris OMR 통합 가이드

## 개요

이 프로젝트는 Audiveris를 사용하여 악보 이미지에서 MusicXML을 추출합니다. Cloud Run에 Audiveris 서비스를 배포하고, Firebase Functions에서 호출하는 구조입니다.

## 배포 방법

### 1. Cloud Run에 OMR 서비스 배포

```bash
# Cloud Run 배포 스크립트 실행
chmod +x cloud-run-deploy.sh
./cloud-run-deploy.sh
```

또는 수동으로:

```bash
# Docker 이미지 빌드
gcloud builds submit --tag gcr.io/michael-jesus/omr-service functions/

# Cloud Run에 배포
gcloud run deploy omr-service \
  --image gcr.io/michael-jesus/omr-service \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 300
```

### 2. Functions에 환경 변수 설정

```bash
# Cloud Run 서비스 URL 가져오기
SERVICE_URL=$(gcloud run services describe omr-service \
  --platform managed \
  --region asia-northeast3 \
  --format 'value(status.url)')

# Functions 환경 변수 설정
firebase functions:config:set omr.service_url="${SERVICE_URL}"
```

### 3. Functions 재배포

```bash
npm run deploy:functions
```

## 현재 상태

현재는 플레이스홀더 MusicXML을 반환합니다. 실제 Audiveris를 통합하려면:

1. `functions/omr-server.py` 파일을 수정하여 실제 Audiveris를 호출
2. Audiveris Docker 이미지를 준비
3. Cloud Run에 배포

## Audiveris 통합 방법

### 방법 1: Python subprocess로 Audiveris 실행

```python
import subprocess
import tempfile
import os

def process_with_audiveris(image_path):
    output_dir = tempfile.mkdtemp()

    # Audiveris 실행
    result = subprocess.run([
        'java', '-jar', '/app/audiveris.jar',
        '-batch',
        '-export',
        '-output', output_dir,
        image_path
    ], capture_output=True, text=True)

    # 생성된 MusicXML 파일 찾기
    musicxml_files = [f for f in os.listdir(output_dir) if f.endswith('.musicxml')]

    if musicxml_files:
        with open(os.path.join(output_dir, musicxml_files[0]), 'r') as f:
            return f.read()

    raise Exception('MusicXML 생성 실패')
```

### 방법 2: Audiveris REST API 사용

Audiveris를 REST API 서버로 실행하고 HTTP 요청으로 호출

## 테스트

```bash
# 로컬에서 테스트
cd functions
python3 omr-server.py

# 다른 터미널에서
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/score.jpg"}'
```

## 참고 자료

- [Audiveris GitHub](https://github.com/Audiveris/audiveris)
- [Cloud Run 문서](https://cloud.google.com/run/docs)
- [Firebase Functions 환경 변수](https://firebase.google.com/docs/functions/config-env)

