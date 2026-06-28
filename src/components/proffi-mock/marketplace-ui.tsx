import { ChevronDown, X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

export const marketplace = {
  pageBg: 'bg-[#F7F7F4]',
  text: 'text-[#232323]',
  textSecondary: 'text-[#777D88]',
  border: 'border-[#E7E9EC]',
  accent: 'bg-[#D9F36B]',
  accentText: 'text-[#232323]',
  maxWidth: 'max-w-[1160px]',
  card: 'rounded-[24px] border border-white/80 bg-white shadow-[0_8px_24px_rgba(25,31,42,0.055)] transition-shadow hover:shadow-[0_12px_30px_rgba(25,31,42,0.075)]',
  chip: 'rounded-full border border-[#E6E9EF] bg-white px-3 py-1.5 text-[11px] font-[300] leading-none text-[#3A3D45] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.72)] sm:text-[12px]',
} as const;

export const treaboMinimal = {
  page: 'min-h-screen max-w-full overflow-x-hidden bg-[#F7F7F4] text-[#232323]',
  section: 'mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8',
  sectionY: 'py-8 sm:py-10',
  eyebrow:
    'inline-flex w-fit items-center gap-2 rounded-full border border-[#E7E9EC] bg-white px-3 py-1.5 text-[11px] font-medium text-[#777D88] shadow-[0_6px_18px_rgba(25,31,42,0.045)]',
  heroTitle: 'text-[34px] font-[300] leading-[1.04] tracking-[-0.04em] text-[#232323] sm:text-[52px] lg:text-[64px]',
  h2: 'text-[26px] font-[300] leading-tight tracking-[-0.03em] text-[#232323] sm:text-[34px]',
  body: 'text-[13px] leading-6 text-[#777D88] sm:text-sm',
  card: marketplace.card,
  compactCard:
    'rounded-[22px] border border-white/80 bg-white shadow-[0_8px_24px_rgba(25,31,42,0.05)] transition hover:shadow-[0_12px_30px_rgba(25,31,42,0.07)]',
  inputShell: 'rounded-[22px] border border-[#E7E9EC] bg-white p-2 shadow-[0_8px_24px_rgba(24,28,35,0.045)]',
  input:
    'rounded-[16px] bg-[#F6F7F5] px-3.5 text-xs font-medium text-[#232323] outline-none placeholder:text-[#777D88] sm:text-[13px]',
  buttonDark:
    'inline-flex min-h-[38px] items-center justify-center rounded-[14px] bg-[#232323] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3a3a3a]',
  buttonAccent:
    'inline-flex min-h-[38px] items-center justify-center rounded-[14px] bg-[#D9F36B] px-4 py-2 text-xs font-semibold text-[#232323] transition hover:bg-[#c7e85a]',
  chip: marketplace.chip,
  badge: 'rounded-[8px] bg-[#F4F5FA] px-1.5 py-0.5 text-[11px] font-medium text-[#566074]',
} as const;

type FilterSidebarProps = {
  title: string;
  resetLabel: string;
  onReset: () => void;
  applyLabel: string;
  onApply: () => void;
  viewOnMapLabel?: string;
  onViewMap?: () => void;
  showMapButton?: boolean;
  children: ReactNode;
  className?: string;
};

export function MarketplaceFilterSidebar({
  title,
  resetLabel,
  onReset,
  applyLabel,
  onApply,
  viewOnMapLabel,
  onViewMap,
  showMapButton = true,
  children,
  className = '',
}: FilterSidebarProps) {
  return (
    <div
      className={`sticky top-20 w-[258px] rounded-[24px] border border-white/80 bg-white p-4 shadow-[0_8px_24px_rgba(25,31,42,0.045)] ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[#232323]">{title}</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-[#777D88] transition hover:text-[#232323] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9F36B]"
        >
          {resetLabel}
        </button>
      </div>
      <div className="space-y-0">{children}</div>
      <button
        type="button"
        onClick={onApply}
        className="mt-4 min-h-[38px] w-full rounded-[14px] bg-[#232323] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3a3a3a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9F36B]"
      >
        {applyLabel}
      </button>
      {showMapButton && onViewMap && viewOnMapLabel ? (
        <button
          type="button"
          onClick={onViewMap}
          className="mt-2 min-h-[38px] w-full rounded-[14px] border border-[#E7E9EC] bg-white px-4 py-2 text-xs font-semibold text-[#232323] transition hover:bg-[#FAFAFA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9F36B]"
        >
          {viewOnMapLabel}
        </button>
      ) : null}
    </div>
  );
}

type FilterGroupProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function MarketplaceFilterGroup({ title, open, onToggle, children }: FilterGroupProps) {
  return (
    <div className="border-t border-[#E7E9EC] py-3 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-[32px] w-full items-center justify-between text-left text-[13px] font-semibold text-[#232323] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9F36B]"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-[#777D88] transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="mt-2 space-y-1">{children}</div> : null}
    </div>
  );
}

type FilterOptionProps = {
  label: string;
  selected?: boolean;
  onClick: () => void;
  type?: 'checkbox' | 'chip';
};

export function MarketplaceFilterOption({ label, selected, onClick, type = 'checkbox' }: FilterOptionProps) {
  if (type === 'chip') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9F36B] ${
          selected
            ? 'border-[#D9F36B] bg-[#D9F36B] text-[#232323]'
            : 'border-[#E7E9EC] bg-white text-[#232323] hover:border-[#D9F36B]/60'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[34px] w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9F36B] ${
        selected ? 'bg-[#D9F36B]/30 font-medium text-[#232323]' : 'text-[#232323] hover:bg-[#F6F7F5]'
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          selected ? 'border-[#232323] bg-[#232323]' : 'border-[#E7E9EC] bg-white'
        }`}
      >
        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>
      {label}
    </button>
  );
}

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  resetLabel: string;
  onReset: () => void;
  applyLabel: string;
  onApply: () => void;
  children: ReactNode;
};

export function MarketplaceMobileFiltersDrawer({
  open,
  onClose,
  title,
  resetLabel,
  onReset,
  applyLabel,
  onApply,
  children,
}: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Закрыть" />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[24px] bg-white">
        <div className="flex items-center justify-between border-b border-[#E7E9EC] px-5 py-3">
          <h2 className="text-[16px] font-semibold text-[#232323]">{title}</h2>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onReset} className="text-xs font-medium text-[#777D88]">
              {resetLabel}
            </button>
            <button type="button" onClick={onClose} className="rounded-full p-1 text-[#232323]">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">{children}</div>
        <div className="border-t border-[#E7E9EC] p-3.5">
          <button
            type="button"
            onClick={() => {
              onApply();
              onClose();
            }}
            className="min-h-[42px] w-full rounded-[16px] bg-[#232323] px-5 py-2.5 text-xs font-semibold text-white"
          >
            {applyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type ResultsBarProps = {
  foundLabel: string;
  countLabel: string;
  sortLabel?: string;
  action?: ReactNode;
};

export function MarketplaceResultsBar({ foundLabel, countLabel, sortLabel, action }: ResultsBarProps) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-xs text-[#777D88]">{foundLabel}</div>
        <div className="text-[17px] font-bold text-[#232323]">{countLabel}</div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {sortLabel ? (
          <button
            type="button"
            className="inline-flex min-h-[36px] items-center gap-2 rounded-[13px] border border-[#E7E9EC] bg-white px-3 py-2 text-xs font-semibold text-[#232323]"
          >
            {sortLabel}
          </button>
        ) : null}
        {action}
      </div>
    </div>
  );
}
