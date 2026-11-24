import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { WishlistGame } from '../data/steamSales';
import {
  calculateWishlistSummary,
  getExpectedSalePrice,
} from '../utils/salesLogic';

interface WishlistPlannerProps {
  items: WishlistGame[];
  budget: number;
  targetSaleShortName: string;
  onChangeBudget: (nextBudget: number) => void;
  onAddGame: (game: Omit<WishlistGame, 'id'>) => void;
  onToggleGame: (id: string) => void;
  onUpdateDiscount: (id: string, discountPct: number) => void;
  onRemoveGame: (id: string) => void;
}

export function WishlistPlanner({
  items,
  budget,
  targetSaleShortName,
  onChangeBudget,
  onAddGame,
  onToggleGame,
  onUpdateDiscount,
  onRemoveGame,
}: WishlistPlannerProps) {
  const [title, setTitle] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [discountInput, setDiscountInput] = useState('40');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const summary = calculateWishlistSummary(items, budget);
  const budgetRatio =
    budget > 0 ? Math.min(100, (summary.totalSalePrice / budget) * 100) : 100;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const parsedPrice = Number.parseFloat(priceInput);
    const parsedDiscount = Number.parseInt(discountInput, 10);

    if (!trimmedTitle) {
      setErrorMessage('Enter a game title before adding it to your sale planner.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || parsedPrice > 500) {
      setErrorMessage('Enter a valid regular price between $0.01 and $500.00.');
      return;
    }
    if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 95) {
      setErrorMessage('Expected discount must be between 0% and 95%.');
      return;
    }

    setErrorMessage(null);
    onAddGame({
      title: trimmedTitle,
      regularPrice: Math.round(parsedPrice * 100) / 100,
      expectedDiscountPct: parsedDiscount,
      included: true,
    });
    setTitle('');
    setPriceInput('');
    setDiscountInput('40');
  };

  return (
    <section
      id="planner"
      aria-labelledby="planner-heading"
      className="scroll-mt-16 py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Column: Summary & Add Game Form */}
          <div className="lg:col-span-5">
            <h2
              id="planner-heading"
              className="font-display text-2xl font-semibold tracking-tight text-[#F1F5F9] sm:text-3xl"
            >
              Sale Budget Planner
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
              Estimate what your Steam wishlist will cost during {targetSaleShortName}. Everything
              stays saved locally in your browser.
            </p>

            {/* Budget Summary Block */}
            <div className="mt-8 rounded-xl border border-white/[0.08] bg-[#121A24] p-6">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="sale-budget-input"
                  className="text-xs font-medium text-[#94A3B8]"
                >
                  Target Sale Budget (USD)
                </label>
                <div className="relative w-28">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#64748B]"
                  >
                    $
                  </span>
                  <input
                    id="sale-budget-input"
                    type="number"
                    min={0}
                    max={5000}
                    step={5}
                    value={budget}
                    onChange={(e) => {
                      const next = Number.parseFloat(e.target.value);
                      onChangeBudget(Number.isFinite(next) && next >= 0 ? next : 0);
                    }}
                    className="h-9 w-full rounded-lg border border-white/[0.12] bg-[#0B1016] pl-7 pr-3 text-right font-mono text-sm text-[#F1F5F9] tabular-nums focus:border-[#66C0F4] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/[0.08] pt-5">
                <div>
                  <p className="text-xs text-[#94A3B8]">Est. Total</p>
                  <p
                    data-testid="wishlist-total-spend"
                    className="mt-1 font-mono text-lg font-semibold text-[#F1F5F9] tabular-nums"
                  >
                    ${summary.totalSalePrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">Est. Savings</p>
                  <p
                    data-testid="wishlist-total-savings"
                    className="mt-1 font-mono text-lg font-semibold text-[#66C0F4] tabular-nums"
                  >
                    ${summary.totalSavings.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">
                    {summary.isOverBudget ? 'Over Budget' : 'Remaining'}
                  </p>
                  <p
                    className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
                      summary.isOverBudget ? 'text-[#F87171]' : 'text-[#4ADE80]'
                    }`}
                  >
                    {summary.isOverBudget
                      ? `+$${Math.abs(summary.remainingBudget).toFixed(2)}`
                      : `$${summary.remainingBudget.toFixed(2)}`}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">
                    {summary.isOverBudget
                      ? 'Status: Over budget — uncheck a title or raise budget'
                      : 'Status: Within budget'}
                  </span>
                  <span className="font-mono text-[#CBD5E1] tabular-nums">
                    {Math.round(budgetRatio)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      summary.isOverBudget ? 'bg-[#F87171]' : 'bg-[#66C0F4]'
                    }`}
                    style={{ width: `${Math.min(100, budgetRatio)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Add Game Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-6 rounded-xl border border-white/[0.08] bg-[#121A24] p-6"
            >
              <h3 className="font-display text-base font-semibold text-[#F1F5F9]">
                Add Game to Watchlist
              </h3>

              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="game-title-input"
                    className="block text-xs font-medium text-[#CBD5E1]"
                  >
                    Game Title
                  </label>
                  <input
                    id="game-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. Hades II"
                    className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.12] bg-[#0B1016] px-3 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#66C0F4] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="game-price-input"
                      className="block text-xs font-medium text-[#CBD5E1]"
                    >
                      Regular Price ($)
                    </label>
                    <input
                      id="game-price-input"
                      type="number"
                      min={0.01}
                      max={500}
                      step={0.01}
                      value={priceInput}
                      onChange={(e) => {
                        setPriceInput(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="29.99"
                      className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.12] bg-[#0B1016] px-3 font-mono text-sm text-[#F1F5F9] tabular-nums placeholder:text-[#64748B] focus:border-[#66C0F4] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="game-discount-input"
                      className="block text-xs font-medium text-[#CBD5E1]"
                    >
                      Expected Discount (%)
                    </label>
                    <input
                      id="game-discount-input"
                      type="number"
                      min={0}
                      max={95}
                      step={5}
                      value={discountInput}
                      onChange={(e) => {
                        setDiscountInput(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.12] bg-[#0B1016] px-3 font-mono text-sm text-[#F1F5F9] tabular-nums focus:border-[#66C0F4] focus:outline-none"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <p
                    role="alert"
                    data-testid="wishlist-form-error"
                    className="text-xs font-medium text-[#F87171]"
                  >
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#66C0F4] px-4 py-2 text-sm font-semibold text-[#081018] transition-colors duration-150 hover:bg-[#82CDF7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#66C0F4] cursor-pointer"
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Add Game</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Interactive Wishlist Table */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <h3 className="font-display text-lg font-semibold text-[#F1F5F9]">
                Planned Pickups
              </h3>
              <span className="text-xs text-[#94A3B8] tabular-nums">
                {summary.includedCount} of {items.length} selected for purchase
              </span>
            </div>

            {items.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-[#121A24]/60 px-6 py-16 text-center">
                <p className="text-sm font-medium text-[#E2E8F0]">
                  Your sale wishlist is empty.
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Add a game on the left to estimate your total spend and projected savings.
                </p>
              </div>
            ) : (
              <ul
                data-testid="wishlist-items-list"
                className="mt-2 divide-y divide-white/[0.06]"
              >
                {items.map((game) => {
                  const salePrice = getExpectedSalePrice(
                    game.regularPrice,
                    game.expectedDiscountPct
                  );
                  return (
                    <li
                      key={game.id}
                      className={`flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                        game.included ? 'opacity-100' : 'opacity-55'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <input
                          id={`include-${game.id}`}
                          type="checkbox"
                          checked={game.included}
                          onChange={() => onToggleGame(game.id)}
                          aria-label={`Include ${game.title} in sale budget`}
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-[#0B1016] accent-[#66C0F4] cursor-pointer"
                        />
                        <div>
                          <label
                            htmlFor={`include-${game.id}`}
                            className="cursor-pointer font-medium text-[#F1F5F9]"
                          >
                            {game.title}
                          </label>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
                            <span className="font-mono tabular-nums line-through text-[#8A9BB0]">
                              ${game.regularPrice.toFixed(2)}
                            </span>
                            <span aria-hidden="true" className="text-white/25">
                              ·
                            </span>
                            <span>{game.note ?? 'Custom watchlist target'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pl-7 sm:justify-end sm:pl-0">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`discount-${game.id}`}
                            className="sr-only"
                          >
                            Expected discount percent for {game.title}
                          </label>
                          <select
                            id={`discount-${game.id}`}
                            value={game.expectedDiscountPct}
                            onChange={(e) =>
                              onUpdateDiscount(
                                game.id,
                                Number.parseInt(e.target.value, 10)
                              )
                            }
                            className="h-8 rounded-md border border-white/[0.1] bg-[#121A24] px-2 font-mono text-xs text-[#CBD5E1] tabular-nums focus:border-[#66C0F4] focus:outline-none"
                          >
                            {[0, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 67, 75, 80, 90].map(
                              (pct) => (
                                <option key={pct} value={pct}>
                                  -{pct}%
                                </option>
                              )
                            )}
                          </select>

                          <span className="w-16 text-right font-mono text-sm font-semibold text-[#F1F5F9] tabular-nums">
                            ${salePrice.toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveGame(game.id)}
                          aria-label={`Remove ${game.title} from wishlist`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-white/[0.06] hover:text-[#F87171] cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
