import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ListChecks,
  MessageCircle,
  Plus,
  Send,
  UserRound,
} from 'lucide-react';
import routes from '@/config/routes';
import TreaboPhoneInput from '@/components/treabo/TreaboPhoneInput';
import TreaboAddressPicker from '@/components/treabo/TreaboAddressPicker';
import RussiaCityInput from '@/components/treabo/RussiaCityInput';
import OtpCodeInput from '@/components/auth/otp-code-input';
import { createTreaboTask, uploadTreaboFile, type TreaboUpload } from '@/data/treabo';
import { getStoredTreaboToken, isTreaboOtpSentResponse } from '@/data/treabo-auth';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import { getTreaboText } from '@/lib/treabo/i18n';
import { normalizeTreaboPhone } from '@/lib/treabo/phone';
import {
  type AiDraft,
  type ClarifyField,
  buildClarifyFields,
  buildTaskDescription,
  categorySlugToLabel,
  generateLocalAiDraft,
  needsManualCategory,
  needsManualCity,
  needsManualUrgency,
  parseBudgetInput,
  resolveTaskCategory,
  resolveTaskTitle,
  urgencyToLabel,
  type WizardDraft,
} from '@/lib/treabo/request-wizard';

type Step = {
  key: string;
  title: string;
  subtitle?: string;
  progress: number;
  action?: string;
  optional?: boolean;
};

const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const MAX_PHOTOS = 10;
const inputClass =
  'w-full rounded-2xl bg-[#eef1f7] px-4 py-4 text-base text-[#232323] outline-none placeholder:text-[#7d849b] focus:ring-2 focus:ring-[#d9f36b]';

function createDraftId() {
  return `trb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function treaboApiUrl(path: string) {
  return `/api/treabo/${path.replace(/^\//, '')}`;
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

export default function RequestWizard() {
  const router = useRouter();
  const text = getTreaboText(router.locale);
  const steps = text.request.steps as Step[];
  const { user, isAuthenticated, login, register, sendOtp, verifyOtp } = useTreaboAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>({ city: text.city });
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [taskCreated, setTaskCreated] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  const [phone, setPhone] = useState('7');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'register'>('login');
  const [resendTimer, setResendTimer] = useState(0);
  const autoCreateAttempted = useRef(false);

  const step = steps[stepIndex];
  const clarifyFields = useMemo(() => buildClarifyFields(aiDraft), [aiDraft]);
  const taskName = draft.category || aiDraft?.title || draft.prompt || text.request.newRequest;

  useEffect(() => {
    const queryPrompt = typeof router.query.q === 'string' ? router.query.q : '';
    if (queryPrompt) {
      setDraft((current) => ({ ...current, prompt: current.prompt || queryPrompt }));
    }
  }, [router.query.q]);

  useEffect(() => {
    if (!draft.id) return;
    const { pendingPhotoFiles, ...serializable } = draft;
    localStorage.setItem(`treabo-request-${draft.id}`, JSON.stringify(serializable));
  }, [draft]);

  useEffect(() => {
    if (!otpStep || resendTimer <= 0) return undefined;
    const timer = window.setInterval(() => setResendTimer((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, [otpStep, resendTimer]);

  const update = useCallback((key: string, value: unknown) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const updateAiAnswer = useCallback((question: string, value: string) => {
    setDraft((current) => ({
      ...current,
      aiAnswers: { ...(current.aiAnswers || {}), [question]: value },
    }));
  }, []);

  function ensureDraftId() {
    if (draft.id) return draft.id;
    const id = createDraftId();
    setDraft((current) => ({ ...current, id }));
    router.replace(`/request/new?draft=${id}`, undefined, { shallow: true });
    return id;
  }

  async function uploadAllPhotos(token: string, currentDraft: WizardDraft): Promise<TreaboUpload[]> {
    const existing = currentDraft.photos || [];
    const pending = currentDraft.pendingPhotoFiles || [];
    if (!pending.length) return existing;

    const uploaded = await Promise.all(
      pending.map((file) => uploadTreaboFile(file, { token, folder: 'tasks' })),
    );
    return [...existing, ...uploaded].slice(0, MAX_PHOTOS);
  }

  async function createTaskFromDraft(currentDraft: WizardDraft, token: string) {
    const photos = await uploadAllPhotos(token, currentDraft);
    const budget = parseBudgetInput(String(currentDraft.budget || ''));

    return createTreaboTask(token, {
      title: resolveTaskTitle(currentDraft, text.request.newRequest),
      description: buildTaskDescription(currentDraft),
      category: resolveTaskCategory(currentDraft),
      city: currentDraft.city || aiDraft?.city || text.city,
      address: currentDraft.address || '',
      lat: currentDraft.lat ?? undefined,
      lng: currentDraft.lng ?? undefined,
      budget,
      deadline: currentDraft.deadline || null,
      photos,
    });
  }

  const finishWithTask = useCallback(
    async (token: string) => {
      setSavingTask(true);
      setSubmitError('');
      try {
        const task = await createTaskFromDraft(draft, token);
        setCreatedTaskId(String(task.id));
        setTaskCreated(true);
        setDraft((current) => ({ ...current, taskId: String(task.id), pendingPhotoFiles: [] }));
        router.push(routes.taskUrl(task));
      } catch (error) {
        const message = error instanceof Error ? error.message : text.request.taskCreateError;
        setSubmitError(message);
        ensureDraftId();
      } finally {
        setSavingTask(false);
      }
    },
    [draft, router, text.request.taskCreateError],
  );

  useEffect(() => {
    if (step?.key !== 'contacts' || !isAuthenticated || savingTask || taskCreated || autoCreateAttempted.current) return;
    const token = getStoredTreaboToken();
    if (token) {
      autoCreateAttempted.current = true;
      finishWithTask(token);
    }
  }, [step?.key, isAuthenticated, savingTask, taskCreated, finishWithTask]);

  async function handleAuthAndCreate() {
    setSubmitError('');
    setSavingTask(true);

    try {
      if (isAuthenticated) {
        const token = getStoredTreaboToken();
        if (!token) throw new Error(text.request.taskCreateError);
        await finishWithTask(token);
        return;
      }

      const normalizedPhone = normalizeTreaboPhone(phone);

      if (name.trim()) {
        const result = await register({
          name: name.trim(),
          phone: normalizedPhone,
          password,
          role: 'customer',
          city: draft.city || text.city,
        });
        if (isTreaboOtpSentResponse(result)) {
          setOtpStep(true);
          setOtpId(result.otp_id);
          setOtpPhone(result.phone);
          setOtpPurpose('register');
          setResendTimer(60);
          return;
        }
        await finishWithTask(result.token);
        return;
      }

      const result = await login({ phone: normalizedPhone, password });
      if (isTreaboOtpSentResponse(result)) {
        setOtpStep(true);
        setOtpId(result.otp_id);
        setOtpPhone(result.phone);
        setOtpPurpose('login');
        setResendTimer(60);
        return;
      }
      await finishWithTask(result.token);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : text.request.taskCreateError);
    } finally {
      setSavingTask(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    if (!otpId) return;
    setSubmitError('');
    setSavingTask(true);
    try {
      const data = await verifyOtp({ phone: otpPhone, otp_id: otpId, code });
      await finishWithTask(data.token);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Неверный код');
    } finally {
      setSavingTask(false);
    }
  }

  async function handleResendOtp() {
    if (resendTimer > 0 || savingTask) return;
    setSubmitError('');
    setSavingTask(true);
    try {
      const payload =
        otpPurpose === 'register'
          ? await sendOtp({
              phone: otpPhone,
              purpose: 'register',
              password,
              name: name.trim(),
              role: 'customer',
              city: draft.city || text.city,
            })
          : await sendOtp({ phone: otpPhone, purpose: 'login', password });
      setOtpId(payload.otp_id);
      setOtpCode('');
      setResendTimer(60);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'SMS не отправлено');
    } finally {
      setSavingTask(false);
    }
  }

  function next() {
    ensureDraftId();
    if (stepIndex >= steps.length - 1) return;
    setStepIndex((value) => value + 1);
  }

  function addPhotoFiles(files: FileList | null) {
    if (!files?.length) return;
    const currentCount = (draft.photos?.length || 0) + (draft.pendingPhotoFiles?.length || 0);
    const selected = Array.from(files).slice(0, Math.max(0, MAX_PHOTOS - currentCount));
    const tooLarge = selected.find((file) => file.size > MAX_PHOTO_BYTES);
    if (tooLarge) {
      setUploadError(text.request.fileTooLarge);
      return;
    }
    setUploadError('');
    setDraft((current) => ({
      ...current,
      pendingPhotoFiles: [...(current.pendingPhotoFiles || []), ...selected].slice(0, MAX_PHOTOS),
    }));
  }

  async function uploadPhotosWithAuth(files: FileList | null) {
    if (!files?.length) return;
    const token = getStoredTreaboToken();
    if (!token) {
      addPhotoFiles(files);
      return;
    }

    const selected = Array.from(files);
    const tooLarge = selected.find((file) => file.size > MAX_PHOTO_BYTES);
    if (tooLarge) {
      setUploadError(text.request.fileTooLarge);
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const currentPhotos = draft.photos || [];
      const slots = Math.max(0, MAX_PHOTOS - currentPhotos.length - (draft.pendingPhotoFiles?.length || 0));
      const toUpload = selected.slice(0, slots);
      const uploaded = await Promise.all(toUpload.map((file) => uploadTreaboFile(file, { token, folder: 'tasks' })));
      setDraft((current) => ({ ...current, photos: [...(current.photos || []), ...uploaded].slice(0, MAX_PHOTOS) }));
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

  function removePendingPhoto(index: number) {
    setDraft((current) => ({
      ...current,
      pendingPhotoFiles: (current.pendingPhotoFiles || []).filter((_, i) => i !== index),
    }));
  }

  function back() {
    if (otpStep) {
      setOtpStep(false);
      setOtpCode('');
      return;
    }
    setStepIndex((value) => Math.max(0, value - 1));
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
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(treaboApiUrl('/ai/job-draft'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: prompt,
          city_hint: draft.city || text.city,
          category_hint: null,
          language_hint: 'ru',
        }),
      });
      clearTimeout(timeout);

      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'AI error');

      const generatedDraft = payload.data as AiDraft;
      applyAiDraft(generatedDraft);
    } catch {
      applyAiDraft(generateLocalAiDraft(prompt, draft.city || text.city));
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiDraft(generatedDraft: AiDraft) {
    setAiDraft(generatedDraft);
    setDraft((current) => ({
      ...current,
      aiDraft: generatedDraft,
      category: categorySlugToLabel(generatedDraft.category_slug) || current.category,
      city: generatedDraft.city || current.city || text.city,
      deadline:
        generatedDraft.urgency && generatedDraft.urgency !== 'unknown'
          ? urgencyToLabel(generatedDraft.urgency)
          : current.deadline,
      aiAnswers: current.aiAnswers || {},
    }));
  }

  function renderClarifyField(field: ClarifyField) {
    const value = draft.aiAnswers?.[field.question] || '';

    if (field.type === 'yesno') {
      return (
        <div className="flex gap-2">
          {[text.request.yes, text.request.no].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => updateAiAnswer(field.question, label)}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${value === label ? 'bg-[#232323] text-white' : 'bg-[#eef1f7] text-[#232323]'}`}
            >
              {label}
            </button>
          ))}
        </div>
      );
    }

    if (field.type === 'area') {
      return (
        <input
          value={value}
          onChange={(event) => updateAiAnswer(field.question, event.target.value)}
          placeholder="Например: 12 м²"
          className={inputClass}
        />
      );
    }

    if (field.type === 'datetime') {
      return (
        <input
          type="datetime-local"
          value={value}
          onChange={(event) => updateAiAnswer(field.question, event.target.value)}
          className={inputClass}
        />
      );
    }

    if (field.type === 'photos') {
      const photoAnswer = value || '';
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[text.request.yes, text.request.no].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => updateAiAnswer(field.question, label)}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${photoAnswer === label ? 'bg-[#232323] text-white' : 'bg-[#eef1f7] text-[#232323]'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {photoAnswer === text.request.yes ? (
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#d3d9e8] bg-white px-5 py-4 text-sm">
              <span>Добавить фото</span>
              <Plus className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  uploadPhotosWithAuth(event.target.files);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          ) : null}
        </div>
      );
    }

    return (
      <input
        value={value}
        onChange={(event) => updateAiAnswer(field.question, event.target.value)}
        className={inputClass}
      />
    );
  }

  function renderAiClarifications() {
    if (!aiDraft) return null;

    const showCategory = needsManualCategory(aiDraft);
    const showCity = needsManualCity(aiDraft, draft.city);
    const showUrgency = needsManualUrgency(aiDraft, draft.deadline);

    return (
      <div className="mt-6 space-y-5 border-t border-[#eef1f7] pt-5">
        <div className="text-sm font-black uppercase tracking-wide text-[#7d849b]">{text.request.clarifyFieldsTitle}</div>

        {showCategory ? (
          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#232323]">{text.request.category}</span>
            <select
              value={draft.category || categorySlugToLabel(aiDraft.category_slug)}
              onChange={(event) => update('category', event.target.value)}
              className={inputClass}
            >
              {text.request.categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {showCity ? (
          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#232323]">{text.request.city}</span>
            <div className={inputClass}>
              <RussiaCityInput
                value={draft.city || text.city}
                onChange={(city) => update('city', city)}
                inputClassName="w-full bg-transparent text-base outline-none"
              />
            </div>
          </label>
        ) : null}

        {showUrgency ? (
          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#232323]">{text.request.urgency}</span>
            <select
              value={draft.deadline || ''}
              onChange={(event) => update('deadline', event.target.value)}
              className={inputClass}
            >
              <option value="">Выберите срок</option>
              {text.request.deadlines.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {clarifyFields.map((field) => (
          <label key={field.key} className="block space-y-2">
            <span className="text-sm font-bold text-[#232323]">{field.question}</span>
            {renderClarifyField(field)}
          </label>
        ))}
      </div>
    );
  }

  function renderStep() {
    if (taskCreated && createdTaskId) {
      return (
        <div className="flex min-h-[520px] flex-col justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#d9f36b]">
            <CheckCircle2 className="h-9 w-9 text-[#232323]" />
          </div>
          <h1 className="mt-7 max-w-2xl text-4xl font-black leading-tight text-[#232323] md:text-5xl">
            {text.request.taskCreatedTitle}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#232323]">{text.request.taskCreatedText}</p>
          <Link
            href={routes.taskUrl(createdTaskId)}
            className="mt-8 inline-flex h-12 items-center gap-3 rounded-xl bg-[#d9f36b] px-6 text-base font-black text-[#232323]"
          >
            {text.request.viewTasks} <ArrowRight className="h-5 w-5" />
          </Link>
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
                <button
                  onClick={submitPrompt}
                  disabled={aiLoading}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d9f36b] text-[#232323] disabled:cursor-wait disabled:opacity-60"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
            {aiLoading ? (
              <div className="mt-5 max-w-3xl rounded-3xl border border-[#dfe4ee] bg-white p-5 text-base font-semibold text-[#232323]">
                {text.request.aiLoading}
              </div>
            ) : null}
            {aiError ? (
              <div className="mt-5 max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-5 text-base font-semibold text-red-700">
                {aiError}
              </div>
            ) : null}
            {aiDraft ? (
              <div className="mt-5 max-w-3xl rounded-3xl border border-[#dfe4ee] bg-white p-5 shadow-sm">
                <div className="text-sm font-black uppercase tracking-wide text-[#7d849b]">{text.request.aiDraft}</div>
                <h2 className="mt-2 text-2xl font-black text-[#232323]">{aiDraft.title}</h2>
                <p className="mt-3 text-base leading-7 text-[#232323]">{aiDraft.description}</p>
                <div className="mt-4 grid gap-3 text-sm font-semibold text-[#232323] sm:grid-cols-3">
                  <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3">
                    {text.request.category}: {categorySlugToLabel(aiDraft.category_slug)}
                  </span>
                  <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3">
                    {text.request.city}: {aiDraft.city || draft.city || text.request.unknownCity}
                  </span>
                  <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3">
                    {text.request.urgency}: {urgencyToLabel(aiDraft.urgency)}
                  </span>
                </div>
                {renderAiClarifications()}
                <button
                  onClick={next}
                  className="mt-5 inline-flex h-12 items-center gap-3 rounded-xl bg-[#d9f36b] px-6 text-base font-black text-[#232323] transition hover:bg-[#c7e85a]"
                >
                  {text.request.continue} <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            ) : null}
          </>
        );
      case 'category':
        return (
          <ChoiceStep
            title={step.title}
            items={text.request.categories}
            value={draft.category || (aiDraft ? categorySlugToLabel(aiDraft.category_slug) : undefined)}
            onSelect={(item) => update('category', item)}
          />
        );
      case 'deadline':
        return (
          <ChoiceStep
            title={step.title}
            items={text.request.deadlines}
            value={draft.deadline}
            onSelect={(item) => update('deadline', item)}
          />
        );
      case 'address':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <TreaboAddressPicker
              city={draft.city || text.city}
              address={draft.address || ''}
              lat={draft.lat}
              lng={draft.lng}
              onCityChange={(city) => update('city', city)}
              onAddressChange={(address) => update('address', address)}
              onCoordinatesChange={(lat, lng) => setDraft((current) => ({ ...current, lat, lng }))}
              addressPlaceholder={text.request.streetPlaceholder}
            />
          </>
        );
      case 'budget':
        return (
          <>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            {step.subtitle ? <p className="mt-4 text-lg text-[#232323]">{step.subtitle}</p> : null}
            <input
              value={draft.budget || ''}
              onChange={(event) => update('budget', event.target.value)}
              placeholder={text.request.budgetPlaceholder}
              className={`${inputClass} mt-8 max-w-[290px]`}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {text.request.budgetPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => update('budget', preset.replace(/[^\d–\-]/g, '').split('–')[0] || preset)}
                  className="rounded-xl bg-[#eef1f7] px-4 py-2 text-sm font-bold text-[#232323] hover:bg-[#e3e7f1]"
                >
                  {preset}
                </button>
              ))}
            </div>
          </>
        );
      case 'details':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <textarea
              value={draft.details || ''}
              onChange={(event) => update('details', event.target.value)}
              placeholder={text.request.detailsPlaceholder}
              className={`${inputClass} mt-10 min-h-[136px] resize-none`}
            />
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
                  uploadPhotosWithAuth(event.target.files);
                  event.currentTarget.value = '';
                }}
              />
            </label>
            {uploadError ? (
              <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{uploadError}</div>
            ) : null}
            {draft.photos?.length || draft.pendingPhotoFiles?.length ? (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {(draft.photos || []).map((photo) => {
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
                {(draft.pendingPhotoFiles || []).map((file, index) => (
                  <div key={`${file.name}-${index}`} className="group relative overflow-hidden rounded-2xl bg-[#eef1f7]">
                    <div className="flex h-24 items-center justify-center px-2 text-center text-xs font-semibold text-[#7d849b]">
                      {file.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePendingPhoto(index)}
                      className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black shadow group-hover:flex"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        );
      case 'contacts':
        if (isAuthenticated) {
          return (
            <div className="mx-auto max-w-3xl">
              <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
              <p className="mt-6 text-base text-[#232323]">{text.request.alreadyLoggedIn}</p>
              {user?.name ? <p className="mt-2 text-sm text-[#7d849b]">{user.name}</p> : null}
              {submitError ? (
                <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{submitError}</div>
              ) : null}
              <button
                onClick={handleAuthAndCreate}
                disabled={savingTask}
                className="mt-8 w-full rounded-2xl bg-[#d9f36b] px-5 py-4 text-base font-black text-[#232323] disabled:opacity-60"
              >
                {savingTask ? text.request.creatingTask : text.request.authCreateTask}
              </button>
            </div>
          );
        }

        if (otpStep) {
          return (
            <div className="mx-auto max-w-3xl">
              <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{text.request.otpTitle}</h1>
              <p className="mt-4 text-sm leading-6 text-[#7d849b]">
                {text.request.otpHint}{' '}
                <span className="font-bold text-[#232323]">{otpPhone}</span>
              </p>
              <div className="mt-8">
                <OtpCodeInput
                  value={otpCode}
                  onChange={setOtpCode}
                  onComplete={handleVerifyOtp}
                  disabled={savingTask}
                  error={submitError || undefined}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setOtpStep(false)} className="text-sm font-bold text-[#7d849b]">
                  Назад
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || savingTask}
                  className="text-sm font-bold text-[#232323] disabled:text-[#b8bcc8]"
                >
                  {resendTimer > 0 ? `${text.request.otpResend} (${resendTimer}с)` : text.request.otpResend}
                </button>
              </div>
              <button
                onClick={() => handleVerifyOtp(otpCode)}
                disabled={savingTask || otpCode.length < 6}
                className="mt-6 w-full rounded-2xl bg-[#d9f36b] px-5 py-4 text-base font-black text-[#232323] disabled:opacity-60"
              >
                {savingTask ? text.request.creatingTask : text.request.otpVerify}
              </button>
            </div>
          );
        }

        return (
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <p className="mt-6 text-sm text-[#7d849b]">{text.request.phoneHint}</p>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-bold text-[#232323]">Телефон</span>
              <TreaboPhoneInput value={phone} onChange={setPhone} />
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-bold text-[#232323]">{text.request.nameLabel}</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Если вы новый пользователь"
                className={inputClass}
              />
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-bold text-[#232323]">{text.request.passwordLabel}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                required
                minLength={4}
              />
            </label>

            {submitError ? (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{submitError}</div>
            ) : null}

            <button
              onClick={handleAuthAndCreate}
              disabled={savingTask || password.length < 4}
              className="mt-6 w-full rounded-2xl bg-[#d9f36b] px-5 py-4 text-base font-black text-[#232323] disabled:opacity-60"
            >
              {savingTask ? text.request.creatingTask : text.request.authCreateTask}
            </button>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f5fa] text-[#232323]">
      <header className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4">
        <Link href="/" className="text-3xl font-black tracking-tight text-[#232323]">
          Treabo
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium md:gap-8">
          <span className="hidden md:inline">{draft.city || text.city}</span>
          <Link href={routes.works} className="hidden md:inline">
            {text.request.specialistSite}
          </Link>
          <span className="hidden md:inline">{isAuthenticated ? user?.name || text.request.login : text.request.login}</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1180px] gap-5 px-4 pb-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="md:pt-6">
          <h2 className="max-w-[240px] text-3xl font-black leading-tight">{taskName}</h2>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-[#e3e7f1] px-4 py-4 text-sm font-bold">
              <span className="flex items-center gap-3">
                <ListChecks className="h-4 w-4" /> {text.request.navDetails}
              </span>
              <span>{taskCreated ? 100 : step.progress}%</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4" /> {text.request.navOffers}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-3">
                <UserRound className="h-4 w-4" /> {text.request.navSpecialists}
              </span>
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
            {!taskCreated && step.key !== 'prompt' && step.key !== 'contacts' && (
              <button
                onClick={next}
                className="inline-flex h-12 items-center gap-3 rounded-xl bg-[#d9f36b] px-6 text-base font-black text-[#232323] transition hover:bg-[#c7e85a]"
              >
                {step.action || text.request.continue} <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ChoiceStep({
  title,
  items,
  value,
  onSelect,
}: {
  title: string;
  items: string[];
  value?: string;
  onSelect: (item: string) => void;
}) {
  return (
    <>
      <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{title}</h1>
      <div className="mt-9 max-w-xl space-y-1">
        {items.map((item) => (
          <Option key={item} label={item} active={value === item} onClick={() => onSelect(item)} />
        ))}
      </div>
    </>
  );
}
