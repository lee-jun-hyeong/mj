import { useState, useRef, useEffect } from 'react';
import { uploadImage } from '../../lib/storage';
import { createScoreDocument } from '../../lib/firestore';
import { ScoreDocument } from '../../types/score';
import { checkFirebaseConnection } from '../../lib/firebaseDebug';
import './ImageUploader.css';

interface ImageUploaderProps {
  onUploadComplete: (score: ScoreDocument) => void;
  onCancel?: () => void;
}

export default function ImageUploader({ onUploadComplete, onCancel }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firebase 연결 상태 확인
  useEffect(() => {
    checkFirebaseConnection().then((status) => {
      if (!status.firestore || !status.storage) {
        setFirebaseStatus('⚠️ Firebase 연결에 문제가 있습니다. Firebase 설정을 확인해주세요.');
      }
    });
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Firebase Storage에 이미지 업로드
      const { url: imageUrl, filePath } = await uploadImage(file, (progress) => {
        setUploadProgress(progress.progress);
      });

      console.log('Image uploaded successfully:', imageUrl);
      console.log('File path:', filePath);

      // Firestore에 문서 생성 (파일 경로 포함)
      const scoreId = await createScoreDocument(imageUrl, filePath);
      console.log('Score document created:', scoreId);

      // 업로드 완료 - 상태 리셋하고 처리 화면으로 전환
      setIsUploading(false);
      setUploadProgress(100);

      // 즉시 처리 상태로 전환 (Functions가 트리거되기 전에 UI 업데이트)
      const initialScore: ScoreDocument = {
        id: scoreId,
        imageUrl,
        status: 'uploaded',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      onUploadComplete(initialScore);

      // 실시간 업데이트 구독 (이미 ScoreRenderer에서 처리됨)
      // 여기서는 구독하지 않고, ScoreRenderer에서 구독하도록 함

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-uploader">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p>업로드 중... {Math.round(uploadProgress)}%</p>
            {uploadProgress >= 100 ? (
              <p className="processing-note">업로드 완료! AI 분석을 기다리는 중...</p>
            ) : (
              <p className="processing-note">업로드 후 AI 분석이 시작됩니다...</p>
            )}
          </div>
        ) : (
          <div className="upload-content">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <h2>악보 이미지를 업로드하세요</h2>
            <p>드래그 앤 드롭 또는 클릭하여 파일 선택</p>
            <p className="file-types">지원 형식: JPG, PNG, GIF, WebP</p>
          </div>
        )}
      </div>

      {firebaseStatus && (
        <div className="error-message" style={{ background: '#fff3cd', borderColor: '#ffc107', color: '#856404' }}>
          <p>{firebaseStatus}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {onCancel && !isUploading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={onCancel}
            className="cancel-button"
            style={{
              background: '#f5f5f5',
              color: '#666',
              border: '1px solid #ddd',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← 목록으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}

