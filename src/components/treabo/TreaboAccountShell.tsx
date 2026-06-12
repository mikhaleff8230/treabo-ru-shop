import Link from 'next/link';
import { useRouter } from 'next/router';
import { CircleHelp, ClipboardList, MessageCircle, Wallet } from 'lucide-react';
import { ProffiHeader } from '@/components/proffi-mock/ProffiShell';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';

const items = [
  { href: '/treabo/profile', label: 'Анкета', icon: ClipboardList },
  { href: '/treabo/chats', label: 'Чаты', icon: MessageCircle },
  { href: '/treabo/balance', label: 'Баланс', icon: Wallet },
  { href: '/treabo/support', label: 'Поддержка', icon: CircleHelp },
];

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function TreaboAccountShell({ title, children }: Props) {
  const router = useRouter();
  const auth = useTreaboAuth();

  return (
    <div className="min-h-screen bg-[#f5f6f1] text-[#232323]">
      <ProffiHeader />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-[28px] border border-zinc-200 bg-white p-3 shadow-sm lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-3 flex items-center gap-3 px-2 py-3">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#d9f36b] text-lg font-black">
              {auth.user?.avatar ? (
                <img src={auth.user.avatar} alt={auth.user.name} className="h-full w-full object-cover" />
              ) : (
                auth.user?.name?.charAt(0)?.toUpperCase() || 'T'
              )}
            </span>
            <div className="min-w-0">
              <div className="truncate text-base font-black">{auth.user?.name || 'Treabo'}</div>
              <div className="text-sm font-semibold text-[#7d849b]">
                {auth.isSpecialist ? 'специалист' : auth.isAuthenticated ? 'клиент' : 'гость'}
              </div>
            </div>
          </div>
          <nav className="grid gap-1">
            {items.map(({ href, label, icon: Icon }) => {
              const active = router.pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black transition ${
                    active ? 'bg-[#232323] text-white' : 'text-[#232323] hover:bg-[#f5f6f1]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section className="min-w-0">
          <h1 className="mb-5 text-3xl font-black leading-tight">{title}</h1>
          {children}
        </section>
      </main>
    </div>
  );
}
