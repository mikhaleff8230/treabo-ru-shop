import { GetServerSideProps } from 'next';

interface TestPlacesProps {
  apiStatus: string;
  placesData: any;
  error?: string;
}

export default function TestPlacesPage({ apiStatus, placesData, error }: TestPlacesProps) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Тест API Places</h1>
      
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
        <h2 className="text-lg font-semibold">Данные:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(placesData, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  console.log('=== TEST PLACES API ===');
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost/api';
    console.log('API URL:', apiUrl);
    
    // Тестируем список плейсов
    const response = await fetch(`${apiUrl}/places?limit=5`);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Data received:', !!data);
    
    return {
      props: {
        apiStatus: '✅ API работает',
        placesData: data,
      },
    };
    
  } catch (error) {
    console.error('API test failed:', error);
    
    return {
      props: {
        apiStatus: '❌ API не работает',
        placesData: null,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
    };
  }
}; 