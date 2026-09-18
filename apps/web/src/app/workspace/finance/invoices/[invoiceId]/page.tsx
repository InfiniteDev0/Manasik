import { InvoiceView } from '@/features/finance/invoice-view';

export default async function Page({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        <InvoiceView invoiceId={invoiceId} />
      </div>
    </div>
  );
}
