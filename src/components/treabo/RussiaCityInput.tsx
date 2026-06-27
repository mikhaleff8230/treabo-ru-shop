import { getTreaboPublicApiBase } from '@/data/treabo';
import { useEffect, useMemo, useState } from 'react';

type RussiaCity = {
  id: string | number;
  name?: string;
  name_ru?: string;
  region?: string | null;
  region_ru?: string | null;
};

type RussiaCityInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

const POPULAR_RUSSIA_CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Новосибирск',
  'Екатеринбург',
  'Казань',
  'Нижний Новгород',
  'Краснодар',
  'Самара',
  'Ростов-на-Дону',
  'Уфа',
];

export default function RussiaCityInput({
  value,
  onChange,
  placeholder = 'Город',
  className = '',
  inputClassName = 'w-full bg-transparent text-xs font-medium text-[#232323] outline-none placeholder:text-[#777D88] sm:text-[13px]',
}: RussiaCityInputProps) {
  const [options, setOptions] = useState<RussiaCity[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const list = useMemo(() => {
    if (options.length) return options;
    return POPULAR_RUSSIA_CITIES.map((name) => ({ id: name, name_ru: name }));
  }, [options]);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setOptions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`${getTreaboPublicApiBase()}/locations/russia/search?q=${encodeURIComponent(query)}&limit=8&type=city`, {
        headers: { Accept: 'application/json' },
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => setOptions(payload?.data || []))
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <div className={`relative min-w-0 flex-1 ${className}`}>
      <input
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-60 overflow-auto rounded-2xl border border-[#E7E9EC] bg-white p-1 shadow-[0_16px_42px_rgba(25,31,42,0.14)]">
          {loading ? <div className="px-3 py-2 text-xs font-medium text-[#777D88]">Поиск города…</div> : null}
          {!loading && list.length ? (
            list.map((city) => {
              const cityName = city.name_ru || city.name || String(city.id);
              const region = city.region_ru || city.region;
              return (
                <button
                  key={`${city.id}-${cityName}`}
                  type="button"
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[#F6F7F5]"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onChange(cityName);
                    setOpen(false);
                  }}
                >
                  <span className="font-semibold text-[#232323]">{cityName}</span>
                  {region ? <span className="ml-2 text-xs text-[#777D88]">{region}</span> : null}
                </button>
              );
            })
          ) : null}
          {!loading && !list.length ? <div className="px-3 py-2 text-xs font-medium text-[#777D88]">Начните вводить город РФ</div> : null}
        </div>
      ) : null}
    </div>
  );
}
