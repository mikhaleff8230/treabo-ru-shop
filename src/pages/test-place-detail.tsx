import { GetServerSideProps } from 'next';

interface TestPlaceDetailProps {
  apiStatus: string;
  placeData: any;
  error?: string;
}

export default function TestPlaceDetailPage({ apiStatus, placeData, error }: TestPlaceDetailProps) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Тест API Place Detail</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Статус API:</h2>
        <p className="text-green-600">{apiStatus}</p>
      </div>
      
      {error && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-red-600">Ошибка:</h2>
          <p className="text-red-500">{error}</p>
        </div>
      )}
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Данные плейса ID=22:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(placeData, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  console.log('=== TEST PLACE DETAIL API ===');
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost/api';
    console.log('API URL:', apiUrl);
    
    // Тестируем получение конкретного плейса
    const response = await fetch(`${apiUrl}/places/22`);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Data received:', !!data);
    
    return {
      props: {
        apiStatus: '✅ API работает',
        placeData: data,
      },
    };
    
  } catch (error) {
    console.error('API test failed:', error);
    
    return {
      props: {
        apiStatus: '❌ API не работает',
        placeData: null,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
    };
  }
}; 