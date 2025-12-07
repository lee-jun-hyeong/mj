import { useState } from 'react';
import ImageUploader from './components/ImageUploader/ImageUploader';
import ScoreRenderer from './components/ScoreRenderer/ScoreRenderer';
import ScoreList from './components/ScoreList/ScoreList';
import { ScoreDocument } from './types/score';
import { sampleScoreData } from './lib/testData';
import './App.css';

type ViewMode = 'list' | 'upload' | 'score';

function App() {
  const [currentScore, setCurrentScore] = useState<ScoreDocument | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const isDevelopment = import.meta.env.DEV;

  // 테스트 모드: 샘플 데이터로 바로 테스트
  const handleTestMode = () => {
    const testScore: ScoreDocument = {
      id: 'test-score-123',
      imageUrl: 'https://via.placeholder.com/800x600?text=Test+Score+Image',
      status: 'completed',
      scoreData: sampleScoreData,
      originalKey: 'C',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCurrentScore(testScore);
    setViewMode('score');
  };

  const handleSelectScore = (score: ScoreDocument) => {
    setCurrentScore(score);
    setViewMode('score');
  };

  const handleUploadComplete = (score: ScoreDocument) => {
    setCurrentScore(score);
    setViewMode('score');
  };

  const handleBack = () => {
    setCurrentScore(null);
    setViewMode('list');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>악보 분석 및 렌더링</h1>
        <p>악보 이미지를 업로드하면 AI가 분석하여 VexFlow로 렌더링합니다</p>
        {isDevelopment && (
          <button
            onClick={handleTestMode}
            className="test-mode-button"
            title="샘플 데이터로 바로 테스트"
          >
            🧪 테스트 모드 (샘플 데이터)
          </button>
        )}
      </header>

      <main className="app-main">
        {viewMode === 'list' && (
          <ScoreList
            onSelectScore={handleSelectScore}
            onUploadNew={() => setViewMode('upload')}
          />
        )}
        {viewMode === 'upload' && (
          <ImageUploader
            onUploadComplete={handleUploadComplete}
            onCancel={() => setViewMode('list')}
          />
        )}
        {viewMode === 'score' && currentScore && (
          <ScoreRenderer
            score={currentScore}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}

export default App;

