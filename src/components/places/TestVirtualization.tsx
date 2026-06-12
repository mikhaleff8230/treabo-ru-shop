import React, { useState, useMemo } from 'react';
import { VirtualizedMasonry } from './virtualized/VirtualizedMasonry';
import { PlaceGrid } from './PlaceGrid';
import { Place } from '@/domain/place/place.types';

// Генератор тестовых данных
function generateTestPlaces(count: number): Place[] {
  const places: Place[] = [];

  for (let i = 0; i < count; i++) {
    places.push({
      id: `test-place-${i}`,
      title: `Тестовое место ${i + 1}`,
      images: [
        {
          id: `img-${i}`,
          url: `https://picsum.photos/400/300?random=${i}`,
          thumbnail: `https://picsum.photos/200/150?random=${i}`,
        }
      ],
      user: {
        id: `user-${i % 10}`,
        name: `Пользователь ${i % 10 + 1}`,
        avatar: `https://picsum.photos/50/50?random=user${i % 10}`,
      },
      created_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(), // Каждый час назад
    });
  }

  return places;
}

export function TestVirtualization() {
  const [useVirtualization, setUseVirtualization] = useState(false);
  const [placeCount, setPlaceCount] = useState(100);

  // Генерируем тестовые данные
  const testPlaces = useMemo(() => generateTestPlaces(placeCount), [placeCount]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Тест виртуализации Places Masonry</h1>

      {/* Панель управления */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Настройки теста</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Количество мест: {placeCount}
            </label>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={placeCount}
              onChange={(e) => setPlaceCount(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>50</span>
              <span>1000</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useVirtualization}
                onChange={(e) => setUseVirtualization(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">Включить виртуализацию</span>
            </label>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Текущий режим: <strong>{useVirtualization ? 'Виртуализированный' : 'Обычный'}</strong></p>
          <p>Элементов в DOM: {useVirtualization ? '~30-60' : placeCount}</p>
        </div>
      </div>

      {/* Статистика производительности */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Статистика</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Всего мест:</span>
            <br />
            <span className="text-blue-600">{placeCount}</span>
          </div>
          <div>
            <span className="font-medium">В DOM сейчас:</span>
            <br />
            <span className="text-brand">
              {useVirtualization ? '~40' : placeCount}
            </span>
          </div>
          <div>
            <span className="font-medium">Экономия памяти:</span>
            <br />
            <span className="text-purple-600">
              {useVirtualization
                ? `${Math.round((1 - 40/placeCount) * 100)}%`
                : '0%'
              }
            </span>
          </div>
          <div>
            <span className="font-medium">Режим:</span>
            <br />
            <span className={`font-semibold ${useVirtualization ? 'text-brand' : 'text-orange-600'}`}>
              {useVirtualization ? 'Виртуальный' : 'Обычный'}
            </span>
          </div>
        </div>
      </div>

      {/* Masonry сетка */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">
          {useVirtualization ? 'Виртуализированная' : 'Обычная'} Masonry сетка
        </h3>

        <div className="h-96 overflow-hidden border rounded">
          {useVirtualization ? (
            <VirtualizedMasonry
              places={testPlaces}
              itemHeightEstimate={320}
              overscan={5}
              minWindowSize={20}
              maxWindowSize={50}
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <PlaceGrid places={testPlaces} />
            </div>
          )}
        </div>
      </div>

      {/* Инструкции */}
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Как тестировать:</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Попробуйте разные количества мест (50-1000)</li>
          <li>Переключайте виртуализацию on/off</li>
          <li>Скролльте и наблюдайте за плавностью</li>
          <li>В режиме виртуализации в DOM всегда ~40 элементов</li>
          <li>В обычном режиме все элементы всегда в DOM</li>
        </ul>
      </div>
    </div>
  );
}

