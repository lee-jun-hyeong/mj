# 환경 변수 설정 가이드

## Cloud Run 배포 완료 ✅

서비스 URL: `https://omr-service-51418627624.asia-northeast3.run.app`

## Firebase Functions 환경 변수 설정

### 방법 1: Firebase Console (가장 간단) ⭐

1. **Firebase Console 접속**
   - https://console.firebase.google.com/project/michael-jesus/functions/env
   - 또는: Firebase Console > Functions > 환경 변수

2. **"환경 변수 추가" 클릭**

3. **다음 정보 입력:**
   - **이름**: `OMR_SERVICE_URL`
   - **값**: `https://omr-service-51418627624.asia-northeast3.run.app`

4. **"저장" 클릭**

5. **Functions 재배포** (자동 적용되지만 필요시):
   ```powershell
   npm run deploy:functions
   ```

### 방법 2: Firebase CLI

```powershell
# 환경 변수 설정
firebase functions:config:set omr.service_url="https://omr-service-51418627624.asia-northeast3.run.app"

# Functions 재배포
npm run deploy:functions
```

**참고**: Functions v2에서는 `defineString`을 사용하므로, Firebase Console에서 설정하는 것이 더 간단하고 권장됩니다.

## 확인 방법

환경 변수 설정 후:

1. 앱에서 악보 이미지 업로드
2. Functions 로그 확인:
   ```bash
   firebase functions:log --only processOMR
   ```
3. 로그에서 `omrServiceUrl`이 올바르게 표시되는지 확인

## 현재 상태

✅ Cloud Run 서비스 배포 완료
✅ Functions 배포 완료
⏳ 환경 변수 설정 필요 (Firebase Console)

환경 변수 설정 후 OMR 서비스가 정상 작동합니다!

