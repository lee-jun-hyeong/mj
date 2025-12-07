import { ScoreData } from '../types/score';

// 제공된 이미지의 샘플 데이터 (3개 보표, 각 3마디)
export const sampleScoreData: ScoreData = {
  title: "샘플 악보",
  composer: "Unknown",
  timeSignature: "3/4",
  keySignature: "C",
  staves: [
    {
      clef: "treble",
      measures: [
        // 첫 번째 보표
        {
          notes: [
            { pitch: "A4", duration: "quarter", rest: false }
          ],
          chords: ["Bm7"],
          lyrics: ["함께과도"]
        },
        {
          notes: [
            { pitch: "A4", duration: "quarter", rest: false }
          ],
          chords: ["Bm7"],
          lyrics: ["함께와도"]
        },
        {
          notes: [
            { pitch: "A4", duration: "quarter", rest: false }
          ],
          chords: ["Bm7"],
          lyrics: ["함께"]
        },
        // 두 번째 보표
        {
          notes: [
            { pitch: "A4", duration: "quarter", rest: false }
          ],
          chords: ["Bm7sus4"],
          lyrics: ["함께"]
        },
        {
          notes: [
            { pitch: "A4", duration: "quarter", rest: false }
          ],
          chords: ["Bm7sus4"],
          lyrics: ["하신"]
        },
        {
          notes: [
            { pitch: "A4", duration: "quarter", rest: false }
          ],
          chords: ["Bm7sus4"],
          lyrics: ["함께라"]
        },
        // 세 번째 보표
        {
          notes: [
            { pitch: "A4", duration: "quarter", rest: false }
          ],
          chords: ["Bm7sus4"],
          lyrics: ["함께과도"]
        },
        {
          notes: [
            { pitch: "A4", duration: "quarter", rest: false }
          ],
          chords: ["Bm7sus4"],
          lyrics: ["함께와도"]
        },
        {
          notes: [
            { pitch: "A4", duration: "quarter", rest: false }
          ],
          chords: ["Bm7sus4"],
          lyrics: ["함께"]
        }
      ]
    }
  ]
};

