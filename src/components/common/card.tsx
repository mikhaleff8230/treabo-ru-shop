import React from 'react';
import cn from 'classnames';

export default function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-4 border rounded bg-white dark:bg-dark-300 border-light-500 dark:border-dark-600', className)}>{children}</div>;
} 