import { GroupDetail } from '@/features/groups/group-detail';

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return <GroupDetail groupId={groupId} />;
}
