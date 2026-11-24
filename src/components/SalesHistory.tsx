import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { SaleCategory, SeasonKey, SteamSaleEvent } from '../data/steamSales';
import {
  filterHistoricalSales,
  formatEventDateRange,
  getCategoryLabel,
  getDurationDays,
  getYearlyCadenceSummary,
  type TimezoneMode,
} from '../utils/salesLogic';

interface SalesHistoryProps {
  events: SteamSaleEvent[];
  nowMs: number;
  timezoneMode: TimezoneMode;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HISTORY_YEARS: (number | 'all')[] = ['all', 2026, 2025, 2024, 2023, 2022];

const SEASON_BAR_COLOR: Record<SeasonKey, string> = {
  spring: 'bg-[#7DD3FC]',
  summer: 'bg-[#E5A93B]',
  autumn: 'bg-[#D97736]',
  winter: 'bg-[#66C0F4]',
};

export function SalesHistory({ events, nowMs, timezoneMode }: SalesHistoryProps) {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<SaleCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedEventId, setInspectedEventId] = useState<string>('autumn-sale-2025');

  const cadenceRows = useMemo(
    () => getYearlyCadenceSummary(events, [2026, 2025, 2024, 2023, 2022]),
    [events]
  );

  const historicalEvents = useMemo(
    () =>
      filterHistoricalSales(events, nowMs, selectedYear, selectedCategory, searchQuery),
    [events, nowMs, selectedYear, selectedCategory, searchQuery]
  );

  const inspectedEvent = useMemo(
    () => events.find((e) => e.id === inspectedEventId) ?? null,
    [events, inspectedEventId]
  );

  return (
    <section
      id="history"
      aria-labelledby="history-heading"
      className="scroll-mt-16 border-b border-white/[0.08] py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="history-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[#F1F5F9] sm:text-3xl"
          >
            Steam Sales History &amp; Annual Cadence
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
            Historical record of Valve’s four major seasonal sales from 2022 through 2026. Notice
            how Valve moved the Autumn Sale from late November into early October starting in 2025.
          </p>
        </div>

        {/* Multi-Year Seasonal Cadence Visual Timeline */}
        <div className="mt-10 rounded-xl border border-white/[0.08] bg-[#121A24] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#94A3B8]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#7DD3FC]" aria-hidden="true" />
                <span>Spring (7d)</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#E5A93B]" aria-hidden="true" />
                <span>Summer (14d)</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#D97736]" aria-hidden="true" />
                <span>Autumn (7d)</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#66C0F4]" aria-hidden="true" />
                <span>Winter (14–18d)</span>
              </span>
            </div>

            {inspectedEvent && (
              <div className="text-xs text-[#CBD5E1] tabular-nums">
                <span className="font-medium text-[#F1F5F9]">{inspectedEvent.shortName}</span>
                <span className="mx-2 text-white/25" aria-hidden="true">
                  ·
                </span>
                <span>{formatEventDateRange(inspectedEvent, timezoneMode)}</span>
                <span className="mx-2 text-white/25" aria-hidden="true">
                  ·
                </span>
                <span>{getDurationDays(inspectedEvent)} days</span>
              </div>
            )}
          </div>

          {/* 12-Month Scale Header */}
          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[64px_1fr_72px] items-center gap-4 pb-2 text-[11px] font-medium text-[#8A9BB0]">
                <span>Year</span>
                <div className="grid grid-cols-12">
                  {MONTHS.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
                <span className="text-right">Days / Yr</span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {cadenceRows.map((row) => (
                  <div
                    key={row.year}
                    className="grid grid-cols-[64px_1fr_72px] items-center gap-4 py-3"
                  >
                    <span className="font-mono text-xs font-medium text-[#CBD5E1] tabular-nums">
                      {row.year}
                    </span>

                    <div className="relative h-7 rounded-md bg-[#0B1016] border border-white/[0.06]">
                      {/* Subtle monthly vertical gridlines */}
                      <div
                        className="pointer-events-none absolute inset-0 grid grid-cols-12 divide-x divide-white/[0.04]"
                        aria-hidden="true"
                      >
                        {MONTHS.map((m) => (
                          <div key={m} />
                        ))}
                      </div>

                      {row.segments.map((seg) => {
                        const seasonKey = seg.event.season ?? 'winter';
                        const isSelected = inspectedEventId === seg.event.id;
                        return (
                          <button
                            key={seg.event.id}
                            type="button"
                            onClick={() => setInspectedEventId(seg.event.id)}
                            onMouseEnter={() => setInspectedEventId(seg.event.id)}
                            aria-label={`${seg.event.name}, ${formatEventDateRange(
                              seg.event,
                              timezoneMode
                            )}, ${seg.durationDays} days`}
                            style={{
                              left: `${seg.startPercent}%`,
                              width: `${seg.widthPercent}%`,
                            }}
                            className={`absolute top-1 bottom-1 rounded-xs transition-opacity duration-150 cursor-pointer ${
                              SEASON_BAR_COLOR[seasonKey]
                            } ${
                              isSelected
                                ? 'opacity-100 ring-2 ring-white/80'
                                : 'opacity-80 hover:opacity-100'
                            }`}
                          />
                        );
                      })}
                    </div>

                    <span className="text-right font-mono text-xs text-[#94A3B8] tabular-nums">
                      {row.totalSaleDays}d
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filterable Historical Archive Table */}
        <div className="mt-12">
          <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="tablist"
                aria-label="Filter sale history by year"
                className="inline-flex items-center gap-1 overflow-x-auto rounded-lg border border-white/[0.08] bg-[#121A24] p-1"
              >
                {HISTORY_YEARS.map((yr) => {
                  const active = selectedYear === yr;
                  return (
                    <button
                      key={String(yr)}
                      role="tab"
                      type="button"
                      aria-selected={active}
                      onClick={() => setSelectedYear(yr)}
                      className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                        active
                          ? 'bg-white/[0.14] text-[#F1F5F9]'
                          : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                      }`}
                    >
                      {yr === 'all' ? 'All Years' : String(yr)}
                    </button>
                  );
                })}
              </div>

              <span className="text-xs text-[#8A9BB0] tabular-nums">
                {historicalEvents.length}{' '}
                {historicalEvents.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="history-category-select" className="text-xs text-[#94A3B8]">
                  Category
                </label>
                <select
                  id="history-category-select"
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value as SaleCategory | 'all')
                  }
                  className="h-9 rounded-lg border border-white/[0.1] bg-[#121A24] pl-3 pr-8 text-xs text-[#F1F5F9] focus:border-[#66C0F4] focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="major">Major Seasonal</option>
                  <option value="fest">Themed Fests</option>
                  <option value="next-fest">Next Fest</option>
                </select>
              </div>

              <div className="relative min-w-[210px]">
                <label htmlFor="history-search" className="sr-only">
                  Search historical Steam sales
                </label>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]"
                  aria-hidden="true"
                />
                <input
                  id="history-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search past sales..."
                  className="h-9 w-full rounded-lg border border-white/[0.1] bg-[#121A24] pl-8 pr-8 text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#66C0F4] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear history search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#F1F5F9] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {historicalEvents.length === 0 ? (
            <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-[#121A24]/60 px-6 py-12 text-center">
              <p className="text-sm font-medium text-[#E2E8F0]">
                No historical sales match these filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedYear('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-4 rounded-lg border border-white/[0.12] px-4 py-2 text-xs font-medium text-[#E2E8F0] transition-colors hover:bg-white/[0.06] cursor-pointer"
              >
                Show All History
              </button>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table
                data-testid="history-sales-table"
                className="w-full min-w-[640px] border-collapse text-left text-sm"
              >
                <thead>
                  <tr className="border-b border-white/[0.08] text-xs font-medium text-[#94A3B8]">
                    <th className="py-3 pr-4 font-medium">Sale Event</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Dates</th>
                    <th className="px-4 py-3 text-right font-medium">Length</th>
                    <th className="py-3 pl-4 font-medium">Archive Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {historicalEvents.map((sale) => (
                    <tr
                      key={sale.id}
                      className="transition-colors duration-150 hover:bg-white/[0.025]"
                    >
                      <td className="py-3.5 pr-4 font-medium text-[#F1F5F9]">
                        {sale.name}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#94A3B8] whitespace-nowrap">
                        {getCategoryLabel(sale.category)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-[#CBD5E1] tabular-nums whitespace-nowrap">
                        {formatEventDateRange(sale, timezoneMode)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-[#94A3B8] tabular-nums whitespace-nowrap">
                        {getDurationDays(sale)}d
                      </td>
                      <td className="py-3.5 pl-4 text-xs text-[#8A9BB0]">
                        {sale.highlightNote ?? sale.summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Three-Column Valve Storefront Discount Rules Reference */}
        <div className="mt-14 grid grid-cols-1 gap-8 border-t border-white/[0.08] pt-10 md:grid-cols-3">
          <div>
            <h3 className="font-display text-base font-semibold text-[#F1F5F9]">
              01. 10:00 AM Pacific Launch Standard
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              Every official Steam Seasonal Sale and Themed Fest opens and closes at 10:00 AM
              Pacific Time (18:00 UTC in winter, 17:00 UTC during Daylight Saving Time).
            </p>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold text-[#F1F5F9]">
              02. 30-Day Cooldown Exemption
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              Publishers must normally wait 30 days between custom discounts, but Steam’s four
              Major Seasonal Sales are exempt — letting games return to sale immediately.
            </p>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold text-[#F1F5F9]">
              03. Autumn Shift &amp; Winter Flagship
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              Starting in 2025, Valve moved the Autumn Sale to early October and expanded the
              Winter Sale to 18 days, giving more breathing room before holiday discounts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
