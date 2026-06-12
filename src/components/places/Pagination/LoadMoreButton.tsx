import React from 'react';
import { useTranslation } from 'next-i18next';

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LoadMoreButton({
  onClick,
  isLoading = false,
  disabled = false,
  className = '',
}: LoadMoreButtonProps) {
  const { t } = useTranslation('common');

  return (
    <div className={`grid place-content-center ${className}`}>
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`
          px-6 py-3 bg-blue-500 text-white rounded-lg font-medium
          hover:bg-blue-600 transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2
        `}
      >
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        )}
        {isLoading ? 'Загрузка...' : t('text-loadmore')}
      </button>
    </div>
  );
}

