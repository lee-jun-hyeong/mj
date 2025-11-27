import { useState } from 'react';
import { createShareLink, deactivateShareLink } from '../../services/sharing';
import './ShareButton.css';

interface ShareButtonProps {
  contiId: string;
  isPublic: boolean;
  onPublicChange?: (isPublic: boolean) => void;
}

function ShareButton({ contiId, isPublic, onPublicChange }: ShareButtonProps) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateShareLink = async () => {
    setLoading(true);
    try {
      const { shareId: id, shareToken } = await createShareLink(contiId);
      const url = `${window.location.origin}/shared/${shareToken}`;
      setShareLink(url);
      setShareId(id);
    } catch (error) {
      console.error('공유 링크 생성 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('링크 복사 오류:', error);
    }
  };

  const handleDeactivate = async () => {
    if (shareId) {
      try {
        await deactivateShareLink(shareId);
      } catch (error) {
        console.error('공유 링크 비활성화 오류:', error);
      }
    }
    setShareLink(null);
    setShareId(null);
    if (onPublicChange) {
      onPublicChange(false);
    }
  };

  return (
    <div className="share-button">
      <div className="share-controls">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => onPublicChange?.(e.target.checked)}
          />
          공개 콘티
        </label>
        {isPublic && (
          <button
            onClick={handleCreateShareLink}
            disabled={loading || !!shareLink}
            className="btn-create-link"
          >
            {loading ? '생성 중...' : '공유 링크 생성'}
          </button>
        )}
      </div>

      {shareLink && (
        <div className="share-link-container">
          <input
            type="text"
            value={shareLink}
            readOnly
            className="share-link-input"
          />
          <button onClick={handleCopyLink} className="btn-copy">
            {copied ? '복사됨!' : '복사'}
          </button>
          <button onClick={handleDeactivate} className="btn-deactivate">
            비활성화
          </button>
        </div>
      )}
    </div>
  );
}

export default ShareButton;

