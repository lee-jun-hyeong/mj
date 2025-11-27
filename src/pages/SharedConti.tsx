import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getShareLinkByToken } from '../services/sharing';
import { getConti } from '../services/firestore';
import { Conti } from '../types/conti';
import ContiDetail from './ContiDetail';
import './SharedConti.css';

function SharedConti() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [conti, setConti] = useState<Conti | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedConti = async () => {
      if (!shareToken) {
        setError('공유 토큰이 없습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const shareLink = await getShareLinkByToken(shareToken);

        if (!shareLink) {
          setError('유효하지 않은 공유 링크입니다.');
          setLoading(false);
          return;
        }

        const contiData = await getConti(shareLink.contiId);
        if (!contiData) {
          setError('콘티를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        if (!contiData.isPublic) {
          setError('이 콘티는 비공개입니다.');
          setLoading(false);
          return;
        }

        setConti(contiData);
      } catch (err) {
        console.error('공유 콘티 로드 오류:', err);
        setError('콘티를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadSharedConti();
  }, [shareToken]);

  if (loading) {
    return <div className="shared-conti loading">콘티를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="shared-conti error">{error}</div>;
  }

  if (!conti) {
    return <div className="shared-conti">콘티를 찾을 수 없습니다.</div>;
  }

  return <ContiDetail />;
}

export default SharedConti;

