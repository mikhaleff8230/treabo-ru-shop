import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import TreaboPhoneInput from '@/components/treabo/TreaboPhoneInput';
import OtpCodeInput from '@/components/auth/otp-code-input';
import { isTreaboOtpSentResponse } from '@/data/treabo-auth';
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
  sendOtp: (input: {
    phone: string;
    purpose: 'login' | 'register';
    password?: string;
    name?: string;
    role?: 'customer' | 'specialist';
    email?: string;
  }) => Promise<{ status: 'otp_sent'; phone: string; otp_id: string }>;
  verifyOtp: (input: { phone: string; otp_id: string; code: string }) => Promise<unknown>;
};

const RESEND_SECONDS = 60;

export default function TreaboAuthModal({
  open,
  onClose,
  initialTab = 'login',
  initialRole = 'customer',
  onSuccess,
  login,
  register,
  sendOtp,
  verifyOtp,
}: TreaboAuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('7');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'specialist'>('customer');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'register'>('login');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setRole(initialRole);
      setError('');
      setOtpStep(false);
      setOtpId(null);
      setOtpPhone('');
      setOtpCode('');
      setResendTimer(0);
    }
  }, [open, initialRole, initialTab]);

  useEffect(() => {
    if (!otpStep || resendTimer <= 0) return undefined;

    const timer = window.setInterval(() => {
      setResendTimer((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpStep, resendTimer]);

  if (!open) return null;

  const inputClass =
    'w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-[#232323] outline-none focus:border-zinc-950';

  const normalizedPhone = normalizeTreaboPhone(phone);

  function beginOtpStep(payload: { phone: string; otp_id: string }, purpose: 'login' | 'register') {
    setOtpStep(true);
    setOtpId(payload.otp_id);
    setOtpPhone(payload.phone);
    setOtpPurpose(purpose);
    setOtpCode('');
    setError('');
    setResendTimer(RESEND_SECONDS);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (tab === 'register') {
        const result = await register({
          name: name.trim(),
          phone: normalizedPhone,
          password,
          role,
          email: email.trim() || undefined,
        });

        if (isTreaboOtpSentResponse(result)) {
          beginOtpStep(result, 'register');
          return;
        }
      } else {
        const result = await login({
          phone: normalizedPhone,
          password,
        });

        if (isTreaboOtpSentResponse(result)) {
          beginOtpStep(result, 'login');
          return;
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить вход');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    if (!otpId) return;

    setError('');
    setSubmitting(true);

    try {
      await verifyOtp({
        phone: otpPhone,
        otp_id: otpId,
        code,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (resendTimer > 0 || submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const payload =
        otpPurpose === 'register'
          ? await sendOtp({
              phone: otpPhone,
              purpose: 'register',
              password,
              name: name.trim(),
              role,
              email: email.trim() || undefined,
            })
          : await sendOtp({
              phone: otpPhone,
              purpose: 'login',
              password,
            });

      setOtpId(payload.otp_id);
      setOtpCode('');
      setResendTimer(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SMS не отправлено');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackFromOtp() {
    setOtpStep(false);
    setOtpId(null);
    setOtpCode('');
    setError('');
    setResendTimer(0);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Закрыть" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#7d849b]">Treabo</div>
            <h2 className="text-2xl font-black text-[#232323]">
              {otpStep ? 'Подтверждение телефона' : tab === 'login' ? 'Вход' : 'Регистрация'}
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

        {!otpStep ? (
          <>
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

              {error ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-[#d9f36b] px-5 py-3 text-base font-black text-[#232323] transition hover:bg-[#c7e85a] disabled:opacity-60"
              >
                {submitting ? 'Подождите…' : tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#7d849b]">
              Мы отправили SMS-код на{' '}
              <span className="font-bold text-[#232323]">{otpPhone}</span>
            </p>

            <OtpCodeInput
              value={otpCode}
              onChange={setOtpCode}
              onComplete={handleVerifyOtp}
              disabled={submitting}
              error={error || undefined}
            />

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBackFromOtp}
                className="text-sm font-bold text-[#7d849b] hover:text-[#232323]"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || submitting}
                className="text-sm font-bold text-[#232323] disabled:text-[#b8bcc8]"
              >
                {resendTimer > 0 ? `Отправить код ещё раз (${resendTimer}с)` : 'Отправить код ещё раз'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleVerifyOtp(otpCode)}
              disabled={submitting || otpCode.length < 6}
              className="w-full rounded-2xl bg-[#d9f36b] px-5 py-3 text-base font-black text-[#232323] transition hover:bg-[#c7e85a] disabled:opacity-60"
            >
              {submitting ? 'Проверяем…' : 'Подтвердить'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
