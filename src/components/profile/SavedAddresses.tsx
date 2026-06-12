import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  useUserAddresses, 
  useDeleteAddress, 
  useSetDefaultAddress, 
  useUpdateAddress,
  UserAddress 
} from '@/data/user-addresses';
import { toast } from 'react-hot-toast';
import { useMe } from '@/data/user';
import Button from '@/components/ui/button';
import PvzModal from '@/components/pvz/PvzModal';

const SavedAddresses: React.FC = () => {
  const { me } = useMe();
  const queryClient = useQueryClient();
  const [showPvzModal, setShowPvzModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Загрузка сохраненных адресов
  const { data: addressesData, isLoading, error } = useQuery(
    useUserAddresses('pvz')
  );

  // Мутации
  const deleteAddressHook = useDeleteAddress();
  const { mutate: deleteAddress, isLoading: isDeleting } = useMutation({
    mutationFn: deleteAddressHook.mutationFn,
    onSuccess: () => {
      toast.success('Адрес удален');
      queryClient.invalidateQueries(['user-addresses']);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Ошибка удаления адреса');
    },
  });

  const setDefaultAddressHook = useSetDefaultAddress();
  const { mutate: setDefaultAddress, isLoading: isSettingDefault } = useMutation({
    mutationFn: setDefaultAddressHook.mutationFn,
    onSuccess: () => {
      toast.success('Адрес установлен по умолчанию');
      queryClient.invalidateQueries(['user-addresses']);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Ошибка изменения адреса по умолчанию');
    },
  });

  const updateAddressHook = useUpdateAddress();
  const { mutate: updateAddress, isLoading: isUpdating } = useMutation({
    mutationFn: updateAddressHook.mutationFn,
    onSuccess: () => {
      toast.success('Название адреса обновлено');
      queryClient.invalidateQueries(['user-addresses']);
      setEditingAddress(null);
      setEditTitle('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Ошибка обновления адреса');
    },
  });

  const addresses = addressesData?.data || [];

  // Обработчики
  const handleDelete = (id: number) => {
    if (confirm('Удалить этот адрес?')) {
      deleteAddress(id);
    }
  };

  const handleSetDefault = (id: number) => {
    setDefaultAddress(id);
  };

  const handleEditTitle = (address: UserAddress) => {
    setEditingAddress(address);
    setEditTitle(address.title);
  };

  const handleSaveTitle = () => {
    if (editingAddress && editTitle.trim()) {
      updateAddress({
        id: editingAddress.id,
        data: { title: editTitle.trim() }
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setEditTitle('');
  };

  if (!me) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Войдите в аккаунт для просмотра сохраненных адресов</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Загрузка адресов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">Ошибка загрузки адресов</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Сохраненные адреса ПВЗ</h3>
          <p className="text-sm text-gray-600">
            Управляйте вашими избранными пунктами выдачи заказов
          </p>
        </div>
        <Button
          onClick={() => setShowPvzModal(true)}
          size="small"
          className="px-4 py-2"
        >
          + Добавить ПВЗ
        </Button>
      </div>

      {/* Список адресов */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-4">У вас пока нет сохраненных адресов ПВЗ</div>
          <Button
            onClick={() => setShowPvzModal(true)}
            variant="outline"
          >
            Добавить первый адрес
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`p-4 border rounded-lg bg-white ${
                address.is_default ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {/* Заголовок адреса */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {editingAddress?.id === address.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        placeholder="Название адреса"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveTitle}
                        disabled={isUpdating || !editTitle.trim()}
                        className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base">{address.title}</h4>
                      <button
                        onClick={() => handleEditTitle(address)}
                        className="text-blue-500 hover:text-blue-600 text-xs"
                      >
                        ✏️
                      </button>
                      {address.is_default && (
                        <span className="inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded">
                          По умолчанию
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Значок службы */}
                {address.service_info && (
                  <span 
                    className="inline-block px-2 py-1 text-xs rounded text-white font-semibold"
                    style={{ backgroundColor: address.service_info.color }}
                  >
                    {address.service_info.name}
                  </span>
                )}
              </div>

              {/* Информация об адресе */}
              <div className="space-y-1 mb-3">
                <div className="font-medium">{address.name}</div>
                <div className="text-gray-600 text-sm">{address.address}</div>
                {address.phone && (
                  <div className="text-gray-500 text-sm">📞 {address.phone}</div>
                )}
                {address.work_time && (
                  <div className="text-gray-500 text-sm">🕒 {address.work_time}</div>
                )}
                {address.note && (
                  <div className="text-gray-500 text-sm">📝 {address.note}</div>
                )}
              </div>

              {/* Кнопки действий */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                {!address.is_default && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    disabled={isSettingDefault}
                    className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded hover:bg-blue-200 disabled:opacity-50 transition"
                  >
                    Сделать основным
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={isDeleting}
                  className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 disabled:opacity-50 transition"
                >
                  Удалить
                </button>
                
                <div className="text-xs text-gray-400 ml-auto">
                  Добавлен {new Date(address.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно для добавления ПВЗ */}
      {showPvzModal && (
        <PvzModal
          onClose={() => setShowPvzModal(false)}
          onSelect={(selected) => {
            setShowPvzModal(false);
            // После выбора ПВЗ модальное окно закрывается
            // Сохранение происходит через кнопку "В профиль" внутри модального окна
          }}
          allowSaveToProfile={true}
        />
      )}
    </div>
  );
};

export default SavedAddresses;
