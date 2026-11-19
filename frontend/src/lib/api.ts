import axios from 'axios';
import type { QuotationSession, ChatMessage, InsuranceProduct } from './types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export const createSession = async (): Promise<QuotationSession> => {
  const { data } = await api.post('/api/sessions');
  return data;
};

export const getSession = async (sessionId: string): Promise<QuotationSession> => {
  const { data } = await api.get(`/api/sessions/${sessionId}`);
  return data;
};

export const saveSession = async (sessionId: string): Promise<QuotationSession> => {
  const { data } = await api.post(`/api/sessions/${sessionId}/save`);
  return data;
};

export const reopenSession = async (sessionId: string): Promise<QuotationSession> => {
  const { data } = await api.post(`/api/sessions/${sessionId}/reopen`);
  return data;
};

export const sendMessage = async (
  sessionId: string,
  message: string
): Promise<{ session: QuotationSession; assistant_message: ChatMessage }> => {
  const { data } = await api.post(`/api/sessions/${sessionId}/chat`, { message });
  return data;
};

export const getProducts = async (): Promise<InsuranceProduct[]> => {
  const { data } = await api.get('/api/products');
  return data;
};

export const updateLanguage = async (
  sessionId: string,
  language: string
): Promise<QuotationSession> => {
  const { data } = await api.post(`/api/sessions/${sessionId}/language`, { language });
  return data;
};
