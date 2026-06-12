import { Camera, Pencil, Star } from 'lucide-react';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';

export default function TreaboProfilePage() {
  const auth = useTreaboAuth();

  return (
    <TreaboAccountShell title="Анкета">
      <div className="space-y-4">
        <section className="rounded-[30px] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-[#edf1f7]">
              {auth.user?.avatar ? (
                <img src={auth.user.avatar} alt={auth.user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-black">
                  {auth.user?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
              )}
              <button className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black leading-tight">{auth.user?.name || 'Специалист Treabo'}</h2>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold">
                    <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-[#232323]" /> 4,0</span>
                    <span>5 отзывов</span>
                    <span className="text-[#7d849b]">Паспорт проверен</span>
                  </div>
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f5f6f1] px-3 py-1.5 text-sm font-bold">Квалификация подтверждена</span>
                <span className="rounded-full bg-[#f5f6f1] px-3 py-1.5 text-sm font-bold">{auth.user?.city || 'Chișinău'}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">О себе</h2>
            <Pencil className="h-4 w-4" />
          </div>
          <p className="max-w-3xl text-base leading-7">
            Здесь будет описание мастера, услуги, выезд к клиенту, портфолио и подтвержденные документы.
            Сейчас страница подготовлена под данные из приложения Treabo.
          </p>
        </section>

        <section className="rounded-[30px] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Моя статистика</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {['Отклики', 'Чаты', 'Выполнено'].map((label, index) => (
              <div key={label} className="rounded-2xl bg-[#f5f6f1] p-4">
                <div className="text-3xl font-black">{[12, 4, 2][index]}</div>
                <div className="text-sm font-bold text-[#7d849b]">{label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </TreaboAccountShell>
  );
}
