# Node.js 20 + Java 25 기반 이미지
FROM node:20-slim

# Java 25 설치 (Temurin OpenJDK)
RUN apt-get update && \
    apt-get install -y wget curl && \
    wget -O /tmp/openjdk.tar.gz https://github.com/adoptium/temurin25-binaries/releases/download/jdk-25.0.1%2B8/OpenJDK25U-jdk_x64_linux_hotspot_25.0.1_8.tar.gz && \
    mkdir -p /usr/lib/jvm && \
    tar -xzf /tmp/openjdk.tar.gz -C /usr/lib/jvm && \
    rm /tmp/openjdk.tar.gz && \
    mv /usr/lib/jvm/jdk-25.0.1+8 /usr/lib/jvm/jdk-25 && \
    update-alternatives --install /usr/bin/java java /usr/lib/jvm/jdk-25/bin/java 1 && \
    update-alternatives --install /usr/bin/javac javac /usr/lib/jvm/jdk-25/bin/javac 1 && \
    update-alternatives --install /usr/bin/jar jar /usr/lib/jvm/jdk-25/bin/jar 1 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /workspace

# package.json 및 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# Audiveris JAR 파일 복사
COPY audiveris.jar ./

# 환경 변수 설정
ENV NODE_ENV=production
ENV JAVA_HOME=/usr/lib/jvm/jdk-25
ENV PATH=$JAVA_HOME/bin:$PATH

# Java 버전 확인 (디버깅용)
RUN java -version

# 포트 설정
EXPOSE 8080

# Cloud Run 진입점
CMD ["node", "lib/index.js"]
