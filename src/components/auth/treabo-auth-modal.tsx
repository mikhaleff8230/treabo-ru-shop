import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import TreaboPhoneInput from '@/components/treabo/TreaboPhoneInput';
import { normalizeTreaboPhone } from '@/lib/treabo/phone';

type TreaboAuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  initialRole?: 'customer' | 'specialist';
  onSuccess?: () => void;
  login: (input: { phone?: string; email?: string; password: string }) => Promise<unknown>;
  register: (input: {
    name: string;
    phone: string;
    password: string;
    role: 'customer' | 'specialist';
    email?: string;
  }) => Promise<unknown>;
};

export default function TreaboAuthModal({
  open,
  onClose,
  initialTab = 'login',
  initialRole = 'customer',
  onSuccess,
  login,
  register,
}: TreaboAuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('7');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'specialist'>('customer');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setRole(initialRole);
      setError('');
    }
  }, [open, initialRole, initialTab]);

  if (!open) return null;

  const inputClass =
    'w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-[#232323] outline-none focus:border-zinc-950';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (tab === 'register') {
        await register({
          name: name.trim(),
          phone: normalizeTreaboPhone(phone),
          password,
          role,
          email: email.trim() || undefined,
        });
      } else {
        await login({
          phone: normalizeTreaboPhone(phone),
          password,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить вход');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Закрыть" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#7d849b]">Treabo</div>
            <h2 className="text-2xl font-black text-[#232323]">
              {tab === 'login' ? 'Вход' : 'Регистрация'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`rounded-xl px-3 py-2 text-sm font-bold ${
              tab === 'login' ? 'bg-white text-[#232323] shadow-sm' : 'text-[#7d849b]'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`rounded-xl px-3 py-2 text-sm font-bold ${
              tab === 'register' ? 'bg-white text-[#232323] shadow-sm' : 'text-[#7d849b]'
            }`}
          >
            Регистрация
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {tab === 'register' ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-[#232323]">Имя</span>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-bold text-[#232323]">Роль</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`rounded-2xl border px-3 py-3 text-sm font-bold ${
                      role === 'customer'
                        ? 'border-[#D9F36B] bg-[#D9F36B] text-[#232323]'
                        : 'border-zinc-200 text-[#232323]'
                    }`}
                  >
                    Заказчик
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('specialist')}
                    className={`rounded-2xl border px-3 py-3 text-sm font-bold ${
                      role === 'specialist'
                        ? 'border-[#D9F36B] bg-[#D9F36B] text-[#232323]'
                        : 'border-zinc-200 text-[#232323]'
                    }`}
                  >
                    Специалист
                  </button>
                </div>
              </div>
            </>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#232323]">Телефон</span>
            <TreaboPhoneInput value={phone} onChange={setPhone} />
          </label>

          {tab === 'register' ? (
            <label className="block space-y-2">
              <span className="text-sm font-bold text-[#232323]">Email (необязательно)</span>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#232323]">Пароль</span>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={4}
            />
          </label>

          {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[#d9f36b] px-5 py-3 text-base font-black text-[#232323] transition hover:bg-[#c7e85a] disabled:opacity-60"
          >
            {submitting ? 'Подождите…' : tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
}
