import { Loader2, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import {
  checkTreaboPendingDeposit,
  createTreaboYookassaBalanceDeposit,
  fetchTreaboBalance,
  fetchTreaboBalanceTransactions,
  type TreaboBalance,
  type TreaboBalanceTransaction,
} from '@/data/treabo';

const money = new Intl.NumberFormat('ru-RU');
const DEPOSIT_AMOUNT = 100;

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
  const router = useRouter();
  const [balance, setBalance] = useState<TreaboBalance | null>(null);
  const [transactions, setTransactions] = useState<TreaboBalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);
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

    if (router.query.deposit === 'success') {
      checkTreaboPendingDeposit(token)
        .then((response) => {
          if (response.data?.processed) {
            setMessage(`Баланс пополнен на ${money.format(response.data.amount || 0)} ₽`);
            return loadBalance(token);
          }
          if (response.data?.has_pending) {
            setMessage('Платёж обрабатывается. Баланс обновится в течение нескольких минут.');
          }
        })
        .catch(() => undefined);
    }
  }, [router.query.deposit]);

  async function handleDeposit() {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('treabo_token') : null;
    if (!token) {
      setMessage('Войдите как мастер, чтобы пополнить баланс.');
      return;
    }

    setDepositLoading(true);
    setMessage(null);

    try {
      const response = await createTreaboYookassaBalanceDeposit(token, DEPOSIT_AMOUNT);
      if (!response.payment_url) {
        setMessage(response.message || 'Не удалось создать платёж. Попробуйте позже.');
        return;
      }
      window.location.href = response.payment_url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось создать пополнение');
    } finally {
      setDepositLoading(false);
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
            <div className="mt-1 text-3xl font-black">{money.format(DEPOSIT_AMOUNT)} ₽</div>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#7d849b]">
              Оплата через ЮKassa. После успешной оплаты баланс обновится автоматически.
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
            className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#d9f36b] px-5 text-sm font-black text-[#232323] disabled:opacity-60"
          >
            {depositLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Пополнить баланс
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
