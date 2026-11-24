import test from 'node:test';
import assert from 'node:assert/strict';
import { STEAM_SALES_DATA, type WishlistGame } from '../data/steamSales';
import {
  calculateInterSaleProgress,
  calculateWishlistSummary,
  filterHistoricalSales,
  filterUpcomingSales,
  formatEventStartTimestamp,
  generateIcsContent,
  getCountdownParts,
  getDaysUntilStart,
  getDurationDays,
  getEventStatus,
  getExpectedSalePrice,
  getNextSale,
  getYearlyCadenceSummary,
} from './salesLogic';

const NOV_24_2026 = Date.parse('2026-11-24T12:00:00Z');

test('getCountdownParts splits days, hours, minutes, and seconds accurately', () => {
  const target = NOV_24_2026 + (2 * 86400 + 5 * 3600 + 30 * 60 + 15) * 1000;
  const parts = getCountdownParts(NOV_24_2026, target);
  assert.equal(parts.days, 2);
  assert.equal(parts.hours, 5);
  assert.equal(parts.minutes, 30);
  assert.equal(parts.seconds, 15);
  assert.equal(parts.isComplete, false);
});

test('getDaysUntilStart matches getCountdownParts days for upcoming sales', () => {
  const winter = STEAM_SALES_DATA.find((e) => e.id === 'winter-sale-2026')!;
  const parts = getCountdownParts(NOV_24_2026, Date.parse(winter.startIso));
  assert.equal(getDaysUntilStart(winter, NOV_24_2026), parts.days);
});

test('getCountdownParts clamps to zero when target has passed', () => {
  const parts = getCountdownParts(NOV_24_2026, NOV_24_2026 - 5000);
  assert.equal(parts.days, 0);
  assert.equal(parts.hours, 0);
  assert.equal(parts.minutes, 0);
  assert.equal(parts.seconds, 0);
  assert.equal(parts.isComplete, true);
});

test('getNextSale distinguishes major seasonal sales from all storefront events', () => {
  const nextMajor = getNextSale(STEAM_SALES_DATA, NOV_24_2026, { majorOnly: true });
  assert.ok(nextMajor);
  assert.equal(nextMajor.id, 'winter-sale-2026');

  const nextAny = getNextSale(STEAM_SALES_DATA, NOV_24_2026, { majorOnly: false });
  assert.ok(nextAny);
  assert.equal(nextAny.id, 'black-friday-hub-2026');
});

test('getNextSale prefers a live active sale over future upcoming sales', () => {
  const duringWinterSale = Date.parse('2026-12-20T18:00:00Z');
  const active = getNextSale(STEAM_SALES_DATA, duringWinterSale, { majorOnly: true });
  assert.ok(active);
  assert.equal(active.id, 'winter-sale-2026');
  assert.equal(getEventStatus(active, duringWinterSale), 'live');
});

test('getDurationDays returns 18 days for Winter Sale 2026', () => {
  const winter = STEAM_SALES_DATA.find((e) => e.id === 'winter-sale-2026')!;
  assert.equal(getDurationDays(winter), 18);
});

test('calculateInterSaleProgress computes elapsed percentage between Autumn 2026 and Winter 2026', () => {
  const winter = STEAM_SALES_DATA.find((e) => e.id === 'winter-sale-2026')!;
  const progress = calculateInterSaleProgress(STEAM_SALES_DATA, winter, NOV_24_2026);
  assert.equal(progress.previousEvent?.id, 'autumn-sale-2026');
  assert.ok(progress.percent > 60 && progress.percent < 75);
  assert.equal(progress.totalGapDays, 70);
});

test('filterUpcomingSales and filterHistoricalSales filter by category, year, and query', () => {
  const upcomingFests = filterUpcomingSales(STEAM_SALES_DATA, NOV_24_2026, 'fest', '');
  assert.ok(upcomingFests.length >= 10);
  assert.ok(upcomingFests.every((e) => e.category === 'fest'));

  const rhythmSearch = filterUpcomingSales(STEAM_SALES_DATA, NOV_24_2026, 'all', 'rhythm');
  assert.equal(rhythmSearch.length, 1);
  assert.equal(rhythmSearch[0].id, 'rhythm-fest-2027');

  const history2025 = filterHistoricalSales(STEAM_SALES_DATA, NOV_24_2026, 2025, 'major', '');
  assert.equal(history2025.length, 4);
  assert.ok(history2025.every((e) => new Date(e.startIso).getUTCFullYear() === 2025));
});

test('getYearlyCadenceSummary builds seasonal timeline rows across 2022-2026', () => {
  const cadence = getYearlyCadenceSummary(STEAM_SALES_DATA, [2026, 2025, 2024]);
  assert.equal(cadence.length, 3);
  assert.equal(cadence[0].year, 2026);
  assert.equal(cadence[0].segments.length, 4);
  assert.equal(cadence[0].totalSaleDays, 7 + 14 + 7 + 18);
});

test('formatEventStartTimestamp renders explicit UTC and PT timezones', () => {
  const winter = STEAM_SALES_DATA.find((e) => e.id === 'winter-sale-2026')!;
  const utcText = formatEventStartTimestamp(winter, 'UTC');
  const ptText = formatEventStartTimestamp(winter, 'PT');
  assert.ok(utcText.includes('UTC'));
  assert.ok(utcText.includes('6:00 PM'));
  assert.ok(ptText.includes('10:00 AM'));
});

test('generateIcsContent produces valid RFC 5545 VCALENDAR payload', () => {
  const winter = STEAM_SALES_DATA.find((e) => e.id === 'winter-sale-2026')!;
  const ics = generateIcsContent(winter);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('DTSTART:20261217T180000Z'));
  assert.ok(ics.includes('DTEND:20270104T180000Z'));
  assert.ok(ics.includes('SUMMARY:Steam Winter Sale 2026'));
  assert.ok(ics.endsWith('END:VCALENDAR'));
});

test('calculateWishlistSummary computes discounts, savings, and budget limits cleanly', () => {
  const items: WishlistGame[] = [
    { id: '1', title: 'Game A', regularPrice: 60, expectedDiscountPct: 50, included: true },
    { id: '2', title: 'Game B', regularPrice: 40, expectedDiscountPct: 25, included: true },
    { id: '3', title: 'Excluded', regularPrice: 50, expectedDiscountPct: 10, included: false },
  ];
  assert.equal(getExpectedSalePrice(60, 50), 30);

  const within = calculateWishlistSummary(items, 100);
  assert.equal(within.includedCount, 2);
  assert.equal(within.totalFullPrice, 100);
  assert.equal(within.totalSalePrice, 60);
  assert.equal(within.totalSavings, 40);
  assert.equal(within.avgDiscountPct, 40);
  assert.equal(within.remainingBudget, 40);
  assert.equal(within.isOverBudget, false);

  const over = calculateWishlistSummary(items, 50);
  assert.equal(over.isOverBudget, true);
  assert.equal(over.remainingBudget, -10);
});
