import { useState } from 'react';
import { CalendarPlus, Check, Copy, RotateCcw } from 'lucide-react';
import type { SeasonKey, SteamSaleEvent } from '../data/steamSales';
import {
  calculateInterSaleProgress,
  formatEventDateRange,
  formatEventStartTimestamp,
  getCategoryLabel,
  getCountdownParts,
  getDurationDays,
  getEventStatus,
  type TimezoneMode,
  type WishlistSummary,
} from '../utils/salesLogic';
import { SeasonalImage } from './SeasonalImage';

interface HeroCountdownProps {
  allEvents: SteamSaleEvent[];
  focusedEvent: SteamSaleEvent;
  defaultMajorEvent: SteamSaleEvent | null;
  nextAnyEvent: SteamSaleEvent | null;
  nextFestEvent: SteamSaleEvent | null;
  isCustomSelection: boolean;
  focusMode: 'major' | 'any';
  onChangeFocusMode: (mode: 'major' | 'any') => void;
  onResetSelection: () => void;
  nowMs: number;
  timezoneMode: TimezoneMode;
  onChangeTimezone: (mode: TimezoneMode) => void;
  onDownloadIcs: (event: SteamSaleEvent) => void;
  onSelectEvent: (event: SteamSaleEvent) => void;
  wishlistSummary: WishlistSummary;
}

function padTwo(value: number): string {
  return String(value).padStart(2, '0');
}

export function HeroCountdown({
  allEvents,
  focusedEvent,
  defaultMajorEvent,
  nextAnyEvent,
  nextFestEvent,
  isCustomSelection,
  focusMode,
  onChangeFocusMode,
  onResetSelection,
  nowMs,
  timezoneMode,
  onChangeTimezone,
  onDownloadIcs,
  onSelectEvent,
  wishlistSummary,
}: HeroCountdownProps) {
  const [copied, setCopied] = useState(false);

  const status = getEventStatus(focusedEvent, nowMs);
  const targetTimestamp =
    status === 'live'
      ? Date.parse(focusedEvent.endIso)
      : Date.parse(focusedEvent.startIso);
  const countdown = getCountdownParts(nowMs, targetTimestamp);
  const durationDays = getDurationDays(focusedEvent);
  const progress = calculateInterSaleProgress(allEvents, focusedEvent, nowMs);
  const heroSeason: SeasonKey = focusedEvent.season ?? 'winter';

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?sale=${encodeURIComponent(
      focusedEvent.id
    )}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  const statusText =
    status === 'live'
      ? 'Live Now'
      : focusedEvent.status === 'confirmed'
      ? 'Confirmed by Valve'
      : 'Projected Date';

  return (
    <section
      id="countdown"
      aria-label="Next Steam Sale Countdown"
      className="relative scroll-mt-16 overflow-hidden border-b border-white/[0.08]"
    >
      {/* Full-bleed atmospheric seasonal illustration with measured contrast scrim */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <SeasonalImage season={heroSeason} priority className="opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1016] via-[#0B1016]/88 to-[#0B1016]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1016] via-transparent to-[#0B1016]/60" />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-6 pt-12 pb-14 lg:px-8 lg:pt-16 lg:pb-16">
        {/* Top utility strip: Event scope segmented switch + Timezone switch */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Countdown target scope"
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#121A24]/90 p-1 backdrop-blur-sm"
            >
              <button
                type="button"
                onClick={() => onChangeFocusMode('major')}
                aria-pressed={!isCustomSelection && focusMode === 'major'}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                  !isCustomSelection && focusMode === 'major'
                    ? 'bg-[#66C0F4] text-[#081018] font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                Next Major Sale
              </button>
              <button
                type="button"
                onClick={() => onChangeFocusMode('any')}
                aria-pressed={!isCustomSelection && focusMode === 'any'}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                  !isCustomSelection && focusMode === 'any'
                    ? 'bg-[#66C0F4] text-[#081018] font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                Next Store Event
              </button>
            </div>

            {isCustomSelection && (
              <button
                type="button"
                onClick={onResetSelection}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#121A24]/90 px-3 py-1.5 text-xs font-medium text-[#CBD5E1] whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[#66C0F4]/50 hover:text-white cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset to Next Sale</span>
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Timezone display"
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#121A24]/90 p-1 backdrop-blur-sm"
          >
            {(['local', 'PT', 'UTC'] as TimezoneMode[]).map((tz) => {
              const label =
                tz === 'local' ? 'Local Time' : tz === 'PT' ? 'Pacific (PT)' : 'UTC';
              return (
                <button
                  key={tz}
                  type="button"
                  onClick={() => onChangeTimezone(tz)}
                  aria-pressed={timezoneMode === tz}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                    timezoneMode === tz
                      ? 'bg-white/[0.14] text-[#F1F5F9]'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Hero Focal Block */}
        <div className="max-w-3xl">
          {/* Clean unboxed metadata line (zero pills!) */}
          <p className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-[#94A3B8]">
            <span className="font-medium text-[#66C0F4]">
              {getCategoryLabel(focusedEvent.category)}
            </span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span className="tabular-nums">
              {formatEventDateRange(focusedEvent, timezoneMode)}
            </span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span className="tabular-nums">{durationDays} days</span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span
              className={
                status === 'live'
                  ? 'font-medium text-[#4ADE80]'
                  : focusedEvent.status === 'confirmed'
                  ? 'text-[#CBD5E1]'
                  : 'text-[#E5A93B]'
              }
            >
              {statusText}
            </span>
          </p>

          <h1
            data-testid="hero-sale-title"
            className="font-display text-[clamp(2.25rem,4.4vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-[#F1F5F9] [text-wrap:balance]"
          >
            {focusedEvent.name}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#CBD5E1]/90">
            {focusedEvent.summary}
          </p>

          {/* Monumental Tabular Horological Countdown */}
          <div
            data-testid="hero-countdown-clock"
            aria-live="off"
            className="mt-9 grid max-w-2xl grid-cols-4 divide-x divide-white/[0.1] rounded-xl border border-white/[0.1] bg-[#0F1620]/88 backdrop-blur-md"
          >
            {[
              { label: 'Days', value: String(countdown.days) },
              { label: 'Hours', value: padTwo(countdown.hours) },
              { label: 'Minutes', value: padTwo(countdown.minutes) },
              { label: 'Seconds', value: padTwo(countdown.seconds) },
            ].map((unit) => (
              <div key={unit.label} className="px-3 py-5 sm:px-6 sm:py-6">
                <div className="font-mono text-3xl font-semibold tracking-tight text-[#F1F5F9] tabular-nums sm:text-5xl">
                  {unit.value}
                </div>
                <div className="mt-1.5 text-xs font-medium text-[#94A3B8] sm:text-sm">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>

          {/* Exact Start/End Timestamp & Inter-sale Progress Bar */}
          <div className="mt-6 max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8]">
              <span data-testid="hero-start-timestamp" className="tabular-nums">
                {status === 'live' ? 'Sale ends: ' : 'Starts: '}
                <strong className="font-medium text-[#E2E8F0]">
                  {formatEventStartTimestamp(focusedEvent, timezoneMode)}
                </strong>
              </span>
              {progress.previousEvent && status !== 'live' && (
                <span className="tabular-nums">
                  {Math.round(progress.percent)}% through the {progress.totalGapDays}-day wait since{' '}
                  {progress.previousEvent.shortName}
                </span>
              )}
              {status === 'live' && (
                <span className="tabular-nums">
                  {Math.round(progress.percent)}% elapsed
                </span>
              )}
            </div>

            <div
              role="progressbar"
              aria-label="Countdown progress between seasonal sales"
              aria-valuenow={Math.round(progress.percent)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]"
            >
              <div
                className="h-full rounded-full bg-[#66C0F4] transition-transform duration-300"
                style={{ width: `${Math.max(2, Math.min(100, progress.percent))}%` }}
              />
            </div>
          </div>

          {/* Primary & Secondary Action Row */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onDownloadIcs(focusedEvent)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#66C0F4] px-5 py-2.5 text-sm font-semibold text-[#081018] whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#82CDF7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#66C0F4] cursor-pointer"
            >
              <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Download .ics Reminder</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/[0.14] bg-[#121A24]/85 px-4 py-2.5 text-sm font-medium text-[#E2E8F0] whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-white/25 hover:bg-[#18222F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#66C0F4] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[#4ADE80]" aria-hidden="true" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[#94A3B8]" aria-hidden="true" />
                  <span>Copy Share Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Full-Width 4-Column Key Fact Strip Below Hero */}
        <div className="mt-12 grid grid-cols-1 gap-4 border-t border-white/[0.08] pt-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-white/[0.08]">
          <div className="lg:pr-6">
            {defaultMajorEvent ? (
              <button
                type="button"
                onClick={() => onSelectEvent(defaultMajorEvent)}
                aria-label={`Focus ${defaultMajorEvent.shortName} in countdown`}
                className="group w-full rounded-lg py-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#66C0F4] cursor-pointer"
              >
                <p className="text-xs font-medium text-[#94A3B8]">Next Major Seasonal Sale</p>
                <p className="mt-1.5 font-display text-base font-semibold text-[#F1F5F9] transition-colors group-hover:text-[#66C0F4]">
                  {defaultMajorEvent.shortName}
                </p>
                <p className="mt-0.5 text-xs text-[#8A9BB0] tabular-nums">
                  {formatEventDateRange(defaultMajorEvent, timezoneMode)}
                </p>
              </button>
            ) : (
              <div className="py-1">
                <p className="text-xs font-medium text-[#94A3B8]">Next Major Seasonal Sale</p>
                <p className="mt-1.5 font-display text-base font-semibold text-[#F1F5F9]">TBA</p>
                <p className="mt-0.5 text-xs text-[#8A9BB0]">Awaiting Valve schedule</p>
              </div>
            )}
          </div>

          <div className="lg:px-6">
            {nextAnyEvent ? (
              <button
                type="button"
                onClick={() => onSelectEvent(nextAnyEvent)}
                aria-label={`Focus ${nextAnyEvent.shortName} in countdown`}
                className="group w-full rounded-lg py-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#66C0F4] cursor-pointer"
              >
                <p className="text-xs font-medium text-[#94A3B8]">Immediate Next Store Event</p>
                <p className="mt-1.5 font-display text-base font-semibold text-[#F1F5F9] transition-colors group-hover:text-[#66C0F4]">
                  {nextAnyEvent.shortName}
                </p>
                <p className="mt-0.5 text-xs text-[#8A9BB0] tabular-nums">
                  {formatEventDateRange(nextAnyEvent, timezoneMode)}
                </p>
              </button>
            ) : (
              <div className="py-1">
                <p className="text-xs font-medium text-[#94A3B8]">Immediate Next Store Event</p>
                <p className="mt-1.5 font-display text-base font-semibold text-[#F1F5F9]">TBA</p>
                <p className="mt-0.5 text-xs text-[#8A9BB0]">No upcoming event</p>
              </div>
            )}
          </div>

          <div className="lg:px-6">
            {nextFestEvent ? (
              <button
                type="button"
                onClick={() => onSelectEvent(nextFestEvent)}
                aria-label={`Focus ${nextFestEvent.shortName} in countdown`}
                className="group w-full rounded-lg py-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#66C0F4] cursor-pointer"
              >
                <p className="text-xs font-medium text-[#94A3B8]">Next Themed Fest</p>
                <p className="mt-1.5 font-display text-base font-semibold text-[#F1F5F9] transition-colors group-hover:text-[#66C0F4]">
                  {nextFestEvent.shortName}
                </p>
                <p className="mt-0.5 text-xs text-[#8A9BB0] tabular-nums">
                  {formatEventDateRange(nextFestEvent, timezoneMode)}
                </p>
              </button>
            ) : (
              <div className="py-1">
                <p className="text-xs font-medium text-[#94A3B8]">Next Themed Fest</p>
                <p className="mt-1.5 font-display text-base font-semibold text-[#F1F5F9]">TBA</p>
                <p className="mt-0.5 text-xs text-[#8A9BB0]">Awaiting schedule</p>
              </div>
            )}
          </div>

          <div className="lg:pl-6">
            <a
              href="#planner"
              className="group block rounded-lg py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#66C0F4]"
            >
              <p className="text-xs font-medium text-[#94A3B8]">Planned Sale Wishlist</p>
              <p className="mt-1.5 font-mono text-base font-semibold text-[#F1F5F9] tabular-nums transition-colors group-hover:text-[#66C0F4]">
                ${wishlistSummary.totalSalePrice.toFixed(2)}{' '}
                <span className="font-sans text-xs font-normal text-[#94A3B8]">
                  ({wishlistSummary.includedCount}{' '}
                  {wishlistSummary.includedCount === 1 ? 'game' : 'games'})
                </span>
              </p>
              <p className="mt-0.5 text-xs text-[#8A9BB0] tabular-nums">
                Est. savings ${wishlistSummary.totalSavings.toFixed(2)} ({wishlistSummary.avgDiscountPct}% avg off)
              </p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
