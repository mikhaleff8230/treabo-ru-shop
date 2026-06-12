import React, { useEffect, useRef } from 'react';

interface InfiniteScrollProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  lastElementRef?: React.RefObject<HTMLDivElement>;
}

export function InfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  children,
  threshold = 0.5,
  rootMargin = '600px',
  lastElementRef: externalLastElementRef,
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const internalLastElementRef = useRef<HTMLDivElement>(null);

  // Используем внешний ref если передан, иначе внутренний
  const lastElementRef = externalLastElementRef || internalLastElementRef;

  useEffect(() => {
    if (typeof window === 'undefined' || !hasNextPage) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold, rootMargin }
    );

    if (lastElementRef.current) {
      observerRef.current.observe(lastElementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold, rootMargin]);

  return (
    <div>
      {children}
      {/* Невидимый элемент для отслеживания - только если не передан external ref */}
      {!externalLastElementRef && (
        <div ref={lastElementRef} style={{ height: '1px' }} />
      )}
    </div>
  );
}
