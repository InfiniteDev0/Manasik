'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES, currencyLabel, formatMoney, type Currency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface CalculatedAmountProps {
  id?: string;
  /** null until there's enough to work it out. */
  value: number | null;
  currency: Currency;
  /** Shown until then: how it's worked out, e.g. "Collected − net". */
  formula: string;
}

/** An amount that isn't typed — worked out from the others, like a commission. */
export function CalculatedAmount({ id, value, currency, formula }: CalculatedAmountProps) {
  return (
    <output
      id={id}
      className="bg-muted/50 text-foreground flex h-9 items-center justify-between rounded-lg border px-2.5 text-sm tabular-nums"
    >
      <span className={value === null ? 'text-muted-foreground' : undefined}>
        {value === null ? formula : formatMoney(value, currency)}
      </span>
      <span className="text-muted-foreground text-xs">auto</span>
    </output>
  );
}

interface MoneyInputProps {
  id?: string;
  /** The amount as typed, so a half-typed "12." isn't lost. */
  value: string;
  onValueChange: (value: string) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/** An amount with its currency (USD or KSh) picked on the right, joined into one field. */
export function MoneyInput({
  id,
  value,
  onValueChange,
  currency,
  onCurrencyChange,
  placeholder,
  required,
  className,
}: MoneyInputProps) {
  return (
    <div className={cn('flex w-full', className)}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="h-9 min-w-0 flex-1 rounded-e-none border-e-0 tabular-nums focus-visible:z-1"
      />
      <Select value={currency} onValueChange={(next: string | null) => next && onCurrencyChange(next as Currency)}>
        <SelectTrigger aria-label="Currency" className="h-9 shrink-0 rounded-s-none focus-visible:z-1">
          <SelectValue>{currencyLabel(currency)}</SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {CURRENCIES.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
