import { PackageDetail } from '@/features/packages/package-detail';

// `params` is a Promise in Next 16 — awaiting it is required, not optional.
export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const { packageId } = await params;
  return <PackageDetail packageId={packageId} />;
}
