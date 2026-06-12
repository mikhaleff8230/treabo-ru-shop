import React, { useEffect, useState } from 'react';
import { PlaceGrid } from './PlaceGrid';

export function TestPlacesFeed() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('TestPlacesFeed: Starting fetch...');
        const response = await fetch('/api/places/feed?limit=5');

        console.log('TestPlacesFeed: Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        console.log('TestPlacesFeed: Raw response length:', text.length);
        console.log('TestPlacesFeed: Raw response preview:', text.substring(0, 200));

        const jsonData = JSON.parse(text);
        console.log('TestPlacesFeed: Parsed successfully, places count:', jsonData?.data?.length || 0);

        setData(jsonData);
        setError(null);
      } catch (err) {
        console.error('TestPlacesFeed: Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Загрузка тестовых данных...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <h3>Ошибка загрузки:</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Перезагрузить
        </button>
      </div>
    );
  }

  if (!data?.data?.length) {
    return <div className="p-8 text-center">Нет данных для отображения</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Тестовый Places Feed</h2>
      <p className="mb-4 text-gray-600">
        Загружено {data.data.length} плейсов из API
      </p>
      <PlaceGrid places={data.data} />
    </div>
  );
}
