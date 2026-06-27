import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import type { TreaboCategory } from '@/data/treabo';
import { categoryLabel, findCategoryById, searchCategories } from '@/lib/treabo/categories';

type TreaboCategorySearchInputProps = {
  categories: TreaboCategory[];
  value: string;
  categoryId?: string | null;
  onValueChange: (value: string) => void;
  onCategoryIdChange: (categoryId: string | null) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showSelectedHint?: boolean;
};

export default function TreaboCategorySearchInput({
  categories,
  value,
  categoryId,
  onValueChange,
  onCategoryIdChange,
  placeholder = 'Какая услуга нужна?',
  className = '',
  inputClassName = 'w-full bg-transparent text-xs font-medium text-[#232323] outline-none placeholder:text-[#777D88] sm:text-[13px]',
  showSelectedHint = false,
}: TreaboCategorySearchInputProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selectedCategory = useMemo(
    () => findCategoryById(categories, categoryId || undefined),
    [categories, categoryId],
  );

  const suggestions = useMemo(() => searchCategories(categories, value, 8), [categories, value]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function pickCategory(category: TreaboCategory) {
    onCategoryIdChange(category.id);
    onValueChange(categoryLabel(category));
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex h-11 items-center gap-2.5 rounded-[16px] bg-[#F6F7F5] px-3.5">
        <Search className="h-4 w-4 shrink-0 text-[#777D88]" />
        <input
          className={inputClassName}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            onCategoryIdChange(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {showSelectedHint && selectedCategory && categoryId ? (
        <div className="mt-2 text-xs font-medium text-[#777D88]">
          Категория: <span className="text-[#232323]">{categoryLabel(selectedCategory)}</span>
        </div>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-auto rounded-2xl border border-[#E7E9EC] bg-white py-1 shadow-[0_16px_42px_rgba(25,31,42,0.14)]">
          {suggestions.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                className="block w-full px-4 py-3 text-left hover:bg-[#F6F7F5]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pickCategory(category)}
              >
                <div className="text-sm font-semibold text-[#232323]">{categoryLabel(category)}</div>
                {category.parent_id ? (
                  <div className="mt-0.5 text-xs text-[#777D88]">{category.parent_id}</div>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
