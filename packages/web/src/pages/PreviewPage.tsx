import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DrawioEmbed } from '../components/PreviewPanel/DrawioEmbed';
import { Spinner } from '../components/common/Spinner';

export const PreviewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [xml, setXml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Session not found');
        return res.json();
      })
      .then((data) => {
        setXml(data.xml);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="h-screen">
      <DrawioEmbed xml={xml} />
    </div>
  );
};
