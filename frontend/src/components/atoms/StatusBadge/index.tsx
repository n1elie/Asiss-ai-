import { Tag } from 'antd';
import type { SessionStatus } from '@/lib/types';
import { normalizeLanguage } from '@/lib/i18n';

const config: Record<
  SessionStatus,
  { color: string; label: Record<'English' | 'French', string> }
> = {
  IN_PROGRESS: {
    color: 'processing',
    label: { English: 'IN PROGRESS', French: 'EN COURS' },
  },
  COMPLETE: {
    color: 'success',
    label: { English: 'COMPLETE', French: 'TERMINÉ' },
  },
  SAVED: {
    color: 'cyan',
    label: { English: 'SAVED', French: 'ENREGISTRÉ' },
  },
};

interface Props {
  status: SessionStatus;
  language?: string;
}

export default function StatusBadge({ status, language }: Props) {
  const item = config[status] ?? config.IN_PROGRESS;
  const { color } = item;
  const label = item.label[normalizeLanguage(language)];
  return (
    <Tag
      color={color}
      style={{ margin: 0, fontWeight: 600, fontSize: 10, letterSpacing: '0.05em' }}
    >
      {label}
    </Tag>
  );
}
