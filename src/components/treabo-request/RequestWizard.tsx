import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ListChecks,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Send,
  UserRound,
} from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { TreaboLanguageSwitcher } from '@/components/proffi-mock/TreaboLanguageSwitcher';

type Draft = Record<string, any> & {
  id?: string;
  prompt?: string;
  category?: string;
  saved?: boolean;
};

type AiDraft = {
  detected_language: string;
  title: string;
  category_slug: string;
  city: string | null;
  urgency: string;
  description: string;
  master_summary: string;
  missing_questions: string[];
  confidence: number;
};

type Step = {
  key: string;
  title: string;
  subtitle?: string;
  progress: number;
  action?: string;
  optional?: boolean;
};

const steps: Step[] = [
  { key: 'prompt', title: 'Что нужно сделать?', subtitle: 'Опишите задачу обычными словами. Позже здесь будет помогать AI.', progress: 8 },
  { key: 'category', title: 'Какая услуга нужна?', progress: 18 },
  { key: 'area', title: 'Площадь работ', subtitle: 'Можно примерно', progress: 30 },
  { key: 'surface', title: 'Основной материал поверхности', progress: 42 },
  { key: 'materials', title: 'Какие материалы использовать?', progress: 52 },
  { key: 'deadline', title: 'Когда нужна услуга?', progress: 64 },
  { key: 'address', title: 'Ваш адрес', progress: 78 },
  { key: 'budget', title: 'Выше какой цены не готовы рассматривать предложения?', progress: 86 },
  { key: 'details', title: 'Остались пожелания?', progress: 90, action: 'Пропустить', optional: true },
  { key: 'choice', title: 'Вы готовы выбрать специалиста или пока думаете?', progress: 94, action: 'Подобрать специалистов' },
  { key: 'contacts', title: 'До специалистов осталось чуть-чуть', progress: 100, action: 'Сохранить заявку' },
];

const categories = ['Ремонт ванной', 'Покраска стен', 'Сантехника', 'Электрика', 'Плиточные работы', 'Кондиционеры'];
const surfaces = ['Бетон', 'Гипсокартон', 'Кирпич', 'Газобетон', 'Дерево'];
const materials = ['Краска на водной основе', 'Краска на масляной основе', 'Эмаль', 'Лак', 'Масло', 'По рекомендации специалиста'];
const deadlines = ['В течение недели', 'Сегодня', 'Завтра', 'Выберу дни в календаре', 'Когда удобно специалисту'];
const choices = [
  'Я точно хочу выбрать специалиста',
  'Еще думаю, посмотрю предложения и решу',
  'Пока не ищу специалиста, хочу посмотреть цены',
];

const inputClass = 'w-full rounded-2xl bg-[#eef1f7] px-4 py-4 text-base text-[#232323] outline-none placeholder:text-[#7d849b] focus:ring-2 focus:ring-[#d9f36b]';

function createDraftId() {
  return `trb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function treaboApiUrl(path: string) {
  return `/api/treabo/${path.replace(/^\//, '')}`;
}

function generateLocalAiDraft(text: string, locale?: string): AiDraft {
  const normalized = text.toLowerCase();
  const isRo = locale === 'ro';
  const hasBath = /ванн|сануз|baie|baia|duș|dus/.test(normalized);
  const hasTile = /плит|gresie|faian/.test(normalized);
  const isUrgent = /сроч|urgent|azi|сегодня/.test(normalized);
  const city = /кишин|chisin|chișin|кишине/.test(normalized) ? 'Chișinău' : null;
  const category = hasBath ? 'bathroom-renovation' : hasTile ? 'tile-work' : 'other';

  return {
    detected_language: isRo ? 'ro' : 'ru',
    title: isRo
      ? hasBath
        ? 'Reparație baie'
        : hasTile
          ? 'Lucrări de faianță și gresie'
          : 'Cerere pentru specialist'
      : hasBath
        ? 'Ремонт ванной комнаты'
        : hasTile
          ? 'Плиточные работы'
          : 'Заявка для специалиста',
    category_slug: category,
    city,
    urgency: isUrgent ? 'urgent' : 'unknown',
    description: isRo
      ? `Clientul a descris sarcina astfel: ${text}. Sunt necesare detalii suplimentare pentru estimarea prețului și termenului.`
      : `Клиент описал задачу так: ${text}. Нужны дополнительные детали для оценки стоимости и сроков.`,
    master_summary: isRo
      ? `${hasBath ? 'Baie' : hasTile ? 'Faianță/gresie' : 'Lucrare'}, ${isUrgent ? 'urgent' : 'termen de precizat'}${city ? `, ${city}` : ''}.`
      : `${hasBath ? 'Ванная' : hasTile ? 'Плитка' : 'Работа'}, ${isUrgent ? 'срочно' : 'срок уточнить'}${city ? `, ${city}` : ''}.`,
    missing_questions: isRo
      ? ['Care este suprafața lucrării?', 'Există fotografii?', 'Materialele sunt cumpărate?', 'Când poate veni specialistul la măsurare?']
      : ['Какая площадь работ?', 'Есть ли фотографии?', 'Материалы уже куплены?', 'Когда специалист может приехать на осмотр?'],
    confidence: 0.55,
  };
}

function Option({
  label,
  active,
  multi,
  onClick,
}: {
  label: string;
  active?: boolean;
  multi?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-2.5 text-left text-base text-[#232323]">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-[#232323]' : 'bg-[#e9edf5]'}`}>
        {active && (multi ? <Check className="h-4 w-4 text-white" /> : <span className="h-2.5 w-2.5 rounded-full bg-white" />)}
      </span>
      <span>{label}</span>
    </button>
  );
}

function TreaboMapMock() {
  return (
    <div className="relative mt-8 h-[360px] overflow-hidden rounded-2xl border border-[#dfe4ee] bg-[#eaf0e3] md:h-[520px]">
      <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(30deg,transparent_46%,#d1d9c8_47%,#d1d9c8_53%,transparent_54%),linear-gradient(120deg,transparent_46%,#cfd8e3_47%,#cfd8e3_53%,transparent_54%),linear-gradient(#f8faf5_1px,transparent_1px),linear-gradient(90deg,#f8faf5_1px,transparent_1px)] [background-size:180px_180px,240px_240px,56px_56px,56px_56px]" />
      <div className="absolute left-[47%] top-[43%] flex h-12 w-12 items-center justify-center rounded-full bg-[#232323] text-white shadow-xl">
        <MapPin className="h-6 w-6 fill-white" />
      </div>
      <div className="absolute bottom-5 right-5 flex flex-col overflow-hidden rounded-full bg-white shadow-xl">
        <button className="flex h-12 w-12 items-center justify-center border-b border-zinc-100"><Plus className="h-5 w-5" /></button>
        <button className="flex h-12 w-12 items-center justify-center"><Minus className="h-5 w-5" /></button>
      </div>
      <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#232323]">Карта будет подключена к Яндекс.Картам</div>
    </div>
  );
}

export default function RequestWizard() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const steps = t('treabo.request.steps', { returnObjects: true }) as Step[];
  const categories = t('treabo.request.categories', { returnObjects: true }) as string[];
  const surfaces = t('treabo.request.surfaces', { returnObjects: true }) as string[];
  const materials = t('treabo.request.materials', { returnObjects: true }) as string[];
  const deadlines = t('treabo.request.deadlines', { returnObjects: true }) as string[];
  const choices = t('treabo.request.choices', { returnObjects: true }) as string[];

  const step = steps[stepIndex];
  const taskName = draft.category || draft.prompt || t('treabo.request.newRequest');

  useEffect(() => {
    const queryPrompt = typeof router.query.q === 'string' ? router.query.q : '';
    if (queryPrompt) {
      setDraft((current) => ({ ...current, prompt: current.prompt || queryPrompt }));
    }
  }, [router.query.q]);

  useEffect(() => {
    if (!draft.id) return;
    localStorage.setItem(`treabo-request-${draft.id}`, JSON.stringify(draft));
  }, [draft]);

  const selectedMaterials = useMemo(() => new Set<string>(draft.materials || []), [draft.materials]);

  function update(key: string, value: any) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function ensureDraftId() {
    if (draft.id) return draft.id;
    const id = createDraftId();
    setDraft((current) => ({ ...current, id }));
    router.replace(`/request/new?draft=${id}`, undefined, { shallow: true });
    return id;
  }

  function next() {
    ensureDraftId();
    if (stepIndex >= steps.length - 1) {
      setDraft((current) => ({ ...current, saved: true, savedAt: new Date().toISOString() }));
      return;
    }
    setStepIndex((value) => value + 1);
  }

  function back() {
    if (draft.saved) {
      setDraft((current) => ({ ...current, saved: false }));
      return;
    }
    setStepIndex((value) => Math.max(0, value - 1));
  }

  function toggleMaterial(value: string) {
    const nextValues = new Set(selectedMaterials);
    if (nextValues.has(value)) nextValues.delete(value);
    else nextValues.add(value);
    update('materials', Array.from(nextValues));
  }

  async function submitPrompt() {
    const prompt = String(draft.prompt || '').trim();

    if (prompt.length < 5) {
      setAiError(t('treabo.request.promptTooShort'));
      return;
    }

    ensureDraftId();
    setAiLoading(true);
    setAiError('');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(treaboApiUrl('/ai/job-draft'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          text: prompt,
          city_hint: 'Chișinău',
          category_hint: null,
          language_hint: router.locale === 'ro' || router.locale === 'ru' ? router.locale : 'auto',
        }),
      });
      clearTimeout(timeout);

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Не удалось сформировать заявку');
      }

      const generatedDraft = payload.data as AiDraft;
      setAiDraft(generatedDraft);
      setDraft((current) => ({
        ...current,
        aiDraft: generatedDraft,
        category: generatedDraft.title || current.category,
        city: generatedDraft.city || current.city,
        details: generatedDraft.description || current.details,
      }));
    } catch (error) {
      const generatedDraft = generateLocalAiDraft(prompt, router.locale);
      setAiDraft(generatedDraft);
      setDraft((current) => ({
        ...current,
        aiDraft: generatedDraft,
        category: generatedDraft.title || current.category,
        city: generatedDraft.city || current.city,
        details: generatedDraft.description || current.details,
      }));
      setAiError('');
    } finally {
      setAiLoading(false);
    }
  }

  function renderStep() {
    if (draft.saved) {
      return (
        <div className="flex min-h-[520px] flex-col justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#d9f36b]">
            <CheckCircle2 className="h-9 w-9 text-[#232323]" />
          </div>
          <h1 className="mt-7 max-w-2xl text-4xl font-black leading-tight text-[#232323] md:text-5xl">{t('treabo.request.draftSavedTitle')}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#232323]">
            {t('treabo.request.draftSavedText')}
          </p>
          <div className="mt-8 rounded-3xl bg-[#f6f7f2] p-5">
            <div className="text-sm font-bold text-[#7d849b]">{t('treabo.request.draftNumber')}</div>
            <div className="mt-1 text-xl font-black text-[#232323]">{draft.id}</div>
          </div>
        </div>
      );
    }

    switch (step.key) {
      case 'prompt':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#232323]">{step.subtitle}</p>
            <div className="mt-9 max-w-3xl rounded-[28px] border border-[#dfe4ee] bg-[#f8f9fb] p-3 shadow-sm">
              <textarea
                value={draft.prompt || ''}
                onChange={(event) => update('prompt', event.target.value)}
                placeholder={t('treabo.request.firstPromptPlaceholder')}
                className="min-h-[150px] w-full resize-none bg-transparent px-3 py-3 text-lg font-semibold text-[#232323] outline-none placeholder:text-[#8b92a8]"
              />
              <div className="flex justify-end">
                <button onClick={submitPrompt} disabled={aiLoading} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d9f36b] text-[#232323] disabled:cursor-wait disabled:opacity-60">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
            {aiLoading && (
              <div className="mt-5 max-w-3xl rounded-3xl border border-[#dfe4ee] bg-white p-5 text-base font-semibold text-[#232323]">
                {t('treabo.request.aiLoading')}
              </div>
            )}
            {aiError && (
              <div className="mt-5 max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-5 text-base font-semibold text-red-700">
                {aiError}
              </div>
            )}
            {aiDraft && (
              <div className="mt-5 max-w-3xl rounded-3xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
                <div className="text-sm font-black uppercase tracking-wide text-[#7d849b]">{t('treabo.request.aiDraft')}</div>
                <h2 className="mt-2 text-2xl font-black text-[#232323]">{aiDraft.title}</h2>
                <p className="mt-3 text-base leading-7 text-[#232323]">{aiDraft.description}</p>
                <div className="mt-4 grid gap-3 text-sm font-semibold text-[#232323] sm:grid-cols-3">
                  <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3">{t('treabo.request.categoryLabel')}: {aiDraft.category_slug}</span>
                  <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3">{t('treabo.request.cityLabel')}: {aiDraft.city || t('treabo.request.unknownCity')}</span>
                  <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3">{t('treabo.request.urgencyLabel')}: {aiDraft.urgency}</span>
                </div>
                {aiDraft.missing_questions?.length > 0 && (
                  <div className="mt-5">
                    <div className="text-sm font-black text-[#232323]">{t('treabo.request.missingTitle')}</div>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-[#232323]">
                      {aiDraft.missing_questions.map((question) => (
                        <li key={question} className="rounded-2xl bg-[#f8f9fb] px-4 py-3">{question}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button onClick={next} className="mt-5 inline-flex h-12 items-center gap-3 rounded-xl bg-[#d9f36b] px-6 text-base font-black text-[#232323] transition hover:bg-[#c7e85a]">
                  Продолжить <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        );
      case 'category':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <div className="mt-9 max-w-xl space-y-1">
              {categories.map((item) => <Option key={item} label={item} active={draft.category === item} onClick={() => update('category', item)} />)}
            </div>
          </>
        );
      case 'area':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <p className="mt-8 text-lg text-[#232323]">{step.subtitle}</p>
            <input value={draft.area || ''} onChange={(event) => update('area', event.target.value)} placeholder="0 м2" className={`${inputClass} mt-7 max-w-[290px]`} />
          </>
        );
      case 'surface':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <div className="mt-9 max-w-xl space-y-1">
              {surfaces.map((item) => <Option key={item} label={item} active={draft.surface === item} onClick={() => update('surface', item)} />)}
              <div className="flex items-center gap-3 pt-2">
                <span className="h-6 w-6 shrink-0 rounded-lg bg-[#e9edf5]" />
                <input value={draft.surfaceOther || ''} onChange={(event) => update('surfaceOther', event.target.value)} placeholder="Другое" className={`${inputClass} max-w-[230px]`} />
              </div>
            </div>
          </>
        );
      case 'materials':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <div className="mt-9 max-w-xl space-y-1">
              {materials.map((item) => <Option key={item} label={item} multi active={selectedMaterials.has(item)} onClick={() => toggleMaterial(item)} />)}
              <div className="flex items-center gap-3 pt-2">
                <span className="h-6 w-6 shrink-0 rounded-lg bg-[#e9edf5]" />
                <input value={draft.materialOther || ''} onChange={(event) => update('materialOther', event.target.value)} placeholder="Другое" className={`${inputClass} max-w-[230px]`} />
              </div>
            </div>
          </>
        );
      case 'deadline':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <div className="mt-9 max-w-xl space-y-1">
              {deadlines.map((item) => <Option key={item} label={item} active={draft.deadline === item} onClick={() => update('deadline', item)} />)}
            </div>
          </>
        );
      case 'address':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <input value={draft.address || ''} onChange={(event) => update('address', event.target.value)} placeholder="Улица и номер дома" className={`${inputClass} mt-8`} />
            <TreaboMapMock />
          </>
        );
      case 'budget':
        return (
          <>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <input value={draft.budget || ''} onChange={(event) => update('budget', event.target.value)} placeholder="до 0 ₽" className={`${inputClass} mt-12 max-w-[290px]`} />
          </>
        );
      case 'details':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <textarea value={draft.details || ''} onChange={(event) => update('details', event.target.value)} placeholder="Важные детали для специалиста, о которых мы не спросили" className={`${inputClass} mt-10 min-h-[136px] resize-none`} />
            <button className="mt-5 flex w-full items-center justify-between rounded-2xl border border-dashed border-[#d3d9e8] bg-white px-5 py-5 text-left text-[#232323]">
              <span>Добавьте фото или документ</span>
              <Plus className="h-5 w-5 text-[#7d849b]" />
            </button>
          </>
        );
      case 'choice':
        return (
          <>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <div className="mt-9 max-w-2xl space-y-1">
              {choices.map((item) => <Option key={item} label={item} active={draft.choice === item} onClick={() => update('choice', item)} />)}
            </div>
          </>
        );
      case 'contacts':
        return (
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">До специалистов осталось чуть-чуть</h1>
            <div className="mt-14 flex items-center">
              {['М', 'А', 'И', 'С', 'Е'].map((letter, index) => (
                <span key={letter} className="-ml-2 flex h-9 w-9 first:ml-0 items-center justify-center rounded-full border-2 border-white bg-[#d9f36b] text-sm font-black text-[#232323]">
                  {letter}
                </span>
              ))}
              <span className="ml-2 text-sm font-bold text-[#7d849b]">10+</span>
            </div>
            <p className="mt-16 text-sm text-[#7d849b]">Специалисты не видят ваш номер. Вы сами решите, кому он будет доступен.</p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#cfd5e6] bg-white px-4 py-4">
              <span className="text-sm">🇷🇺</span>
              <input value={draft.phone || ''} onChange={(event) => update('phone', event.target.value)} placeholder="+ 7 ___-___-__-__" className="w-full bg-transparent text-base text-[#232323] outline-none" />
            </div>
            <button onClick={next} className="mt-4 w-full rounded-2xl bg-[#d9f36b] px-5 py-4 text-base font-black text-[#232323]">{t('treabo.request.phoneContinue')}</button>
            <div className="my-8 flex items-center gap-4 text-sm text-[#7d849b]">
              <span className="h-px flex-1 bg-[#dfe4ee]" />
              или
              <span className="h-px flex-1 bg-[#dfe4ee]" />
            </div>
            <button className="w-full rounded-2xl bg-[#eef1f7] px-5 py-4 text-base font-black text-[#8b3ffc]">Войти через Яндекс ID</button>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f5fa] text-[#232323]">
      <header className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4">
        <Link href="/" className="text-3xl font-black tracking-tight text-[#232323]">Treabo</Link>
        <div className="flex items-center gap-3 text-sm font-medium md:gap-8">
          <span className="hidden md:inline">{t('treabo.common.city')}</span>
          <Link href="/podrabotka" className="hidden md:inline">{t('treabo.request.specialistSite')}</Link>
          <span className="hidden md:inline">{t('treabo.request.login')}</span>
          <TreaboLanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto grid max-w-[1180px] gap-5 px-4 pb-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="md:pt-6">
          <h2 className="max-w-[240px] text-3xl font-black leading-tight">{taskName}</h2>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-[#e3e7f1] px-4 py-4 text-sm font-bold">
              <span className="flex items-center gap-3"><ListChecks className="h-4 w-4" /> {t('treabo.request.detailsNav')}</span>
              <span>{draft.saved ? 100 : step.progress}%</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-3"><MessageCircle className="h-4 w-4" /> {t('treabo.request.offersNav')}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-3"><UserRound className="h-4 w-4" /> {t('treabo.request.specialistsNav')}</span>
              <span className="text-[#7d849b]">12735</span>
            </div>
          </div>
        </aside>

        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm md:min-h-[860px]">
          <div className="min-h-[640px] px-6 py-10 md:px-12">
            {renderStep()}
          </div>
          <div className="flex items-center gap-4 border-t border-[#e3e7f1] px-6 py-6 md:px-12">
            <button onClick={back} className="flex h-12 w-16 items-center justify-center rounded-xl bg-[#eef1f7] text-[#232323]">
              <ArrowLeft className="h-5 w-5" />
            </button>
            {!draft.saved && step.key !== 'prompt' && step.key !== 'contacts' && (
              <button onClick={next} className="inline-flex h-12 items-center gap-3 rounded-xl bg-[#d9f36b] px-6 text-base font-black text-[#232323] transition hover:bg-[#c7e85a]">
                {step.action || t('treabo.request.continue')} <ArrowRight className="h-5 w-5" />
              </button>
            )}
            {draft.saved && (
              <Link href="/podrabotka" className="inline-flex h-12 items-center gap-3 rounded-xl bg-[#d9f36b] px-6 text-base font-black text-[#232323]">
                Смотреть задания <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
