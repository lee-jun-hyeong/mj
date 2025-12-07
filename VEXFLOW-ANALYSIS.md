# VexFlow 렌더링 코드 분석 결과

## 발견된 문제점

### 1. Voice beats 계산 로직 오류 ⚠️ 심각

**위치**: `src/lib/vexflowRenderer.ts:149-150`

```typescript
const voiceBeats = Math.max(1, Math.min(numBeats, Math.ceil(measureBeats)));
```

**문제점**:
- 마디의 실제 beats가 박자표보다 작으면 잘못된 값이 설정됨
- 예: 4/4 박자인데 마디에 3 beats만 있으면 3으로 설정 → VexFlow 오류 가능
- `Math.min(numBeats, ...)` 로직이 잘못됨
- **올바른 방법**: 항상 박자표의 `num_beats`를 사용해야 함

**수정 필요**:
```typescript
// 항상 박자표의 num_beats 사용
const voice = new Voice({
  num_beats: numBeats,  // 박자표의 beats 사용
  beat_value: beatValue
});
```

### 2. 조표 매핑 불완전 ⚠️ 중간

**위치**: `src/lib/vexflowRenderer.ts:96-102`

**문제점**:
- F major는 매핑에 있지만, VexFlow가 실제로 지원하는 형식인지 확인 필요
- minor 키 매핑이 제한적 (Am, Em, Dm만 있음)
- Bb 같은 플랫이 있는 경우 조표를 제대로 표시하지 못할 수 있음

**개선 필요**:
- VexFlow가 지원하는 조표 형식 확인
- 모든 major/minor 키 매핑 추가

### 3. 음표 위치 가져오기 불안정 ⚠️ 중간

**위치**: `src/lib/vexflowRenderer.ts:167-182`

**문제점**:
- `getAbsoluteX()`, `getX()` 메서드가 실제로 존재하는지 불확실
- 타입 캐스팅 `(note as any)` 사용 → 런타임 오류 가능
- 코드와 가사 위치가 부정확할 수 있음

**개선 필요**:
- VexFlow API 문서 확인하여 올바른 메서드 사용
- 또는 Formatter가 계산한 위치 사용

### 4. 마디 처리 로직 복잡성 ⚠️ 낮음

**위치**: `src/lib/vexflowRenderer.ts:139-162`

**문제점**:
- 각 마디마다 별도의 Voice 생성 → 올바른 방법이지만
- measureBeats 계산이 불필요할 수 있음
- Formatter의 format 너비 계산이 정확한지 확인 필요

### 5. 조표가 없을 때 처리 ⚠️ 낮음

**이미지 설명**: 조표가 없음 (C major 또는 F major일 수 있음)
**현재 코드**: keySignature가 없으면 조표를 추가하지 않음 → 올바름

하지만 Bb4 같은 플랫이 있는 경우:
- 조표가 없으면 → F major일 가능성
- 또는 임시표(accidental)로 처리해야 함

## 우선순위별 개선 사항

### 🔴 높은 우선순위 (즉시 수정 필요)

1. **Voice beats 계산 수정**
   - 박자표의 `num_beats`를 항상 사용
   - 마디의 실제 beats와 일치하지 않아도 VexFlow가 자동으로 처리

### 🟡 중간 우선순위

2. **조표 매핑 개선**
   - VexFlow 지원 조표 형식 확인
   - 모든 major/minor 키 추가

3. **음표 위치 가져오기 개선**
   - VexFlow API 문서 확인
   - 올바른 메서드 사용

### 🟢 낮은 우선순위

4. **코드 정리 및 최적화**
   - 불필요한 계산 제거
   - 주석 개선

## 결론

**VexFlow 렌더링 자체는 문제가 없지만, Voice beats 계산 로직이 잘못되어 있습니다.**

가장 중요한 문제는 **Voice의 `num_beats`를 박자표가 아닌 마디의 실제 beats로 설정하는 것**입니다. 이는 VexFlow의 "Too many ticks" 또는 "IncompleteVoice" 오류를 유발할 수 있습니다.

