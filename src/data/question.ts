import {
  MyQuestionQueryOptions,
  QuestionPaginator,
  QuestionQueryOptions,
} from '@/types';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/data/client/endpoints';
import client from '@/data/client';
import { mapPaginatorData } from '@/data/utils/data-mapper';

export function useQuestions(options: QuestionQueryOptions) {
  const {
    data: response,
    isLoading,
    error,
    isFetching,
  } = useQuery<QuestionPaginator, Error>(
    [API_ENDPOINTS.PRODUCTS_QUESTIONS, options],
    ({ queryKey }) =>
      client.questions.all(
        Object.assign({}, queryKey[1] as QuestionQueryOptions)
      ),
    {
      keepPreviousData: true,
    }
  );
  return {
    questions: response?.data ?? [],
    paginatorInfo: mapPaginatorData(response),
    isLoading,
    error,
    isFetching,
  };
}

export function useMyQuestions(options?: MyQuestionQueryOptions) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery<QuestionPaginator, Error>(
    [API_ENDPOINTS.MY_QUESTIONS, options],
    ({ queryKey, pageParam }) =>
      client.myQuestions.all(Object.assign({}, queryKey[1], pageParam)),
    {
      getNextPageParam: (lastPage) => {
        if (!lastPage || typeof lastPage.current_page !== 'number' || typeof lastPage.last_page !== 'number') {
          return undefined;
        }
        return lastPage.last_page > lastPage.current_page 
          ? { page: lastPage.current_page + 1 } 
          : undefined;
      },
    }
  );

  function handleLoadMore() {
    fetchNextPage();
  }

  // Фильтруем вопросы без продуктов (когда товары были удалены)
  const allQuestions = Array.isArray(data?.pages) 
    ? data.pages.flatMap((page) => page?.data ?? []) 
    : [];
  
  // Фильтруем вопросы, у которых есть продукт
  const questionsWithProducts = allQuestions.filter((question) => question?.product);

  return {
    questions: questionsWithProducts,
    paginatorInfo: Array.isArray(data?.pages) && data.pages.length > 0
      ? mapPaginatorData(data.pages[data.pages.length - 1])
      : null,
    isLoading,
    error,
    isFetching,
    isLoadingMore: isFetchingNextPage,
    loadMore: handleLoadMore,
    hasMore: Boolean(hasNextPage),
  };
}
