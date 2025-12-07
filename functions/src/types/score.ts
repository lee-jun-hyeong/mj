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
}

export interface NoteData {
  pitch: string; // "C4", "D#4" 등
  duration: string; // "whole", "half", "quarter", "eighth", "sixteenth"
  rest?: boolean;
}

