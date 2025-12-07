# VexFlow 렌더링 코드 수정 사항

## 수정 완료된 항목

### 1. ✅ Voice beats 계산 로직 수정 (가장 중요)

**이전 코드**:
```typescript
// 마디의 실제 beats 계산
let measureBeats = 0;
measure.notes.forEach((noteData) => {
  measureBeats += durationMap[noteData.duration] || 1;
});
const voiceBeats = Math.max(1, Math.min(numBeats, Math.ceil(measureBeats)));
const voice = new Voice({
  num_beats: voiceBeats,  // ❌ 잘못된 로직
  beat_value: beatValue
});
```

**수정된 코드**:
```typescript
// Voice는 항상 박자표의 beats를 사용 (VexFlow 요구사항)
const voice = new Voice({
  num_beats: numBeats,  // ✅ 박자표의 beats 사용
  beat_value: beatValue
});
```

**이유**:
- VexFlow는 Voice의 `num_beats`가 박자표와 일치해야 함
- 마디의 실제 beats와 다를 수 있지만, VexFlow가 자동으로 처리
- 이전 로직은 "Too many ticks" 또는 "IncompleteVoice" 오류 유발 가능

### 2. ✅ 음표 위치 가져오기 개선

**이전 코드**:
```typescript
const noteX = (note as any).getAbsoluteX ? (note as any).getAbsoluteX() :
             (note as any).getX ? (note as any).getX() :
             xPosition + (notePositions.length * 30);
```

**수정된 코드**:
```typescript
try {
  const staveNote = note as any;
  if (staveNote.getAbsoluteX && typeof staveNote.getAbsoluteX === 'function') {
    notePositions.push(staveNote.getAbsoluteX());
  } else if (staveNote.getX && typeof staveNote.getX === 'function') {
    notePositions.push(staveNote.getX());
  } else {
    // 대략적인 위치 계산
    const noteSpacing = measureWidth / Math.max(notes.length, 1);
    notePositions.push(xPosition + (index * noteSpacing));
  }
} catch (e) {
  // 오류 발생 시 대략적인 위치 계산
  const noteSpacing = measureWidth / Math.max(notes.length, 1);
  notePositions.push(xPosition + (index * noteSpacing));
}
```

**개선 사항**:
- 타입 체크 추가 (`typeof === 'function'`)
- try-catch로 오류 처리
- 더 정확한 위치 계산 (measureWidth 기반)

### 3. ✅ 조표 매핑 개선

**추가된 조표**:
- Minor keys: Bm, F#m, C#m, G#m, Bbm, Fm, Cm, Gm, Cbm
- 에러 처리 추가

### 4. ✅ Formatter 변수 저장

**이전**: `new Formatter().joinVoices([voice]).format([voice], measureWidth - 20);`
**수정**: Formatter 인스턴스를 변수에 저장하여 재사용 가능

## 예상 효과

1. **Voice beats 오류 해결**: "Too many ticks", "IncompleteVoice" 오류 감소
2. **코드/가사 위치 정확도 향상**: 음표 위치 계산 개선
3. **안정성 향상**: 에러 처리 추가로 런타임 오류 감소

## 테스트 권장 사항

1. 다양한 박자표 테스트 (3/4, 4/4, 2/4 등)
2. 마디의 beats가 박자표와 다른 경우 테스트
3. 다양한 조표 테스트
4. 코드와 가사 위치 확인

