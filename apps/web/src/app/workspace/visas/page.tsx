import { VisasTable } from '@/features/visas/visas-table';

export default function VisasPage() {
  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        <VisasTable />
      </div>
    </div>
  );
}
