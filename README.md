# 악보 분석 및 렌더링 시스템

악보 이미지를 AI(Gemini Vision API)로 분석하여 JSON으로 변환하고, VexFlow로 렌더링하는 시스템입니다.

## 기능

- 🖼️ 악보 이미지 업로드 (드래그 앤 드롭 지원)
- 🤖 Gemini Vision API를 통한 자동 악보 분석
- 🎵 VexFlow를 통한 악보 렌더링
- 📊 실시간 처리 상태 업데이트
- 🎹 코드 기호 및 가사 표시

## 기술 스택

### 프론트엔드
- React + TypeScript + Vite
- VexFlow (악보 렌더링)
- Firebase SDK (Storage, Firestore)

### 백엔드
- Firebase Functions (Node.js/TypeScript)
- Google Gemini Vision API

## 설치 및 설정

### 1. 의존성 설치

```bash
# 프론트엔드
npm install

# Firebase Functions
cd functions
npm install
```

### 2. Firebase 설정

1. Firebase 프로젝트 생성
2. `src/config/firebase.ts` 파일에 Firebase 설정 추가
3. 또는 환경 변수 설정:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 3. Gemini API 키 설정

Firebase Functions 환경 변수에 Gemini API 키를 설정:

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

또는 `.env` 파일 사용 (로컬 개발):
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Firebase Storage 및 Firestore 설정

- Firebase Console에서 Storage 활성화
- Firestore Database 생성
- 보안 규칙 설정 (개발 단계에서는 모든 접근 허용)

## 실행

### 개발 모드

```bash
# 프론트엔드
npm run dev

# Functions 로컬 테스트
cd functions
npm run serve
```

### 배포

```bash
# Functions 배포
npm run deploy:functions

# 전체 배포
npm run deploy
```

## 사용 방법

1. 악보 이미지를 업로드 (JPG, PNG, GIF, WebP)
2. 업로드 후 자동으로 Gemini API가 악보를 분석
3. 분석 완료 후 VexFlow로 렌더링된 악보 표시

## 프로젝트 구조

```
├── src/
│   ├── components/
│   │   ├── ImageUploader/    # 이미지 업로드 컴포넌트
│   │   └── ScoreRenderer/    # 악보 렌더링 컴포넌트
│   ├── lib/
│   │   ├── firebase.ts       # Firebase 초기화
│   │   ├── storage.ts        # Storage 업로드
│   │   ├── firestore.ts      # Firestore CRUD
│   │   └── vexflowRenderer.ts # VexFlow 렌더링
│   ├── types/
│   │   └── score.ts          # 타입 정의
│   └── config/
│       └── firebase.ts       # Firebase 설정
└── functions/
    └── src/
        ├── index.ts          # Functions 진입점
        ├── geminiScoreAnalyzer.ts  # Gemini API 통합
        └── firestoreUtils.ts  # Firestore 유틸리티
```

## 주의사항

- Gemini API 사용 시 비용이 발생할 수 있습니다
- 이미지 크기가 클수록 처리 시간이 길어집니다
- 복잡한 악보는 분석 정확도가 낮을 수 있습니다

## 라이선스

MIT

