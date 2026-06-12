import React, { useEffect, useState } from 'react';
import { NextPageWithLayout } from '@/types';
import Layout from '@/layouts/_layout';

const TestPlacesSimple: NextPageWithLayout = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        console.log('Testing Places API...');

        const apiUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru';
        const response = await fetch(`${apiUrl}/places/feed?limit=5`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log('Raw response:', text.substring(0, 500));

        const data = JSON.parse(text);
        console.log('Parsed data:', data);

        setResult(data);
      } catch (err) {
        console.error('API Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Тестируем API...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Ошибка API</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Тест Places API</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Результат API:</h2>
        <pre className="bg-white p-4 rounded text-sm overflow-auto max-h-96">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>

      {result?.data && (
        <div className="bg-brand-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-brand-800 mb-2">
            ✅ API работает! Получено {result.data.length} плейсов
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {result.data.slice(0, 6).map((place: any, index: number) => (
              <div key={place.id || index} className="bg-white p-4 rounded shadow">
                <h4 className="font-semibold">{place.title}</h4>
                <p className="text-sm text-gray-600">ID: {place.id}</p>
                <p className="text-sm text-gray-600">Изображений: {place.images?.length || 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!result?.data || result.data.length === 0) && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">
            ⚠️ API вернул пустой результат
          </h3>
          <p className="mt-2">Возможно, в базе данных нет плейсов или API требует авторизации.</p>
        </div>
      )}
    </div>
  );
};

TestPlacesSimple.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default TestPlacesSimple;
