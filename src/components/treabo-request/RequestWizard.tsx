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
import { TreaboLanguageSwitcher } from '@/components/proffi-mock/TreaboLanguageSwitcher';
import routes from '@/config/routes';
import { createTreaboTask, uploadTreaboFile, type TreaboUpload } from '@/data/treabo';
import { getStoredTreaboToken } from '@/data/treabo-auth';
import { getTreaboText } from '@/lib/treabo/i18n';

type Draft = Record<string, any> & {
  id?: string;
  prompt?: string;
  category?: string;
  saved?: boolean;
  photos?: TreaboUpload[];
  taskId?: string;
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

const inputClass = 'w-full rounded-2xl bg-[#eef1f7] px-4 py-4 text-base text-[#232323] outline-none placeholder:text-[#7d849b] focus:ring-2 focus:ring-[#d9f36b]';

function createDraftId() {
  return `trb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function treaboApiUrl(path: string) {
  return `/api/treabo/${path.replace(/^\//, '')}`;
}

function generateLocalAiDraft(text: string, locale?: string): AiDraft {
  const normalized = text.toLowerCase();
  const isRo = locale !== 'ru';
  const hasBath = /ванн|сануз|baie|baia|duș|dus/.test(normalized);
  const hasTile = /плит|gresie|faian/.test(normalized);
  const isUrgent = /сроч|urgent|azi|сегодня/.test(normalized);
  const city = /кишин|chisin|chișin|кишинэ/.test(normalized) ? 'Chișinău' : null;
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

function TreaboMapMock({ label }: { label: string }) {
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
      <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#232323]">{label}</div>
    </div>
  );
}

export default function RequestWizard() {
  const router = useRouter();
  const text = getTreaboText(router.locale);
  const steps = text.request.steps as Step[];
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  const step = steps[stepIndex];
  const taskName = draft.category || draft.prompt || text.request.newRequest;
  const selectedMaterials = useMemo(() => new Set<string>(draft.materials || []), [draft.materials]);

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

  async function saveTaskIfPossible(nextDraft: Draft) {
    const token = getStoredTreaboToken();
    if (!token || nextDraft.taskId) return nextDraft;

    setSavingTask(true);
    try {
      const task = await createTreaboTask(token, {
        title: nextDraft.category || nextDraft.aiDraft?.title || nextDraft.prompt || text.request.newRequest,
        description: nextDraft.details || nextDraft.aiDraft?.description || nextDraft.prompt || text.request.newRequest,
        category: nextDraft.aiDraft?.category_slug || 'other',
        city: nextDraft.city || nextDraft.aiDraft?.city || text.city,
        address: nextDraft.address || '',
        budget: nextDraft.budget ? Number(String(nextDraft.budget).replace(/\D/g, '')) : null,
        deadline: nextDraft.deadline || null,
        photos: nextDraft.photos || [],
      });
      return { ...nextDraft, taskId: task.id };
    } catch {
      return nextDraft;
    } finally {
      setSavingTask(false);
    }
  }

  async function next() {
    ensureDraftId();
    if (stepIndex >= steps.length - 1) {
      const nextDraft = await saveTaskIfPossible({ ...draft, saved: true, savedAt: new Date().toISOString() });
      setDraft(nextDraft);
      return;
    }
    setStepIndex((value) => value + 1);
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;
    const token = getStoredTreaboToken();
    if (!token) {
      setUploadError(text.request.login || 'Login required');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const currentPhotos = draft.photos || [];
      const slots = Math.max(0, 10 - currentPhotos.length);
      const selected = Array.from(files).slice(0, slots);
      const uploaded = await Promise.all(selected.map((file) => uploadTreaboFile(file, { token, folder: 'tasks' })));
      setDraft((current) => ({ ...current, photos: [...(current.photos || []), ...uploaded].slice(0, 10) }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(pathOrUrl?: string | null) {
    setDraft((current) => ({
      ...current,
      photos: (current.photos || []).filter((photo: TreaboUpload) => (photo.url || photo.path) !== pathOrUrl),
    }));
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
      setAiError(text.request.promptTooShort);
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
        headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: prompt,
          city_hint: text.city,
          category_hint: null,
          language_hint: router.locale === 'ru' ? 'ru' : 'ro',
        }),
      });
      clearTimeout(timeout);

      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'AI error');

      const generatedDraft = payload.data as AiDraft;
      setAiDraft(generatedDraft);
      setDraft((current) => ({
        ...current,
        aiDraft: generatedDraft,
        category: generatedDraft.title || current.category,
        city: generatedDraft.city || current.city,
        details: generatedDraft.description || current.details,
      }));
    } catch {
      const generatedDraft = generateLocalAiDraft(prompt, router.locale);
      setAiDraft(generatedDraft);
      setDraft((current) => ({
        ...current,
        aiDraft: generatedDraft,
        category: generatedDraft.title || current.category,
        city: generatedDraft.city || current.city,
        details: generatedDraft.description || current.details,
      }));
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
          <h1 className="mt-7 max-w-2xl text-4xl font-black leading-tight text-[#232323] md:text-5xl">{text.request.draftSavedTitle}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#232323]">{text.request.draftSavedText}</p>
          <div className="mt-8 rounded-3xl bg-[#f6f7f2] p-5">
            <div className="text-sm font-bold text-[#7d849b]">{text.request.draftNumber}</div>
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
                placeholder={text.request.firstPromptPlaceholder}
                className="min-h-[150px] w-full resize-none bg-transparent px-3 py-3 text-lg font-semibold text-[#232323] outline-none placeholder:text-[#8b92a8]"
              />
              <div className="flex justify-end">
                <button onClick={submitPrompt} disabled={aiLoading} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d9f36b] text-[#232323] disabled:cursor-wait disabled:opacity-60">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
            {aiLoading && <div className="mt-5 max-w-3xl rounded-3xl border border-[#dfe4ee] bg-white p-5 text-base font-semibold text-[#232323]">{text.request.aiLoading}</div>}
            {aiError && <div className="mt-5 max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-5 text-base font-semibold text-red-700">{aiError}</div>}
            {aiDraft && (
              <div className="mt-5 max-w-3xl rounded-3xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
                <div className="text-sm font-black uppercase tracking-wide text-[#7d849b]">{text.request.aiDraft}</div>
                <h2 className="mt-2 text-2xl font-black text-[#232323]">{aiDraft.title}</h2>
                <p className="mt-3 text-base leading-7 text-[#232323]">{aiDraft.description}</p>
                <div className="mt-4 grid gap-3 text-sm font-semibold text-[#232323] sm:grid-cols-3">
                  <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3">{text.request.category}: {aiDraft.category_slug}</span>
                  <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3">{text.request.city}: {aiDraft.city || text.request.unknownCity}</span>
                  <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3">{text.request.urgency}: {aiDraft.urgency}</span>
                </div>
                {aiDraft.missing_questions?.length > 0 && (
                  <div className="mt-5">
                    <div className="text-sm font-black text-[#232323]">{text.request.clarify}</div>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-[#232323]">
                      {aiDraft.missing_questions.map((question) => (
                        <li key={question} className="rounded-2xl bg-[#f8f9fb] px-4 py-3">{question}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button onClick={next} className="mt-5 inline-flex h-12 items-center gap-3 rounded-xl bg-[#d9f36b] px-6 text-base font-black text-[#232323] transition hover:bg-[#c7e85a]">
                  {text.request.continue} <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        );
      case 'category':
        return <ChoiceStep title={step.title} items={text.request.categories} value={draft.category} onSelect={(item) => update('category', item)} />;
      case 'area':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <p className="mt-8 text-lg text-[#232323]">{step.subtitle}</p>
            <input value={draft.area || ''} onChange={(event) => update('area', event.target.value)} placeholder="0 м²" className={`${inputClass} mt-7 max-w-[290px]`} />
          </>
        );
      case 'surface':
        return (
          <>
            <ChoiceStep title={step.title} items={text.request.surfaces} value={draft.surface} onSelect={(item) => update('surface', item)} />
            <OtherInput value={draft.surfaceOther || ''} placeholder={text.request.other} onChange={(value) => update('surfaceOther', value)} />
          </>
        );
      case 'materials':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <div className="mt-9 max-w-xl space-y-1">
              {text.request.materials.map((item) => <Option key={item} label={item} multi active={selectedMaterials.has(item)} onClick={() => toggleMaterial(item)} />)}
            </div>
            <OtherInput value={draft.materialOther || ''} placeholder={text.request.other} onChange={(value) => update('materialOther', value)} />
          </>
        );
      case 'deadline':
        return <ChoiceStep title={step.title} items={text.request.deadlines} value={draft.deadline} onSelect={(item) => update('deadline', item)} />;
      case 'address':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <input value={draft.address || ''} onChange={(event) => update('address', event.target.value)} placeholder={text.request.streetPlaceholder} className={`${inputClass} mt-8`} />
            <TreaboMapMock label={text.request.localMapHint} />
          </>
        );
      case 'budget':
        return (
          <>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <input value={draft.budget || ''} onChange={(event) => update('budget', event.target.value)} placeholder={text.request.budgetPlaceholder} className={`${inputClass} mt-12 max-w-[290px]`} />
          </>
        );
      case 'details':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <textarea value={draft.details || ''} onChange={(event) => update('details', event.target.value)} placeholder={text.request.detailsPlaceholder} className={`${inputClass} mt-10 min-h-[136px] resize-none`} />
            <label className="mt-5 flex w-full cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#d3d9e8] bg-white px-5 py-5 text-left text-[#232323]">
              <span>{uploading ? 'Загрузка...' : text.request.addFile}</span>
              <Plus className="h-5 w-5 text-[#7d849b]" />
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  uploadPhotos(event.target.files);
                  event.currentTarget.value = '';
                }}
              />
            </label>
            {uploadError && <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{uploadError}</div>}
            {draft.photos?.length ? (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {draft.photos.map((photo) => {
                  const url = photo.url || '';
                  return (
                    <div key={photo.path || photo.url} className="group relative overflow-hidden rounded-2xl bg-[#eef1f7]">
                      {url ? <img src={url} alt="" className="h-24 w-full object-cover" /> : <div className="h-24" />}
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.url || photo.path)}
                        className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black shadow group-hover:flex"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        );
      case 'choice':
        return <ChoiceStep title={step.title} items={text.request.choices} value={draft.choice} onSelect={(item) => update('choice', item)} />;
      case 'contacts':
        return (
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <div className="mt-14 flex items-center">
              {['M', 'A', 'I', 'C', 'E'].map((letter) => (
                <span key={letter} className="-ml-2 flex h-9 w-9 first:ml-0 items-center justify-center rounded-full border-2 border-white bg-[#d9f36b] text-sm font-black text-[#232323]">
                  {letter}
                </span>
              ))}
              <span className="ml-2 text-sm font-bold text-[#7d849b]">10+</span>
            </div>
            <p className="mt-16 text-sm text-[#7d849b]">{text.request.phoneHint}</p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#cfd5e6] bg-white px-4 py-4">
              <span className="text-sm">🇲🇩</span>
              <input value={draft.phone || ''} onChange={(event) => update('phone', event.target.value)} placeholder={text.request.phonePlaceholder} className="w-full bg-transparent text-base text-[#232323] outline-none" />
            </div>
            <button onClick={next} className="mt-4 w-full rounded-2xl bg-[#d9f36b] px-5 py-4 text-base font-black text-[#232323]">{text.request.continue}</button>
            <div className="my-8 flex items-center gap-4 text-sm text-[#7d849b]">
              <span className="h-px flex-1 bg-[#dfe4ee]" />
              {text.request.or}
              <span className="h-px flex-1 bg-[#dfe4ee]" />
            </div>
            <button className="w-full rounded-2xl bg-[#eef1f7] px-5 py-4 text-base font-black text-[#8b3ffc]">{text.request.yandex}</button>
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
          <span className="hidden md:inline">{text.city}</span>
          <Link href={routes.works} className="hidden md:inline">{text.request.specialistSite}</Link>
          <span className="hidden md:inline">{text.request.login}</span>
          <TreaboLanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto grid max-w-[1180px] gap-5 px-4 pb-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="md:pt-6">
          <h2 className="max-w-[240px] text-3xl font-black leading-tight">{taskName}</h2>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-[#e3e7f1] px-4 py-4 text-sm font-bold">
              <span className="flex items-center gap-3"><ListChecks className="h-4 w-4" /> {text.request.navDetails}</span>
              <span>{draft.saved ? 100 : step.progress}%</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-3"><MessageCircle className="h-4 w-4" /> {text.request.navOffers}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-3"><UserRound className="h-4 w-4" /> {text.request.navSpecialists}</span>
              <span className="text-[#7d849b]">12735</span>
            </div>
          </div>
        </aside>

        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm md:min-h-[860px]">
          <div className="min-h-[640px] px-6 py-10 md:px-12">{renderStep()}</div>
          <div className="flex items-center gap-4 border-t border-[#e3e7f1] px-6 py-6 md:px-12">
            <button onClick={back} className="flex h-12 w-16 items-center justify-center rounded-xl bg-[#eef1f7] text-[#232323]">
              <ArrowLeft className="h-5 w-5" />
            </button>
            {!draft.saved && step.key !== 'prompt' && step.key !== 'contacts' && (
              <button onClick={next} className="inline-flex h-12 items-center gap-3 rounded-xl bg-[#d9f36b] px-6 text-base font-black text-[#232323] transition hover:bg-[#c7e85a]">
                {step.action || text.request.continue} <ArrowRight className="h-5 w-5" />
              </button>
            )}
            {draft.saved && (
              <Link href={routes.works} className="inline-flex h-12 items-center gap-3 rounded-xl bg-[#d9f36b] px-6 text-base font-black text-[#232323]">
                {text.request.viewTasks} <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ChoiceStep({ title, items, value, onSelect }: { title: string; items: string[]; value?: string; onSelect: (item: string) => void }) {
  return (
    <>
      <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{title}</h1>
      <div className="mt-9 max-w-xl space-y-1">
        {items.map((item) => <Option key={item} label={item} active={value === item} onClick={() => onSelect(item)} />)}
      </div>
    </>
  );
}

function OtherInput({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="h-6 w-6 shrink-0 rounded-lg bg-[#e9edf5]" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${inputClass} max-w-[230px]`} />
    </div>
  );
}
