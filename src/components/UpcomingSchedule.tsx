import { useMemo, useState } from 'react';
import { CalendarPlus, Clock, Search, X } from 'lucide-react';
import type { SaleCategory, SteamSaleEvent } from '../data/steamSales';
import {
  filterUpcomingSales,
  formatEventDateRange,
  getCategoryLabel,
  getDaysUntilStart,
  getDurationDays,
  getEventStatus,
  type TimezoneMode,
} from '../utils/salesLogic';
import { SeasonalImage } from './SeasonalImage';

interface UpcomingScheduleProps {
  events: SteamSaleEvent[];
  nowMs: number;
  timezoneMode: TimezoneMode;
  focusedEventId: string;
  onSelectEvent: (event: SteamSaleEvent) => void;
  onDownloadIcs: (event: SteamSaleEvent) => void;
}

const FILTER_TABS: { value: SaleCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Upcoming' },
  { value: 'major', label: 'Major Seasonal' },
  { value: 'fest', label: 'Themed Fests' },
  { value: 'next-fest', label: 'Next Fest' },
];

export function UpcomingSchedule({
  events,
  nowMs,
  timezoneMode,
  focusedEventId,
  onSelectEvent,
  onDownloadIcs,
}: UpcomingScheduleProps) {
  const [categoryFilter, setCategoryFilter] = useState<SaleCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const upcomingMajors = useMemo(
    () =>
      filterUpcomingSales(events, nowMs, 'major', '').slice(0, 4),
    [events, nowMs]
  );

  const filteredUpcoming = useMemo(
    () => filterUpcomingSales(events, nowMs, categoryFilter, searchQuery),
    [events, nowMs, categoryFilter, searchQuery]
  );

  return (
    <section
      id="upcoming"
      aria-labelledby="upcoming-heading"
      className="scroll-mt-16 border-b border-white/[0.08] py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="upcoming-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[#F1F5F9] sm:text-3xl"
          >
            Upcoming Steam Sales &amp; Fests
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
            Official storewide seasonal sales and themed category fests announced by Valve for
            2026–2027. Pin any event to the countdown clock or export an .ics calendar reminder.
          </p>
        </div>

        {/* Four Seasonal Major Sale Showcase Cards */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {upcomingMajors.map((sale) => {
            const status = getEventStatus(sale, nowMs);
            const daysAway = getDaysUntilStart(sale, nowMs);
            const duration = getDurationDays(sale);
            const isTracked = focusedEventId === sale.id;

            return (
              <article
                key={sale.id}
                className={`group flex flex-col overflow-hidden rounded-xl border transition-colors duration-150 ${
                  isTracked
                    ? 'border-[#66C0F4]/60 bg-[#121C28]'
                    : 'border-white/[0.08] bg-[#121A24] hover:border-white/[0.16]'
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0F1620]">
                  <SeasonalImage
                    season={sale.season ?? 'winter'}
                    className="transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121A24] via-[#121A24]/30 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xs font-medium text-[#E2E8F0] tabular-nums">
                      {status === 'live'
                        ? 'Live right now'
                        : daysAway === 0
                        ? 'Starts in < 24h'
                        : daysAway === 1
                        ? 'In 1 day'
                        : `In ${daysAway} days`}
                    </span>
                    <span className="text-xs text-[#CBD5E1]/90 tabular-nums">
                      {duration}d
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <span>{sale.status === 'confirmed' ? 'Confirmed' : 'Projected'}</span>
                    <span aria-hidden="true" className="text-white/25">
                      ·
                    </span>
                    <span className="tabular-nums">
                      {formatEventDateRange(sale, timezoneMode)}
                    </span>
                  </div>

                  <h3 className="mt-2 font-display text-lg font-semibold text-[#F1F5F9]">
                    {sale.shortName}
                  </h3>

                  <p className="mt-2 flex-1 text-xs leading-relaxed text-[#94A3B8]">
                    {sale.highlightNote ?? sale.summary}
                  </p>

                  <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4">
                    <button
                      type="button"
                      onClick={() => onSelectEvent(sale)}
                      aria-label={`Track ${sale.shortName} in countdown`}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                        isTracked
                          ? 'bg-[#66C0F4]/15 text-[#66C0F4]'
                          : 'bg-white/[0.06] text-[#E2E8F0] hover:bg-white/[0.12]'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{isTracked ? 'Tracking' : 'Track Countdown'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDownloadIcs(sale)}
                      aria-label={`Download calendar reminder for ${sale.shortName}`}
                      title="Download .ics calendar reminder"
                      className="inline-flex h-8 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-[#94A3B8] transition-colors duration-150 hover:border-white/20 hover:text-[#F1F5F9] cursor-pointer"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Full Upcoming Schedule Ledger with Segmented Filter & Live Search */}
        <div className="mt-14">
          <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-display text-lg font-semibold text-[#F1F5F9]">
                Full 2026–2027 Event Calendar
              </h3>
              <span className="text-xs text-[#8A9BB0] tabular-nums">
                {filteredUpcoming.length}{' '}
                {filteredUpcoming.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                role="tablist"
                aria-label="Filter upcoming Steam events by type"
                className="inline-flex items-center gap-1 overflow-x-auto rounded-lg border border-white/[0.08] bg-[#121A24] p-1"
              >
                {FILTER_TABS.map((tab) => {
                  const active = categoryFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      role="tab"
                      type="button"
                      aria-selected={active}
                      onClick={() => setCategoryFilter(tab.value)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                        active
                          ? 'bg-white/[0.12] text-[#F1F5F9]'
                          : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[220px]">
                <label htmlFor="upcoming-search" className="sr-only">
                  Search upcoming Steam events
                </label>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]"
                  aria-hidden="true"
                />
                <input
                  id="upcoming-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fests or sales..."
                  className="h-9 w-full rounded-lg border border-white/[0.1] bg-[#121A24] pl-8 pr-8 text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#66C0F4] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear upcoming event search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#F1F5F9] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredUpcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-[#121A24]/60 px-6 py-12 text-center mt-5">
              <p className="text-sm font-medium text-[#E2E8F0]">
                No upcoming Steam events match your filter.
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Try clearing your search query or switching back to All Upcoming.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 rounded-lg border border-white/[0.12] px-4 py-2 text-xs font-medium text-[#E2E8F0] transition-colors hover:bg-white/[0.06] cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table
                data-testid="upcoming-events-table"
                className="w-full min-w-[680px] border-collapse text-left text-sm"
              >
                <thead>
                  <tr className="border-b border-white/[0.08] text-xs font-medium text-[#94A3B8]">
                    <th className="py-3 pr-4 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Window</th>
                    <th className="px-4 py-3 text-right font-medium">Duration</th>
                    <th className="px-4 py-3 text-right font-medium">Countdown</th>
                    <th className="py-3 pl-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredUpcoming.map((sale) => {
                    const status = getEventStatus(sale, nowMs);
                    const daysAway = getDaysUntilStart(sale, nowMs);
                    const duration = getDurationDays(sale);
                    const isTracked = focusedEventId === sale.id;

                    return (
                      <tr
                        key={sale.id}
                        className={`transition-colors duration-150 ${
                          isTracked ? 'bg-[#66C0F4]/[0.06]' : 'hover:bg-white/[0.025]'
                        }`}
                      >
                        <td className="py-3.5 pr-4">
                          <div className="font-medium text-[#F1F5F9]">{sale.name}</div>
                          <div className="mt-0.5 text-xs text-[#8A9BB0] line-clamp-1">
                            {sale.summary}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                          <span
                            className={
                              sale.category === 'major'
                                ? 'font-medium text-[#E5A93B]'
                                : sale.category === 'next-fest'
                                ? 'text-[#66C0F4]'
                                : 'text-[#94A3B8]'
                            }
                          >
                            {getCategoryLabel(sale.category)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-[#CBD5E1] tabular-nums whitespace-nowrap">
                          {formatEventDateRange(sale, timezoneMode)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-[#94A3B8] tabular-nums whitespace-nowrap">
                          {duration}d
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                          {status === 'live' ? (
                            <span className="font-medium text-[#4ADE80]">Live now</span>
                          ) : daysAway === 0 ? (
                            <span className="text-[#CBD5E1]">&lt; 24h</span>
                          ) : (
                            <span className="text-[#CBD5E1]">In {daysAway}d</span>
                          )}
                        </td>
                        <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectEvent(sale)}
                              aria-label={`Focus ${sale.name} in hero countdown`}
                              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                isTracked
                                  ? 'bg-[#66C0F4]/20 text-[#66C0F4]'
                                  : 'text-[#CBD5E1] hover:bg-white/[0.08] hover:text-white'
                              }`}
                            >
                              {isTracked ? 'Active' : 'Track'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDownloadIcs(sale)}
                              aria-label={`Download .ics file for ${sale.name}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-white/[0.08] hover:text-white cursor-pointer"
                            >
                              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
