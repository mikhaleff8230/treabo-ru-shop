import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { CircleHelp, ClipboardList, LogOut, Map, Menu, MessageCircle, UserRound, Wallet } from 'lucide-react';
import TreaboAuthModal from '@/components/auth/treabo-auth-modal';
import TreaboLocationSelector from '@/components/treabo/TreaboLocationSelector';
import routes from '@/config/routes';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import { getTreaboText } from '@/lib/treabo/i18n';

export function ProffiHeader() {
  const router = useRouter();
  const text = getTreaboText(router.locale);
  const auth = useTreaboAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  function openAuth(tab: 'login' | 'register') {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  const headerLinks = auth.isAuthenticated
    ? auth.isSpecialist
      ? [
          { href: '/treabo/chats', label: 'Чаты' },
          { href: routes.works, label: 'Задания' },
          { href: `${routes.works}?map=1`, label: 'Посмотреть на карте', icon: Map },
        ]
      : [
          { href: '/specialists', label: 'Найти специалиста' },
          { href: '/treabo/tasks', label: 'Мои задания' },
          { href: '/treabo/chats', label: 'Чаты' },
        ]
    : [
        { href: '/specialists', label: text.header.findSpecialist },
        { href: routes.works, label: text.header.tasks },
        { href: '/master-registration', label: text.header.masterLogin },
      ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1160px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/treabo-logo.png"
              alt="Treabo"
              width={150}
              height={30}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>

          <div className="hidden lg:block">
            <TreaboLocationSelector />
          </div>

          <nav className="hidden items-center gap-2 text-sm font-semibold text-[#232323] md:flex">
            {headerLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 transition hover:bg-[#d9f36b] hover:text-[#232323]"
              >
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {label}
              </Link>
            ))}
            {!auth.isAuthenticated ? (
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="rounded-xl px-3 py-2 transition hover:bg-[#d9f36b] hover:text-[#232323]"
              >
                {text.header.login}
              </button>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            <div className="block lg:hidden">
              <TreaboLocationSelector />
            </div>
            <Link
              href="/request/new"
              className="hidden rounded-full bg-[#d9f36b] px-4 py-2 text-xs font-semibold text-[#232323] shadow-[0_8px_18px_rgba(132,204,22,0.14)] transition hover:bg-[#c7e85a] sm:inline-flex"
            >
              {text.header.createRequest}
            </Link>

            {auth.isAuthenticated ? (
              <div className="group relative hidden sm:block">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-2 pr-3 text-[#232323] transition hover:border-zinc-950"
                  aria-label={text.header.profile}
                >
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#d9f36b] text-xs font-semibold">
                    {auth.user?.avatar ? (
                      <img src={auth.user.avatar} alt={auth.user.name} className="h-full w-full object-cover" />
                    ) : (
                      auth.user?.name?.charAt(0)?.toUpperCase() || 'T'
                    )}
                  </span>
                  <span className="hidden max-w-[110px] truncate text-left text-xs font-bold leading-4 lg:block">
                    {auth.user?.name}
                    <span className="block text-[10px] font-semibold text-[#7d849b]">
                      {auth.isSpecialist ? text.header.master : text.header.client}
                    </span>
                  </span>
                </button>
                <div className="invisible absolute right-0 top-12 z-[90] w-60 translate-y-2 rounded-[24px] border border-zinc-200 bg-white p-2 opacity-0 shadow-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <Link href="/treabo/profile" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#232323] hover:bg-[#f5f6f1]">
                    <ClipboardList className="h-4 w-4" />
                    {text.header.questionnaire}
                  </Link>
                  <Link href="/treabo/chats" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#232323] hover:bg-[#f5f6f1]">
                    <MessageCircle className="h-4 w-4" />
                    {text.header.chats}
                  </Link>
                  <Link href="/treabo/balance" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#232323] hover:bg-[#f5f6f1]">
                    <Wallet className="h-4 w-4" />
                    {text.header.balance}
                  </Link>
                  <Link href="/treabo/support" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#232323] hover:bg-[#f5f6f1]">
                    <CircleHelp className="h-4 w-4" />
                    {text.header.support}
                  </Link>
                  <button
                    type="button"
                    onClick={auth.logout}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {text.header.logout}
                  </button>
                </div>
              </div>
            ) : null}

            {!auth.isAuthenticated ? (
              <button
                type="button"
                onClick={() => openAuth('login')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white"
                aria-label={text.header.login}
              >
              <UserRound className="h-4 w-4" />
            </button>
          ) : null}
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 md:hidden" aria-label="Menu">
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <TreaboAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab={authTab}
        login={auth.login}
        register={auth.register}
        sendOtp={auth.sendOtp}
        verifyOtp={auth.verifyOtp}
        onSuccess={auth.refresh}
      />
    </>
  );
}

export function ProffiFooter() {
  const router = useRouter();
  const text = getTreaboText(router.locale);
  const footerColumns = [
    text.header.findSpecialist,
    text.header.tasks,
    text.header.masterLogin,
    text.header.support,
  ];

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-[1160px] gap-6 px-4 py-6 sm:px-6 md:grid-cols-[1fr_2fr] lg:px-8">
        <div>
          <div className="mb-2 flex items-center">
            <Image
              src="/treabo-logo.png"
              alt="Treabo"
              width={142}
              height={28}
              className="h-7 w-auto object-contain"
            />
          </div>
          <p className="max-w-sm text-xs leading-5 text-[#777D88]">
            Treabo соединяет клиентов и специалистов: заявки, отклики, чаты и заказы в одном месте.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
          {footerColumns.map((title) => (
            <div key={title}>
              <div className="mb-2 font-semibold text-[#232323]">{title}</div>
              <div className="space-y-1.5 text-[#777D88]">
                <div>{text.common.category}</div>
                <div>{text.header.chats}</div>
                <div>{text.header.support}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function FloatingMobileCTA() {
  const router = useRouter();
  const text = getTreaboText(router.locale);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        <Link href="/request/new" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#d9f36b] px-4 py-3 text-sm font-bold text-[#232323]">
          <MessageCircle className="h-4 w-4" />
          {text.header.createRequest}
        </Link>
        <Link href={routes.works} className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-bold text-[#232323]">
          {text.header.tasks}
        </Link>
      </div>
    </div>
  );
}
