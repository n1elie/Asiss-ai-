import SessionLayout from '@/components/templates/SessionLayout';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { id } = await params;
  return <SessionLayout sessionId={id} />;
}
