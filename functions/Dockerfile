# Audiveris OMR 서비스를 위한 Dockerfile
# Cloud Run에 배포하기 위한 기본 구조

FROM python:3.11-slim

WORKDIR /app

# 필요한 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# OMR 서버 스크립트 복사
COPY omr-server.py /app/
RUN chmod +x /app/omr-server.py

# 포트 설정
ENV PORT=8080
EXPOSE 8080

# 서버 실행
CMD ["python3", "/app/omr-server.py"]

