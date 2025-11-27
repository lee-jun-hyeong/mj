import * as Tone from 'tone';
import { parseMusicXML } from './musicXmlParser';

export interface Note {
  pitch: string;
  duration: number;
  startTime: number;
}

export class MusicPlayer {
  private synth: Tone.Synth | null = null;
  private isPlaying = false;
  private startTime = 0;

  constructor() {
    this.synth = new Tone.Synth().toDestination();
  }

  async playNotes(notes: Note[]) {
    if (this.isPlaying) {
      this.stop();
    }

    // Tone.js 시작 (사용자 제스처 후에만 가능)
    try {
      await Tone.start();
    } catch (error) {
      console.error('AudioContext 시작 오류:', error);
      throw new Error('오디오를 재생하려면 사용자 상호작용이 필요합니다.');
    }

    this.isPlaying = true;
    this.startTime = Tone.now();

    // 각 노트 재생
    notes.forEach((note) => {
      const time = this.startTime + note.startTime;
      this.synth?.triggerAttackRelease(note.pitch, note.duration, time);
    });

    // 재생 완료 시간 계산
    const totalDuration = Math.max(...notes.map((n) => n.startTime + n.duration));
    setTimeout(() => {
      this.isPlaying = false;
    }, totalDuration * 1000);
  }

  stop() {
    if (this.synth) {
      this.synth.dispose();
      this.synth = new Tone.Synth().toDestination();
    }
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // MusicXML에서 노트 추출
  parseMusicXMLToNotes(musicXml: string): Note[] {
    if (!musicXml || musicXml.trim() === '') {
      return [];
    }

    try {
      const measures = parseMusicXML(musicXml);
      const notes: Note[] = [];
      let currentTime = 0;
      const tempo = 120; // 기본 템포 (BPM)
      const beatDuration = 60 / tempo; // 한 박자의 초 단위 길이

      measures.forEach((measure) => {
        const timeSignature = measure.timeSignature || { beats: 4, beatType: 4 };
        const beatValue = timeSignature.beatType;

        measure.notes.forEach((note) => {
          // VexFlow duration을 초 단위로 변환
          const duration = this.convertDurationToSeconds(note.duration, beatValue, beatDuration);

          // VexFlow pitch를 Tone.js 형식으로 변환
          const tonePitch = this.convertToTonePitch(note.pitch);

          notes.push({
            pitch: tonePitch,
            duration,
            startTime: currentTime,
          });

          currentTime += duration;
        });
      });

      return notes;
    } catch (error) {
      console.error('MusicXML 파싱 오류:', error);
      return [];
    }
  }

  private convertDurationToSeconds(vexDuration: string, _beatType: number, beatDuration: number): number {
    // VexFlow duration을 초 단위로 변환
    const durationMap: { [key: string]: number } = {
      'w': beatDuration * 4, // whole note
      'h': beatDuration * 2,  // half note
      '4': beatDuration,     // quarter note
      '8': beatDuration / 2, // eighth note
      '16': beatDuration / 4, // 16th note
      '32': beatDuration / 8, // 32nd note
    };

    return durationMap[vexDuration] || beatDuration;
  }

  private convertToTonePitch(vexPitch: string): string {
    // VexFlow 형식 (예: 'c/4', 'c#/4')을 Tone.js 형식 (예: 'C4', 'C#4')으로 변환
    const [note, octave] = vexPitch.split('/');
    const noteUpper = note.charAt(0).toUpperCase() + note.slice(1);
    return `${noteUpper}${octave}`;
  }
}

