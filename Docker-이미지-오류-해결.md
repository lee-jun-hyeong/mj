# Docker 이미지 오류 해결 방법

## 오류 메시지
```
Image 'us-central1-docker.pkg.dev/michael-jesus/gcf-artifacts/michael--jesus__us--central1__hello_world:version_1' not found.
```

## 해결 방법

### 방법 1: Functions 재배포 (가장 간단)

프로젝트 루트에서 다음 명령어 실행:

```powershell
npm run deploy:functions
```

또는:

```powershell
firebase deploy --only functions
```

### 방법 2: 특정 함수만 재배포

```powershell
firebase deploy --only functions:processOMR
```

### 방법 3: 캐시 클리어 후 재배포

```powershell
# Firebase 로그아웃 후 재로그인
firebase logout
firebase login

# Functions 재배포
npm run deploy:functions
```

### 방법 4: Google Cloud Console에서 직접 배포

1. https://console.cloud.google.com/functions 접속
2. `helloWorld` 함수 선택
3. "삭제" 클릭 (이 함수가 필요 없다면)
4. 또는 "재배포" 클릭

## 원인

이 오류는 보통 다음과 같은 경우에 발생합니다:
- Functions 배포 중 중단됨
- Docker 이미지 빌드 실패
- 이전 배포의 캐시 문제

## 예방 방법

- Functions 배포가 완료될 때까지 기다리기
- 배포 중 중단하지 않기
- 정기적으로 Functions 재배포

## 현재 상태 확인

Functions 목록 확인:
```powershell
firebase functions:list
```

Functions 로그 확인:
```powershell
firebase functions:log
```

