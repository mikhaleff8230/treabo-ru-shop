import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface ApiTestProps {
  apiTest: any;
  error?: string;
}

export default function ApiTestFrontend({ apiTest, error }: ApiTestProps) {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Тест API с фронтенда</h1>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <h3>Ошибка:</h3>
          <pre>{error}</pre>
        </div>
      )}
      
      {apiTest && (
        <div>
          <h3>Результат теста:</h3>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {JSON.stringify(apiTest, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const locale = context.locale || context.defaultLocale || 'ru';
  const apiUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru';

  try {
    console.log('API Test: Начинаем тест API');
    console.log('API Test: URL =', apiUrl);
    
    // Тест 1: Простой GET запрос
    const test1Url = `${apiUrl}/places?limit=5`;
    console.log('API Test: Тестируем URL =', test1Url);
    
    const res = await fetch(test1Url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('API Test: HTTP статус =', res.status);
    console.log('API Test: HTTP заголовки =', Object.fromEntries(res.headers.entries()));
    
    const text = await res.text();
    console.log('API Test: Получен ответ длиной =', text.length);
    console.log('API Test: Первые 500 символов ответа =', text.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(text);
      console.log('API Test: JSON успешно распарсен');
    } catch (e) {
      console.log('API Test: Ошибка парсинга JSON =', e);
      return {
        props: {
          error: `Ошибка парсинга JSON: ${e.message}. Ответ: ${text.substring(0, 200)}`,
          ...(await serverSideTranslations(locale, ['common']))
        }
      };
    }

    return {
      props: {
        apiTest: {
          url: test1Url,
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          data: data,
          responseLength: text.length
        },
        ...(await serverSideTranslations(locale, ['common']))
      },
    };
  } catch (error) {
    console.log('API Test: Ошибка запроса =', error);
    return {
      props: {
        error: error.message,
        ...(await serverSideTranslations(locale, ['common']))
      }
    };
  }
}; 