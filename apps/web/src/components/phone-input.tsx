'use client';

import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';
import { getCountryCallingCode } from 'react-phone-number-input/input';

import {
  ALL_COUNTRIES as COUNTRY_NAMES,
  CountryFlag,
  countryName,
  TOP_COUNTRY_CODES,
  type Country,
} from '@/components/country-flag';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
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

const ALL_COUNTRIES: CountryOption[] = COUNTRY_NAMES.map(({ code, name }) => ({
  code,
  name,
  dial: `+${getCountryCallingCode(code)}`,
}));

const TOP_COUNTRIES = TOP_COUNTRY_CODES.flatMap((code) => ALL_COUNTRIES.filter((option) => option.code === code));
const OTHER_COUNTRIES = ALL_COUNTRIES.filter((option) => !TOP_COUNTRY_CODES.includes(option.code));

/** Top countries first — so they also win when a dial code is shared (+1 is the US, +44 the UK). */
const COUNTRIES: CountryOption[] = [...TOP_COUNTRIES, ...OTHER_COUNTRIES];

/** Where the agency is, so a new number starts on +254. */
export const DEFAULT_PHONE_COUNTRY: Country = 'KE';

/** What an untouched phone field holds: the dial code, ready for the rest. */
export const DEFAULT_PHONE_VALUE = '+254 ';

/** True once something has been typed past the dial code. */
export function hasPhoneNumber(value: string): boolean {
  return /\d/.test(value.replace(/^\s*\+\d+/, ''));
}

/** The country a number starts with — the longest matching dial code wins; on a tie, the one listed first. */
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
          aria-label={`Country: ${countryName(country)}`}
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
              {[TOP_COUNTRIES, OTHER_COUNTRIES].map((group, index) => (
                <React.Fragment key={index}>
                  {index > 0 ? <CommandSeparator /> : null}
                  <CommandGroup>
                    {group.map((option) => (
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
                </React.Fragment>
              ))}
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
