import Image from 'next/image';
import { useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  MessageCircle,
  Phone,
  QrCode,
  ShieldCheck,
  Star,
  WalletCards,
} from 'lucide-react';
import TreaboAuthModal from '@/components/auth/treabo-auth-modal';
import TreaboPhoneInput from '@/components/treabo/TreaboPhoneInput';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import team1 from '@/assets/images/team/1.png';
import team2 from '@/assets/images/team/2.png';
import team3 from '@/assets/images/team/3.png';
import { ProffiFooter, ProffiHeader } from './ProffiShell';

const steps = [
  'Клиент оставляет заявку с описанием работы',
  'Вы выбираете подходящий заказ',
  'Обсуждаете детали и договариваетесь',
  'Выполняете работу и получаете оплату',
];

const tariffs = [
  {
    title: 'Плата за отклик',
    text: 'Платите только за выбранные отклики. Подходит мастерам, которые хотят брать заказы выборочно.',
    icon: WalletCards,
  },
  {
    title: 'Комиссия за заказ',
    text: 'Откликайтесь свободно и платите комиссию только после успешной договоренности.',
    icon: BadgeCheck,
  },
];

const reviews = [
  {
    name: 'Андрей А.',
    role: 'Мастер по ремонту',
    text: 'Понравилось, что заявки приходят с деталями. Можно быстро понять объем работы и написать клиенту по делу.',
    avatar: team1,
  },
  {
    name: 'Лена М.',
    role: 'Клининг и дом',
    text: 'Удобно выбирать район и график. Клиенты задают вопросы в чате, не нужно долго созваниваться.',
    avatar: team2,
  },
  {
    name: 'Виктор Б.',
    role: 'Сантехник',
    text: 'Профиль с отзывами помогает получать доверие. Хочу добавить больше фото работ и подключить календарь.',
    avatar: team3,
  },
];

const questions = [
  'Какие документы нужны мастеру?',
  'Сколько стоит отклик?',
  'Как клиент выбирает специалиста?',
  'Можно ли работать в своем районе?',
  'Когда появится приложение?',
  'Как пройти проверку профиля?',
  'Можно ли брать заказы без команды?',
  'Как получать больше заявок?',
];

function QrMock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`grid ${compact ? 'h-28 w-28 grid-cols-7' : 'h-36 w-36 grid-cols-9'} gap-1 rounded-2xl bg-white p-3 shadow-sm`}>
      {Array.from({ length: compact ? 49 : 81 }).map((_, index) => (
        <span
          key={index}
          className={`rounded-[2px] ${
            [0, 1, 2, 6, 7, 8, 10, 18, 20, 24, 26, 32, 36, 40, 44, 48, 54, 56, 60, 62, 70, 72, 73, 74, 78, 79, 80].includes(index)
              ? 'bg-[#232323]'
              : index % 5 === 0 || index % 7 === 0
                ? 'bg-[#232323]'
                : 'bg-zinc-100'
          }`}
        />
      ))}
    </div>
  );
}

export default function MasterRegistrationPage() {
  const auth = useTreaboAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [phone, setPhone] = useState('373');

  return (
    <div className="min-h-screen bg-white text-[#232323]">
      <ProffiHeader />
      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-10 sm:px-6 md:grid-cols-[1fr_420px] md:pb-12 lg:px-8">
          <div className="flex flex-col justify-end">
            <h1 className="max-w-2xl text-[34px] font-black leading-[1.04] sm:text-6xl">
              Зарабатывайте на том, что умеете
            </h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[#232323]">
              Более 500 000 заказов в месяц в приложении и на сайте Treabo.
            </p>
          </div>
          <div className="overflow-hidden rounded-[28px] bg-[#e9edf3] p-3">
            <Image
              src={team2}
              alt="Мастер Treabo получает заявку"
              width={520}
              height={320}
              className="h-64 w-full rounded-[22px] object-cover"
              priority
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 rounded-[28px] bg-[#e9edf3] p-5 sm:p-7 md:grid-cols-[1fr_260px] md:items-center">
            <div>
              <h2 className="text-2xl font-black leading-tight">Зарегистрируйтесь по номеру телефона</h2>
              <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-[#232323]">
                Откроем профиль мастера и подскажем, какие услуги лучше добавить для первых заказов.
              </p>
              <div className="mt-5 max-w-md space-y-3">
                <TreaboPhoneInput value={phone} onChange={setPhone} />
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#232323] px-5 text-sm font-black text-white"
                >
                  Продолжить
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <QrMock />
              <p className="mt-3 max-w-[220px] text-xs font-semibold leading-5 text-[#232323]">
                Наведите камеру телефона, чтобы открыть регистрацию мастера.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black">Как это работает?</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="relative">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9f36b] text-sm font-black">
                    {index + 1}
                  </span>
                  {index < steps.length - 1 ? <span className="hidden h-px flex-1 bg-[#232323] md:block" /> : null}
                </div>
                <p className="text-sm font-semibold leading-6 text-[#232323]">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black">Тарифы</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {tariffs.map(({ icon: Icon, title, text }) => (
              <article key={title} className="grid gap-5 rounded-[26px] bg-[#f3f5fa] p-5 sm:grid-cols-[1fr_90px]">
                <div>
                  <h3 className="text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#232323]">{text}</p>
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white">
                  <Icon className="h-9 w-9 text-[#232323]" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-[28px] bg-[#e9edf3] p-7 md:grid-cols-[260px_1fr] md:items-center">
            <div className="mx-auto w-48 rounded-[34px] border-[10px] border-white bg-[#232323] p-4 shadow-2xl">
              <div className="rounded-[24px] bg-white p-4">
                <QrMock compact />
                <div className="mt-4 h-3 rounded-full bg-zinc-200" />
                <div className="mt-2 h-3 w-2/3 rounded-full bg-zinc-200" />
              </div>
            </div>
            <div>
              <h2 className="max-w-xl text-3xl font-black leading-tight sm:text-5xl">
                С приложением «Для профи» ещё удобнее
              </h2>
              <p className="mt-3 text-base font-semibold leading-7">Заказы и чаты с клиентами всегда под рукой.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Google Play', 'App Store', 'AppGallery'].map((store) => (
                  <span key={store} className="rounded-xl bg-[#232323] px-4 py-2 text-xs font-black text-white">
                    {store}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f3f5fa] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-black">Отзывы специалистов о Treabo</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {reviews.map((review) => (
                <article key={review.name} className="rounded-[26px] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Image src={review.avatar} alt={review.name} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                    <div>
                      <h3 className="font-black">{review.name}</h3>
                      <p className="text-xs font-semibold text-[#7d849b]">{review.role}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-1 text-yellow-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm font-semibold leading-6 text-[#232323]">{review.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[28px] bg-[#f3f5fa] p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-black">Остались вопросы? Сейчас расскажем</h2>
              <button className="w-fit rounded-full bg-white px-4 py-2 text-xs font-black text-[#232323]">
                Как с вами заработать?
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((question) => (
                <button key={question} className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-[#232323]">
                  {question}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-[28px] bg-[#d9f36b] p-7 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-black">Начните получать заявки</h2>
              <p className="mt-2 font-semibold">Телефон обязателен, подтверждение пока не требуется.</p>
            </div>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#232323] px-6 py-4 font-black text-white"
            >
              <Phone className="h-5 w-5" />
              Регистрация мастера
            </button>
          </div>
        </section>
      </main>
      <ProffiFooter />

      <TreaboAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab="register"
        initialRole="specialist"
        login={auth.login}
        register={auth.register}
        onSuccess={auth.refresh}
      />
    </div>
  );
}
