import React from 'react';
import Masonry from 'react-masonry-css';
import PlaceCard from '../place/place-card';
import { Place } from '@/domain/place/place.types';

interface PlaceGridProps {
  places: Place[];
  onLastItemRef?: React.RefObject<HTMLDivElement>;
  className?: string;
  onPlaceClick?: (place: Place) => void;
}

export function PlaceGrid({
  places,
  onLastItemRef,
  className = '',
  onPlaceClick,
}: PlaceGridProps) {
  if (!places || places.length === 0) {
    return <div className="flex justify-center py-12 text-gray-500">Плейсы не найдены</div>;
  }

  const breakpointColumnsObj = { default: 6, 1600: 5, 1400: 4, 1100: 3, 500: 2 };

  return (
    <div className={`w-full ${className}`}>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-4"
        columnClassName="flex flex-col gap-4 pl-4"
      >
        {places.map((place, index) => {
          const isLastItem = index === places.length - 1;
          return (
            <div
              key={place.id}
              className="break-inside-avoid"
              ref={isLastItem ? onLastItemRef : null}
              onClick={() => onPlaceClick?.(place)}
            >
              <PlaceCard place={place} />
            </div>
          );
        })}
      </Masonry>
    </div>
  );
}
