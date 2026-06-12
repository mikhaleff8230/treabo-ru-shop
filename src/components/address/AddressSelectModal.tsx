import * as React from 'react';
import { useState } from 'react';
import { useAddress } from '@/context/address-context';

interface Address {
  id: string;
  label: string;
  address: string;
  extra?: string;
  suitability?: string;
}

const initialAddresses: Address[] = [
  {
    id: '1',
    label: 'Пункт СДЕК',
    address: 'Московская обл., г. Шаховская, д. Дор, Центральная ул., 3А',
    extra: 'Срок хранения заказа — 14 дней',
    suitability: 'Адрес подходит для этих товаров',
  },
  {
    id: '2',
    label: 'Постамат',
    address: 'Московская обл., г. Шаховская, д. Дор, ул. Лётчика Грицевца, 9',
    extra: 'Срок хранения заказа — 2 дня',
    suitability: 'Адрес подходит для этих товаров',
  },
  {
    id: '3',
    label: 'Адрес доставки',
    address: 'Москва, Планерная ул., 12к1, кв./офис 358',
    extra: 'подъезд 12, домофон 358, этаж 3',
    suitability: 'Адрес подходит для этих товаров',
  },
];

interface AddressSelectModalProps {
  onAddNew: () => void;
  onClose: () => void;
}

const AddressSelectModal: React.FC<AddressSelectModalProps> = ({ onAddNew, onClose }) => {
  const { selectedAddress, setSelectedAddress } = useAddress();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);

  const handleSelect = (addr: Address) => {
    setSelectedAddress(addr);
    onClose();
  };

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter((a: Address) => a.id !== id));
    if (selectedAddress?.id === id) setSelectedAddress(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative">
        <button className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        <div className="text-2xl font-bold mb-5">Выберите адрес доставки</div>
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto mb-6">
          {addresses.map((addr: Address) => (
            <div
              key={addr.id}
              className={`rounded-2xl border ${selectedAddress?.id === addr.id ? 'border-blue-500' : 'border-gray-200'} bg-white p-4 shadow-sm flex flex-col cursor-pointer transition relative`}
              onClick={() => handleSelect(addr)}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="font-semibold">{addr.label}</div>
                <button
                  className="text-gray-400 hover:text-red-500 px-2"
                  onClick={e => { e.stopPropagation(); handleDelete(addr.id); }}
                  title="Удалить адрес"
                >
                  <span style={{fontSize:18}}>🗑️</span>
                </button>
              </div>
              <div className="text-sm text-gray-800">{addr.address}</div>
              {addr.extra && <div className="text-xs text-gray-500">{addr.extra}</div>}
              {addr.suitability && <div className="text-xs text-green-600 mt-1">{addr.suitability}</div>}
            </div>
          ))}
        </div>
        <button
          className="w-full mt-2 py-3 rounded-xl bg-[#f3f6fa] text-[#2563eb] font-bold text-lg hover:bg-[#e0e7ef] transition"
          onClick={onAddNew}
        >
          Добавить
          <div className="text-xs font-normal">адрес доставки, пункт выдачи, постамат</div>
        </button>
      </div>
    </div>
  );
};

export default AddressSelectModal; 