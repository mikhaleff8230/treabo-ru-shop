import { Place } from '@/types';
import PlaceCard from '@/components/place/place-card';
import Masonry from 'react-masonry-css';

interface PlaceMasonryGridProps {
  places: Place[];
  className?: string;
  onLastItemRef?: (node: HTMLDivElement | null) => void;
}

/**
 * Компонент для отображения плейсов в Masonry-style (Pinterest)
 * Использует react-masonry-css для автоматического распределения карточек по колонкам
 */
export default function PlaceMasonryGrid({ 
  places, 
  className = '',
  onLastItemRef 
}: PlaceMasonryGridProps) {
  
  if (!places || places.length === 0) {
    return null;
  }

  // Настройка брейкпоинтов для колонок
  // Больше колонок на десктопе для больших фото
  const breakpointColumnsObj = {
    default: 6,    // По умолчанию 6 колонок (для больших экранов)
    1600: 5,       // На экранах до 1600px - 5 колонок
    1400: 4,       // На экранах до 1400px - 4 колонки
    1100: 3,       // На экранах до 1100px - 3 колонки
    500: 2         // На экранах до 500px (телефоны) - 2 колонки
  };

  return (
    <div className={`flex w-auto ${className}`}>
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
            >
              <PlaceCard place={place} />
            </div>
          );
        })}
      </Masonry>
    </div>
  );
}
