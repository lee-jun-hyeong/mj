# OMR 현재 상황

## 문제

현재 OMR 서비스는 **플레이스홀더 MusicXML**만 반환하고 있습니다.
- 모든 악보 이미지에 대해 동일한 "도레미파(C, D, E, F)" 4개 음표만 반환
- 실제 악보 이미지의 음표를 인식하지 못함

## 현재 구조

1. **Cloud Run OMR 서비스** (`functions/omr-server.py`)
   - 플레이스홀더 MusicXML만 반환
   - 실제 Audiveris 통합 필요

2. **Firebase Functions** (`functions/src/omrProcessor.ts`)
   - Cloud Run 서비스 호출 또는 로컬 플레이스홀더 반환

## 해결 방법

### 옵션 1: Audiveris 통합 (권장)

Audiveris는 Java 기반 오픈소스 OMR 엔진입니다.

**단계:**
1. Audiveris JAR 파일 다운로드
2. Docker 이미지에 Java와 Audiveris 포함
3. `omr-server.py`에서 Audiveris 실행
4. 생성된 MusicXML 반환

**장점:**
- 오픈소스, 무료
- 정확도 높음
- 오프라인 작동

**단점:**
- 설정 복잡
- 처리 시간 오래 걸림
- 리소스 많이 필요

### 옵션 2: 다른 OMR 서비스 사용

- **OpenOMR**: Python 기반
- **OMR 서비스 API**: 상용 서비스
- **MusicOCR**: 웹 기반 서비스

### 옵션 3: 수동 입력 (임시)

사용자가 직접 MusicXML을 입력하거나 편집할 수 있는 기능 추가

## 다음 단계

실제 OMR 처리를 원하시면:
1. Audiveris 통합 진행
2. 다른 OMR 서비스 검토
3. 수동 입력 기능 추가

어떤 방법을 선호하시나요?

