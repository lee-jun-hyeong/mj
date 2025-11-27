# Audiveris OMR 서비스를 위한 Dockerfile
# Cloud Run에 배포하기 위한 기본 구조

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
# 방법 1: 미리 다운로드한 JAR 파일 사용 (권장)
# COPY audiveris-*.jar /app/audiveris.jar

# 방법 2: 소스에서 빌드 (Dockerfile.build 사용)
# 또는 아래 주석을 해제하여 소스에서 빌드
# RUN git clone https://github.com/Audiveris/audiveris.git /tmp/audiveris && \
#     cd /tmp/audiveris && \
#     gradle build -x test && \
#     find . -name "*.jar" -path "*/build/libs/*" -exec cp {} /app/audiveris.jar \; && \
#     rm -rf /tmp/audiveris

# OMR 서버 스크립트 복사
COPY omr-server.py /app/
RUN chmod +x /app/omr-server.py

# 포트 설정
ENV PORT=8080
EXPOSE 8080

# 서버 실행
CMD ["python3", "/app/omr-server.py"]

