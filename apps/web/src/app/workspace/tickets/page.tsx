import { TicketsTable } from '@/features/tickets/tickets-table';

export default function TicketsPage() {
  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        <TicketsTable />
      </div>
    </div>
  );
}
