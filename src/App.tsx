import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_WISHLIST_GAMES,
  STEAM_SALES_DATA,
  type SteamSaleEvent,
  type WishlistGame,
} from './data/steamSales';
import {
  calculateWishlistSummary,
  generateIcsContent,
  getEventStatus,
  getNextSale,
  type TimezoneMode,
} from './utils/salesLogic';
import { Header } from './components/Header';
import { HeroCountdown } from './components/HeroCountdown';
import { UpcomingSchedule } from './components/UpcomingSchedule';
import { SalesHistory } from './components/SalesHistory';
import { WishlistPlanner } from './components/WishlistPlanner';
import { Footer } from './components/Footer';

const WISHLIST_STORAGE_KEY = 'steamclock_wishlist_v1';
const BUDGET_STORAGE_KEY = 'steamclock_budget_v1';

function loadStoredWishlist(): WishlistGame[] {
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return DEFAULT_WISHLIST_GAMES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_WISHLIST_GAMES;
  } catch {
    return DEFAULT_WISHLIST_GAMES;
  }
}

function loadStoredBudget(): number {
  try {
    const raw = window.localStorage.getItem(BUDGET_STORAGE_KEY);
    if (!raw) return 150;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 150;
  } catch {
    return 150;
  }
}

function readInitialSaleFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const saleId = params.get('sale');
    if (saleId && STEAM_SALES_DATA.some((e) => e.id === saleId)) {
      return saleId;
    }
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [focusMode, setFocusMode] = useState<'major' | 'any'>('major');
  const [customEventId, setCustomEventId] = useState<string | null>(() =>
    readInitialSaleFromUrl()
  );
  const [timezoneMode, setTimezoneMode] = useState<TimezoneMode>('local');
  const [wishlist, setWishlist] = useState<WishlistGame[]>(() => loadStoredWishlist());
  const [budget, setBudget] = useState<number>(() => loadStoredBudget());

  // Tick once per second for live countdown
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Persist wishlist & budget locally
  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // Ignore storage quota errors
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      window.localStorage.setItem(BUDGET_STORAGE_KEY, String(budget));
    } catch {
      // Ignore storage quota errors
    }
  }, [budget]);

  const defaultMajorEvent = useMemo(
    () => getNextSale(STEAM_SALES_DATA, nowMs, { majorOnly: true }),
    [nowMs]
  );

  const nextAnyEvent = useMemo(
    () => getNextSale(STEAM_SALES_DATA, nowMs, { majorOnly: false }),
    [nowMs]
  );

  const nextFestEvent = useMemo(() => {
    const fests = STEAM_SALES_DATA.filter(
      (e) =>
        (e.category === 'fest' || e.category === 'next-fest') &&
        getEventStatus(e, nowMs) !== 'ended'
    ).sort((a, b) => Date.parse(a.startIso) - Date.parse(b.startIso));
    return fests[0] ?? null;
  }, [nowMs]);

  const focusedEvent: SteamSaleEvent = useMemo(() => {
    if (customEventId) {
      const found = STEAM_SALES_DATA.find((e) => e.id === customEventId);
      if (found) return found;
    }
    if (focusMode === 'any' && nextAnyEvent) {
      return nextAnyEvent;
    }
    return defaultMajorEvent ?? nextAnyEvent ?? STEAM_SALES_DATA[0];
  }, [customEventId, focusMode, nextAnyEvent, defaultMajorEvent]);

  const wishlistSummary = useMemo(
    () => calculateWishlistSummary(wishlist, budget),
    [wishlist, budget]
  );

  const handleDownloadIcs = useCallback((event: SteamSaleEvent) => {
    const content = generateIcsContent(event);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${event.id}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, []);

  const handleSelectEvent = useCallback((event: SteamSaleEvent) => {
    setCustomEventId(event.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleChangeFocusMode = useCallback((mode: 'major' | 'any') => {
    setCustomEventId(null);
    setFocusMode(mode);
  }, []);

  const handleResetSelection = useCallback(() => {
    setCustomEventId(null);
    setFocusMode('major');
  }, []);

  const handleAddGame = useCallback((game: Omit<WishlistGame, 'id'>) => {
    setWishlist((prev) => [
      {
        ...game,
        id: `game-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
      ...prev,
    ]);
  }, []);

  const handleToggleGame = useCallback((id: string) => {
    setWishlist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, included: !item.included } : item
      )
    );
  }, []);

  const handleUpdateDiscount = useCallback((id: string, discountPct: number) => {
    setWishlist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, expectedDiscountPct: discountPct } : item
      )
    );
  }, []);

  const handleRemoveGame = useCallback((id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1016] text-[#F1F5F9]">
      <Header
        onDownloadIcs={() => handleDownloadIcs(focusedEvent)}
        focusedSaleShortName={focusedEvent.shortName}
      />

      <main>
        <HeroCountdown
          allEvents={STEAM_SALES_DATA}
          focusedEvent={focusedEvent}
          defaultMajorEvent={defaultMajorEvent}
          nextAnyEvent={nextAnyEvent}
          nextFestEvent={nextFestEvent}
          isCustomSelection={customEventId !== null}
          focusMode={focusMode}
          onChangeFocusMode={handleChangeFocusMode}
          onResetSelection={handleResetSelection}
          nowMs={nowMs}
          timezoneMode={timezoneMode}
          onChangeTimezone={setTimezoneMode}
          onDownloadIcs={handleDownloadIcs}
          onSelectEvent={handleSelectEvent}
          wishlistSummary={wishlistSummary}
        />

        <UpcomingSchedule
          events={STEAM_SALES_DATA}
          nowMs={nowMs}
          timezoneMode={timezoneMode}
          focusedEventId={focusedEvent.id}
          onSelectEvent={handleSelectEvent}
          onDownloadIcs={handleDownloadIcs}
        />

        <SalesHistory
          events={STEAM_SALES_DATA}
          nowMs={nowMs}
          timezoneMode={timezoneMode}
        />

        <WishlistPlanner
          items={wishlist}
          budget={budget}
          targetSaleShortName={focusedEvent.shortName}
          onChangeBudget={setBudget}
          onAddGame={handleAddGame}
          onToggleGame={handleToggleGame}
          onUpdateDiscount={handleUpdateDiscount}
          onRemoveGame={handleRemoveGame}
        />
      </main>

      <Footer />
    </div>
  );
}
