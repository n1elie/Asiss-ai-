'use client';
import { create } from 'zustand';
import * as api from '@/lib/api';
import { normalizeLanguage } from '@/lib/i18n';
import type { QuotationSession, ChatMessage, InsuranceProduct } from '@/lib/types';

const LANGUAGE_STORAGE_KEY = 'insurance.preferredLanguage';

export function getPreferredLanguage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storePreferredLanguage(language: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* ignore unavailable storage */
  }
}

interface SessionState {
  session: QuotationSession | null;
  messages: ChatMessage[];
  products: InsuranceProduct[];
  isLoading: boolean;
  isSaving: boolean;
  isSaved: boolean;
  initSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  selectProduct: (product: InsuranceProduct, label?: string) => Promise<void>;
  saveSession: () => Promise<void>;
  reopenSession: () => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  messages: [],
  products: [],
  isLoading: false,
  isSaving: false,
  isSaved: false,

  initSession: async () => {
    const [session, products] = await Promise.all([
      api.createSession(),
      api.getProducts(),
    ]);
    set({
      session,
      messages: session.messages,
      products,
      isSaved: false,
    });
  },

  loadSession: async (sessionId: string) => {
    const [session, products] = await Promise.all([
      api.getSession(sessionId),
      api.getProducts(),
    ]);
    set({
      session,
      messages: session.messages,
      products,
    });
  },

  sendMessage: async (content: string) => {
    const { session } = get();
    if (!session) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }));

    try {
      const result = await api.sendMessage(session.session_id, content);
      set({
        session: result.session,
        messages: result.session.messages,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  selectProduct: async (product: InsuranceProduct, label?: string) => {
    await get().sendMessage(label ?? product.name);
  },

  saveSession: async () => {
    const { session } = get();
    if (!session) return;
    set({ isSaving: true });
    try {
      const saved = await api.saveSession(session.session_id);
      set({ session: saved, isSaving: false, isSaved: true });
    } catch {
      set({ isSaving: false });
    }
  },

  reopenSession: async () => {
    const { session } = get();
    if (!session) return;
    set({ isSaving: true });
    try {
      const reopened = await api.reopenSession(session.session_id);
      set({ session: reopened, isSaving: false, isSaved: false });
    } catch {
      set({ isSaving: false });
    }
  },

  setLanguage: async (language: string) => {
    const { session } = get();
    if (!session) return;
    const normalized = normalizeLanguage(language);

    // Update the UI immediately so the switch always feels instant, even if
    // the network request is slow or temporarily unavailable.
    set((s) => ({
      session: s.session ? { ...s.session, language: normalized } : null,
    }));
    storePreferredLanguage(normalized);

    try {
      const updated = await api.updateLanguage(session.session_id, normalized);
      set({ session: updated, messages: updated.messages });
    } catch {
      // Keep the optimistic language so the UI never reverts unexpectedly.
    }
  },
}));
