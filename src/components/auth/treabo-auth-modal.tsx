import { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import TreaboPhoneInput from '@/components/treabo/TreaboPhoneInput';
import OtpCodeInput from '@/components/auth/otp-code-input';
import {
  isTreaboOtpSentResponse,
  treaboPollPushLogin,
  treaboRequestPushLogin,
  treaboResetCustomerPassword,
  treaboSendCustomerPasswordResetCode,
} from '@/data/treabo-auth';
import { normalizeTreaboPhone } from '@/lib/treabo/phone';

type TreaboAuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  initialRole?: 'customer' | 'specialist';
  onSuccess?: () => void;
  login: (input: { phone?: string; email?: string; password: string; role: 'customer' | 'specialist' }) => Promise<unknown>;
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
    role: 'customer' | 'specialist';
    email?: string;
    channel?: 'sms' | 'telegram';
  }) => Promise<{ status: 'otp_sent'; phone: string; otp_id: string }>;
  verifyOtp: (input: { phone: string; otp_id: string; code: string; role: 'customer' | 'specialist' }) => Promise<unknown>;
};

const RESEND_SECONDS = 60;
const MASTER_APP_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_TREABO_APP_APK_URL || '/downloads/treabo-proffi.apk';

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
  const [passwordReset, setPasswordReset] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const isSpecialistPushLogin = tab === 'login' && role === 'specialist';

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
      setPasswordReset(false);
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
    if (isSpecialistPushLogin) {
      await handlePushLogin();
      return;
    }

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
          role,
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

  async function handlePushLogin() {
    setError('');
    setSubmitting(true);
    try {
      const request = await treaboRequestPushLogin(normalizedPhone);
      const deadline = Date.now() + request.expires_in * 1000;
      while (Date.now() < deadline) {
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        const result = await treaboPollPushLogin(request.request_id);
        if (result.status === 'approved') { onSuccess?.(); onClose(); return; }
        if (result.status === 'rejected' || result.status === 'expired') throw new Error('Вход отклонён или время подтверждения истекло');
      }
      throw new Error('Время подтверждения истекло');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить push');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    if (!otpId) return;

    setError('');
    setSubmitting(true);

    try {
      if (passwordReset) {
        await treaboResetCustomerPassword({
          phone: otpPhone,
          otp_id: otpId,
          code,
          password,
        });
      } else {
        await verifyOtp({
          phone: otpPhone,
          otp_id: otpId,
          code,
          role,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setSubmitting(true);
    try {
      const payload = await treaboSendCustomerPasswordResetCode(normalizedPhone);
      setPasswordReset(true);
      setOtpStep(true);
      setOtpId(payload.otp_id);
      setOtpPhone(payload.phone);
      setOtpCode('');
      setResendTimer(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить код в Telegram');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (resendTimer > 0 || submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const payload = passwordReset
        ? await treaboSendCustomerPasswordResetCode(otpPhone)
        : otpPurpose === 'register'
          ? await sendOtp({
              phone: otpPhone,
              purpose: 'register',
              password,
              name: name.trim(),
              role,
              email: email.trim() || undefined,
              channel: 'telegram',
            })
          : await sendOtp({
              phone: otpPhone,
              purpose: 'login',
              password,
              role,
              channel: 'telegram',
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
    setPasswordReset(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Закрыть" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#7d849b]">Treabo</div>
            <h2 className="text-2xl font-black text-[#232323]">
              {otpStep
                ? 'Подтверждение телефона'
                : tab === 'login'
                  ? 'Вход'
                  : role === 'specialist'
                    ? 'Регистрация специалиста'
                    : 'Регистрация клиента'}
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

              {!isSpecialistPushLogin ? (
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-[#232323]">Пароль</span>
                  <input
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={4}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  />
                </label>
              ) : (
                <div className="rounded-2xl bg-[#f3f5fa] px-4 py-3 text-sm leading-6 text-[#5f6678]">
                  Мы отправим бесплатное push-уведомление в приложение Treabo. Подтвердите вход на своём телефоне.
                </div>
              )}

              {tab === 'login' && role === 'customer' ? (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={submitting || !normalizedPhone}
                  className="text-left text-sm font-bold text-[#5f6678] hover:text-[#232323] disabled:opacity-50"
                >
                  Забыли пароль? Получить код в Telegram
                </button>
              ) : null}

              {error ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-2xl px-5 py-3 text-base font-black transition disabled:opacity-60 ${role === 'specialist' ? 'bg-[#232323] text-white hover:bg-black' : 'bg-[#d9f36b] text-[#232323] hover:bg-[#c7e85a]'}`}
              >
                {submitting
                  ? isSpecialistPushLogin
                    ? 'Ожидаем подтверждение…'
                    : 'Подождите…'
                  : isSpecialistPushLogin
                    ? 'Подтвердить вход в приложении'
                    : tab === 'login'
                      ? 'Войти'
                      : 'Зарегистрироваться'}
              </button>
              {isSpecialistPushLogin ? (
                <p className="text-center text-xs leading-5 text-[#7d849b]">
                  Первый вход и привязка телефона выполняются при регистрации. SMS при обычном входе мастера не отправляется.
                </p>
              ) : null}

              {tab === 'register' && role === 'specialist' ? (
                <a
                  href={MASTER_APP_DOWNLOAD_URL}
                  download
                  className="flex items-center gap-3 rounded-2xl border border-[#dfe5c5] bg-[#f8fbe9] px-4 py-3 transition hover:border-[#c7d97c] hover:bg-[#f3f8d9]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9f36b] text-[#232323]">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-[#232323]">Скачать приложение Treabo</span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#6f765d]">
                      Скачайте приложение для входа в кабинет специалиста
                    </span>
                  </span>
                </a>
              ) : null}
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#7d849b]">
              {passwordReset ? 'Код для восстановления пароля отправлен через Telegram на ' : 'Мы отправили код подтверждения на '}
              <span className="font-bold text-[#232323]">{otpPhone}</span>
            </p>

            {passwordReset ? (
              <label className="block space-y-2">
                <span className="text-sm font-bold text-[#232323]">Новый пароль</span>
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
            ) : null}

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
                {resendTimer > 0 ? `Получить код в Telegram (${resendTimer}с)` : 'Получить код в Telegram'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleVerifyOtp(otpCode)}
              disabled={submitting || otpCode.length < 6 || (passwordReset && password.length < 6)}
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
