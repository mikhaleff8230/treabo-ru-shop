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
import { normalizeTreaboAssetUrl, type TreaboSpecialist } from '@/data/treabo';
import { treaboMinimal } from './marketplace-ui';
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
    telegramChat: true,
  },
];

const reviewTexts = [
  {
    name: 'Андрей А.',
    role: 'Мастер по ремонту',
    text: 'Понравилось, что заявки приходят с деталями. Можно быстро понять объем работы и написать клиенту по делу.',
  },
  {
    name: 'Лена М.',
    role: 'Клининг и дом',
    text: 'Удобно выбирать район и график. Клиенты задают вопросы в чате, не нужно долго созваниваться.',
  },
  {
    name: 'Виктор Б.',
    role: 'Сантехник',
    text: 'Профиль с отзывами помогает получать доверие. Хочу добавить больше фото работ и подключить календарь.',
  },
];

const TELEGRAM_CHAT_URL = 'https://t.me/+IKp5Qdq27MU3NGIy';
const APP_DOWNLOAD_URL = process.env.NEXT_PUBLIC_TREABO_APP_APK_URL || 'https://treabo.ru/downloads/treabo-proffi.apk';
const APP_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(APP_DOWNLOAD_URL)}`;

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

type MasterRegistrationPageProps = { topSpecialists?: TreaboSpecialist[] };

export default function MasterRegistrationPage({ topSpecialists = [] }: MasterRegistrationPageProps) {
  const auth = useTreaboAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [phone, setPhone] = useState('7');

  return (
    <div className={treaboMinimal.page}>
      <ProffiHeader />
      <main>
        <section className={`${treaboMinimal.section} grid gap-6 pb-8 pt-8 md:grid-cols-[1fr_360px] md:pb-10`}>
          <div className="flex flex-col justify-end">
            <h1 className={`${treaboMinimal.heroTitle} max-w-2xl`}>
              Зарабатывайте на том, что умеете
            </h1>
            <p className={`${treaboMinimal.body} mt-4 max-w-xl`}>
              Более 500 000 заказов в месяц в приложении и на сайте Treabo.
            </p>
          </div>
          <div className="overflow-hidden rounded-[24px] bg-white p-2 shadow-[0_8px_24px_rgba(25,31,42,0.055)]">
            <Image
              src="/proffi/treabo-app-banner.png"
              alt="Приложение Treabo для мастера"
              width={1132}
              height={869}
              className="h-56 w-full rounded-[18px] object-cover object-center"
              priority
            />
          </div>
        </section>

        <section className={`${treaboMinimal.section} pb-9`}>
          <div className="grid gap-5 rounded-[24px] border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(25,31,42,0.05)] sm:p-6 md:grid-cols-[1fr_220px] md:items-center">
            <div>
              <h2 className="text-[24px] font-[300] leading-tight">Зарегистрируйтесь по номеру телефона</h2>
              <p className={`${treaboMinimal.body} mt-2 max-w-xl`}>
                Откроем профиль мастера и подскажем, какие услуги лучше добавить для первых заказов.
              </p>
              <div className="mt-5 max-w-md space-y-3">
                <TreaboPhoneInput value={phone} onChange={setPhone} />
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className={`${treaboMinimal.buttonDark} gap-2`}
                >
                  Продолжить
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <img src={APP_QR_URL} alt="QR-код для скачивания приложения Treabo для мастера" className="h-36 w-36 rounded-2xl bg-white p-2 shadow-sm" />
              <p className="mt-3 max-w-[220px] text-xs font-medium leading-5 text-[#777D88]">
                Наведите камеру, чтобы скачать приложение для мастера.
              </p>
            </div>
          </div>
        </section>

        <section className={`${treaboMinimal.section} py-8`}>
          <h2 className={treaboMinimal.h2}>Как это работает?</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="relative">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-[#D9F36B] text-xs font-semibold">
                    {index + 1}
                  </span>
                  {index < steps.length - 1 ? <span className="hidden h-px flex-1 bg-[#232323] md:block" /> : null}
                </div>
                <p className="text-xs font-medium leading-5 text-[#777D88]">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${treaboMinimal.section} py-8`}>
          <h2 className={treaboMinimal.h2}>Тарифы</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {tariffs.map(({ icon: Icon, title, text, telegramChat }) => (
              <article key={title} className={`${treaboMinimal.compactCard} grid gap-5 p-5 sm:grid-cols-[1fr_78px]`}>
                <div>
                  <h3 className="text-[17px] font-[400]">{title}</h3>
                  <p className="mt-2 text-xs font-medium leading-5 text-[#777D88]">{text}</p>
                  {telegramChat ? (
                    <a href={TELEGRAM_CHAT_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-[#232323] underline decoration-[#D9F36B] decoration-2 underline-offset-4">
                      Доступно в Telegram-чате
                    </a>
                  ) : null}
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#F7F7F4]">
                  <Icon className="h-7 w-7 text-[#232323]" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${treaboMinimal.section} py-8`}>
          <div className="grid gap-6 rounded-[24px] bg-white p-6 shadow-[0_8px_24px_rgba(25,31,42,0.05)] md:grid-cols-[220px_1fr_150px] md:items-center">
            <Image src="/proffi/treabo-app-banner.png" alt="Приложение Treabo для мастера" width={1132} height={869} className="mx-auto h-56 w-full rounded-[22px] object-cover object-center" />
            <div>
              <h2 className={`${treaboMinimal.h2} max-w-xl`}>
                С приложением «Treabo для мастера» ещё удобнее
              </h2>
              <p className={`${treaboMinimal.body} mt-3`}>Заказы и чаты с клиентами всегда под рукой.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Google Play', 'App Store', 'AppGallery'].map((store) => (
                  <span key={store} className="rounded-[12px] bg-[#232323] px-3.5 py-2 text-xs font-semibold text-white">
                    {store}
                  </span>
                ))}
              </div>
            </div>
            <div className="mx-auto text-center">
              <img src={APP_QR_URL} alt="QR-код для скачивания приложения Treabo для мастера" className="h-32 w-32 rounded-2xl bg-white p-2 shadow-sm" />
            </div>
          </div>
        </section>

        <section className="bg-white py-10">
          <div className={treaboMinimal.section}>
            <h2 className={treaboMinimal.h2}>Отзывы специалистов о Treabo</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {reviewTexts.map((review, index) => {
                const specialist = topSpecialists[index];
                const name = specialist?.name || review.name;
                const role = specialist?.services?.[0] || specialist?.bio?.split(/[.!?]/)[0] || review.role;
                const avatar = specialist?.avatar ? normalizeTreaboAssetUrl(specialist.avatar) : null;
                return (
                <article key={review.name} className={`${treaboMinimal.compactCard} p-5`}>
                  <div className="flex items-center gap-3">
                    {avatar ? <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D9F36B] text-lg font-bold">{name.charAt(0)}</span>}
                    <div>
                      <h3 className="text-[15px] font-[400]">{name}</h3>
                      <p className="text-xs font-medium text-[#777D88]">{role}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-1 text-yellow-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-xs font-medium leading-5 text-[#777D88]">{review.text}</p>
                </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={`${treaboMinimal.section} py-10`}>
          <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(25,31,42,0.05)] sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className={treaboMinimal.h2}>Остались вопросы? Сейчас расскажем</h2>
              <button className="w-fit rounded-full border border-[#E7E9EC] bg-white px-4 py-2 text-xs font-semibold text-[#232323]">
                Как с вами заработать?
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((question) => (
                <button key={question} className={treaboMinimal.chip}>
                  {question}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={`${treaboMinimal.section} pb-12`}>
          <div className="grid gap-4 rounded-[24px] bg-[#D9F36B] p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className={treaboMinimal.h2}>Начните получать заявки</h2>
              <p className="mt-2 text-sm font-medium text-[#232323]/75">Телефон обязателен, подтверждение пока не требуется.</p>
            </div>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className={`${treaboMinimal.buttonDark} gap-2`}
            >
              <Phone className="h-4 w-4" />
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
        sendOtp={auth.sendOtp}
        verifyOtp={auth.verifyOtp}
        onSuccess={auth.refresh}
      />
    </div>
  );
}
