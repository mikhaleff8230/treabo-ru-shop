import { HttpClient } from './client/http-client';

export interface UserAddress {
  id: number;
  type: 'pvz' | 'home';
  title: string;
  pvz_id?: string;
  service?: string;
  service_info?: {
    name: string;
    color: string;
  };
  name?: string;
  city: string;
  address: string;
  formatted_address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  work_time?: string;
  note?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressInput {
  type: 'pvz' | 'home';
  title: string;
  city: string;
  address: string;
  pvz_id?: string;
  service?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  work_time?: string;
  note?: string;
  is_default?: boolean;
}

export interface AddPvzFromMapInput {
  pvz_id: string;
  service: string;
  name: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  work_time?: string;
  title?: string;
}

// API функции для работы с адресами пользователей
export const userAddressesApi = {
  // Получить все адреса пользователя
  getAddresses: async (type?: 'pvz' | 'home'): Promise<{ data: UserAddress[]; total: number }> => {
    const data = await HttpClient.get<{ data: UserAddress[]; total: number }>('/user/addresses', {
      type
    });
    return data;
  },

  // Создать новый адрес
  createAddress: async (input: CreateAddressInput): Promise<{ message: string; data: UserAddress }> => {
    const data = await HttpClient.post<{ message: string; data: UserAddress }>('/user/addresses', input);
    return data;
  },

  // Обновить адрес
  updateAddress: async (id: number, input: Partial<CreateAddressInput>): Promise<{ message: string; data: UserAddress }> => {
    const data = await HttpClient.put<{ message: string; data: UserAddress }>(`/user/addresses/${id}`, input);
    return data;
  },

  // Удалить адрес
  deleteAddress: async (id: number): Promise<{ message: string }> => {
    const data = await HttpClient.delete<{ message: string }>(`/user/addresses/${id}`);
    return data;
  },

  // Установить адрес по умолчанию
  setDefaultAddress: async (id: number): Promise<{ message: string; data: UserAddress }> => {
    const data = await HttpClient.post<{ message: string; data: UserAddress }>(`/user/addresses/${id}/set-default`);
    return data;
  },

  // Быстрое добавление ПВЗ из карты
  addPvzFromMap: async (input: AddPvzFromMapInput): Promise<{ message: string; data: UserAddress }> => {
    const data = await HttpClient.post<{ message: string; data: UserAddress }>('/user/addresses/add-pvz', input);
    return data;
  },

  // Получить конкретный адрес
  getAddress: async (id: number): Promise<{ data: UserAddress }> => {
    const data = await HttpClient.get<{ data: UserAddress }>(`/user/addresses/${id}`);
    return data;
  },
};

// React Query hooks для работы с адресами
export const useUserAddresses = (type?: 'pvz' | 'home') => {
  return {
    queryKey: ['user-addresses', type],
    queryFn: () => userAddressesApi.getAddresses(type),
  };
};

export const useCreateAddress = () => {
  return {
    mutationFn: userAddressesApi.createAddress,
  };
};

export const useUpdateAddress = () => {
  return {
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAddressInput> }) =>
      userAddressesApi.updateAddress(id, data),
  };
};

export const useDeleteAddress = () => {
  return {
    mutationFn: userAddressesApi.deleteAddress,
  };
};

export const useSetDefaultAddress = () => {
  return {
    mutationFn: userAddressesApi.setDefaultAddress,
  };
};

export const useAddPvzFromMap = () => {
  return {
    mutationFn: userAddressesApi.addPvzFromMap,
  };
};

