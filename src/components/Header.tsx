import { useState } from 'react';
import { CalendarPlus, Menu, X } from 'lucide-react';

interface HeaderProps {
  onDownloadIcs: () => void;
  focusedSaleShortName: string;
}

const NAV_LINKS = [
  { href: '#countdown', label: 'Countdown' },
  { href: '#upcoming', label: 'Upcoming' },
  { href: '#history', label: 'History' },
  { href: '#planner', label: 'Budget Planner' },
];

export function Header({ onDownloadIcs, focusedSaleShortName }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0B1016]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-8 px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#countdown"
          className="font-display text-lg font-semibold tracking-tight text-[#F1F5F9] whitespace-nowrap shrink-0 transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#66C0F4]"
        >
          SteamClock
        </a>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#94A3B8]"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 py-1 transition-colors duration-150 hover:text-[#F1F5F9] hover:underline underline-offset-8 decoration-[#66C0F4]/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#66C0F4]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onDownloadIcs}
            aria-label={`Add ${focusedSaleShortName} to calendar`}
            className="inline-flex items-center gap-2 rounded-lg bg-[#66C0F4] px-4 py-2 text-xs font-semibold text-[#081018] whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#82CDF7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#66C0F4] cursor-pointer"
          >
            <CalendarPlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Add to Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.1] text-[#CBD5E1] transition-colors duration-150 hover:border-white/20 hover:text-white md:hidden cursor-pointer"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation disclosure */}
      {mobileOpen && (
        <nav
          id="mobile-nav-menu"
          aria-label="Mobile navigation"
          className="border-t border-white/[0.08] bg-[#0B1016] px-6 py-4 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-[#CBD5E1] transition-colors duration-150 hover:bg-white/[0.05] hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
