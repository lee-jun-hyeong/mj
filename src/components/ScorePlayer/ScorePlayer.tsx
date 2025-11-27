import { useState, useEffect } from 'react';
import { MusicPlayer } from '../../lib/musicPlayer';
import { useScore } from '../../hooks/useScore';
import './ScorePlayer.css';

interface ScorePlayerProps {
  scoreId: string;
}

function ScorePlayer({ scoreId }: ScorePlayerProps) {
  const { score } = useScore(scoreId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player] = useState(() => new MusicPlayer());

  useEffect(() => {
    return () => {
      player.stop();
    };
  }, [player]);

  const handlePlay = async () => {
    if (!score) return;

    if (isPlaying) {
      player.stop();
      setIsPlaying(false);
    } else {
      try {
        const notes = player.parseMusicXMLToNotes(score.musicXml);
        await player.playNotes(notes);
        setIsPlaying(true);

        // 재생 완료 감지
        const checkInterval = setInterval(() => {
          if (!player.getIsPlaying()) {
            setIsPlaying(false);
            clearInterval(checkInterval);
          }
        }, 100);
      } catch (error) {
        console.error('재생 오류:', error);
        alert('오디오를 재생하려면 페이지를 클릭한 후 다시 시도해주세요.');
      }
    }
  };

  const handleStop = () => {
    player.stop();
    setIsPlaying(false);
  };

  if (!score) {
    return null;
  }

  return (
    <div className="score-player">
      <div className="player-controls">
        <button
          onClick={handlePlay}
          className={`btn-play ${isPlaying ? 'playing' : ''}`}
          disabled={!score.musicXml}
        >
          {isPlaying ? '⏸ 일시정지' : '▶ 재생'}
        </button>
        <button
          onClick={handleStop}
          className="btn-stop"
          disabled={!isPlaying}
        >
          ⏹ 정지
        </button>
      </div>
      {!score.musicXml && (
        <p className="player-message">악보 데이터가 없습니다.</p>
      )}
    </div>
  );
}

export default ScorePlayer;

