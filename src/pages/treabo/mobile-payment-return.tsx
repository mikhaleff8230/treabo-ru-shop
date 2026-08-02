import { useEffect } from 'react';

const APP_RETURN_URL = 'treabo-specialist://balance/deposit-success';

export default function MobilePaymentReturnPage() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.location.replace(APP_RETURN_URL), 250);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f2] px-5">
      <section className="w-full max-w-md rounded-[28px] bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#d9f36b] text-3xl font-black">✓</div>
        <h1 className="mt-5 text-2xl font-black text-[#24262d]">Возвращаем в Treabo</h1>
        <p className="mt-2 text-sm leading-6 text-[#697086]">Приложение проверит платёж и автоматически обновит баланс.</p>
        <a href={APP_RETURN_URL} className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#24262d] px-5 font-bold text-white">
          Открыть Treabo-specialist
        </a>
      </section>
    </main>
  );
}
