import { ExternalLink, Loader2, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import {
  createTreaboManualBalanceDeposit,
  fetchTreaboBalance,
  fetchTreaboBalanceTransactions,
  reportTreaboManualBalancePayment,
  type TreaboBalance,
  type TreaboBalanceTransaction,
  type TreaboManualDeposit,
} from '@/data/treabo';

const money = new Intl.NumberFormat('ru-RU');

function formatRub(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${money.format(value)} ₽`;
}

function formatDate(value?: string | null) {
  if (!value) return 'дата не указана';
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TreaboBalancePage() {
  const [balance, setBalance] = useState<TreaboBalance | null>(null);
  const [transactions, setTransactions] = useState<TreaboBalanceTransaction[]>([]);
  const [deposit, setDeposit] = useState<TreaboManualDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadBalance(token: string) {
    const [balanceResponse, transactionsResponse] = await Promise.all([
      fetchTreaboBalance(token),
      fetchTreaboBalanceTransactions(token),
    ]);
    setBalance(balanceResponse);
    setTransactions(transactionsResponse);
  }

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('treabo_token') : null;
    if (!token) {
      setLoading(false);
      setMessage('Войдите как мастер, чтобы пополнить баланс.');
      return;
    }

    loadBalance(token)
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Не удалось загрузить баланс'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDeposit() {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('treabo_token') : null;
    if (!token) {
      setMessage('Войдите как мастер, чтобы пополнить баланс.');
      return;
    }

    setDepositLoading(true);
    setMessage(null);

    try {
      const response = await createTreaboManualBalanceDeposit(token, 100);
      setDeposit(response);
      if (!response.payment_url) {
        setMessage(response.message || 'QR-ссылка пополнения пока не настроена.');
        return;
      }
      window.open(response.payment_url, '_blank', 'noopener,noreferrer');
      setMessage(`Открыли QR-ссылку для пополнения ${money.format(Number(response.amount || 100))} ₽. После оплаты нажмите кнопку ниже.`);
      await loadBalance(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось создать пополнение');
    } finally {
      setDepositLoading(false);
    }
  }

  async function handleReportPayment() {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('treabo_token') : null;
    if (!token) {
      setMessage('Войдите как мастер, чтобы сообщить об оплате.');
      return;
    }

    setReportLoading(true);
    setMessage(null);

    try {
      const response = await reportTreaboManualBalancePayment(token, deposit?.deposit_id);
      setMessage(response.message || 'Спасибо. Администрация проверит оплату и пополнит баланс.');
      await loadBalance(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось отправить сообщение об оплате');
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <TreaboAccountShell title="Баланс">
      <div className="space-y-4">
        <section className="rounded-[30px] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-5xl font-black">
                {loading ? '...' : `${money.format(Number(balance?.balance || 0))} ₽`}
              </div>
              <div className="mt-2 text-sm font-bold text-[#7d849b]">Доступный баланс</div>
            </div>
            <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5f6f1]">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 rounded-[24px] bg-[#f5f6f1] p-4">
            <div className="text-sm font-bold text-[#7d849b]">Сумма пополнения</div>
            <div className="mt-1 text-3xl font-black">100 ₽</div>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#7d849b]">
              Временный ручной способ: откройте QR-ссылку, оплатите и сообщите администрации.
            </p>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#f5f6f1] px-4 py-3 text-sm font-semibold text-[#232323]">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleDeposit}
            disabled={depositLoading}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#232323] px-5 text-sm font-black text-white disabled:opacity-60"
          >
            {depositLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Открыть QR для оплаты
          </button>

          <button
            type="button"
            onClick={handleReportPayment}
            disabled={reportLoading}
            className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#d9f36b] px-5 text-sm font-black text-[#232323] disabled:opacity-60"
          >
            {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Сообщить об оплате администрации
          </button>
        </section>

        <section className="rounded-[30px] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">История операций</h2>
          <div className="mt-4 divide-y divide-zinc-100">
            {transactions.length ? transactions.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="font-bold">{item.title}</div>
                  {item.description ? (
                    <div className="truncate text-sm font-semibold text-[#7d849b]">{item.description}</div>
                  ) : null}
                  <div className="text-sm font-semibold text-[#7d849b]">{formatDate(item.created_at)}</div>
                </div>
                <div className={`shrink-0 font-black ${item.amount > 0 ? 'text-emerald-600' : 'text-[#232323]'}`}>
                  {formatRub(Number(item.amount || 0))}
                </div>
              </div>
            )) : (
              <div className="py-6 text-sm font-semibold text-[#7d849b]">Операций пока нет.</div>
            )}
          </div>
        </section>
      </div>
    </TreaboAccountShell>
  );
}
