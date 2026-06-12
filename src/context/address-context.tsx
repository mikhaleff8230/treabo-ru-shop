import React, { createContext, useContext, useState } from 'react';

export interface Address {
  id: string;
  label: string;
  address: string;
  extra?: string;
  suitability?: string;
}

interface AddressContextType {
  selectedAddress: Address | null;
  setSelectedAddress: (addr: Address | null) => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  return (
    <AddressContext.Provider value={{ selectedAddress, setSelectedAddress }}>
      {children}
    </AddressContext.Provider>
  );
};

export function useAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddress must be used within AddressProvider');
  return ctx;
} 