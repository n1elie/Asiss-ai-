import type { QuotationSession } from './types';

export interface RecentQuotation {
  id: string;
  ref: string;
  productId?: string;
  productName?: string;
  customer?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'insurance.recentQuotations';
const MAX_ITEMS = 8;
const EMPTY_RECENTS: RecentQuotation[] = [];

let cached: RecentQuotation[] | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function readFromStorage(): RecentQuotation[] {
  if (typeof window === 'undefined') return EMPTY_RECENTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_RECENTS;
    const parsed = JSON.parse(raw) as RecentQuotation[];
    if (!Array.isArray(parsed)) return EMPTY_RECENTS;
    return parsed.filter((item) => item && typeof item.id === 'string').slice(0, MAX_ITEMS);
  } catch {
    return EMPTY_RECENTS;
  }
}

export function subscribeRecentQuotations(listener: () => void) {
  listeners.add(listener);

  if (typeof window === 'undefined') {
    return () => {
      listeners.delete(listener);
    };
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cached = null;
    listener();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function getRecentQuotations(): RecentQuotation[] {
  if (cached === null) cached = readFromStorage();
  return cached;
}

export function getServerRecentQuotations(): RecentQuotation[] {
  return EMPTY_RECENTS;
}

function persist(items: RecentQuotation[]) {
  cached = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable */
  }
  emit();
}

export function rememberQuotation(session: QuotationSession): RecentQuotation[] {
  const next: RecentQuotation = {
    id: session.session_id,
    ref: session.quotation_ref,
    productId: session.selected_product,
    productName: session.selected_product_name,
    customer: session.insured_party.full_name,
    updatedAt: Date.now(),
  };

  const existing = getRecentQuotations().filter((item) => item.id !== session.session_id);
  const updated = [next, ...existing].slice(0, MAX_ITEMS);
  persist(updated);
  return updated;
}

export function forgetQuotation(sessionId: string): RecentQuotation[] {
  const updated = getRecentQuotations().filter((item) => item.id !== sessionId);
  persist(updated);
  return updated;
}
