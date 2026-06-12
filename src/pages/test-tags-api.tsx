import { useState, useEffect } from 'react';
import client from '@/data/client';

interface Tag {
  id: number;
  name: string;
  slug: string;
  language: string;
}

export default function TestTagsApi() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testTagSlug, setTestTagSlug] = useState('abstrakciya-kartiny-dlya-interera');
  const [tagResult, setTagResult] = useState<Tag | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  // Получить список всех тегов
  const fetchTags = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.tags.all({ limit: 20 });
      setTags(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Протестировать получение конкретного тега
  const testTag = async () => {
    setTagError(null);
    setTagResult(null);

    try {
      console.log('Testing tag fetch with slug:', testTagSlug);
      const tag = await client.tags.get({
        slug: testTagSlug,
        language: 'ru'
      });
      console.log('Tag fetched successfully:', tag);
      setTagResult(tag);
    } catch (err) {
      console.error('Error fetching tag:', err);
      setTagError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Тест API тегов</h1>

      {/* Список всех тегов */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Все теги (первые 20)</h2>
        <button
          onClick={fetchTags}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Обновить список'}
        </button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Ошибка: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <div key={tag.id} className="border rounded p-4">
              <div className="font-medium">{tag.name}</div>
              <div className="text-sm text-gray-600">Slug: {tag.slug}</div>
              <div className="text-sm text-gray-500">Язык: {tag.language}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Тест конкретного тега */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Тест конкретного тега</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={testTagSlug}
            onChange={(e) => setTestTagSlug(e.target.value)}
            className="border px-3 py-2 rounded flex-1"
            placeholder="Введите slug тега"
          />
          <button
            onClick={testTag}
            className="bg-brand text-white px-4 py-2 rounded"
          >
            Проверить
          </button>
        </div>

        {tagError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Ошибка при получении тега: {tagError}
          </div>
        )}

        {tagResult && (
          <div className="bg-brand-100 border border-brand-400 text-brand-700 px-4 py-3 rounded">
            <h3 className="font-semibold">Тег найден:</h3>
            <p>ID: {tagResult.id}</p>
            <p>Название: {tagResult.name}</p>
            <p>Slug: {tagResult.slug}</p>
            <p>Язык: {tagResult.language}</p>
          </div>
        )}
      </div>

      {/* Информация о API */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Информация о API</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>API Endpoint:</strong> {process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru'}</p>
          <p><strong>Текущая страница:</strong> /test-tags-api</p>
          <p><strong>Маршрут тегов:</strong> /products/tags/[tagSlug]</p>
        </div>
      </div>

      {/* Ссылки на реальные теги */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Тестовые ссылки</h2>
        <div className="space-y-2">
          {tags.slice(0, 5).map((tag) => (
            <a
              key={tag.id}
              href={`/products/tags/${tag.slug}`}
              className="block text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Перейти к тегу: {tag.name} ({tag.slug})
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}








