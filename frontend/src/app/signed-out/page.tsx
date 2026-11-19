'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import AppLogo from '@/components/atoms/AppLogo';
import { normalizeLanguage, t } from '@/lib/i18n';

const LANGUAGE_STORAGE_KEY = 'insurance.preferredLanguage';

function subscribe() {
  return () => {};
}

function getLanguageSnapshot() {
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? undefined);
  } catch {
    return 'English';
  }
}

function getServerLanguageSnapshot() {
  return 'English';
}

export default function SignedOutPage() {
  const router = useRouter();
  const language = useSyncExternalStore(subscribe, getLanguageSnapshot, getServerLanguageSnapshot);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        padding: 24,
        background: 'var(--bg)',
        textAlign: 'center',
      }}
    >
      <AppLogo />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420 }}>
        <h1 style={{ fontSize: 22, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          {t(language, 'signedOutTitle')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.55 }}>
          {t(language, 'signedOutBody')}
        </p>
      </div>
      <Button type="primary" size="large" onClick={() => router.push('/')}>
        {t(language, 'signInAs')}
      </Button>
    </div>
  );
}
