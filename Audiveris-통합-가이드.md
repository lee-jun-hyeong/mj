# Audiveris 통합 가이드

## 개요

Audiveris를 Cloud Run OMR 서비스에 통합하여 실제 악보 이미지에서 음표를 인식하도록 합니다.

## 사전 준비

1. **Audiveris 다운로드**
   - https://github.com/Audiveris/audiveris/releases
   - 최신 버전 JAR 파일 다운로드

2. **Java 설치 확인**
   - Cloud Run Docker 이미지에 Java 11+ 필요

## Dockerfile 수정

`functions/Dockerfile`을 수정하여 Audiveris를 포함:

```dockerfile
FROM openjdk:11-jre-slim

WORKDIR /app

# 필요한 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Audiveris JAR 파일 복사
COPY audiveris-*.jar /app/audiveris.jar

# OMR 서버 스크립트 복사
COPY omr-server.py /app/
RUN chmod +x /app/omr-server.py

# 포트 설정
ENV PORT=8080
EXPOSE 8080

# 서버 실행
CMD ["python3", "/app/omr-server.py"]
```

## omr-server.py 수정

`functions/omr-server.py`의 `process_omr` 함수를 수정:

```python
import subprocess
import os

def process_omr(self, image_url):
    """OMR 처리 (Audiveris 사용)"""
    try:
        # 이미지 다운로드
        import urllib.request
        temp_image = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
        urllib.request.urlretrieve(image_url, temp_image.name)

        # 출력 디렉토리 생성
        output_dir = tempfile.mkdtemp()

        # Audiveris 실행
        cmd = [
            'java', '-jar', '/app/audiveris.jar',
            '-batch',
            '-export',
            '-output', output_dir,
            temp_image.name
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5분 타임아웃
        )

        if result.returncode != 0:
            raise Exception(f'Audiveris 실행 실패: {result.stderr}')

        # 생성된 MusicXML 파일 찾기
        musicxml_files = [f for f in os.listdir(output_dir) if f.endswith('.musicxml')]

        if not musicxml_files:
            raise Exception('MusicXML 파일을 찾을 수 없습니다')

        # 첫 번째 MusicXML 파일 읽기
        musicxml_path = os.path.join(output_dir, musicxml_files[0])
        with open(musicxml_path, 'r', encoding='utf-8') as f:
            music_xml = f.read()

        # 임시 파일 정리
        os.unlink(temp_image.name)
        import shutil
        shutil.rmtree(output_dir)

        return music_xml

    except Exception as e:
        # 오류 발생 시 플레이스홀더 반환
        print(f'OMR 처리 오류: {e}')
        return self.get_fallback_musicxml()
```

## 배포

1. **Audiveris JAR 파일 준비**
   ```bash
   # functions/ 디렉토리에 audiveris-*.jar 파일 복사
   ```

2. **Docker 이미지 재빌드 및 배포**
   ```bash
   gcloud builds submit --tag gcr.io/michael-jesus/omr-service functions/ --project=michael-jesus
   gcloud run deploy omr-service \
     --image gcr.io/michael-jesus/omr-service \
     --platform managed \
     --region asia-northeast3 \
     --allow-unauthenticated \
     --memory 4Gi \
     --timeout 300 \
     --project=michael-jesus
   ```

## 주의사항

- **메모리**: Audiveris는 많은 메모리가 필요하므로 최소 4Gi 권장
- **처리 시간**: 복잡한 악보는 5분 이상 걸릴 수 있음
- **비용**: Cloud Run 사용량에 따라 비용 발생

## 테스트

배포 후 악보 이미지를 업로드하여 실제 음표가 인식되는지 확인하세요.

