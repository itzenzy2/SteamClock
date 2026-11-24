import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { SEASON_ARTWORK, type SeasonKey } from '../data/steamSales';

interface SeasonalImageProps {
  season: SeasonKey;
  className?: string;
  priority?: boolean;
}

const FALLBACK_GRADIENTS: Record<SeasonKey, string> = {
  winter: 'from-[#0F2032] via-[#12263A] to-[#0B1016]',
  spring: 'from-[#162336] via-[#1B2B40] to-[#0B1016]',
  summer: 'from-[#102030] via-[#1D2A38] to-[#0B1016]',
  autumn: 'from-[#221A17] via-[#1B212D] to-[#0B1016]',
};

export function SeasonalImage({
  season,
  className = '',
  priority = false,
}: SeasonalImageProps) {
  const [hasError, setHasError] = useState(false);
  const artwork = SEASON_ARTWORK[season];

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={artwork.alt}
        className={`flex items-center justify-center bg-gradient-to-br ${FALLBACK_GRADIENTS[season]} ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-[#64748B]">
          <Calendar className="h-8 w-8" aria-hidden="true" />
          <span className="text-xs font-medium capitalize">{season} Seasonal Art</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={artwork.src}
      alt={artwork.alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setHasError(true)}
      className={`h-full w-full object-cover ${artwork.cropClass ?? ''} ${className}`}
    />
  );
}
