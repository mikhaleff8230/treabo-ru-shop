import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { fetchPvz, fetchAllPvz } from '@/data/pvz';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAddPvzFromMap } from '@/data/user-addresses';
import { useMe } from '@/data/user';
import { toast } from 'react-hot-toast';

const MapWithPoints = dynamic(() => import('@/components/address/MapWithPoints'), { ssr: false });

interface PvzModalProps {
  onClose: () => void;
  onSelect: (address: string) => void;
  allowSaveToProfile?: boolean; // Добавляем возможность сохранять в профиль
}

interface PvzItem {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  work_time: string;
  service: string;
}

const PvzModal: React.FC<PvzModalProps> = ({ onClose, onSelect, allowSaveToProfile = false }) => {
  const { me } = useMe();
  const queryClient = useQueryClient();
  
  // Мутация для сохранения ПВЗ в профиль
  const { mutate: addPvzToProfile, isLoading: isSaving } = useMutation(useAddPvzFromMap(), {
    onSuccess: (data) => {
      toast.success('ПВЗ сохранен в ваш профиль!');
      queryClient.invalidateQueries(['user-addresses']);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Ошибка сохранения ПВЗ');
    },
  });
  const [city, setCity] = useState('Москва');
  const [service, setService] = useState('all');
  const [pvzList, setPvzList] = useState<PvzItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPvzId, setSelectedPvzId] = useState<string>('');

  const loadPvz = async () => {
    if (!city.trim()) {
      setError('Введите город');
      setPvzList([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = service === 'all' ? await fetchAllPvz(city) : await fetchPvz(city, service);
      setPvzList(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки ПВЗ');
      setPvzList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPvz();
  }, [city, service]);

  // Преобразуем ПВЗ в формат для карты
  const mapPoints = pvzList.map(pvz => ({
    id: pvz.id,
    label: pvz.name,
    address: pvz.address,
    lat: pvz.latitude,
    lng: pvz.longitude,
  }));

  const handlePvzSelect = (pvzId: string) => {
    setSelectedPvzId(pvzId);
    const selectedPvz = pvzList.find(p => p.id === pvzId);
    if (selectedPvz) {
      onSelect(`ПВЗ ${selectedPvz.service.toUpperCase()}: ${selectedPvz.name} - ${selectedPvz.address}`);
    }
  };

  // Функция для сохранения ПВЗ в профиль
  const handleSavePvzToProfile = (pvz: PvzItem) => {
    if (!me) {
      toast.error('Необходимо войти в аккаунт');
      return;
    }

    addPvzToProfile({
      pvz_id: pvz.id,
      service: pvz.service,
      name: pvz.name,
      city: city,
      address: pvz.address,
      latitude: pvz.latitude,
      longitude: pvz.longitude,
      phone: pvz.phone,
      work_time: pvz.work_time,
      title: `${pvz.service.toUpperCase()} - ${pvz.name}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>✕</button>
        <h2 className="text-lg font-semibold mb-4">Выберите ПВЗ</h2>
        
        {/* Фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Город</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Введите город"
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Служба доставки</label>
            <select 
              value={service} 
              onChange={e => setService(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="all">Все службы</option>
              <option value="sdek">СДЭК</option>
              <option value="yandex">Яндекс.Доставка</option>
            </select>
          </div>
        </div>

        {/* Основной контент - карта и список */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Карта */}
          <div className="h-96 lg:h-80 border rounded bg-gray-50">
            {pvzList.length > 0 ? (
              <MapWithPoints 
                points={mapPoints} 
                selectedId={selectedPvzId}
                onSelect={handlePvzSelect}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-gray-500">
                  {loading ? 'Загрузка карты...' : 'Выберите город для отображения ПВЗ'}
                </span>
              </div>
            )}
          </div>

          {/* Список ПВЗ */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {loading && <div className="text-center py-4">Загрузка ПВЗ...</div>}
            {error && <div className="text-red-500 text-center py-2">{error}</div>}
            {!loading && !error && pvzList.length === 0 && (
              <div className="text-center py-4 text-gray-500">ПВЗ не найдены</div>
            )}
            {pvzList.map((pvz) => (
              <div
                key={pvz.id}
                className={`p-3 border rounded transition-colors ${
                  selectedPvzId === pvz.id 
                    ? 'bg-blue-100 border-blue-300' 
                    : 'hover:bg-blue-50'
                }`}
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => handlePvzSelect(pvz.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      pvz.service === 'sdek' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pvz.service.toUpperCase()}
                    </span>
                    <div className="font-semibold">{pvz.name}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{pvz.address}</div>
                  {pvz.phone && <div className="text-sm text-gray-500">Тел: {pvz.phone}</div>}
                  {pvz.work_time && <div className="text-sm text-gray-500">Время: {pvz.work_time}</div>}
                </div>
                
                {/* Кнопки действий */}
                <div className="flex gap-2 mt-3">
                  <button
                    className="flex-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                    onClick={() => handlePvzSelect(pvz.id)}
                  >
                    Выбрать
                  </button>
                  {allowSaveToProfile && me && (
                    <button
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition disabled:opacity-50"
                      onClick={() => handleSavePvzToProfile(pvz)}
                      disabled={isSaving}
                    >
                      {isSaving ? '...' : '💾 В профиль'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PvzModal; 