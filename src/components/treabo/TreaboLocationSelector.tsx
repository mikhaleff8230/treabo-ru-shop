import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Check, ChevronDown, Loader2, MapPin, Search, X } from 'lucide-react';
import {
  getLocationDisplayName,
  getMoldovaLocationById,
  MoldovaLocation,
  readStoredTreaboLocation,
  searchMoldovaLocationsWithFallback,
  toStoredTreaboLocation,
  TREABO_LOCATION_STORAGE_KEY,
} from '@/data/moldova-locations';

const DEBOUNCE_MS = 250;

export default function TreaboLocationSelector() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MoldovaLocation[]>([]);
  const [selected, setSelected] = useState<MoldovaLocation>(() => getMoldovaLocationById('chisinau'));

  const locale = router.locale === 'ru' ? 'ru' : 'ro';
  const selectedName = getLocationDisplayName(selected, locale);

  useEffect(() => {
    setSelected(readStoredTreaboLocation());
  }, []);

  useEffect(() => {
    if (!open) return;

    setLoading(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const next = await searchMoldovaLocationsWithFallback(query, { limit: 14, locale });
      setResults(next);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [open, query, locale]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const visibleResults = useMemo(() => results, [results]);

  function selectLocation(location: MoldovaLocation) {
    setSelected(location);
    setQuery('');
    setOpen(false);

    if (typeof window !== 'undefined') {
      const stored = toStoredTreaboLocation(location);
      window.localStorage.setItem(TREABO_LOCATION_STORAGE_KEY, JSON.stringify(stored));
      window.dispatchEvent(new CustomEvent('treabo:location-change', { detail: location }));
    }

    if (router.pathname === '/works' || router.pathname === '/specialists') {
      router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          city: getLocationDisplayName(location, 'ru'),
        },
      });
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 max-w-[170px] items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-sm font-bold text-[#232323] transition hover:border-zinc-950"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MapPin className="h-4 w-4 shrink-0" />
        <span className="truncate">{selectedName}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[80] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-2xl">
          <div className="border-b border-zinc-100 p-3">
            <div className="flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-[#7d849b]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
                className="w-full bg-transparent text-sm font-semibold text-[#232323] outline-none placeholder:text-[#7d849b]"
                placeholder={locale === 'ro' ? 'Oraș sau localitate' : 'Город или населенный пункт'}
              />
              {query ? (
                <button type="button" onClick={() => setQuery('')} className="rounded-full p-1 hover:bg-zinc-100">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm font-semibold text-[#7d849b]">
                <Loader2 className="h-4 w-4 animate-spin" />
                {locale === 'ro' ? 'Se caută...' : 'Поиск...'}
              </div>
            ) : null}

            {!loading && visibleResults.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm font-semibold text-[#7d849b]">
                {locale === 'ro' ? 'Nimic găsit' : 'Ничего не найдено'}
              </div>
            ) : null}

            {!loading
              ? visibleResults.map((location) => {
                  const active = String(location.id) === String(selected.id);
                  return (
                    <button
                      key={`${location.id}-${location.cuatm_code || location.name_ro}`}
                      type="button"
                      onClick={() => selectLocation(location)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[#f5f6f1]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d9f36b]">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-[#232323]">
                          {getLocationDisplayName(location, locale)}
                        </span>
                        <span className="block truncate text-xs font-semibold text-[#7d849b]">
                          {locale === 'ro' ? location.district_ro : location.district_ru}
                        </span>
                      </span>
                      {active ? <Check className="h-4 w-4 shrink-0" /> : null}
                    </button>
                  );
                })
              : null}
          </div>

          <div className="border-t border-zinc-100 px-4 py-3 text-xs font-semibold leading-5 text-[#7d849b]">
            {locale === 'ro'
              ? 'Sursa: API Moldova/CUATM. Dacă backend-ul nu răspunde, folosim fallback local.'
              : 'Источник: API Moldova/CUATM. Если backend недоступен, используем локальный fallback.'}
          </div>
        </div>
      ) : null}
    </div>
  );
}
