'use client';

import { PlaneTakeoffIcon } from 'lucide-react';
import * as React from 'react';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface Airport {
  /** IATA code: "NBO". */
  code: string;
  city: string;
  name: string;
  country: string;
  /** 0 large, 1 medium, 2 small — bigger airports come first in results. */
  rank: number;
}

type AirportRow = [code: string, city: string, name: string, country: string, rank: number];

const REGION_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

// The list (about 4,000 airports, src/data/airports.json) is only loaded the
// first time a picker shows, then shared by every picker on the page.
let airportsPromise: Promise<Airport[]> | null = null;
let airportsCache: Airport[] | null = null;

function loadAirports(): Promise<Airport[]> {
  airportsPromise ??= import('@/data/airports.json').then((module) => {
    airportsCache = (module.default as unknown as AirportRow[]).map(([code, city, name, country, rank]) => ({
      code,
      city,
      name,
      country: REGION_NAMES.of(country) ?? country,
      rank,
    }));
    return airportsCache;
  });
  return airportsPromise;
}

function useAirports(): Airport[] | null {
  const [airports, setAirports] = React.useState(airportsCache);
  React.useEffect(() => {
    if (airports) return;
    let active = true;
    loadAirports().then((loaded) => {
      if (active) setAirports(loaded);
    });
    return () => {
      active = false;
    };
  }, [airports]);
  return airports;
}

/** Shown before anything is typed: the agency's usual routes. */
const POPULAR_CODES = [
  'NBO', 'MBA', 'MGQ', 'HGA', 'BSA', 'JED', 'MED', 'DXB', 'DOH', 'IST', 'ADD', 'EBB', 'DAR', 'CAI', 'LHR', 'FRA', 'JFK',
];

const MAX_RESULTS = 50;

/**
 * Airports matching what's typed, best first: an exact code, then codes and
 * cities that start with it, then anything that contains it — bigger airports
 * ahead of smaller ones.
 */
function searchAirports(airports: Airport[], query: string): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return POPULAR_CODES.flatMap((code) => airports.filter((airport) => airport.code === code));
  }
  const scored: { airport: Airport; score: number }[] = [];
  for (const airport of airports) {
    const code = airport.code.toLowerCase();
    const city = airport.city.toLowerCase();
    let score: number;
    if (code === q) score = 0;
    else if (city.startsWith(q)) score = 1;
    else if (code.startsWith(q)) score = 2;
    else if (city.includes(q)) score = 3;
    else if (airport.name.toLowerCase().includes(q) || airport.country.toLowerCase().includes(q)) score = 4;
    else continue;
    scored.push({ airport, score });
  }
  scored.sort((a, b) => a.score - b.score || a.airport.rank - b.airport.rank || a.airport.city.localeCompare(b.airport.city));
  return scored.slice(0, MAX_RESULTS).map(({ airport }) => airport);
}

interface AirportPickerProps {
  id?: string;
  /** The airport's code ("NBO"), or whatever was typed for one that isn't listed. */
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  className?: string;
}

/** Pick an airport by code, city, airport name or country — like a flight booking app. */
export function AirportPicker({ id, value, onChange, placeholder = 'Airport', className, ...props }: AirportPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const airports = useAirports();

  const selected = airports?.find((airport) => airport.code === value);
  const results = airports ? searchAirports(airports, query) : [];
  const typed = query.trim().toUpperCase();
  // Not every airstrip is listed — let an unlisted code or town be used as typed.
  const canUseTyped = typed.length > 0 && !results.some((airport) => airport.code === typed);

  const choose = (code: string) => {
    onChange(code);
    setQuery('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-label={props['aria-label']}
        className={cn(
          'border-input hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full min-w-0 items-center gap-1.5 rounded-lg border px-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-3 dark:bg-input/30',
          className,
        )}
      >
        {value ? (
          <>
            <span className="font-semibold">{value}</span>
            {selected ? <span className="text-muted-foreground truncate text-xs">{selected.city}</span> : null}
          </>
        ) : (
          <span className="text-muted-foreground truncate">{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="City, airport or code" value={query} onValueChange={setQuery} />
          <CommandList className="max-h-72">
            {!airports ? (
              <p className="text-muted-foreground py-6 text-center text-sm">Loading airports…</p>
            ) : (
              <>
                <CommandEmpty>No airport found.</CommandEmpty>
                <CommandGroup heading={query.trim() ? undefined : 'Popular'}>
                  {results.map((airport) => (
                    <CommandItem key={airport.code} value={airport.code} onSelect={() => choose(airport.code)}>
                      <span className="w-9 shrink-0 font-mono text-xs font-semibold">{airport.code}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">
                          {airport.city}, {airport.country}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">{airport.name}</span>
                      </span>
                    </CommandItem>
                  ))}
                  {canUseTyped ? (
                    <CommandItem value={`typed-${typed}`} onSelect={() => choose(typed)}>
                      <PlaneTakeoffIcon className="text-muted-foreground" />
                      <span>
                        Use &ldquo;{typed}&rdquo;
                      </span>
                    </CommandItem>
                  ) : null}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
