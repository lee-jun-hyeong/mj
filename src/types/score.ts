export interface ScoreData {
  title: string;
  composer?: string;
  timeSignature: string;
  keySignature: string;
  staves: StaffData[];
}

export interface StaffData {
  clef: string;
  measures: MeasureData[];
}

export interface MeasureData {
  notes: NoteData[];
  chords?: string[];
  lyrics?: string[];
  chordPositions?: number[]; // 각 코드가 어떤 beat에 위치하는지 (chords 배열과 인덱스 매칭)
  lyricPositions?: number[]; // 각 가사가 어떤 beat에 위치하는지 (lyrics 배열과 인덱스 매칭)
  startX?: number; // 마디의 시작 X 위치 (이미지 내에서의 상대 위치, 0.0 ~ 1.0)
  // 예: 이미지 왼쪽 끝 = 0.0, 오른쪽 끝 = 1.0
  // 이 값이 없으면 자동으로 균등 배치
}

export interface NoteData {
  pitch: string; // "C4", "D#4" 등
  duration: string; // "whole", "half", "quarter", "eighth", "sixteenth"
  rest?: boolean;
  beat?: number; // 마디 내에서의 beat 위치 (0부터 시작, quarter note = 1 beat)
  // 예: 4/4 박자에서 첫 번째 quarter note = 0, 두 번째 = 1, 세 번째 = 2, 네 번째 = 3
}

export interface ScoreDocument {
  id: string;
  imageUrl: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  scoreData?: ScoreData;
  originalKey?: string;
  transposedKey?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

