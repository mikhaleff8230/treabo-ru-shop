import React, { useState } from 'react';
import { InputHTMLAttributes } from 'react';
import { SearchIcon } from '@/components/icons/search-icon';
import { CloseIcon } from '@/components/icons/close-icon';

interface SearchProps {
  onSearch: (params: { searchText: string }) => void;
  placeholderText?: string;
}

export default function Search({ onSearch, placeholderText }: SearchProps) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSearch({ searchText: value });
      }}
      className="flex"
    >
      <input
        type="text"
        className="border rounded px-3 py-2 w-full"
        placeholder={placeholderText || 'Поиск...'}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button type="submit" className="ml-2 px-3 py-2 rounded bg-blue-600 text-white">Найти</button>
    </form>
  );
}

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: any;
  onSubmit: (e: any) => void;
  onClearSearch: (e: any) => void;
  onChangeSearch: (e: any) => void;
}

const QuestionSearch: React.FC<Props> = ({
  label,
  onSubmit,
  onClearSearch,
  onChangeSearch,
  value,
  ...rest
}) => {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="relative flex h-11 rounded md:rounded-lg">
        <label htmlFor={label} className="sr-only">
          {label}
        </label>

        <input
          id={label}
          onChange={onChangeSearch}
          type="text"
          value={value}
          autoComplete="off"
          className="search item-center text-heading flex h-full w-full appearance-none overflow-hidden truncate rounded-xl border-light bg-light text-13px placeholder-light-900 transition duration-300 ease-in-out focus:border-brand-dark focus:outline-none focus:ring-0 ltr:pl-11 rtl:pr-11 dark:border-dark-300 dark:bg-dark-300"
          {...rest}
        />
        {value && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute flex h-full w-10 cursor-pointer items-center justify-center text-13px transition-colors duration-200 hover:text-brand focus:text-brand focus:outline-none ltr:right-0 rtl:left-0 md:w-14 ltr:md:-right-1 rtl:md:-left-1"
          >
            <span className="sr-only">Close</span>
            <CloseIcon className="h-3.5 w-3.5 md:h-3 md:w-3" />
          </button>
        )}

        <button className="absolute flex h-full w-12 items-center justify-center text-13px transition-colors duration-200 hover:text-brand focus:text-brand focus:outline-none ltr:left-0 rtl:right-0">
          <span className="sr-only">Search</span>
          <SearchIcon className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};
