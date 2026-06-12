import Link from 'next/link';
import { useState } from 'react';
import { LogOut, Menu, MessageCircle, UserRound } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import TreaboAuthModal from '@/components/auth/treabo-auth-modal';
import TreaboLocationSelector from '@/components/treabo/TreaboLocationSelector';
import routes from '@/config/routes';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import { TreaboLanguageSwitcher } from './TreaboLanguageSwitcher';

export function ProffiHeader() {
  const { t } = useTranslation('common');
  const auth = useTreaboAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  function openAuth(tab: 'login' | 'register') {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-sm font-black text-white">
              T
            </span>
            <span className="text-xl font-black tracking-tight text-[#232323]">Treabo</span>
          </Link>
          <div className="hidden lg:block">
            <TreaboLocationSelector />
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#232323] md:flex">
            <Link href="/specialists" className="hover:opacity-75">{t('treabo.header.findSpecialist')}</Link>
            <Link href={routes.works} className="hover:opacity-75">{t('treabo.header.tasks')}</Link>
            <Link href="/master-registration" className="hover:opacity-75">Вход для мастера</Link>
            {!auth.isAuthenticated ? (
              <button type="button" onClick={() => openAuth('login')} className="hover:opacity-75">
                Войти
              </button>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            <div className="block lg:hidden">
              <TreaboLocationSelector />
            </div>
            <TreaboLanguageSwitcher />
            <Link
              href="/request/new"
              className="hidden rounded-full bg-[#d9f36b] px-4 py-2 text-sm font-semibold text-[#232323] shadow-[0_10px_22px_rgba(132,204,22,0.18)] transition hover:bg-[#c7e85a] sm:inline-flex"
            >
              {t('treabo.header.createRequest')}
            </Link>

            {auth.isAuthenticated ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="max-w-[120px] truncate text-sm font-semibold text-[#232323]">
                  {auth.user?.name}
                </span>
                <button
                  type="button"
                  onClick={auth.logout}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-[#232323]"
                  aria-label="Выйти"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => openAuth('login')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white"
              aria-label="Войти"
            >
              <UserRound className="h-5 w-5" />
            </button>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 md:hidden">
              <Menu className="h-5 w-5" />
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
        onSuccess={auth.refresh}
      />
    </>
  );
}

export function ProffiFooter() {
  const { t } = useTranslation('common');
  const footerColumns = [
    t('treabo.footer.services'),
    t('treabo.footer.tasks'),
    t('treabo.footer.forSpecialists'),
    t('treabo.footer.help'),
  ];

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_2fr] lg:px-8">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-sm font-black text-white">
              T
            </span>
            <span className="text-xl font-black tracking-tight text-[#232323]">Treabo</span>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#232323]">
            {t('treabo.footer.description')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-4">
          {footerColumns.map((title) => (
            <div key={title}>
              <div className="mb-3 font-bold text-[#232323]">{title}</div>
              <div className="space-y-2 text-[#232323]">
                <div>{t('treabo.footer.catalog')}</div>
                <div>{t('treabo.footer.reviews')}</div>
                <div>{t('treabo.footer.support')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function FloatingMobileCTA() {
  const { t } = useTranslation('common');

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        <Link href="/request/new" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#d9f36b] px-4 py-3 text-sm font-bold text-[#232323]">
          <MessageCircle className="h-4 w-4" />
          {t('treabo.mobile.createOrder')}
        </Link>
        <Link href={routes.works} className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-bold text-[#232323]">
          {t('treabo.header.tasks')}
        </Link>
      </div>
    </div>
  );
}
