import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserAddresses, UserAddress } from '@/data/user-addresses';
import { useMe } from '@/data/user';
import Button from '@/components/ui/button';
import { useRouter } from 'next/router';

interface SavedAddressSelectorProps {
  onSelectAddress: (address: UserAddress) => void;
  selectedAddress?: UserAddress | null;
}

const SavedAddressSelector: React.FC<SavedAddressSelectorProps> = ({ 
  onSelectAddress, 
  selectedAddress 
}) => {
  const { me } = useMe();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  // Загрузка сохраненных адресов ПВЗ
  const { data: addressesData, isLoading, error } = useQuery({
    ...useUserAddresses('pvz'),
    enabled: !!me, // Загружаем только если пользователь авторизован
  });

  // Отладочная информация
  console.log('SavedAddressSelector debug:', {
    me: !!me,
    isLoading,
    error,
    addressesData,
    addressesCount: addressesData?.data?.length || 0
  });

  const addresses = addressesData?.data || [];
  const defaultAddress = addresses.find(addr => addr.is_default);
  const hasAddresses = addresses.length > 0;

  if (!me) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
        <div className="text-gray-500 mb-2">Войдите в аккаунт</div>
        <div className="text-sm text-gray-400">чтобы использовать сохраненные адреса</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="text-gray-500">Загрузка сохраненных адресов...</div>
      </div>
    );
  }

  if (!hasAddresses) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
        <div className="text-gray-500 mb-2">Нет сохраненных адресов ПВЗ</div>
        <Button
          variant="outline"
          size="small"
          onClick={() => router.push('/select-address')}
        >
          Выбрать ПВЗ
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Сохраненные адреса</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-500 hover:text-blue-600 text-sm"
        >
          {isExpanded ? 'Свернуть' : `Показать все (${addresses.length})`}
        </button>
      </div>

      {/* Адрес по умолчанию */}
      {defaultAddress && !isExpanded && (
        <div
          className={`p-3 border rounded-lg cursor-pointer transition ${
            selectedAddress?.id === defaultAddress.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelectAddress(defaultAddress)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{defaultAddress.title}</span>
                <span className="inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded">
                  По умолчанию
                </span>
              </div>
              <div className="text-sm text-gray-600">{defaultAddress.name}</div>
              <div className="text-sm text-gray-500">{defaultAddress.address}</div>
            </div>
            {defaultAddress.service_info && (
              <span 
                className="inline-block px-2 py-1 text-xs rounded text-white font-semibold"
                style={{ backgroundColor: defaultAddress.service_info.color }}
              >
                {defaultAddress.service_info.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Все адреса */}
      {isExpanded && (
        <div className="space-y-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`p-3 border rounded-lg cursor-pointer transition ${
                selectedAddress?.id === address.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectAddress(address)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{address.title}</span>
                    {address.is_default && (
                      <span className="inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded">
                        По умолчанию
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{address.name}</div>
                  <div className="text-sm text-gray-500">{address.address}</div>
                  {address.phone && (
                    <div className="text-xs text-gray-400 mt-1">📞 {address.phone}</div>
                  )}
                </div>
                {address.service_info && (
                  <span 
                    className="inline-block px-2 py-1 text-xs rounded text-white font-semibold"
                    style={{ backgroundColor: address.service_info.color }}
                  >
                    {address.service_info.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка для добавления нового адреса */}
      <div className="pt-2 border-t border-gray-100">
        <Button
          variant="outline"
          size="small"
          onClick={() => router.push('/select-address')}
          className="w-full"
        >
          + Выбрать другой ПВЗ
        </Button>
      </div>
    </div>
  );
};

export default SavedAddressSelector;

