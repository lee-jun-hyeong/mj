# Gemini API 키 설정 가이드

## 문제
현재 Firebase Functions Secrets에 저장된 Gemini API 키가 유효하지 않거나 중복되어 있습니다.

## 해결 방법

### 1. Gemini API 키 생성/확인

1. https://aistudio.google.com/app/apikey 접속
2. "Create API Key" 클릭 또는 기존 키 확인
3. API 키 복사 (형식: `AIzaSy...`)

### 2. Firebase Functions Secrets에 설정

```bash
# 방법 1: 대화형으로 설정
firebase functions:secrets:set GEMINI_API_KEY

# 방법 2: 직접 값 입력 (PowerShell)
echo "YOUR_API_KEY_HERE" | firebase functions:secrets:set GEMINI_API_KEY

# 방법 3: 파일에서 읽기
type gemini-key.txt | firebase functions:secrets:set GEMINI_API_KEY
```

### 3. 설정 확인

```bash
firebase functions:secrets:access GEMINI_API_KEY
```

출력이 `AIzaSy...` 형식의 단일 키여야 합니다. 중복되거나 잘못된 형식이면 다시 설정하세요.

### 4. Functions 재배포

```bash
firebase deploy --only functions
```

### 5. 테스트

이미지를 업로드하여 Gemini API가 정상 작동하는지 확인하세요.

