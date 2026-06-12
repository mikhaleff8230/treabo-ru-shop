import { Loader2, MessageCircle, X } from 'lucide-react';

type Props = {
  open: boolean;
  price: number;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function TreaboApplyConfirmModal({
  open,
  price,
  loading,
  error,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/82 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white text-[#232323] shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d9f36b]">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <div className="text-lg font-black">Написать клиенту</div>
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
            <div className="text-sm font-bold text-[#7d849b]">Будет списано</div>
            <div className="mt-1 text-4xl font-black">{price} MDL</div>
            <p className="mt-3 text-sm leading-6 text-[#232323]">
              После подтверждения будет создан отклик и открыт чат с клиентом. Стоимость отклика
              по умолчанию сейчас 15 MDL, позже подключим расчет по категории и параметрам задания.
            </p>
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
