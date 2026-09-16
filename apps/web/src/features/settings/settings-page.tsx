'use client';

import type { Currency } from '@manasik/types';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/workspace/page-header';
import { useCurrentUser } from '@/features/auth/current-user';
import { DEFAULT_CURRENCY } from '@/lib/money';
import { t } from '@/lib/strings';

const CURRENCIES: Currency[] = ['USD', 'KES', 'SAR', 'AED', 'GBP', 'EUR'];

const TIMEZONES = [
  'Africa/Nairobi',
  'Africa/Mogadishu',
  'Africa/Dar_es_Salaam',
  'Asia/Riyadh',
  'Europe/London',
];

/**
 * Settings.
 *
 * <p>Agency details are editable locally only — there is no table behind them
 * yet, so Save reports success without persisting. That is called out in the
 * UI rather than hidden, because a form that silently discards input is worse
 * than one that admits it.
 *
 * <p>No members or billing: Manasik has a single admin account for now.
 */
export function SettingsPage() {
  const user = useCurrentUser();

  const [form, setForm] = React.useState({
    name: '',
    country: 'KE',
    currency: DEFAULT_CURRENCY as Currency,
    timezone: 'Africa/Nairobi',
    contactEmail: user.email,
    contactPhone: '',
  });
  const [saved, setSaved] = React.useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <Card>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('settings.organizationName')}</Label>
              <Input value={form.name} onChange={(event) => set('name', event.target.value)} />
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('settings.country')}</Label>
              <Input value={form.country} onChange={(event) => set('country', event.target.value)} />
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('settings.currency')}</Label>
              <Select
                value={form.currency}
                onValueChange={(value: unknown) => set('currency', value as Currency)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Packages are priced in this currency. Hajj and Umrah are normally quoted in USD.
              </p>
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('settings.timezone')}</Label>
              <Select
                value={form.timezone}
                onValueChange={(value: unknown) => set('timezone', String(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('settings.contactEmail')}</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(event) => set('contactEmail', event.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('settings.contactPhone')}</Label>
              <Input
                value={form.contactPhone}
                onChange={(event) => set('contactPhone', event.target.value)}
                placeholder="+254 712 345 678"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 border-t pt-4">
            <Button onClick={() => setSaved(true)}>{t('common.saveChanges')}</Button>
            {saved ? (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                {t('settings.saved')}
              </span>
            ) : null}
            <span className="ml-auto text-xs text-muted-foreground">
              Not persisted yet — there is no agency table behind this form.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
