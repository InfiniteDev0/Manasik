'use client';

import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

import { ALL_COUNTRIES, CountryFlag, countryName, TOP_COUNTRY_CODES } from '@/components/country-flag';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// The agency's usual countries first (the same six as the phone field), then the rest A–Z.
const TOP_COUNTRIES = TOP_COUNTRY_CODES.flatMap((code) => ALL_COUNTRIES.filter((option) => option.code === code));
const OTHER_COUNTRIES = ALL_COUNTRIES.filter((option) => !TOP_COUNTRY_CODES.includes(option.code));

interface CountryPickerProps {
  id?: string;
  /** The country's two-letter code ("AE"), or '' before one is picked. */
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  className?: string;
}

/** Pick a country by its full name — every country, with its flag. */
export function CountryPicker({ id, value, onChange, placeholder = 'Country', className }: CountryPickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        className={cn(
          'border-input hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border px-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-3 dark:bg-input/30',
          className,
        )}
      >
        {value ? (
          <>
            <CountryFlag code={value} />
            <span className="truncate">{countryName(value)}</span>
          </>
        ) : (
          <span className="text-muted-foreground truncate">{placeholder}</span>
        )}
        <ChevronDownIcon className="text-muted-foreground ml-auto size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search country" />
          <CommandList className="max-h-72">
            <CommandEmpty>No country found.</CommandEmpty>
            {[TOP_COUNTRIES, OTHER_COUNTRIES].map((group, index) => (
              <React.Fragment key={index}>
                {index > 0 ? <CommandSeparator /> : null}
                <CommandGroup>
                  {group.map((option) => (
                    <CommandItem
                      key={option.code}
                      value={option.name}
                      onSelect={() => {
                        onChange(option.code);
                        setOpen(false);
                      }}
                    >
                      <CountryFlag code={option.code} />
                      <span className="truncate">{option.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
