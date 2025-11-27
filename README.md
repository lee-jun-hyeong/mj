# 마이클 지저스

악보 이미지에서 악보를 추출하고, 사용자가 악보 콘티를 만들어서 악보를 볼 수 있는 웹앱입니다.

## 기술 스택

- TypeScript
- Vite
- Firebase Hosting
- Firebase Firestore
- Firebase Storage
- Firebase Authentication
- Firebase Functions

## 개발 환경 설정

1. 의존성 설치
```bash
npm install
cd functions && npm install && cd ..
```

2. Firebase 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 Firebase 콘솔에서 가져온 설정 값을 입력하세요:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=michael-jesus.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=michael-jesus.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

3. 개발 서버 실행
```bash
npm run dev
```

4. 빌드
```bash
npm run build
```

5. Firebase 배포
```bash
# 전체 배포 (Hosting + Functions)
npm run build:deploy

# Hosting만 배포
npm run deploy:hosting

# Functions만 배포
npm run deploy:functions
```

## Firebase 서비스

- **Hosting**: 웹앱 호스팅
- **Firestore**: 데이터베이스
- **Storage**: 파일 저장소 (악보 이미지 등)
- **Authentication**: 사용자 인증
- **Functions**: 서버리스 함수

## Firebase 설정

프로젝트 ID는 `michael-jesus`로 설정되어 있습니다. (`.firebaserc` 파일)

Firebase 콘솔: https://console.firebase.google.com/u/0/project/michael-jesus

