import { DASHBOARD_STATS } from '@/features/dashboard/mock-data';
import { PeriodSelect } from '@/features/dashboard/period-select';
import { StatCard } from '@/features/dashboard/stat-card';

/*
 * Page structure follows the dashboard-01 block: a `@container/main` wrapper,
 * and breakpoints that respond to the content area's width rather than the
 * window's — so collapsing or opening the sidebar reflows the cards.
 */
export default function DashboardPage() {
  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-light tracking-tight text-neutral-950 @3xl/main:text-3xl dark:text-neutral-50">
            Complete Overview Of Your Travel Operations
          </h2>
          <PeriodSelect />
        </div>

        {/* Four across when there's room — one topic per row (see mock-data.ts)
            — two across on medium widths, stacked when narrow. */}
        <div className="grid auto-rows-min gap-4 @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
          {DASHBOARD_STATS.map((stat) => (
            <StatCard key={stat.id} {...stat} />
          ))}
        </div>
      </div>
    </div>
  );
}
