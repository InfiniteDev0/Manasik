'use client';

import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';
import flags from 'react-phone-number-input/flags';
import { getCountries, getCountryCallingCode, type Country } from 'react-phone-number-input/input';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CountryOption {
  code: Country;
  name: string;
  /** The dial code, with its plus: "+254". */
  dial: string;
}

const REGION_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

const COUNTRIES: CountryOption[] = getCountries()
  .map((code) => ({ code, name: REGION_NAMES.of(code) ?? code, dial: `+${getCountryCallingCode(code)}` }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** Where the agency is, so a new number starts on +254. */
export const DEFAULT_PHONE_COUNTRY: Country = 'KE';

/** What an untouched phone field holds: the dial code, ready for the rest. */
export const DEFAULT_PHONE_VALUE = '+254 ';

/** True once something has been typed past the dial code. */
export function hasPhoneNumber(value: string): boolean {
  return /\d/.test(value.replace(/^\s*\+\d+/, ''));
}

/** The country a number starts with — the longest matching dial code wins. */
function countryFromValue(value: string): Country | undefined {
  const dial = /^\s*(\+\d+)/.exec(value)?.[1];
  if (!dial) {
    return undefined;
  }
  let best: CountryOption | undefined;
  for (const option of COUNTRIES) {
    if (dial.startsWith(option.dial) && (!best || option.dial.length > best.dial.length)) {
      best = option;
    }
  }
  return best?.code;
}

function CountryFlag({ code, className }: { code: Country; className?: string }) {
  const Flag = flags[code];
  // The flag components take only a title, so the sizing lives on the wrapper.
  return (
    <span
      className={cn(
        'flex h-3.5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-[2px]',
        '[&>svg]:h-full [&>svg]:w-full',
        className,
      )}
    >
      {Flag ? <Flag title={code} /> : <span className="text-muted-foreground text-[9px]">{code}</span>}
    </span>
  );
}

interface PhoneInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * A phone field with a country picker: choosing a country puts its dial code in
 * the input and the rest of the number is typed after it.
 */
export function PhoneInput({ id, value, onChange, placeholder = 'Phone number', className }: PhoneInputProps) {
  const [open, setOpen] = React.useState(false);
  const [country, setCountry] = React.useState<Country>(() => countryFromValue(value) ?? DEFAULT_PHONE_COUNTRY);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onCountrySelect = (option: CountryOption) => {
    setCountry(option.code);
    // Swap the dial code, keep whatever was typed after it.
    const rest = value.replace(/^\s*\+\d+\s*/, '');
    onChange(rest ? `${option.dial} ${rest}` : `${option.dial} `);
    setOpen(false);
  };

  const onValueChange = (next: string) => {
    // Follow the number if it's typed or pasted with another country's code.
    const current = COUNTRIES.find((option) => option.code === country);
    if (!current || !next.replace(/\s/g, '').startsWith(current.dial)) {
      const detected = countryFromValue(next);
      if (detected) {
        setCountry(detected);
      }
    }
    onChange(next);
  };

  return (
    <div className={cn('flex w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={`Country: ${REGION_NAMES.of(country) ?? country}`}
          className="border-input hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 shrink-0 items-center gap-1 rounded-s-lg border border-e-0 px-2.5 outline-none transition-colors focus-visible:z-1 focus-visible:ring-3 dark:bg-input/30"
        >
          <CountryFlag code={country} />
          <ChevronDownIcon className="text-muted-foreground size-3.5" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0" finalFocus={inputRef}>
          <Command>
            <CommandInput placeholder="Search country" />
            <CommandList className="max-h-64">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((option) => (
                  <CommandItem
                    key={option.code}
                    value={`${option.name} ${option.dial}`}
                    onSelect={() => onCountrySelect(option)}
                  >
                    <CountryFlag code={option.code} />
                    <span className="flex-1 truncate">{option.name}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">{option.dial}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Input
        ref={inputRef}
        id={id}
        type="tel"
        inputMode="tel"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className="h-9 rounded-s-none"
      />
    </div>
  );
}
