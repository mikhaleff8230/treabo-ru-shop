import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowRight,
  Bot,
  Check,
  ChevronLeft,
  Loader2,
  MapPin,
  Pencil,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  fetchTreaboCategories,
  fetchTreaboWorks,
  uploadTreaboFile,
  type TreaboCategory,
  type TreaboWork,
} from '@/data/treabo';
import { getStoredTreaboToken } from '@/data/treabo-auth';
import {
  clearRequestAssistantRecovery,
  confirmRequestDraft,
  createRequestDraft,
  patchRequestDraft,
  requestAssistantClientDraftId,
  restoreLatestRequestDraft,
  sendRequestDraftTurn,
  type RequestDraftQuestion,
  type RequestDraftResponse,
} from '@/data/treabo-request-assistant';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import TreaboAddressPicker from '@/components/treabo/TreaboAddressPicker';
import OtpCodeInput from '@/components/auth/otp-code-input';
import { isTreaboOtpSentResponse } from '@/data/treabo-auth';

type Message = { role: 'assistant' | 'user'; text: string };

const fieldClass =
  'w-full rounded-2xl border border-[#dfe4ee] bg-white px-4 py-3.5 text-base text-[#24262d] outline-none transition focus:border-[#b4ca42] focus:ring-4 focus:ring-[#d9f36b]/25';

function messageFor(response: RequestDraftResponse) {
  const action = response.data.ui_action;
  if (action.type === 'ask_question') return action.question.text;
  if ('message' in action && action.message) return action.message;
  if (action.type === 'review') return 'Готово. Проверьте заявку — всё можно исправить перед публикацией.';
  return '';
}

function QuestionInput({
  question,
  disabled,
  onAnswer,
  onSkip,
  uploadToken,
  onAuthRequired,
}: {
  question: RequestDraftQuestion;
  disabled: boolean;
  onAnswer: (value: unknown, label?: string) => void;
  onSkip: () => void;
  uploadToken?: string | null;
  onAuthRequired: () => void;
}) {
  const [value, setValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const options = question.options || [];

  if (question.field_type === 'photo') {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className={`flex items-center justify-center rounded-2xl px-5 py-3 font-semibold ${
          uploadToken ? 'cursor-pointer bg-[#24262d] text-white' : 'cursor-not-allowed bg-[#e7eaf0] text-[#7d8497]'
        }`}>
          {uploading ? 'Загружаю…' : 'Добавить фотографию'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || uploading || !uploadToken}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const uploaded = await uploadTreaboFile(file, { folder: 'tasks', token: uploadToken });
                onAnswer(uploaded, file.name);
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        {!question.required && (
          <button type="button" disabled={disabled} onClick={onSkip} className="rounded-2xl px-5 py-3 font-semibold text-[#697086]">
            Пропустить
          </button>
        )}
        {question.required && !uploadToken && (
          <button type="button" onClick={onAuthRequired} className="rounded-2xl bg-[#24262d] px-5 py-3 font-semibold text-white">
            Войти и добавить
          </button>
        )}
        {!uploadToken && <span className="self-center text-xs text-[#7d8497]">Фото можно добавить после входа</span>}
      </div>
    );
  }

  if (options.length || question.field_type === 'yesno' || question.field_type === 'boolean') {
    const values = options.length
      ? options
      : [
          { value: true, label: 'Да' },
          { value: false, label: 'Нет' },
        ];
    return (
      <div>
        <div className="grid gap-2 sm:grid-cols-2">
          {values.map((option) => (
            <button
              type="button"
              disabled={disabled}
              key={String(option.value)}
              onClick={() => onAnswer(option.value, option.label)}
              className="rounded-2xl border border-[#dfe4ee] bg-white px-4 py-3 text-left font-semibold text-[#30323a] transition hover:border-[#b4ca42] hover:bg-[#f8fbe9] disabled:opacity-60"
            >
              {option.label}
            </button>
          ))}
        </div>
        {!question.required && (
          <button type="button" disabled={disabled} onClick={onSkip} className="mt-2 px-2 py-1 text-sm font-semibold text-[#697086]">
            Пропустить
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim()) onAnswer(question.field_type === 'number' ? Number(value) : value.trim());
      }}
    >
      <input
        autoFocus
        disabled={disabled}
        type={question.field_type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ваш ответ"
        className={fieldClass}
      />
      <button
        type="submit"
        aria-label="Отправить ответ"
        disabled={disabled || !value.trim()}
        className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-[#24262d] text-white disabled:opacity-40"
      >
        <Send className="h-5 w-5" />
      </button>
      {!question.required && (
        <button type="button" disabled={disabled} onClick={onSkip} className="px-3 text-sm font-semibold text-[#697086]">
          Пропустить
        </button>
      )}
    </form>
  );
}

export default function AiRequestAssistant() {
  const router = useRouter();
  const { isAuthenticated, isSpecialist, login, register, verifyOtp } = useTreaboAuth();
  const [response, setResponse] = useState<RequestDraftResponse | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [initialText, setInitialText] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<TreaboCategory[]>([]);
  const [works, setWorks] = useState<TreaboWork[]>([]);
  const [manualMode, setManualMode] = useState<'category' | 'work' | null>(null);
  const [publishedTaskId, setPublishedTaskId] = useState<string | null>(null);
  const [reviewCity, setReviewCity] = useState('');
  const [reviewAddress, setReviewAddress] = useState('');
  const [reviewLat, setReviewLat] = useState<number | null>(null);
  const [reviewLng, setReviewLng] = useState<number | null>(null);
  const [reviewAddressConfirmed, setReviewAddressConfirmed] = useState(false);
  const [budgetType, setBudgetType] = useState<'negotiable' | 'fixed' | 'range'>('negotiable');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [reviewStep, setReviewStep] = useState<'location' | 'budget' | 'auth' | 'summary'>('location');
  const [authPhone, setAuthPhone] = useState('');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOtpId, setAuthOtpId] = useState<string | null>(null);
  const [authOtpCode, setAuthOtpCode] = useState('');

  const action = response?.data.ui_action;
  const draft = response?.data.draft;
  const progress = response?.data.progress;
  const reviewSteps: Array<'location' | 'budget' | 'auth' | 'summary'> = isAuthenticated
    ? ['location', 'budget', 'summary']
    : ['location', 'budget', 'auth', 'summary'];

  useEffect(() => {
    fetchTreaboCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const query = typeof router.query.q === 'string' ? router.query.q : '';
    if (query) setInitialText(query);
  }, [router.query.q]);

  useEffect(() => {
    const clientDraftId = requestAssistantClientDraftId();
    restoreLatestRequestDraft(clientDraftId)
      .then((restored) => {
        setResponse(restored);
        setMessages([
          { role: 'user', text: restored.data.draft.initial_text || restored.data.draft.description || 'Заявка' },
          { role: 'assistant', text: messageFor(restored) },
        ]);
      })
      .catch(() => undefined)
      .finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    const categoryId =
      action?.type === 'choose_service'
        ? action.category_id
        : manualMode === 'work'
          ? draft?.category?.id
          : null;
    if (!categoryId) return;
    fetchTreaboWorks({ category_id: categoryId })
      .then((items) => setWorks(items.filter((item) => item.is_active !== false)))
      .catch(() => setWorks([]));
  }, [action, draft?.category?.id, manualMode]);

  useEffect(() => {
    if (!draft) return;
    setReviewCity((current) => current || draft.location?.city || '');
    setReviewAddress((current) => current || draft.location?.address || '');
    setReviewLat((current) => current ?? draft.location?.lat ?? null);
    setReviewLng((current) => current ?? draft.location?.lng ?? null);
    setReviewAddressConfirmed((current) => current || Boolean(draft.location?.confirmed));
    setBudgetType((current) => {
      if (current !== 'negotiable') return current;
      return draft.budget?.type === 'fixed' || draft.budget?.type === 'range'
        ? draft.budget.type
        : 'negotiable';
    });
    setBudgetAmount((current) => current || (draft.budget?.amount ? String(draft.budget.amount) : ''));
    setBudgetMin((current) => current || (draft.budget?.min ? String(draft.budget.min) : ''));
    setBudgetMax((current) => current || (draft.budget?.max ? String(draft.budget.max) : ''));
  }, [draft?.id, draft?.location?.address, draft?.location?.city]);

  const title = useMemo(() => {
    if (!draft) return 'Что нужно сделать?';
    return draft.title || draft.work?.name || 'Уточняем задачу';
  }, [draft]);

  async function start(event: FormEvent) {
    event.preventDefault();
    if (initialText.trim().length < 2) return;
    setBusy(true);
    setError('');
    try {
      const created = await createRequestDraft({
        initial_text: initialText.trim(),
        city_hint: city.trim() || null,
        client_draft_id: requestAssistantClientDraftId(),
      });
      setResponse(created);
      setMessages([
        { role: 'user', text: initialText.trim() },
        { role: 'assistant', text: messageFor(created) },
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось начать диалог.');
    } finally {
      setBusy(false);
    }
  }

  async function answer(value: unknown, label?: string) {
    if (!draft || action?.type !== 'ask_question' || action.question.id == null) return;
    setBusy(true);
    setError('');
    try {
      const updated = await sendRequestDraftTurn(draft, {
        answer: { question_id: action.question.id, value },
      });
      setMessages((current) => [
        ...current,
        { role: 'user', text: label || String(value) },
        { role: 'assistant', text: messageFor(updated) },
      ]);
      setResponse(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Ответ не сохранился.');
    } finally {
      setBusy(false);
    }
  }

  async function skipQuestion() {
    if (!draft || action?.type !== 'ask_question' || action.question.id == null) return;
    setBusy(true);
    setError('');
    try {
      const updated = await sendRequestDraftTurn(draft, {
        skip_question_id: action.question.id,
      });
      setMessages((current) => [
        ...current,
        { role: 'user', text: 'Пропустить' },
        { role: 'assistant', text: messageFor(updated) },
      ]);
      setResponse(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось пропустить вопрос.');
    } finally {
      setBusy(false);
    }
  }

  async function sendText(event: FormEvent) {
    event.preventDefault();
    if (!draft || !followUp.trim()) return;
    const text = followUp.trim();
    setFollowUp('');
    setBusy(true);
    setError('');
    try {
      const updated = await sendRequestDraftTurn(draft, { message: text });
      setMessages((current) => [
        ...current,
        { role: 'user', text },
        { role: 'assistant', text: messageFor(updated) },
      ]);
      setResponse(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Сообщение не отправлено.');
    } finally {
      setBusy(false);
    }
  }

  async function change(path: string, value: unknown, label?: string) {
    if (!draft) return;
    setBusy(true);
    setError('');
    try {
      const updated = await patchRequestDraft(draft, [{ op: 'replace', path, value }]);
      setResponse(updated);
      setManualMode(null);
      if (label) {
        setMessages((current) => [
          ...current,
          { role: 'user', text: label },
          { role: 'assistant', text: messageFor(updated) },
        ]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Изменение не сохранилось.');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!draft) return;
    const token = getStoredTreaboToken();
    if (!token) {
      setReviewStep('auth');
      setError('Подтвердите телефон — после этого заявка сразу будет готова к публикации.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (!reviewCity.trim()) {
        setError('Укажите город перед публикацией.');
        setBusy(false);
        return;
      }
      if (reviewAddress.trim() && (
        !reviewAddressConfirmed
        || reviewLat == null
        || reviewLng == null
      )) {
        setError('Подтвердите найденный адрес или уточните точку на карте.');
        setBusy(false);
        return;
      }
      if (budgetType === 'fixed' && (!budgetAmount || Number(budgetAmount) <= 0)) {
        setError('Укажите бюджет или выберите «Цена договорная».');
        setBusy(false);
        return;
      }
      if (budgetType === 'range' && (
        !budgetMin
        || !budgetMax
        || Number(budgetMin) <= 0
        || Number(budgetMax) < Number(budgetMin)
      )) {
        setError('Проверьте диапазон бюджета: максимальная сумма не должна быть меньше минимальной.');
        setBusy(false);
        return;
      }
      let publishDraft = draft;
      const changes: Array<{ op: 'replace'; path: string; value: unknown }> = [
        { op: 'replace', path: '/location/city', value: reviewCity.trim() },
        { op: 'replace', path: '/location/address', value: reviewAddress.trim() },
        { op: 'replace', path: '/location/lat', value: reviewLat },
        { op: 'replace', path: '/location/lng', value: reviewLng },
        { op: 'replace', path: '/location/confirmed', value: reviewAddress.trim() ? reviewAddressConfirmed : false },
        { op: 'replace', path: '/location/source', value: reviewAddressConfirmed ? 'geocoder_or_map' : null },
        { op: 'replace', path: '/budget/type', value: budgetType },
        { op: 'replace', path: '/budget/amount', value: budgetType === 'fixed' ? Number(budgetAmount) : null },
        { op: 'replace', path: '/budget/min', value: budgetType === 'range' ? Number(budgetMin) : null },
        { op: 'replace', path: '/budget/max', value: budgetType === 'range' ? Number(budgetMax) : null },
      ];
      const updated = await patchRequestDraft(draft, changes);
      setResponse(updated);
      publishDraft = updated.data.draft;
      const result = await confirmRequestDraft(publishDraft, token);
      setPublishedTaskId(result.data.task_id);
      clearRequestAssistantRecovery();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Заявка не опубликована.');
    } finally {
      setBusy(false);
    }
  }

  async function continueFromLocation() {
    if (!draft) return;
    if (!reviewCity.trim()) {
      setError('Укажите город.');
      return;
    }
    if (reviewAddress.trim() && (!reviewAddressConfirmed || reviewLat == null || reviewLng == null)) {
      setError('Подтвердите найденный адрес или уточните точку на карте.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = await patchRequestDraft(draft, [
        { op: 'replace', path: '/location/city', value: reviewCity.trim() },
        { op: 'replace', path: '/location/address', value: reviewAddress.trim() },
        { op: 'replace', path: '/location/lat', value: reviewLat },
        { op: 'replace', path: '/location/lng', value: reviewLng },
        { op: 'replace', path: '/location/confirmed', value: reviewAddress.trim() ? reviewAddressConfirmed : false },
        { op: 'replace', path: '/location/source', value: reviewAddressConfirmed ? 'geocoder_or_map' : null },
      ]);
      setResponse(updated);
      setReviewStep('budget');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Адрес не сохранился.');
    } finally {
      setBusy(false);
    }
  }

  async function continueFromBudget() {
    if (!draft) return;
    if (budgetType === 'fixed' && (!budgetAmount || Number(budgetAmount) <= 0)) {
      setError('Укажите сумму или выберите «Цена договорная».');
      return;
    }
    if (budgetType === 'range' && (
      !budgetMin
      || !budgetMax
      || Number(budgetMin) <= 0
      || Number(budgetMax) < Number(budgetMin)
    )) {
      setError('Проверьте диапазон бюджета.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = await patchRequestDraft(draft, [
        { op: 'replace', path: '/budget/type', value: budgetType },
        { op: 'replace', path: '/budget/amount', value: budgetType === 'fixed' ? Number(budgetAmount) : null },
        { op: 'replace', path: '/budget/min', value: budgetType === 'range' ? Number(budgetMin) : null },
        { op: 'replace', path: '/budget/max', value: budgetType === 'range' ? Number(budgetMax) : null },
      ]);
      setResponse(updated);
      setReviewStep(isAuthenticated ? 'summary' : 'auth');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Бюджет не сохранился.');
    } finally {
      setBusy(false);
    }
  }

  async function submitInlineAuth() {
    if (authPhone.replace(/\D/g, '').length < 10) {
      setError('Введите номер телефона полностью.');
      return;
    }
    if (authMode === 'register' && authName.trim().length < 2) {
      setError('Укажите имя.');
      return;
    }
    if (authPassword.length < 4) {
      setError('Пароль должен содержать минимум 4 символа.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = authMode === 'register'
        ? await register({
            name: authName.trim(),
            phone: authPhone,
            password: authPassword,
            role: 'customer',
            email: authEmail.trim() || undefined,
            city: reviewCity.trim() || undefined,
          })
        : await login({
            phone: authPhone,
            password: authPassword,
            role: 'customer',
          });
      if (isTreaboOtpSentResponse(result)) {
        setAuthOtpId(result.otp_id);
        setAuthPhone(result.phone.replace(/^\+7/, ''));
        setAuthOtpCode('');
      } else {
        setReviewStep('summary');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось выполнить вход.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmAuthCode(code = authOtpCode) {
    if (!authOtpId || code.length < 6) return;
    setBusy(true);
    setError('');
    try {
      await verifyOtp({
        phone: authPhone,
        otp_id: authOtpId,
        code,
        role: 'customer',
      });
      setReviewStep('summary');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Неверный или просроченный код.');
    } finally {
      setBusy(false);
    }
  }

  if (restoring) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f7fb]">
        <Loader2 className="h-7 w-7 animate-spin text-[#879432]" />
      </main>
    );
  }

  if (publishedTaskId) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-[32px] bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9f36b]">
            <Check className="h-8 w-8 text-[#24262d]" />
          </span>
          <h1 className="mt-5 text-3xl font-bold text-[#24262d]">Заявка опубликована</h1>
          <p className="mt-3 text-[#697086]">Подберём подходящих мастеров и сообщим об откликах.</p>
          <button
            type="button"
            onClick={() => router.push(`/tasks/${publishedTaskId}`)}
            className="mt-7 rounded-2xl bg-[#24262d] px-6 py-3.5 font-semibold text-white"
          >
            Открыть заявку
          </button>
        </div>
      </main>
    );
  }

  if (!response) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f1f8cc,_#f6f7fb_42%)] px-4 py-10 sm:py-20">
        <section className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#687325] shadow-sm">
              <Sparkles className="h-4 w-4" /> AI‑помощник Treabo
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#24262d] sm:text-6xl">Опишите задачу своими словами</h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#697086] sm:text-lg">
              Можно коротко, с ошибками и без специальных терминов. Мы уточним только необходимое.
            </p>
          </div>
          <form onSubmit={start} className="rounded-[28px] bg-white p-4 shadow-[0_24px_70px_rgba(34,38,45,0.10)] sm:p-6">
            <textarea
              autoFocus
              value={initialText}
              onChange={(event) => setInitialText(event.target.value)}
              placeholder="Например: течёт бачок унитаза, воду могу перекрыть"
              rows={5}
              className={`${fieldClass} resize-none border-0 bg-[#f3f5f9] text-lg`}
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9097aa]" />
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Город (можно позже)"
                  className={`${fieldClass} py-3 pl-10`}
                />
              </label>
              <button
                type="submit"
                disabled={busy || initialText.trim().length < 2}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[#24262d] px-6 font-semibold text-white transition hover:bg-black disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Продолжить <ArrowRight className="h-5 w-5" /></>}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </form>
          <button
            type="button"
            onClick={() => router.push('/request/new?mode=manual')}
            className="mx-auto mt-6 block text-sm font-semibold text-[#697086] underline decoration-[#c9ced9] underline-offset-4"
          >
            Выбрать услугу вручную
          </button>
        </section>
      </main>
    );
  }

  const currentDraft = response.data.draft;
  const showCategories = action?.type === 'choose_category' || manualMode === 'category';
  const showWorks = action?.type === 'choose_service' || manualMode === 'work';

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-3 py-4 sm:px-6 sm:py-10">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm">
          <header className="border-b border-[#edf0f5] px-5 py-5 sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#7c862f]">
                  <Bot className="h-4 w-4" /> AI‑помощник
                </div>
                <h1 className="mt-1 truncate text-xl font-bold text-[#24262d] sm:text-2xl">{title}</h1>
              </div>
              <span className="shrink-0 text-sm font-semibold text-[#697086]">{progress?.percent || 0}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf0f5]">
              <div
                className="h-full rounded-full bg-[#c8df55] transition-all duration-500"
                style={{ width: `${Math.max(5, progress?.percent || 0)}%` }}
              />
            </div>
          </header>

          <div className="max-h-[52vh] space-y-4 overflow-y-auto px-4 py-5 sm:max-h-[58vh] sm:px-7">
            {messages.filter((message) => message.text).map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-3xl px-4 py-3 leading-6 ${
                    message.role === 'user'
                      ? 'rounded-br-md bg-[#24262d] text-white'
                      : 'rounded-bl-md bg-[#f0f3f7] text-[#30323a]'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-[#7d8497]">
                <Loader2 className="h-4 w-4 animate-spin" /> Анализирую ответ…
              </div>
            )}
          </div>

          <div className="border-t border-[#edf0f5] bg-[#fbfcfd] p-4 sm:p-6">
            {showCategories && (
              <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    disabled={busy}
                    onClick={() => change('/category/id', category.id, category.name_ru)}
                    className="rounded-2xl border border-[#dfe4ee] bg-white px-4 py-3 text-left font-semibold hover:border-[#b4ca42]"
                  >
                    {category.name_ru}
                  </button>
                ))}
              </div>
            )}
            {showWorks && (
              <div className="grid max-h-64 gap-2 overflow-y-auto">
                {works.map((work) => (
                  <button
                    type="button"
                    key={work.id}
                    disabled={busy}
                    onClick={() => change('/work/id', work.id, work.title)}
                    className="rounded-2xl border border-[#dfe4ee] bg-white px-4 py-3 text-left font-semibold hover:border-[#b4ca42]"
                  >
                    {work.title}
                  </button>
                ))}
              </div>
            )}
            {action?.type === 'ask_question' && action.question.id != null && !manualMode && (
              <QuestionInput
                question={action.question}
                disabled={busy}
                onAnswer={answer}
                onSkip={skipQuestion}
                uploadToken={getStoredTreaboToken()}
                onAuthRequired={() => router.push(`/request/new?mode=manual&q=${encodeURIComponent(currentDraft.description || '')}`)}
              />
            )}
            {action?.type === 'ask_question' && action.question.id == null && !manualMode && (
              <form onSubmit={sendText} className="flex gap-2">
                <input
                  autoFocus
                  value={followUp}
                  onChange={(event) => setFollowUp(event.target.value)}
                  placeholder="Опишите подробнее"
                  className={fieldClass}
                />
                <button
                  type="submit"
                  disabled={busy || !followUp.trim()}
                  className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-[#24262d] text-white disabled:opacity-40"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            )}
            {action?.type === 'split_intents' && (
              <div className="space-y-2">
                {action.intents.map((intent, index) => (
                  <button
                    type="button"
                    key={`${intent.service_id}-${index}`}
                    disabled={busy || !intent.service_id}
                    onClick={() => change('/work/id', intent.service_id, intent.label)}
                    className="w-full rounded-2xl border border-[#dfe4ee] bg-white px-4 py-3 text-left font-semibold hover:border-[#b4ca42] disabled:opacity-50"
                  >
                    {intent.label}
                  </button>
                ))}
                <p className="text-xs text-[#7d8497]">Сначала создадим одну заявку. Для второй можно повторить диалог.</p>
              </div>
            )}
            {action?.type === 'manual_fallback' && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setManualMode('category')}
                  className="rounded-2xl bg-[#24262d] px-5 py-3 font-semibold text-white"
                >
                  Выбрать категорию
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/request/new?mode=manual&q=${encodeURIComponent(currentDraft.description || '')}`)}
                  className="rounded-2xl border border-[#dfe4ee] bg-white px-5 py-3 font-semibold"
                >
                  Открыть ручную форму
                </button>
              </div>
            )}
            {action?.type === 'review' && (
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  {reviewSteps.map((step, index, steps) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full ${
                        steps.indexOf(reviewStep) >= index ? 'bg-[#c4dc50]' : 'bg-[#e8ebf1]'
                      }`}
                    />
                  ))}
                </div>

                {reviewStep === 'location' && (
                  <div className="rounded-3xl border border-[#e5e8ef] bg-[#fafbfc] p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#30323a]">
                      <MapPin className="h-4 w-4" /> Шаг 1. Адрес
                    </div>
                    <p className="mt-1 text-sm text-[#7d8497]">Найдём точный адрес и покажем точку для подтверждения.</p>
                    <input
                      value={reviewCity}
                      onChange={(event) => {
                        setReviewCity(event.target.value);
                        setReviewAddressConfirmed(false);
                      }}
                      placeholder="Город *"
                      className={`${fieldClass} mt-3`}
                    />
                    <TreaboAddressPicker
                      city={reviewCity}
                      address={reviewAddress}
                      lat={reviewLat}
                      lng={reviewLng}
                      onCityChange={setReviewCity}
                      onAddressChange={(value) => {
                        setReviewAddress(value);
                        setReviewAddressConfirmed(false);
                      }}
                      onCoordinatesChange={(lat, lng) => {
                        setReviewLat(lat);
                        setReviewLng(lng);
                      }}
                      onConfirmedChange={setReviewAddressConfirmed}
                      autoDetect={false}
                      resolveInitialAddress
                      compact
                      deferMapUntilAddress
                      addressPlaceholder="Улица, дом, квартира"
                      mapHint="Проверьте точку; при необходимости перетащите маркер"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={continueFromLocation}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#24262d] px-5 py-4 font-semibold text-white disabled:opacity-50"
                    >
                      Продолжить <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {reviewStep === 'budget' && (
                  <div className="rounded-3xl border border-[#e5e8ef] bg-white p-5 sm:p-6">
                    <div className="text-sm font-bold text-[#30323a]">Шаг 2. Бюджет</div>
                    <p className="mt-1 text-sm text-[#7d8497]">Можно оставить цену договорной — это нормальный вариант.</p>
                    <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-[#f1f3f7] p-1 text-xs font-semibold sm:text-sm">
                      {([
                        ['negotiable', 'Договорная'],
                        ['fixed', 'Фиксированная'],
                        ['range', 'Диапазон'],
                      ] as const).map(([type, label]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBudgetType(type)}
                          className={`rounded-xl px-2 py-2.5 transition ${
                            budgetType === type ? 'bg-white text-[#24262d] shadow-sm' : 'text-[#7d8497]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {budgetType === 'fixed' && (
                      <div className="relative mt-3">
                        <input
                          type="number"
                          min="1"
                          inputMode="numeric"
                          value={budgetAmount}
                          onChange={(event) => setBudgetAmount(event.target.value)}
                          placeholder="Сумма"
                          className={`${fieldClass} pr-12`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#7d8497]">₽</span>
                      </div>
                    )}
                    {budgetType === 'range' && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <input type="number" min="1" inputMode="numeric" value={budgetMin} onChange={(event) => setBudgetMin(event.target.value)} placeholder="От, ₽" className={fieldClass} />
                        <input type="number" min="1" inputMode="numeric" value={budgetMax} onChange={(event) => setBudgetMax(event.target.value)} placeholder="До, ₽" className={fieldClass} />
                      </div>
                    )}
                    <div className="mt-5 flex gap-3">
                      <button type="button" onClick={() => setReviewStep('location')} className="rounded-2xl px-5 py-4 font-semibold text-[#697086]">Назад</button>
                      <button type="button" disabled={busy} onClick={continueFromBudget} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#24262d] px-5 py-4 font-semibold text-white disabled:opacity-50">
                        Продолжить <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {reviewStep === 'auth' && (
                  <div className="rounded-3xl border border-[#e5e8ef] bg-white p-5 sm:p-6">
                    <div className="text-sm font-bold text-[#30323a]">Шаг 3. Аккаунт клиента</div>
                    <p className="mt-1 text-sm leading-6 text-[#7d8497]">
                      Заявка сохранена. Войдите или зарегистрируйтесь — и мы сразу её опубликуем.
                    </p>
                    {!authOtpId ? (
                      <>
                        <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-[#f1f3f7] p-1 text-sm font-semibold">
                          <button type="button" onClick={() => setAuthMode('login')} className={`rounded-xl px-3 py-2.5 ${authMode === 'login' ? 'bg-white shadow-sm' : 'text-[#7d8497]'}`}>Вход</button>
                          <button type="button" onClick={() => setAuthMode('register')} className={`rounded-xl px-3 py-2.5 ${authMode === 'register' ? 'bg-white shadow-sm' : 'text-[#7d8497]'}`}>Регистрация</button>
                        </div>
                        {authMode === 'register' && (
                          <input
                            value={authName}
                            onChange={(event) => setAuthName(event.target.value)}
                            autoComplete="name"
                            placeholder="Имя *"
                            className={`${fieldClass} mt-4`}
                          />
                        )}
                        <div className="mt-4 flex overflow-hidden rounded-2xl border border-[#dfe4ee] bg-white">
                          <span className="flex items-center border-r border-[#dfe4ee] px-4 font-semibold">🇷🇺 +7</span>
                          <input
                            value={authPhone}
                            onChange={(event) => setAuthPhone(event.target.value)}
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="999 123-45-67"
                            className="min-w-0 flex-1 px-4 py-4 text-base outline-none"
                          />
                        </div>
                        {authMode === 'register' && (
                          <input
                            value={authEmail}
                            onChange={(event) => setAuthEmail(event.target.value)}
                            type="email"
                            autoComplete="email"
                            placeholder="Email (необязательно)"
                            className={`${fieldClass} mt-3`}
                          />
                        )}
                        <input
                          value={authPassword}
                          onChange={(event) => setAuthPassword(event.target.value)}
                          type="password"
                          autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                          placeholder="Пароль *"
                          className={`${fieldClass} mt-3`}
                        />
                        {authMode === 'register' && (
                          <p className="mt-3 text-xs leading-5 text-[#7d8497]">
                            SMS отправим один раз для подтверждения номера. Дальше вход — по телефону и паролю.
                          </p>
                        )}
                        {authMode === 'login' && (
                          <button type="button" onClick={() => router.push('/auth/client')} className="mt-3 text-sm font-semibold text-[#697086] underline">
                            Не помню пароль
                          </button>
                        )}
                        <button type="button" disabled={busy} onClick={submitInlineAuth} className="mt-4 w-full rounded-2xl bg-[#24262d] px-5 py-4 font-semibold text-white disabled:opacity-50">
                          {authMode === 'register' ? 'Зарегистрироваться' : 'Войти'}
                        </button>
                      </>
                    ) : (
                      <div className="mt-5">
                        <p className="mb-4 text-center text-sm leading-6 text-[#697086]">
                          Введите SMS-код, отправленный на +7 {authPhone}. Повторно подтверждать номер при входе не потребуется.
                        </p>
                        <OtpCodeInput
                          value={authOtpCode}
                          onChange={setAuthOtpCode}
                          onComplete={confirmAuthCode}
                          disabled={busy}
                          error={error || undefined}
                        />
                        <button type="button" disabled={busy || authOtpCode.length < 6} onClick={() => confirmAuthCode()} className="mt-5 w-full rounded-2xl bg-[#24262d] px-5 py-4 font-semibold text-white disabled:opacity-50">
                          Подтвердить
                        </button>
                        <button type="button" onClick={() => setAuthOtpId(null)} className="mt-3 w-full text-sm font-semibold text-[#697086]">Изменить номер</button>
                      </div>
                    )}
                    <button type="button" onClick={() => setReviewStep('budget')} className="mt-4 text-sm font-semibold text-[#697086]">Назад к бюджету</button>
                  </div>
                )}

                {reviewStep === 'summary' && (
                  <div className="rounded-3xl border border-[#e5e8ef] bg-white p-5 sm:p-6">
                    <div className="text-sm font-bold text-[#30323a]">Всё готово</div>
                    <p className="mt-1 text-sm text-[#7d8497]">Проверьте итог — после публикации мастера смогут откликнуться.</p>
                    <div className="mt-4 space-y-3 rounded-2xl bg-[#f6f7f9] p-4 text-sm">
                      <div><span className="text-[#8a91a3]">Адрес:</span> <span className="font-semibold">{reviewAddress || reviewCity}</span></div>
                      <div><span className="text-[#8a91a3]">Бюджет:</span> <span className="font-semibold">
                        {budgetType === 'negotiable' ? 'Цена договорная' : budgetType === 'fixed' ? `${budgetAmount} ₽` : `${budgetMin}–${budgetMax} ₽`}
                      </span></div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-[#e5e8ef] p-4">
                      <div className="text-xs font-bold uppercase tracking-wide text-[#8a91a3]">Описание для мастера</div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#30323a]">
                        {currentDraft.description}
                      </p>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button type="button" onClick={() => setReviewStep('budget')} className="rounded-2xl px-5 py-4 font-semibold text-[#697086]">Назад</button>
                      <button type="button" disabled={busy || isSpecialist} onClick={publish} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#24262d] px-5 py-4 font-semibold text-white disabled:opacity-50">
                        Опубликовать заявку <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {error && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>{error}</span>
                <button type="button" onClick={() => setError('')}><RotateCcw className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-[28px] bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
          <h2 className="text-lg font-bold text-[#24262d]">Черновик заявки</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-[#8a91a3]">Категория</dt>
              <dd className="mt-1 flex items-center justify-between gap-3 font-semibold text-[#30323a]">
                <span>{currentDraft.category?.name || 'Не определена'}</span>
                <button type="button" onClick={() => setManualMode('category')} aria-label="Изменить категорию">
                  <Pencil className="h-4 w-4 text-[#7d8497]" />
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-[#8a91a3]">Работа</dt>
              <dd className="mt-1 flex items-center justify-between gap-3 font-semibold text-[#30323a]">
                <span>{currentDraft.work?.name || 'Не определена'}</span>
                {currentDraft.category && (
                  <button type="button" onClick={() => setManualMode('work')} aria-label="Изменить работу">
                    <Pencil className="h-4 w-4 text-[#7d8497]" />
                  </button>
                )}
              </dd>
            </div>
            {currentDraft.answers.map((item) => (
              <div key={item.question_id}>
                <dt className="text-[#8a91a3]">{item.question}</dt>
                <dd className="mt-1 font-semibold text-[#30323a]">{item.display_value}</dd>
              </div>
            ))}
          </dl>
          {manualMode && (
            <button type="button" onClick={() => setManualMode(null)} className="mt-5 flex items-center gap-1 text-sm font-semibold text-[#697086]">
              <ChevronLeft className="h-4 w-4" /> Вернуться к вопросу
            </button>
          )}
          <div className="mt-6 rounded-2xl bg-[#f4f7e6] p-4 text-sm leading-6 text-[#5f6824]">
            AI использует только опубликованный справочник Treabo. Итог всегда можно исправить.
          </div>
        </aside>
      </div>
    </main>
  );
}
