import React, { forwardRef } from 'react';
import Masonry from 'react-masonry-css';
import PlaceCard from '../../place/place-card';
import { Place } from '@/domain/place/place.types';

interface VirtualizedMasonryProps {
  places: Place[]; // Это visibleItems из виртуализации
  className?: string;
  onPlaceClick?: (place: Place) => void;
  topPadding?: number;
  bottomPadding?: number;
}

export const VirtualizedMasonry = forwardRef<HTMLDivElement, VirtualizedMasonryProps>(({
  places,
  className = '',
  onPlaceClick,
  topPadding = 0,
  bottomPadding = 0,
}, ref) => {
  const breakpointColumnsObj = { default: 6, 1600: 5, 1400: 4, 1100: 3, 500: 2 };

  if (!places || places.length === 0) {
    return (
      <div ref={ref} className={`w-full ${className}`}>
        <div className="flex justify-center py-12 text-gray-500">
          Плейсы не найдены
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full ${className}`}
      ref={ref}
      style={{
        paddingTop: topPadding > 0 ? `${topPadding}px` : undefined,
        paddingBottom: bottomPadding > 0 ? `${bottomPadding}px` : undefined,
      }}
    >
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-4"
        columnClassName="flex flex-col gap-4 pl-4"
      >
        {places.map((place, index) => (
          <div
            key={place.id}
            className="break-inside-avoid"
          >
            <PlaceCard place={place} />
          </div>
        ))}
      </Masonry>
    </div>
  );
});

VirtualizedMasonry.displayName = 'VirtualizedMasonry';
