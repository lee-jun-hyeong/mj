# 빠른 배포 가이드

## 1. Firebase 설정 확인 ✅

- 프로젝트 ID: `michael-jesus`
- Firebase 설정: `src/config/firebase.ts`에 업데이트 완료

## 2. Gemini API 키 설정

Firebase Functions Secrets에 Gemini API 키를 설정하세요:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

프롬프트가 나타나면 Gemini API 키를 입력하세요.

**Gemini API 키가 없으신가요?**
1. https://aistudio.google.com/app/apikey 접속
2. "Create API Key" 클릭
3. 생성된 키를 복사하여 위 명령어에 입력

## 3. Functions 배포

```bash
# functions 디렉토리에서
cd functions
npm run build
cd ..

# 배포
firebase deploy --only functions
```

## 4. 배포 확인

```bash
# Functions 로그 확인
firebase functions:log

# 배포된 Functions 목록 확인
firebase functions:list
```

## 5. 테스트

1. 브라우저에서 `http://localhost:5173` 접속
2. 악보 이미지 업로드
3. Firebase Console → Functions → 로그에서 처리 상태 확인
4. Firestore에서 `scores` 컬렉션 확인

## 문제 해결

### "Secret not found" 오류
- Secrets가 제대로 설정되었는지 확인: `firebase functions:secrets:access GEMINI_API_KEY`
- 배포 전에 Secrets를 설정했는지 확인

### Functions가 트리거되지 않는 경우
- Storage 규칙 확인
- Functions 로그 확인: `firebase functions:log`
- Firestore 인덱스 확인

### Gemini API 오류
- API 키 확인
- API 할당량 확인
- Functions 로그에서 상세 오류 확인

