import { useQuery } from '@tanstack/react-query';

export interface ProSubscriptionCheckResponse {
  success: boolean;
  data: {
    has_active: boolean;
  };
}

export function useProSubscriptionCheck(sellerId: number | undefined) {
  return useQuery<ProSubscriptionCheckResponse>(
    ['pro-subscription', 'check', sellerId],
    async () => {
      if (!sellerId) {
        return { success: false, data: { has_active: false } };
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}/pro-subscription/check/${sellerId}`
      );
      
      if (!response.ok) {
        return { success: false, data: { has_active: false } };
      }
      
      return response.json();
    },
    {
      enabled: !!sellerId,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 минут
    }
  );
}

