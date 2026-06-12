import { useState } from 'react';
import { useMe } from '@/data/user';
import client from '@/data/client';
import { getAuthToken } from '@/data/client/token.utils';
import Layout from '@/layouts/_layout';
import type { NextPageWithLayout } from '@/types';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
  error?: any;
}

const TestChatAPI: NextPageWithLayout = () => {
  const { me, isAuthorized } = useMe();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [shopId, setShopId] = useState('');

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testEndpoint = async (
    name: string,
    testFn: () => Promise<any>
  ): Promise<void> => {
    addResult({ name, status: 'pending', message: 'Выполняется...' });
    try {
      const data = await testFn();
      addResult({
        name,
        status: 'success',
        message: 'Успешно',
        data,
      });
    } catch (error: any) {
      addResult({
        name,
        status: 'error',
        message: error?.message || 'Ошибка',
        error: {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          url: error?.config?.url,
          method: error?.config?.method,
        },
      });
    }
  };

  const runAllTests = async () => {
    clearResults();
    setIsRunning(true);

    const token = getAuthToken();

    // 1. Проверка авторизации
    await testEndpoint('1. Проверка токена', async () => {
      if (!token) throw new Error('Токен не найден');
      return { token: token.substring(0, 20) + '...' };
    });

    // 2. Проверка данных пользователя
    await testEndpoint('2. Получение данных пользователя (me)', async () => {
      if (!me) throw new Error('Пользователь не загружен');
      return {
        id: me.id,
        name: me.name,
        email: me.email,
        shop_id: (me as any).shop_id,
        shops: (me as any).shops,
      };
    });

    // 3. Получение списка диалогов
    await testEndpoint(
      '3. GET /api/chat/conversations (список диалогов)',
      async () => {
        const response = await client.chat.conversations();
        return response;
      }
    );

    // 4. Создание диалога (если указан shopId)
    if (shopId) {
      await testEndpoint(
        `4. POST /api/conversations (создание диалога с shop_id=${shopId})`,
        async () => {
          const response = await client.chat.createConversation(shopId);
          return response;
        }
      );
    } else {
      addResult({
        name: '4. POST /api/conversations',
        status: 'pending',
        message: 'Пропущено (не указан shop_id)',
      });
    }

    // 5. Получение конкретного диалога (если есть диалоги)
    await testEndpoint(
      '5. GET /api/chat/conversations/{id} (получение диалога)',
      async () => {
        const conversations = await client.chat.conversations();
        const conversationsList =
          conversations?.data ||
          conversations?.conversations ||
          conversations ||
          [];
        
        if (Array.isArray(conversationsList) && conversationsList.length > 0) {
          const firstConv = conversationsList[0];
          const response = await client.chat.conversation(firstConv.id);
          return response;
        } else {
          throw new Error('Нет диалогов для тестирования');
        }
      }
    );

    // 6. Отправка сообщения (если есть диалоги)
    await testEndpoint(
      '6. POST /api/chat/messages (отправка сообщения)',
      async () => {
        const conversations = await client.chat.conversations();
        const conversationsList =
          conversations?.data ||
          conversations?.conversations ||
          conversations ||
          [];
        
        if (Array.isArray(conversationsList) && conversationsList.length > 0) {
          const firstConv = conversationsList[0];
          const response = await client.chat.sendMessage({
            conversation_id: firstConv.id,
            body: 'Тестовое сообщение от ' + new Date().toLocaleTimeString(),
          });
          return response;
        } else {
          throw new Error('Нет диалогов для отправки сообщения');
        }
      }
    );

    // 7. Проверка endpoint для создания диалога (старый способ)
    await testEndpoint(
      '7. POST /conversations (старый endpoint)',
      async () => {
        if (!shopId) throw new Error('Не указан shop_id');
        // Прямой вызов через fetch для проверки
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru'}/conversations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ shop_id: shopId }),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || `HTTP ${response.status}`);
        }
        return data;
      }
    );

    // 8. Проверка endpoint для создания диалога (новый способ)
    await testEndpoint(
      '8. POST /api/conversations (новый endpoint)',
      async () => {
        if (!shopId) throw new Error('Не указан shop_id');
        // Прямой вызов через fetch для проверки
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru'}/api/conversations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ shop_id: shopId }),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || `HTTP ${response.status}`);
        }
        return data;
      }
    );

    setIsRunning(false);
  };

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              Требуется авторизация
            </h2>
            <p className="text-yellow-700">
              Пожалуйста, войдите в систему для тестирования API чата.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Тестирование Chat API</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Информация о пользователе</h2>
          <div className="space-y-2">
            <p>
              <strong>ID:</strong> {me?.id}
            </p>
            <p>
              <strong>Имя:</strong> {me?.name}
            </p>
            <p>
              <strong>Email:</strong> {me?.email}
            </p>
            <p>
              <strong>Shop ID:</strong> {(me as any)?.shop_id || 'Нет'}
            </p>
            <p>
              <strong>Shops:</strong>{' '}
              {(me as any)?.shops?.length > 0
                ? (me as any).shops.map((s: any) => s.id).join(', ')
                : 'Нет'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Настройки теста</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop ID для создания диалога (опционально):
              </label>
              <input
                type="text"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                placeholder="Введите shop_id"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? 'Выполняется...' : 'Запустить все тесты'}
              </button>
              <button
                onClick={clearResults}
                disabled={isRunning}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Очистить результаты
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Результаты тестов</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">Нажмите "Запустить все тесты" для начала</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : result.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{result.name}</h3>
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        result.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {result.status === 'success'
                        ? '✓ Успешно'
                        : result.status === 'error'
                        ? '✗ Ошибка'
                        : '⏳ Ожидание'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{result.message}</p>

                  {result.error && (
                    <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                      <p className="font-semibold text-red-800 mb-2">Детали ошибки:</p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>URL:</strong> {result.error.url || 'N/A'}
                        </p>
                        <p>
                          <strong>Method:</strong> {result.error.method || 'N/A'}
                        </p>
                        <p>
                          <strong>Status:</strong> {result.error.status || 'N/A'} (
                          {result.error.statusText || 'N/A'})
                        </p>
                        <p>
                          <strong>Message:</strong> {result.error.message || 'N/A'}
                        </p>
                        {result.error.response && (
                          <div className="mt-2">
                            <strong>Response:</strong>
                            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                              {JSON.stringify(result.error.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {result.data && (
                    <div className="mt-3 p-3 bg-green-100 rounded border border-green-200">
                      <p className="font-semibold text-green-800 mb-2">Данные ответа:</p>
                      <pre className="text-xs overflow-auto max-h-60 bg-white p-2 rounded">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Информация о конфигурации</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <strong>API Endpoint:</strong>{' '}
              {process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru'}
            </p>
            <p>
              <strong>Токен:</strong>{' '}
              {getAuthToken()
                ? getAuthToken()!.substring(0, 20) + '...'
                : 'Не найден'}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

TestChatAPI.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default TestChatAPI;

