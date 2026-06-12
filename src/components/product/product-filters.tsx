import { ChevronRight } from '@/components/icons/chevron-right';

interface ProductFiltersProps {
  onFilterChange?: (filters: any) => void;
}

export default function ProductFilters({ onFilterChange }: ProductFiltersProps) {
  return (
    <button
      className="h-[30px] shrink-0 !rounded-full border border-dark-100 bg-dark-100 text-light-100 py-1.5 px-3.5 text-xs font-medium outline-none transition-opacity duration-200 hover:opacity-90 focus:opacity-90 flex items-center gap-2"
    >
      <span className="h-4 w-4 flex items-center justify-center">☰</span>
      Фильтр
      <ChevronRight className="h-3 w-3 rotate-90" />
    </button>
  );
}
