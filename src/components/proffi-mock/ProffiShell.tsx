import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { CircleHelp, ClipboardList, LogOut, Map, Menu, MessageCircle, UserRound, Wallet, X } from 'lucide-react';
import TreaboAuthModal from '@/components/auth/treabo-auth-modal';
import TreaboLocationSelector from '@/components/treabo/TreaboLocationSelector';
import routes from '@/config/routes';
import { normalizeTreaboAssetUrl } from '@/data/treabo';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import { useTreaboBrandLogo } from '@/hooks/use-treabo-brand-logo';
import { useTreaboUnreadChats } from '@/hooks/use-treabo-unread-chats';
import { getTreaboText } from '@/lib/treabo/i18n';

export function ProffiHeader() {
  const router = useRouter();
  const text = getTreaboText(router.locale);
  const auth = useTreaboAuth();
  const { src: logoSrc, alt: logoAlt } = useTreaboBrandLogo();
  const { unreadCount } = useTreaboUnreadChats(auth.isAuthenticated);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showLocationSelector = router.pathname !== '/';

  function openAuth(tab: 'login' | 'register') {
    setMobileMenuOpen(false);
    setAuthTab(tab);
    setAuthOpen(true);
  }

  useEffect(() => {
    const closeMenu = () => setMobileMenuOpen(false);
    router.events.on('routeChangeStart', closeMenu);
    return () => router.events.off('routeChangeStart', closeMenu);
  }, [router.events]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

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
        { href: '/auth/master', label: text.header.masterLogin },
      ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1160px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={logoAlt}
              width={150}
              height={30}
              className="h-8 w-auto object-contain"
            />
          </Link>

          {showLocationSelector ? <div className="hidden lg:block">
            <TreaboLocationSelector />
          </div> : null}

          <nav className="hidden items-center gap-2 text-sm font-semibold text-[#232323] md:flex">
            {headerLinks.map(({ href, label, icon: Icon }) => {
              const isChats = href === '/treabo/chats';
              return (
              <Link
                key={href}
                href={href}
                className="relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 transition hover:bg-[#d9f36b] hover:text-[#232323]"
              >
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {label}
                {isChats && unreadCount > 0 ? (
                  <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff405c] px-1.5 text-[11px] font-black leading-none text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </Link>
              );
            })}
            {!auth.isAuthenticated ? (
              <button
                type="button"
                onClick={() => { window.location.href = '/auth/client'; }}
                className="rounded-xl px-3 py-2 transition hover:bg-[#d9f36b] hover:text-[#232323]"
              >
                {text.header.login}
              </button>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            {showLocationSelector ? <div className="block lg:hidden">
              <TreaboLocationSelector />
            </div> : null}
            {!auth.isSpecialist ? (
              <Link
                href="/request/new"
                className="hidden rounded-full bg-[#d9f36b] px-4 py-2 text-xs font-semibold text-[#232323] shadow-[0_8px_18px_rgba(132,204,22,0.14)] transition hover:bg-[#c7e85a] sm:inline-flex"
              >
                {text.header.createRequest}
              </Link>
            ) : null}

            {auth.isAuthenticated ? (
              <div className="group relative hidden sm:block">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-2 pr-3 text-[#232323] transition hover:border-zinc-950"
                  aria-label={text.header.profile}
                >
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#d9f36b] text-xs font-semibold">
                    {auth.user?.avatar ? (
                      <img src={normalizeTreaboAssetUrl(auth.user.avatar)} alt={auth.user.name} className="h-full w-full object-cover" />
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
                <div className="invisible absolute right-0 top-full z-[90] w-60 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                  <div className="translate-y-2 rounded-[24px] border border-zinc-200 bg-white p-2 shadow-2xl transition group-hover:translate-y-0">
                    <Link href="/treabo/profile" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#232323] hover:bg-[#f5f6f1]">
                      <ClipboardList className="h-4 w-4" />
                      {text.header.questionnaire}
                    </Link>
                    <Link href="/treabo/chats" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#232323] hover:bg-[#f5f6f1]">
                      <MessageCircle className="h-4 w-4" />
                      {text.header.chats}
                      {unreadCount > 0 ? (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff405c] px-1.5 text-[11px] font-black leading-none text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      ) : null}
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
              </div>
            ) : null}

            {!auth.isAuthenticated ? (
              <button
                type="button"
                onClick={() => { window.location.href = '/auth/client'; }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white"
                aria-label={text.header.login}
              >
              <UserRound className="h-4 w-4" />
            </button>
          ) : null}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 md:hidden"
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={mobileMenuOpen}
              aria-controls="treabo-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <div id="treabo-mobile-menu" className="border-t border-zinc-200 bg-white px-4 py-4 shadow-xl md:hidden">
            <nav className="mx-auto flex max-w-[1160px] flex-col gap-1" aria-label="Мобильная навигация">
              {headerLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex min-h-[46px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[#232323] hover:bg-[#f5f6f1]">
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  <span className="min-w-0 flex-1">{label}</span>
                  {href === '/treabo/chats' && unreadCount > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff405c] px-1.5 text-[11px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  ) : null}
                </Link>
              ))}
              {!auth.isSpecialist ? (
                <Link href="/request/new" className="mt-2 flex min-h-[46px] items-center justify-center rounded-2xl bg-[#d9f36b] px-4 py-3 text-sm font-bold text-[#232323]">
                  {text.header.createRequest}
                </Link>
              ) : null}
              {auth.isAuthenticated ? (
                <>
                  <div className="my-2 border-t border-zinc-200" />
                  <Link href="/treabo/profile" className="flex min-h-[46px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-[#f5f6f1]"><ClipboardList className="h-4 w-4" />{text.header.questionnaire}</Link>
                  <Link href="/treabo/balance" className="flex min-h-[46px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-[#f5f6f1]"><Wallet className="h-4 w-4" />{text.header.balance}</Link>
                  <Link href="/treabo/support" className="flex min-h-[46px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-[#f5f6f1]"><CircleHelp className="h-4 w-4" />{text.header.support}</Link>
                  <button type="button" onClick={() => { setMobileMenuOpen(false); auth.logout(); }} className="flex min-h-[46px] items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />{text.header.logout}</button>
                </>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link href="/auth/client" onClick={() => setMobileMenuOpen(false)} className="flex min-h-[44px] items-center justify-center rounded-2xl border border-zinc-300 px-3 text-sm font-bold">{text.header.login}</Link>
                  <Link href="/auth/client?tab=register" onClick={() => setMobileMenuOpen(false)} className="flex min-h-[44px] items-center justify-center rounded-2xl bg-[#d9f36b] px-3 text-sm font-bold text-[#232323]">Регистрация</Link>
                </div>
              )}
            </nav>
          </div>
        ) : null}
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
  const auth = useTreaboAuth();
  const { src: logoSrc, alt: logoAlt } = useTreaboBrandLogo();
  const footerColumns = [
    {
      title: text.header.findSpecialist,
      links: [
        { href: '/specialists', label: 'Каталог специалистов' },
        { href: '/request/new', label: text.header.createRequest },
        { href: '/master-registration', label: 'Стать специалистом' },
      ],
    },
    {
      title: text.header.tasks,
      links: [
        { href: routes.works, label: 'Все задания' },
        { href: `${routes.works}?map=1`, label: 'Задания на карте' },
        { href: '/treabo/tasks', label: 'Мои задания' },
      ],
    },
    {
      title: 'Общение',
      links: [
        { href: '/treabo/chats', label: text.header.chats },
        { href: '/treabo/reviews', label: 'Отзывы' },
        { href: '/treabo/profile', label: text.header.profile },
      ],
    },
    {
      title: text.header.support,
      links: [
        { href: '/treabo/support', label: 'Центр поддержки' },
        { href: '/treabo/profile', label: 'Настройки профиля' },
        { href: '/', label: 'Главная' },
      ],
    },
  ];

  return (
    <footer className="border-t border-zinc-200 bg-white pb-24 sm:pb-0">
      <div className="mx-auto grid max-w-[1160px] gap-6 px-4 py-6 sm:px-6 md:grid-cols-[1fr_2fr] lg:px-8">
        <div>
          <div className="mb-2 flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={logoAlt}
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
          {footerColumns.map((column) => (
            <div key={column.title}>
              <div className="mb-2 font-semibold text-[#232323]">{column.title}</div>
              <div className="space-y-1.5 text-[#777D88]">
                {column.links.filter((link) => !(auth.isSpecialist && link.href === '/request/new')).map((link) => (
                  <Link key={link.href + link.label} href={link.href} className="block transition hover:text-[#232323] hover:underline">
                    {link.label}
                  </Link>
                ))}
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
  const auth = useTreaboAuth();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        {!auth.isSpecialist ? (
          <Link href="/request/new" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#d9f36b] px-4 py-3 text-sm font-bold text-[#232323]">
            <MessageCircle className="h-4 w-4" />
            {text.header.createRequest}
          </Link>
        ) : null}
        <Link href={routes.works} className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-bold text-[#232323]">
          {text.header.tasks}
        </Link>
      </div>
    </div>
  );
}
