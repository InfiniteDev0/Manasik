import { PilgrimDetail } from '@/features/pilgrims/pilgrim-detail';

export default async function PilgrimDetailPage({
  params,
}: {
  params: Promise<{ pilgrimId: string }>;
}) {
  const { pilgrimId } = await params;
  return <PilgrimDetail pilgrimId={pilgrimId} />;
}
