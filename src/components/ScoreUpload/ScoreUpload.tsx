import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { uploadScoreImage } from '../../services/storage';
import { createScore, updateScore } from '../../services/firestore';
import { processOMR } from '../../services/omr';
import './ScoreUpload.css';

interface ScoreUploadProps {
  onUploadComplete?: (scoreId: string) => void;
}

function ScoreUpload({ onUploadComplete }: ScoreUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setUploading(true);
    setProcessing(false);
    setError(null);

    try {
      // 먼저 Firestore에 저장하여 scoreId 생성 (임시 MusicXML)
      const tempMusicXml = '<?xml version="1.0" encoding="UTF-8"?><score-partwise></score-partwise>';
      const scoreId = await createScore({
        userId: user.uid,
        title: title || file.name,
        musicXml: tempMusicXml,
        imageUrl: '', // 임시로 빈 값
      });

      // 이미지 업로드
      const imageUrl = await uploadScoreImage(user.uid, scoreId, file);

      // 이미지 URL 업데이트
      await updateScore(scoreId, { imageUrl });

      // OMR 처리 시작
      setUploading(false);
      setProcessing(true);

      try {
        // OMR 처리로 MusicXML 추출
        const musicXml = await processOMR(imageUrl);

        // MusicXML 업데이트
        await updateScore(scoreId, { musicXml });

        if (onUploadComplete) {
          onUploadComplete(scoreId);
        }
      } catch (omrError) {
        console.error('OMR 처리 오류:', omrError);
        // OMR 실패해도 악보는 저장됨 (나중에 다시 처리 가능)
        setError('악보는 업로드되었지만 음표 인식에 실패했습니다. 나중에 다시 시도할 수 있습니다.');
        if (onUploadComplete) {
          onUploadComplete(scoreId);
        }
      } finally {
        setProcessing(false);
      }

      // 초기화
      setTitle('');
      if (event.target) {
        event.target.value = '';
      }
    } catch (err) {
      console.error('업로드 오류:', err);
      setError('업로드 중 오류가 발생했습니다.');
      setUploading(false);
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="score-upload">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="score-upload">
      <h3>악보 업로드</h3>
      <div className="upload-form">
        <input
          type="text"
          placeholder="악보 제목 (선택사항)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
          disabled={uploading || processing}
        />
        <label className="file-input-label">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading || processing}
            className="file-input"
          />
          {uploading ? '업로드 중...' : processing ? '음표 인식 중...' : '악보 이미지 선택'}
        </label>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

export default ScoreUpload;

