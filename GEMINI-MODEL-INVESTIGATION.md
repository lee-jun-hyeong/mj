# Gemini 모델 이름 오류 조사 결과

## 문제 분석

### 오류 메시지
```
[404 Not Found] models/gemini-pro-vision is not found for API version v1beta,
or is not supported for generateContent.
```

### 조사 결과

#### 1. API 버전 문제
- 현재 사용 중: `v1beta` API 버전
- 일부 모델은 `v1` API 버전에서만 지원될 수 있음
- `@google/generative-ai` 패키지가 내부적으로 `v1beta`를 사용하고 있을 가능성

#### 2. 모델 이름 문제
검색 결과에서 확인된 모델 이름들:
- `gemini-pro-vision` - 멀티모달 지원 (이미지 + 텍스트)
- `gemini-1.5-pro` - 최신 버전
- `gemini-1.5-flash` - 빠른 버전
- `gemini-1.5-pro-latest` - 최신 안정 버전
- `gemini-2.5-flash` - 최신 버전 (일부 문서에서 언급)

하지만 실제로는 모두 404 오류 발생

#### 3. 패키지 버전
- 현재 사용 중: `@google/generative-ai@^0.21.0`
- 패키지 버전과 모델 호환성 문제 가능성

#### 4. 접근 권한 문제
- API 키가 특정 모델에 대한 접근 권한이 없을 수 있음
- 일부 모델은 프리뷰 상태로 제한적 접근

## 해결 방안

### 방법 1: 모델 목록 API로 확인
실제 사용 가능한 모델을 API로 조회:
```typescript
const genAI = new GoogleGenerativeAI(apiKey);
const models = await genAI.listModels();
console.log(models);
```

### 방법 2: Google AI Studio에서 확인
1. https://aistudio.google.com/ 접속
2. Get Started 클릭
3. 코드 예제에서 실제 사용되는 모델 이름 확인

### 방법 3: 패키지 업데이트
최신 버전의 `@google/generative-ai` 패키지로 업데이트하여 최신 모델 지원 확인

### 방법 4: 모델 이름 시도
다음 모델들을 순차적으로 시도:
1. `gemini-1.5-flash` (가장 빠르고 안정적)
2. `gemini-1.5-pro-latest` (최신 안정 버전)
3. `gemini-pro` (기본 모델, 이미지 지원 여부 확인 필요)

## 권장 사항

1. **Google AI Studio에서 실제 작동하는 모델 이름 확인**
2. **패키지를 최신 버전으로 업데이트**
3. **API 키 권한 확인**
4. **모델 목록 API로 실제 사용 가능한 모델 확인**

