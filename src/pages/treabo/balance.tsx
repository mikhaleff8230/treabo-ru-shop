import { Loader2, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import { createTreaboManualBalanceDeposit, fetchTreaboBalance, type TreaboBalance } from '@/data/treabo';

const operations = [
  { title: 'Пополнение баланса', date: 'сегодня', value: '+204 MDL', positive: true },
  { title: 'Отклик на задание', date: 'сегодня', value: '-15 MDL', positive: false },
  { title: 'Возврат отклика', date: 'вчера', value: '+15 MDL', positive: true },
];

export default function TreaboBalancePage() {
  const [balance, setBalance] = useState<TreaboBalance | null>(null);
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('treabo_token') : null;
    if (!token) {
      setLoading(false);
      setMessage('Войдите как мастер, чтобы пополнить баланс.');
      return;
    }

    fetchTreaboBalance(token)
      .then(setBalance)
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Не удалось загрузить баланс'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDeposit() {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('treabo_token') : null;
    const value = Number(amount);
    if (!token || !Number.isFinite(value) || value <= 0) {
      setMessage('Укажите сумму пополнения.');
      return;
    }

    setDepositLoading(true);
    setMessage(null);

    try {
      const response = await createTreaboManualBalanceDeposit(token, value);
      if (!response.payment_url) {
        setMessage(response.message || 'Ссылка пополнения не настроена.');
        return;
      }
      window.open(response.payment_url, '_blank', 'noopener,noreferrer');
      setMessage(`Заявка на пополнение ${value} MDL создана. После оплаты администратор зачислит баланс вручную.`);
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
                {loading ? '...' : `${Number(balance?.balance || 0).toLocaleString('ru-RU')} MDL`}
              </div>
              <div className="mt-2 text-sm font-bold text-[#7d849b]">Доступный баланс</div>
            </div>
            <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5f6f1]">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-6">
            <label className="text-sm font-bold">Сумма пополнения</label>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-2 h-14 w-full rounded-2xl bg-[#f1f3f8] px-4 text-lg font-bold outline-none"
              placeholder="0 MDL"
              inputMode="decimal"
            />
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
            {depositLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Пополнить баланс
          </button>
        </section>

        <section className="rounded-[30px] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">История операций</h2>
          <div className="mt-4 divide-y divide-zinc-100">
            {operations.map((item) => (
              <div key={`${item.title}-${item.date}`} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-bold">{item.title}</div>
                  <div className="text-sm font-semibold text-[#7d849b]">{item.date}</div>
                </div>
                <div className={`font-black ${item.positive ? 'text-emerald-600' : 'text-[#232323]'}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </TreaboAccountShell>
  );
}
