import type { TreaboApplicationPreview } from '@/data/treabo';
import { Loader2, MessageCircle, X } from 'lucide-react';

type Props = {
  open: boolean;
  price: number;
  preview?: TreaboApplicationPreview | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function TreaboApplyConfirmModal({
  open,
  price,
  preview,
  loading,
  error,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  const isPaid = Boolean(preview?.charge_required);
  const fee = Number(preview?.response_fee_mdl ?? price);
  const freeLimit = Number(preview?.free_daily_limit ?? 5);
  const remainingAfter = Number(preview?.free_remaining_after ?? Math.max(0, freeLimit - 1));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/82 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white text-[#232323] shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d9f36b]">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <div className="text-lg font-black">Вы делаете отклик</div>
              <div className="text-sm font-semibold text-[#7d849b]">Отклик откроет чат по заданию</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="rounded-[22px] bg-[#f5f6f1] p-5">
            {isPaid ? (
              <>
                <div className="text-sm font-bold text-[#7d849b]">Будет списано</div>
                <div className="mt-1 text-4xl font-black">{fee} ₽</div>
                <p className="mt-3 text-sm leading-6 text-[#232323]">
                  Бесплатные отклики на сегодня закончились. После подтверждения будет создан отклик,
                  открыт чат с клиентом и сумма спишется с баланса мастера.
                </p>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-[#7d849b]">Бесплатный отклик</div>
                <div className="mt-1 text-2xl font-black">Останется {remainingAfter} бесплатных отклика на сегодня</div>
                <p className="mt-3 text-sm leading-6 text-[#7d849b]">
                  В сутки не более {freeLimit} бесплатных откликов.
                </p>
              </>
            )}
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#232323] px-5 text-sm font-black text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            Подтвердить и открыть чат
          </button>
        </div>
      </div>
    </div>
  );
}
