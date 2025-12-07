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
  chordPositions?: number[]; // 각 코드가 어떤 beat에 위치하는지
  lyricPositions?: number[]; // 각 가사가 어떤 beat에 위치하는지
}

export interface NoteData {
  pitch: string; // "C4", "D#4" 등
  duration: string; // "whole", "half", "quarter", "eighth", "sixteenth"
  rest?: boolean;
  beat?: number; // 마디 내에서의 beat 위치 (0부터 시작)
}

