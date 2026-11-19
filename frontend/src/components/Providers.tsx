'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'insurance.theme';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  resolved: 'light',
  setMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (typeof window === 'undefined') {
    return () => {
      listeners.delete(listener);
    };
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onMediaChange = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) listener();
  };

  media.addEventListener('change', onMediaChange);
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', onMediaChange);
    window.removeEventListener('storage', onStorage);
  };
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* storage unavailable */
  }
  return 'system';
}

function prefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getModeSnapshot(): ThemeMode {
  return readStoredMode();
}

function getModeServerSnapshot(): ThemeMode {
  return 'system';
}

function getSystemSnapshot(): ResolvedTheme {
  return prefersDark() ? 'dark' : 'light';
}

function getSystemServerSnapshot(): ResolvedTheme {
  return 'light';
}

export default function Providers({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getModeSnapshot, getModeServerSnapshot);
  const systemTheme = useSyncExternalStore(subscribe, getSystemSnapshot, getSystemServerSnapshot);
  const resolved: ResolvedTheme = mode === 'system' ? systemTheme : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
    emit();
  }, []);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  const isDark = resolved === 'dark';

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: isDark ? '#19c37d' : '#10a37f',
            colorInfo: isDark ? '#19c37d' : '#10a37f',
            colorBgContainer: isDark ? '#2f2f2f' : '#ffffff',
            colorBgElevated: isDark ? '#2f2f2f' : '#ffffff',
            colorBgLayout: isDark ? '#212121' : '#ffffff',
            colorText: isDark ? '#ececec' : '#0d0d0d',
            colorTextSecondary: isDark ? '#b4b4b4' : '#5d5d5d',
            colorTextTertiary: isDark ? '#8e8e8e' : '#8f8f8f',
            colorBorder: isDark ? '#3a3a3a' : '#e6e6e6',
            colorBorderSecondary: isDark ? '#333333' : '#f0f0f0',
            borderRadius: 10,
            fontSize: 13,
            controlHeight: 34,
            fontFamily:
              "'Roboto', sans-serif",
          },
          components: {
            Button: { borderRadius: 10, fontWeight: 500 },
            Select: { borderRadius: 8 },
            Modal: { borderRadiusLG: 16 },
            Tag: { borderRadiusSM: 6 },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
