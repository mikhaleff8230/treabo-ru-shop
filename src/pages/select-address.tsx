import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { fetchAllPvz, fetchPvz } from '@/data/pvz';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAddPvzFromMap } from '@/data/user-addresses';
import { useMe } from '@/data/user';
import { toast } from 'react-hot-toast';

const MapWithPoints = dynamic(() => import('@/components/address/MapWithPoints'), { ssr: false });

interface PvzPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  work_time: string;
  service: string;
}

const SelectAddressPage = () => {
  const [pickup, setPickup] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [city, setCity] = useState('Москва');
  const [service, setService] = useState('all');
  const [pvzList, setPvzList] = useState<PvzPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { me } = useMe();
  const queryClient = useQueryClient();

  // Мутация для сохранения ПВЗ в профиль
  const { mutate: addPvzToProfile, isLoading: isSaving } = useMutation({
    ...useAddPvzFromMap(),
    onSuccess: (data) => {
      toast.success('ПВЗ сохранен в ваш профиль!');
      queryClient.invalidateQueries(['user-addresses']);
      // Возвращаемся на страницу откуда пришли или на checkout
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        localStorage.removeItem('returnUrl');
        router.push(returnUrl);
      } else {
        router.push('/checkout');
      }
    },
    onError: (error: any) => {
      console.error('PVZ Save Error:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Ошибка сохранения ПВЗ';
      toast.error(errorMessage);
    },
  });

  // Загрузка ПВЗ
  const loadPvz = async () => {
    if (!city.trim() || !pickup) {
      setPvzList([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = service === 'all' ? await fetchAllPvz(city) : await fetchPvz(city, service);
      setPvzList(data);
    } catch (err: any) {
      console.error('PVZ loading error:', err);
      setError(err.message || 'Ошибка загрузки ПВЗ');
      setPvzList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPvz();
  }, [city, service, pickup]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  // Функция для сохранения ПВЗ в профиль
  const handleSavePvzToProfile = (pvz: PvzPoint) => {
    if (!me) {
      toast.error('Необходимо войти в аккаунт');
      return;
    }

    const pvzData = {
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
    };

    addPvzToProfile(pvzData);
  };

  const handleConfirm = () => {
    if (pickup) {
      const selected = pvzList.find(p => p.id === selectedId);
      if (selected) {
        // Сохраняем ПВЗ в профиль пользователя
        if (me) {
          handleSavePvzToProfile(selected);
        }
        
        // Сохраняем в localStorage для checkout
        localStorage.setItem('selectedAddress', JSON.stringify({
          id: selected.id,
          label: selected.name,
          address: selected.address,
          phone: selected.phone,
          work_time: selected.work_time,
          service: selected.service,
          type: 'pvz'
        }));
        // Возвращаемся на страницу откуда пришли или на checkout
        const returnUrl = localStorage.getItem('returnUrl');
        if (returnUrl) {
          localStorage.removeItem('returnUrl');
          router.push(returnUrl);
        } else {
          router.push('/checkout');
        }
      }
    } else {
      // Для курьерской доставки можно добавить логику ввода адреса
      router.push('/checkout');
    }
  };

  // Преобразуем ПВЗ для карты
  const mapPoints = pvzList.map(pvz => ({
    id: pvz.id,
    label: pvz.name,
    address: pvz.address,
    lat: pvz.latitude,
    lng: pvz.longitude,
    service: pvz.service, // Передаем службу для иконок
  }));

  return (
    <div className="flex h-screen w-screen bg-[#f6f7fa]">
      <div className="w-[420px] p-6 bg-white border-r border-gray-200 flex flex-col">
        <div className="flex gap-2 mb-6">
          <button
            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-base transition border ${pickup ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-[#f3f6fa] text-[#2563eb] border-transparent hover:bg-[#e0e7ef]'}`}
            onClick={() => setPickup(true)}
          >Самовывоз</button>
          <button
            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-base transition border ${!pickup ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-[#f3f6fa] text-[#2563eb] border-transparent hover:bg-[#e0e7ef]'}`}
            onClick={() => setPickup(false)}
          >Курьером</button>
        </div>
        <div className="mb-4">
          <input 
            className="w-full px-4 py-2 rounded-lg border border-gray-200" 
            placeholder="Введите город"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        
        {pickup && (
          <div className="mb-4">
            <select 
              value={service} 
              onChange={(e) => setService(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            >
              <option value="all">Все службы</option>
              <option value="sdek">СДЭК</option>
              <option value="yandex">Яндекс.Доставка</option>
            </select>
          </div>
        )}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3">
          {loading && (
            <div className="text-center py-8 text-gray-500">
              Загрузка ПВЗ...
            </div>
          )}
          
          {error && (
            <div className="text-center py-4">
              <div className="text-red-500 text-sm mb-2">{error}</div>
              <button 
                onClick={loadPvz}
                className="text-blue-500 text-sm hover:text-blue-600"
              >
                Попробовать снова
              </button>
            </div>
          )}
          
          {pickup && !loading && !error && pvzList.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ПВЗ не найдены в этом городе
            </div>
          )}
          
          {pickup && pvzList.map(point => (
            <div
              key={point.id}
              className={`rounded-2xl border ${selectedId === point.id ? 'border-blue-500' : 'border-gray-200'} bg-white p-4 shadow-sm flex flex-col transition`}
            >
              <div 
                className="cursor-pointer"
                onClick={() => handleSelect(point.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    point.service === 'sdek' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {point.service.toUpperCase()}
                  </span>
                  <div className="font-semibold">{point.name}</div>
                </div>
                <div className="text-sm text-gray-800 mb-1">{point.address}</div>
                {point.phone && (
                  <div className="text-xs text-gray-500">Тел: {point.phone}</div>
                )}
                {point.work_time && (
                  <div className="text-xs text-gray-500">Время работы: {point.work_time}</div>
                )}
                <div className="text-xs text-green-600 mt-1">Адрес подходит для доставки</div>
              </div>

              {/* Индикатор выбора */}
              {selectedId === point.id && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-center text-blue-600 font-semibold">
                    ✓ Выбрано
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {!pickup && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="font-semibold mb-3">Адрес доставки</div>
              <input 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3" 
                placeholder="Улица, дом"
              />
              <input 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3" 
                placeholder="Квартира, офис"
              />
              <textarea 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" 
                placeholder="Комментарий к доставке"
                rows={3}
              />
            </div>
          )}
        </div>
        <button
          className="w-full mt-6 py-3 rounded-xl bg-[#2563eb] text-white font-bold text-lg hover:bg-[#1d4ed8] transition disabled:opacity-60"
          disabled={pickup ? !selectedId : false}
          onClick={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
        >
          {pickup && selectedId ? 'Сохранить' : 'Выбрать'}
        </button>
      </div>
      <div className="flex-1 relative">
        {pickup && pvzList.length > 0 ? (
          <MapWithPoints points={mapPoints} selectedId={selectedId} onSelect={handleSelect} />
        ) : (
          <div className="h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              {pickup ? (
                loading ? 'Загрузка карты...' : 'Выберите город для отображения ПВЗ на карте'
              ) : (
                'Для курьерской доставки карта не требуется'
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectAddressPage; 