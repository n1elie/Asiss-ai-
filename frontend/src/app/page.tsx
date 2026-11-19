'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spin } from 'antd';
import { createSession, updateLanguage } from '@/lib/api';
import { getPreferredLanguage } from '@/store/sessionStore';

export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    createSession()
      .then(async (session) => {
        const preferred = getPreferredLanguage();
        if (preferred && preferred !== session.language) {
          try {
            const updated = await updateLanguage(session.session_id, preferred);
            if (!cancelled) router.replace(`/session/${updated.session_id}`);
            return;
          } catch {
            /* fall back to the default language */
          }
        }
        if (!cancelled) router.replace(`/session/${session.session_id}`);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            'Could not reach the backend. Make sure it is running on http://127.0.0.1:8000.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, attempt]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
      background: 'var(--bg)',
      textAlign: 'center',
    }}>
      {error ? (
        <>
          <p style={{ color: 'var(--danger)', fontFamily: 'Roboto, sans-serif', fontSize: 13, maxWidth: 460 }}>
            {error}
          </p>
          <Button
            type="primary"
            onClick={() => {
              setError('');
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </>
      ) : (
        <>
          <Spin size="large" />
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'Roboto, sans-serif', fontSize: 13 }}>
            Starting your session…
          </p>
        </>
      )}
    </div>
  );
}
