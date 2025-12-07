# 테스트 가이드

## 전체 플로우 테스트 방법

### 방법 1: 테스트 모드 (가장 간단)

개발 모드에서 실행하면 헤더에 "🧪 테스트 모드" 버튼이 표시됩니다.

1. 개발 서버 실행:
```bash
npm run dev
```

2. 브라우저에서 `http://localhost:5174` 접속

3. "🧪 테스트 모드 (샘플 데이터)" 버튼 클릭

4. 샘플 악보 데이터가 바로 렌더링됩니다!

### 방법 2: Firebase Emulator 사용 (전체 플로우)

실제 Firebase 프로젝트 없이 전체 플로우를 테스트할 수 있습니다.

#### 1. Emulator 시작

```bash
# Firebase Emulator 시작 (Firestore, Storage, Functions)
npm run serve
```

또는 개별적으로:
```bash
firebase emulators:start --only firestore,storage,functions
```

#### 2. 환경 변수 설정

`.env.local` 파일 생성:
```
VITE_USE_EMULATOR=true
VITE_FIREBASE_PROJECT_ID=demo-project-id
```

#### 3. 프론트엔드 실행

다른 터미널에서:
```bash
npm run dev
```

#### 4. 테스트

1. 브라우저에서 이미지 업로드
2. Emulator UI에서 데이터 확인: `http://localhost:4000`
3. Functions 로그 확인

### 방법 3: 실제 Firebase 프로젝트 사용

#### 1. Firebase 프로젝트 설정

1. Firebase Console에서 프로젝트 생성
2. `src/config/firebase.ts`에 실제 설정 추가
3. Storage 및 Firestore 활성화

#### 2. Functions 배포

```bash
cd functions
npm install
npm run build

# 환경 변수 설정
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# 배포
npm run deploy
```

#### 3. 테스트

1. 이미지 업로드
2. Functions가 자동으로 트리거되어 Gemini API 호출
3. 결과가 Firestore에 저장되고 실시간으로 업데이트

## 샘플 데이터

`src/lib/testData.ts`에 "주께 와 엎드려" 악보의 샘플 데이터가 포함되어 있습니다.

## 문제 해결

### Emulator 연결 오류
- Emulator가 실행 중인지 확인
- 포트가 사용 중이 아닌지 확인
- `VITE_USE_EMULATOR=true` 환경 변수 설정 확인

### Functions 트리거 안 됨
- Storage Emulator가 실행 중인지 확인
- 파일이 `scores/` 폴더에 업로드되는지 확인
- Functions 로그 확인: `firebase functions:log`

### 렌더링 오류
- 브라우저 콘솔 확인
- VexFlow 버전 확인
- JSON 데이터 형식 확인

