import { ExternalLink, Loader2, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import {
  createTreaboManualBalanceDeposit,
  fetchTreaboBalance,
  reportTreaboManualBalancePayment,
  type TreaboBalance,
  type TreaboManualDeposit,
} from '@/data/treabo';

const operations = [
  { title: 'Пополнение баланса', date: 'сегодня', value: '+100 MDL', positive: true },
  { title: 'Отклик на задание', date: 'сегодня', value: '-15 MDL', positive: false },
  { title: 'Возврат отклика', date: 'вчера', value: '+15 MDL', positive: true },
];

export default function TreaboBalancePage() {
  const [balance, setBalance] = useState<TreaboBalance | null>(null);
  const [deposit, setDeposit] = useState<TreaboManualDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
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
      setMessage(`Открыли QR-ссылку для пополнения ${Number(response.amount || 100)} MDL. После оплаты нажмите кнопку ниже.`);
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
      setMessage(response.message || 'Спасибо. В течение суток баланс будет пополнен после проверки администрации.');
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
                {loading ? '...' : `${Number(balance?.balance || 0).toLocaleString('ru-RU')} MDL`}
              </div>
              <div className="mt-2 text-sm font-bold text-[#7d849b]">Доступный баланс</div>
            </div>
            <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5f6f1]">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 rounded-[24px] bg-[#f5f6f1] p-4">
            <div className="text-sm font-bold text-[#7d849b]">Сумма пополнения</div>
            <div className="mt-1 text-3xl font-black">100 MDL</div>
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
