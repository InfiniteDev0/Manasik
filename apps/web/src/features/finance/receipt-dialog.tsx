'use client';

import { PrinterIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';

import type { Receipt } from './finance-data';
import { ReceiptSlip } from './receipt-slip';

interface ReceiptDialogProps {
  /** The receipt to show; null when closed. */
  receipt: Receipt | null;
  onClose: () => void;
}

/** A receipt, ready to print. */
export function ReceiptDialog({ receipt, onClose }: ReceiptDialogProps) {
  return (
    <Dialog open={receipt !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Receipt {receipt?.number}</DialogTitle>
        <DialogDescription>It&apos;s also kept on the Receipts page.</DialogDescription>

        {receipt ? (
          <div className="mx-auto w-fit shadow-md ring-1 ring-black/5">
            <ReceiptSlip receipt={receipt} />
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.print()}>
            <PrinterIcon />
            Print / Save as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
