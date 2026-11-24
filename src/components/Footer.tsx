export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#090D12] py-10">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <span className="font-display text-base font-semibold text-[#F1F5F9]">
            SteamClock
          </span>
          <p className="mt-1 text-xs text-[#8A9BB0]">
            Official Steamworks seasonal dates &amp; historical archive inspired by SteamDB.
            Independent community tracker; not affiliated with Valve Corporation.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-6 text-xs text-[#94A3B8]"
        >
          <a href="#countdown" className="hover:text-[#F1F5F9] transition-colors">
            Countdown
          </a>
          <a href="#upcoming" className="hover:text-[#F1F5F9] transition-colors">
            Upcoming
          </a>
          <a href="#history" className="hover:text-[#F1F5F9] transition-colors">
            History
          </a>
          <a href="#planner" className="hover:text-[#F1F5F9] transition-colors">
            Budget Planner
          </a>
        </nav>
      </div>
    </footer>
  );
}
