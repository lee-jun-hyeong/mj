# Firebase 배포 가이드

## 1. Firebase 프로젝트 설정 확인

프로젝트 ID: `michael-jesus`

Firebase Console에서 웹 앱 설정 가져오기:
1. https://console.firebase.google.com 접속
2. `michael-jesus` 프로젝트 선택
3. 프로젝트 설정 (톱니바퀴 아이콘) → 일반 탭
4. "내 앱" 섹션에서 웹 앱 선택 또는 새로 만들기
5. Firebase SDK 추가 → 구성 선택
6. 설정 값 복사

## 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=michael-jesus.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=michael-jesus
VITE_FIREBASE_STORAGE_BUCKET=michael-jesus.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

또는 `src/config/firebase.ts`에 직접 설정:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "michael-jesus.firebaseapp.com",
  projectId: "michael-jesus",
  storageBucket: "michael-jesus.firebasestorage.app",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 3. Firebase 서비스 활성화

Firebase Console에서 다음 서비스 활성화:
- **Storage**: 프로젝트 설정 → Storage → 시작하기
- **Firestore**: 프로젝트 설정 → Firestore Database → 데이터베이스 만들기
- **Functions**: 프로젝트 설정 → Functions → 시작하기

## 4. Gemini API 키 설정

### Firebase Functions Secrets 설정 (배포용)

Firebase Functions v2에서는 Secrets를 사용합니다:

```bash
# 프로젝트 루트에서 실행
firebase functions:secrets:set GEMINI_API_KEY
# 프롬프트에서 Gemini API 키 입력
```

또는 직접 값 입력:
```bash
echo "your_gemini_api_key_here" | firebase functions:secrets:set GEMINI_API_KEY
```

**중요**: Secrets를 설정한 후 Functions를 배포해야 합니다.

### 로컬 개발용 (Emulator)

로컬 개발 시에는 `functions/.env` 파일을 사용할 수 있지만,
현재 코드는 Secrets를 사용하도록 설정되어 있으므로 배포 환경에서만 작동합니다.

## 5. Functions 배포

```bash
# Functions 디렉토리로 이동
cd functions

# 의존성 설치
npm install

# 빌드
npm run build

# 배포
npm run deploy
```

또는 루트에서:
```bash
npm run deploy:functions
```

## 6. 배포 확인

```bash
# Functions 로그 확인
firebase functions:log

# 배포 상태 확인
firebase functions:list
```

## 7. 테스트

1. 브라우저에서 이미지 업로드
2. Firebase Console → Functions → 로그에서 처리 상태 확인
3. Firestore에서 `scores` 컬렉션 확인

## 문제 해결

### Functions가 트리거되지 않는 경우
- Storage 규칙 확인
- Functions 로그 확인
- Firestore 인덱스 확인

### Gemini API 오류
- API 키 확인
- Functions 환경 변수 확인
- API 할당량 확인

