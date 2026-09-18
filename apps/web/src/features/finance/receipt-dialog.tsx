'use client';

import { PrinterIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';

import type { Receipt } from './finance-data';
import { ReceiptSlip } from './receipt-slip';

interface ReceiptDialogProps {
  /** The receipt to show; null when closed. */
  receipt: Receipt | null;
  onClose: () => void;
  /** Open the print dialog as soon as the receipt shows — for Print buttons. */
  printOnOpen?: boolean;
}

/** A receipt, ready to print. */
export function ReceiptDialog({ receipt, onClose, printOnOpen = false }: ReceiptDialogProps) {
  React.useEffect(() => {
    if (!receipt || !printOnOpen) return;
    // Waits out the dialog's open animation, which would otherwise print the
    // slip half-faded.
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, [receipt, printOnOpen]);

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
