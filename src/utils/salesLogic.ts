import type { SaleCategory, SteamSaleEvent, WishlistGame } from '../data/steamSales';

export type SaleStatus = 'live' | 'upcoming' | 'ended';
export type TimezoneMode = 'local' | 'PT' | 'UTC';

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isComplete: boolean;
}

export interface InterSaleProgress {
  percent: number;
  previousEvent: SteamSaleEvent | null;
  elapsedDays: number;
  totalGapDays: number;
}

export interface YearlyCadenceSegment {
  event: SteamSaleEvent;
  startPercent: number;
  widthPercent: number;
  durationDays: number;
}

export interface YearlyCadenceRow {
  year: number;
  segments: YearlyCadenceSegment[];
  totalSaleDays: number;
}

export interface WishlistSummary {
  totalFullPrice: number;
  totalSalePrice: number;
  totalSavings: number;
  avgDiscountPct: number;
  remainingBudget: number;
  isOverBudget: boolean;
  includedCount: number;
}

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export function getEventStatus(event: SteamSaleEvent, nowMs: number): SaleStatus {
  const start = Date.parse(event.startIso);
  const end = Date.parse(event.endIso);
  if (nowMs >= start && nowMs < end) {
    return 'live';
  }
  if (nowMs < start) {
    return 'upcoming';
  }
  return 'ended';
}

export function getDurationDays(event: SteamSaleEvent): number {
  const diff = Date.parse(event.endIso) - Date.parse(event.startIso);
  return Math.max(1, Math.round(diff / MS_PER_DAY));
}

export function getCountdownParts(nowMs: number, targetMs: number): CountdownParts {
  const diff = targetMs - nowMs;
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isComplete: true,
    };
  }

  const days = Math.floor(diff / MS_PER_DAY);
  const hours = Math.floor((diff % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((diff % MS_PER_MINUTE) / MS_PER_SECOND);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff,
    isComplete: false,
  };
}

export function getNextSale(
  events: SteamSaleEvent[],
  nowMs: number,
  options: { majorOnly?: boolean } = {}
): SteamSaleEvent | null {
  const filtered = options.majorOnly
    ? events.filter((e) => e.category === 'major')
    : events;

  const sorted = [...filtered].sort(
    (a, b) => Date.parse(a.startIso) - Date.parse(b.startIso)
  );

  // Prefer an active live sale first
  const live = sorted.find((e) => getEventStatus(e, nowMs) === 'live');
  if (live) return live;

  // Otherwise pick the earliest upcoming sale
  return sorted.find((e) => getEventStatus(e, nowMs) === 'upcoming') ?? null;
}

export function getDaysUntilStart(event: SteamSaleEvent, nowMs: number): number {
  const diff = Date.parse(event.startIso) - nowMs;
  if (diff <= 0) return 0;
  return Math.floor(diff / MS_PER_DAY);
}

export function calculateInterSaleProgress(
  events: SteamSaleEvent[],
  targetEvent: SteamSaleEvent,
  nowMs: number
): InterSaleProgress {
  const targetStart = Date.parse(targetEvent.startIso);
  const targetEnd = Date.parse(targetEvent.endIso);

  // If the target sale is live right now, return progress through the sale itself
  if (nowMs >= targetStart && nowMs < targetEnd) {
    const durationMs = Math.max(1, targetEnd - targetStart);
    const elapsedMs = nowMs - targetStart;
    return {
      percent: Math.min(100, Math.max(0, (elapsedMs / durationMs) * 100)),
      previousEvent: null,
      elapsedDays: Math.floor(elapsedMs / MS_PER_DAY),
      totalGapDays: Math.max(1, Math.round(durationMs / MS_PER_DAY)),
    };
  }

  // Find the most recent ended sale of the same tier (major if target is major, else any)
  const pool =
    targetEvent.category === 'major'
      ? events.filter((e) => e.category === 'major')
      : events;

  const previousCandidates = pool
    .filter((e) => e.id !== targetEvent.id && Date.parse(e.endIso) <= targetStart)
    .sort((a, b) => Date.parse(b.endIso) - Date.parse(a.endIso));

  const previousEvent = previousCandidates[0] ?? null;
  if (!previousEvent) {
    return {
      percent: 0,
      previousEvent: null,
      elapsedDays: 0,
      totalGapDays: 0,
    };
  }

  const prevEnd = Date.parse(previousEvent.endIso);
  const totalGapMs = Math.max(1, targetStart - prevEnd);
  const elapsedMs = Math.min(totalGapMs, Math.max(0, nowMs - prevEnd));

  return {
    percent: Math.min(100, Math.max(0, (elapsedMs / totalGapMs) * 100)),
    previousEvent,
    elapsedDays: Math.floor(elapsedMs / MS_PER_DAY),
    totalGapDays: Math.max(1, Math.round(totalGapMs / MS_PER_DAY)),
  };
}

export function filterUpcomingSales(
  events: SteamSaleEvent[],
  nowMs: number,
  category: SaleCategory | 'all',
  query: string
): SteamSaleEvent[] {
  const trimmed = query.trim().toLowerCase();
  return events
    .filter((e) => {
      const status = getEventStatus(e, nowMs);
      if (status === 'ended') return false;
      if (category !== 'all' && e.category !== category) return false;
      if (trimmed) {
        const haystack = `${e.name} ${e.shortName} ${e.summary}`.toLowerCase();
        if (!haystack.includes(trimmed)) return false;
      }
      return true;
    })
    .sort((a, b) => Date.parse(a.startIso) - Date.parse(b.startIso));
}

export function filterHistoricalSales(
  events: SteamSaleEvent[],
  nowMs: number,
  year: number | 'all',
  category: SaleCategory | 'all',
  query: string
): SteamSaleEvent[] {
  const trimmed = query.trim().toLowerCase();
  return events
    .filter((e) => {
      const status = getEventStatus(e, nowMs);
      if (status !== 'ended') return false;
      const startYear = new Date(e.startIso).getUTCFullYear();
      if (year !== 'all' && startYear !== year) return false;
      if (category !== 'all' && e.category !== category) return false;
      if (trimmed) {
        const haystack = `${e.name} ${e.shortName} ${e.summary} ${startYear}`.toLowerCase();
        if (!haystack.includes(trimmed)) return false;
      }
      return true;
    })
    .sort((a, b) => Date.parse(b.startIso) - Date.parse(a.startIso));
}

export function getYearlyCadenceSummary(
  events: SteamSaleEvent[],
  years: number[] = [2026, 2025, 2024, 2023, 2022]
): YearlyCadenceRow[] {
  const majors = events.filter((e) => e.category === 'major');

  return years.map((year) => {
    const yearStart = Date.UTC(year, 0, 1);
    const yearEnd = Date.UTC(year + 1, 0, 1);
    const yearLength = yearEnd - yearStart;

    const yearEvents = majors
      .filter((e) => new Date(e.startIso).getUTCFullYear() === year)
      .sort((a, b) => Date.parse(a.startIso) - Date.parse(b.startIso));

    const segments: YearlyCadenceSegment[] = yearEvents.map((event) => {
      const start = Math.max(yearStart, Date.parse(event.startIso));
      const end = Math.min(yearEnd, Date.parse(event.endIso));
      const startPercent = ((start - yearStart) / yearLength) * 100;
      const widthPercent = Math.max(1.8, ((end - start) / yearLength) * 100);
      return {
        event,
        startPercent,
        widthPercent,
        durationDays: getDurationDays(event),
      };
    });

    const totalSaleDays = yearEvents.reduce(
      (sum, event) => sum + getDurationDays(event),
      0
    );

    return {
      year,
      segments,
      totalSaleDays,
    };
  });
}

function resolveTimezoneOption(mode: TimezoneMode): string | undefined {
  if (mode === 'UTC') return 'UTC';
  if (mode === 'PT') return 'America/Los_Angeles';
  return undefined;
}

export function formatEventDateRange(
  event: SteamSaleEvent,
  mode: TimezoneMode
): string {
  const tz = resolveTimezoneOption(mode);
  const start = new Date(event.startIso);
  const end = new Date(event.endIso);

  const sameYear =
    new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: tz }).format(start) ===
    new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: tz }).format(end);

  const startStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: tz,
  }).format(start);

  const endStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: tz,
  }).format(end);

  return `${startStr} – ${endStr}`;
}

export function formatEventStartTimestamp(
  event: SteamSaleEvent,
  mode: TimezoneMode
): string {
  const tz = resolveTimezoneOption(mode);
  const start = new Date(event.startIso);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: tz,
  }).format(start);
}

function formatIcsDate(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function generateIcsContent(event: SteamSaleEvent): string {
  const dtStamp = formatIcsDate(new Date().toISOString());
  const dtStart = formatIcsDate(event.startIso);
  const dtEnd = formatIcsDate(event.endIso);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SteamClock//Steam Sale Countdown//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@steamclock.app`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(event.name)}`,
    `DESCRIPTION:${escapeIcsText(event.summary)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function getExpectedSalePrice(
  regularPrice: number,
  expectedDiscountPct: number
): number {
  const clampedPct = Math.min(95, Math.max(0, expectedDiscountPct));
  const raw = regularPrice * (1 - clampedPct / 100);
  return Math.round(raw * 100) / 100;
}

export function calculateWishlistSummary(
  items: WishlistGame[],
  budget: number
): WishlistSummary {
  const included = items.filter((item) => item.included);
  const totalFullPrice =
    Math.round(included.reduce((sum, item) => sum + item.regularPrice, 0) * 100) / 100;

  const totalSalePrice =
    Math.round(
      included.reduce(
        (sum, item) =>
          sum + getExpectedSalePrice(item.regularPrice, item.expectedDiscountPct),
        0
      ) * 100
    ) / 100;

  const totalSavings = Math.round((totalFullPrice - totalSalePrice) * 100) / 100;
  const avgDiscountPct =
    totalFullPrice > 0 ? Math.round((totalSavings / totalFullPrice) * 100) : 0;

  const safeBudget = Math.max(0, budget);
  const remainingBudget = Math.round((safeBudget - totalSalePrice) * 100) / 100;

  return {
    totalFullPrice,
    totalSalePrice,
    totalSavings,
    avgDiscountPct,
    remainingBudget,
    isOverBudget: totalSalePrice > safeBudget,
    includedCount: included.length,
  };
}

export function getCategoryLabel(category: SaleCategory): string {
  switch (category) {
    case 'major':
      return 'Major Seasonal';
    case 'fest':
      return 'Themed Fest';
    case 'next-fest':
      return 'Steam Next Fest';
    case 'event':
      return 'Storefront Event';
  }
}
