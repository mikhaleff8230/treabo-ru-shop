import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ListChecks,
  MapPin,
  Plus,
} from 'lucide-react';
import routes from '@/config/routes';
import TreaboPhoneInput from '@/components/treabo/TreaboPhoneInput';
import TreaboAddressPicker from '@/components/treabo/TreaboAddressPicker';
import RussiaCityInput from '@/components/treabo/RussiaCityInput';
import OtpCodeInput from '@/components/auth/otp-code-input';
import {
  createTreaboTask,
  fetchTreaboCategories,
  fetchTreaboWorkQuestions,
  fetchTreaboWorks,
  getTreaboPublicApiBase,
  uploadTreaboFile,
  type TreaboCategory,
  type TreaboWork,
  type TreaboWorkQuestion,
  type TreaboUpload,
} from '@/data/treabo';
import { getStoredTreaboToken, isTreaboOtpSentResponse } from '@/data/treabo-auth';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import { getTreaboText } from '@/lib/treabo/i18n';
import { normalizeTreaboPhone } from '@/lib/treabo/phone';
import {
  type AiDraft,
  type ClarifyField,
  buildClarifyFields,
  buildTaskAiDetails,
  buildTaskDescription,
  categorySlugToLabel,
  mapApiTypeToClarifyType,
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
  'w-full rounded-2xl border-0 bg-[#eef1f7] px-4 py-4 text-base text-[#232323] outline-none placeholder:text-[#7d849b] focus:ring-2 focus:ring-[#d9f36b]';

const ipCityAliases: Record<string, string> = {
  Moscow: 'Москва',
  'Saint Petersburg': 'Санкт-Петербург',
  Novosibirsk: 'Новосибирск',
  Yekaterinburg: 'Екатеринбург',
  Kazan: 'Казань',
  Nizhny: 'Нижний Новгород',
};

type CategoryOption = {
  id: string | null;
  slug?: string | null;
  label: string;
};

function promptTitleFallback(prompt?: string, fallback = '') {
  const cleaned = String(prompt || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  const firstSentence = cleaned.split(/[.!?\n]/).find(Boolean)?.trim() || cleaned;
  return firstSentence.slice(0, 96);
}

function isGenericAiTitle(value?: string | null) {
  const normalized = String(value || '').toLowerCase();
  return !normalized || normalized.includes('заявка для специалиста') || normalized.includes('request for specialist');
}

function createDraftId() {
  return `trb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function treaboApiUrl(path: string) {
  return `${getTreaboPublicApiBase()}/${path.replace(/^\//, '')}`;
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

function PendingPhotoPreview({
  file,
  children,
}: {
  file: File;
  children: React.ReactNode;
}) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#eef1f7]">
      {previewUrl ? (
        <img src={previewUrl} alt={file.name} className="h-24 w-full object-cover" />
      ) : (
        <div className="flex h-24 items-center justify-center px-2 text-center text-xs font-semibold text-[#7d849b]">
          {file.name}
        </div>
      )}
      {children}
    </div>
  );
}

export default function RequestWizard() {
  const router = useRouter();
  const text = getTreaboText(router.locale);
  const steps = text.request.steps as Step[];
  const { user, isAuthenticated, isSpecialist, loading: authLoading, login, register, sendOtp, verifyOtp } = useTreaboAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>({ city: text.city });
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);
  const [categories, setCategories] = useState<TreaboCategory[]>([]);
  const [works, setWorks] = useState<TreaboWork[]>([]);
  const [workQuestions, setWorkQuestions] = useState<TreaboWorkQuestion[]>([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [aiFollowUp, setAiFollowUp] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [taskCreated, setTaskCreated] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [createdTaskUrl, setCreatedTaskUrl] = useState<string | null>(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);

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

  useEffect(() => {
    if (!authLoading && isSpecialist) {
      void router.replace('/works');
    }
  }, [authLoading, isSpecialist, router]);

  const clarifyFields = useMemo(() => buildClarifyFields(aiDraft), [aiDraft]);
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const apiOptions = categories
      .map((category) => ({
        id: String(category.id),
        slug: category.slug,
        label: category.name_ru || category.slug || String(category.id),
      }))
      .filter((category) => category.label);

    if (apiOptions.length) return apiOptions;

    return text.request.categories.map((label) => ({
      id: null,
      label,
    }));
  }, [categories, text.request.categories]);

  const workQuestionFields = useMemo<ClarifyField[]>(
    () =>
      workQuestions.map((question) => ({
        key: question.field_key?.trim() || `work_q_${question.id}`,
        question: question.question,
        type: mapApiTypeToClarifyType(question.type),
        options: question.options?.length ? question.options : undefined,
        placeholder: question.placeholder || undefined,
        helpText: question.help_text || undefined,
        isRequired: question.is_required,
        questionId: Number(question.id) || null,
      })),
    [workQuestions],
  );

  const normalizedSteps = useMemo(
    () =>
      steps.map((item) =>
        item.key === 'contacts'
          ? {
              ...item,
              title: 'До создания заявки осталось чуть-чуть',
            }
          : item,
      ),
    [steps],
  );

  const visibleSteps = useMemo(() => {
    const result: Step[] = [];
    const aiResolvedCategory = Boolean(aiDraft?.category_id && Number(aiDraft.confidence || 0) >= 0.65);
    const aiResolvedWork = Boolean(aiDraft?.work_id && Number(aiDraft.confidence || 0) >= 0.65);
    const questionsStep: Step | null = draft.work_id || workQuestions.length
      ? { key: 'work_questions', title: 'Уточните детали работы', progress: 90 }
      : null;

    normalizedSteps.forEach((item) => {
      if (item.key === 'work' || item.key === 'work_questions') return;
      if (item.key === 'category' && aiResolvedCategory) {
        if (works.length && !aiResolvedWork) {
          result.push({
            key: 'work',
            title: 'Какая именно работа нужна?',
            progress: 35,
          });
        }
        if (questionsStep) result.push(questionsStep);
        return;
      }

      result.push(item);

      if (item.key === 'category' && works.length && !aiResolvedWork) {
        result.push({
          key: 'work',
          title: 'Какая именно работа нужна?',
          progress: 35,
        });
      }
      if (item.key === 'category' && questionsStep) result.push(questionsStep);
    });

    return result;
  }, [
    aiDraft?.category_id,
    aiDraft?.confidence,
    aiDraft?.work_id,
    draft.work_id,
    normalizedSteps,
    workQuestions.length,
    works.length,
  ]);

  const step = visibleSteps[Math.min(stepIndex, Math.max(visibleSteps.length - 1, 0))] || normalizedSteps[0];
  const taskName =
    !isGenericAiTitle(aiDraft?.title)
      ? aiDraft?.title
      : draft.title || promptTitleFallback(draft.prompt, draft.category || text.request.newRequest);
  const aiUserTurns = aiMessages.filter((message) => message.role === 'user').length;
  const aiDraftReady = Boolean(
    aiDraft &&
      !aiDraft.needs_clarification &&
      draft.category_id &&
      draft.work_id &&
      Number(aiDraft.confidence || 0) >= 0.65,
  );

  const selectCategory = useCallback((option: CategoryOption) => {
    setDraft((current) => ({
      ...current,
      category: option.label,
      category_id: option.id,
      category_slug: option.slug || current.category_slug,
      work_id: null,
      work_title: null,
      workQuestions: [],
    }));
  }, []);

  const selectWork = useCallback((work: TreaboWork) => {
    setDraft((current) => ({
      ...current,
      work_id: work.id,
      work_title: work.title,
      workQuestions: [],
    }));
  }, []);

  const selectedCategoryLabel = useMemo(() => {
    if (draft.category) return draft.category;
    const byId = draft.category_id
      ? categoryOptions.find((category) => String(category.id) === String(draft.category_id))
      : null;
    if (byId) return byId.label;
    const bySlug = aiDraft?.category_slug
      ? categoryOptions.find((category) => category.slug === aiDraft.category_slug)
      : null;
    return bySlug?.label || (aiDraft ? categorySlugToLabel(aiDraft.category_slug || '') : '');
  }, [aiDraft, categoryOptions, draft.category, draft.category_id]);

  useEffect(() => {
    let cancelled = false;
    fetchTreaboCategories()
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draft.category_id) {
      setWorks([]);
      return;
    }

    let cancelled = false;
    setWorksLoading(true);
    fetchTreaboWorks({ category_id: draft.category_id })
      .then((items) => {
        if (!cancelled) {
          const activeWorks = items.filter((item) => item.is_active !== false);
          setWorks(activeWorks);
          if (draft.work_id) {
            const selectedWork = activeWorks.find((item) => String(item.id) === String(draft.work_id));
            if (selectedWork) {
              setDraft((current) => ({ ...current, work_title: selectedWork.title }));
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) setWorks([]);
      })
      .finally(() => {
        if (!cancelled) setWorksLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [draft.category_id, draft.work_id]);

  useEffect(() => {
    const filters = draft.work_id
      ? { work_id: draft.work_id }
      : draft.category_id && !works.length
        ? { category_id: draft.category_id }
        : null;

    if (!filters) {
      setWorkQuestions([]);
      setDraft((current) => ({ ...current, workQuestions: [] }));
      return;
    }

    let cancelled = false;
    setQuestionsLoading(true);
    fetchTreaboWorkQuestions(filters)
      .then((items) => {
        const activeItems = items.filter((item) => item.is_active !== false && item.question);
        if (!cancelled) {
          setWorkQuestions(activeItems);
          setDraft((current) => ({ ...current, workQuestions: activeItems }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorkQuestions([]);
          setDraft((current) => ({ ...current, workQuestions: [] }));
        }
      })
      .finally(() => {
        if (!cancelled) setQuestionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [draft.category_id, draft.work_id, works.length]);

  useEffect(() => {
    if (stepIndex <= visibleSteps.length - 1) return;
    setStepIndex(Math.max(visibleSteps.length - 1, 0));
  }, [stepIndex, visibleSteps.length]);

  useEffect(() => {
    const queryPrompt = typeof router.query.q === 'string' ? router.query.q : '';
    if (queryPrompt) {
      setDraft((current) => ({ ...current, prompt: current.prompt || queryPrompt }));
    }
  }, [router.query.q]);

  useEffect(() => {
    let cancelled = false;

    fetch('https://ipapi.co/json/', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.country_code && payload.country_code !== 'RU') return;
        const rawCity = typeof payload?.city === 'string' ? payload.city.trim() : '';
        const detectedCity = ipCityAliases[rawCity] || rawCity;
        if (!cancelled && detectedCity) {
          setDraft((current) =>
            current.city && current.city !== text.city ? current : { ...current, city: detectedCity },
          );
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [text.city]);

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

  const updateAiAnswer = useCallback((key: string, value: string) => {
    setDraft((current) => ({
      ...current,
      aiAnswers: { ...(current.aiAnswers || {}), [key]: value },
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
    if (isSpecialist) {
      throw new Error('Мастер не может создавать заявки. Для этого нужен аккаунт клиента.');
    }

    const photos = await uploadAllPhotos(token, currentDraft);
    const budgetType = currentDraft.budget_type === 'range' ? 'range' : 'fixed';
    const budget = budgetType === 'fixed' ? parseBudgetInput(String(currentDraft.budget || '')) : null;
    const budgetMin = budgetType === 'range' ? parseBudgetInput(String(currentDraft.budget_min || '')) : null;
    const budgetMax = budgetType === 'range' ? parseBudgetInput(String(currentDraft.budget_max || '')) : null;

    return createTreaboTask(token, {
      title: resolveTaskTitle(currentDraft, text.request.newRequest),
      description: buildTaskDescription(currentDraft),
      category: resolveTaskCategory(currentDraft),
      category_id: currentDraft.category_id || aiDraft?.category_id || null,
      work_id: currentDraft.work_id || aiDraft?.work_id || null,
      ai_details: buildTaskAiDetails(currentDraft),
      city: currentDraft.city || aiDraft?.city || text.city,
      address: currentDraft.address || '',
      lat: currentDraft.lat ?? undefined,
      lng: currentDraft.lng ?? undefined,
      budget,
      budget_type: budgetType,
      budget_min: budgetMin,
      budget_max: budgetMax,
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
        setCreatedTaskUrl(routes.taskUrl(task));
        setTaskCreated(true);
        setDraft((current) => ({ ...current, taskId: String(task.id), pendingPhotoFiles: [] }));
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
              channel: 'telegram',
            })
          : await sendOtp({ phone: otpPhone, purpose: 'login', password, role: 'customer', channel: 'telegram' });
      setOtpId(payload.otp_id);
      setOtpCode('');
      setResendTimer(60);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось отправить код в Telegram');
    } finally {
      setSavingTask(false);
    }
  }

  function next() {
    ensureDraftId();
    if (step?.key === 'address' && !addressConfirmed) {
      setSubmitError('Подтвердите адрес перед продолжением');
      return;
    }
    if (step?.key === 'work_questions') {
      const missingRequired = workQuestionFields.some((field) => {
        if (!field.isRequired) return false;
        return !String(draft.aiAnswers?.[field.key] || '').trim();
      });
      if (missingRequired) {
        setSubmitError('Ответьте на обязательные вопросы');
        return;
      }
    }
    if (stepIndex >= visibleSteps.length - 1) return;
    setSubmitError('');
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

  async function runAiAssistant(prompt: string, userMessage: string, initial: boolean) {
    setAiLoading(true);
    setAiError('');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      const response = await fetch(treaboApiUrl('/ai/job-draft'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: prompt,
          city_hint: draft.city || text.city,
          category_hint: draft.category_id || null,
          language_hint: 'ru',
        }),
      });
      clearTimeout(timeout);

      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || 'AI error');

      const generatedDraft = payload.data as AiDraft;
      applyAiDraft(generatedDraft);
      setAiMessages((current) => [
        ...(initial ? [] : current),
        { role: 'user', text: userMessage },
        ...(generatedDraft.assistant_message
          ? [{ role: 'assistant' as const, text: generatedDraft.assistant_message }]
          : []),
      ]);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI-помощник временно недоступен');
    } finally {
      setAiLoading(false);
    }
  }

  async function submitPrompt() {
    const prompt = String(draft.prompt || '').trim();
    if (prompt.length < 5) {
      setAiError(text.request.promptTooShort);
      return;
    }

    ensureDraftId();
    await runAiAssistant(prompt, prompt, true);
  }

  async function submitAiFollowUp() {
    const answer = aiFollowUp.trim();
    if (!answer || aiLoading || aiUserTurns >= 6) return;
    const transcript = [...aiMessages, { role: 'user' as const, text: answer }]
      .map((message) => `${message.role === 'user' ? 'Клиент' : 'Помощник'}: ${message.text}`)
      .join('\n');
    const originalRequest = (draft.prompt || '').slice(0, 1500);
    const recentTranscript = transcript.slice(-1400);
    setAiFollowUp('');
    await runAiAssistant(`${originalRequest}\n\nДиалог уточнения:\n${recentTranscript}`, answer, false);
  }

  function applyAiDraft(generatedDraft: AiDraft) {
    setAiDraft(generatedDraft);
    const apiCategory =
      generatedDraft.category_id != null
        ? categoryOptions.find((category) => String(category.id) === String(generatedDraft.category_id))
        : categoryOptions.find((category) => category.slug === generatedDraft.category_slug);

    setDraft((current) => ({
      ...current,
      aiDraft: generatedDraft,
      title: isGenericAiTitle(generatedDraft.title)
        ? promptTitleFallback(current.prompt, current.title || text.request.newRequest)
        : generatedDraft.title,
      category: apiCategory?.label || categorySlugToLabel(generatedDraft.category_slug || '') || current.category,
      category_id: apiCategory?.id || generatedDraft.category_id || current.category_id || null,
      category_slug: apiCategory?.slug || generatedDraft.category_slug || current.category_slug || null,
      work_id: generatedDraft.work_id || current.work_id || null,
      work_title: null,
      city: generatedDraft.city || current.city || text.city,
      deadline:
        generatedDraft.urgency && generatedDraft.urgency !== 'unknown'
          ? urgencyToLabel(generatedDraft.urgency)
          : current.deadline,
      aiAnswers: current.aiAnswers || {},
    }));
  }

  function renderClarifyField(field: ClarifyField) {
    const value = draft.aiAnswers?.[field.key] || '';

    if (field.type === 'yesno') {
      return (
        <div className="flex gap-2">
          {[text.request.yes, text.request.no].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => updateAiAnswer(field.key, label)}
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
          onChange={(event) => updateAiAnswer(field.key, event.target.value)}
          placeholder={field.placeholder || 'Например: 12 м²'}
          className={inputClass}
        />
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(event) => updateAiAnswer(field.key, event.target.value)}
          placeholder={field.placeholder}
          className={`${inputClass} min-h-[96px]`}
        />
      );
    }

    if (field.type === 'select' && field.options?.length) {
      return (
        <select
          value={value}
          onChange={(event) => updateAiAnswer(field.key, event.target.value)}
          className={inputClass}
        >
          <option value="">Выберите вариант</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'multiselect' && field.options?.length) {
      const selected = value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
      return (
        <div className="space-y-2">
          {field.options.map((option) => {
            const checked = selected.includes(option);
            return (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((item) => item !== option)
                      : [...selected, option];
                    updateAiAnswer(field.key, next.join(', '));
                  }}
                />
                {option}
              </label>
            );
          })}
        </div>
      );
    }

    if (field.type === 'datetime') {
      return (
        <input
          type="datetime-local"
          value={value}
          onChange={(event) => updateAiAnswer(field.key, event.target.value)}
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
                onClick={() => updateAiAnswer(field.key, label)}
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
        onChange={(event) => updateAiAnswer(field.key, event.target.value)}
        placeholder={field.placeholder}
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
              value={selectedCategoryLabel}
              onChange={(event) => {
                const option = categoryOptions.find((category) => category.label === event.target.value);
                if (option) selectCategory(option);
                else update('category', event.target.value);
              }}
              className={inputClass}
            >
              {categoryOptions.map((item) => (
                <option key={item.id || item.label} value={item.label}>
                  {item.label}
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
            <span className="text-sm font-bold text-[#232323]">
              {field.question}
              {field.isRequired ? ' *' : ''}
            </span>
            {field.helpText ? (
              <span className="block text-xs text-[#7d849b]">{field.helpText}</span>
            ) : null}
            {renderClarifyField(field)}
          </label>
        ))}
      </div>
    );
  }

  function renderStep() {
    if (taskCreated && createdTaskUrl) {
      return (
        <div className="flex min-h-[520px] flex-col justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#d9f36b]">
            <CheckCircle2 className="h-9 w-9 text-[#232323]" />
          </div>
          <p className="mt-7 text-sm font-bold uppercase tracking-wide text-[#7d849b]">
            {text.request.taskCreatedSubtitle}
          </p>
          <h1 className="mt-2 max-w-2xl text-4xl font-black leading-tight text-[#232323] md:text-5xl">
            {text.request.taskCreatedTitle}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#232323]">{text.request.taskCreatedText}</p>
          <Link
            href={createdTaskUrl}
            className="mt-8 inline-flex h-12 items-center gap-3 rounded-xl bg-[#d9f36b] px-6 text-base font-black text-[#232323]"
          >
            {text.request.viewTask} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      );
    }

    switch (step.key) {
      case 'prompt':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            <div className="mt-9 max-w-3xl rounded-[28px] border border-[#dfe4ee] bg-[#f8f9fb] p-3 shadow-sm">
              <textarea
                value={draft.prompt || ''}
                onChange={(event) => update('prompt', event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    submitPrompt();
                  }
                }}
                placeholder={text.request.firstPromptPlaceholder}
                className="block min-h-[150px] w-full resize-none appearance-none border-0 bg-transparent px-3 py-3 text-lg font-semibold text-[#232323] outline-none placeholder:text-[#8b92a8] focus:border-0 focus:outline-none focus:ring-0"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={submitPrompt}
                  disabled={aiLoading}
                  className="flex h-12 items-center justify-center rounded-2xl bg-[#d9f36b] px-5 text-sm font-black text-[#232323] disabled:cursor-wait disabled:opacity-60"
                >
                  Проверить
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
                <div className="text-sm font-black uppercase tracking-wide text-[#7d849b]">Детали заявки</div>
                <h2 className="mt-2 text-2xl font-black text-[#232323]">{taskName}</h2>
                <div className="mt-4 grid gap-3 text-sm font-semibold text-[#232323] sm:grid-cols-2">
                  <span className="rounded-2xl bg-[#f3f5fa] px-4 py-3">
                    {text.request.city}: {aiDraft.city || draft.city || text.request.unknownCity}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCategoryLabel ? (
                    <span className="rounded-full bg-[#f3f5fa] px-3 py-1.5 text-xs font-bold">{selectedCategoryLabel}</span>
                  ) : null}
                  {draft.work_title ? (
                    <span className="rounded-full bg-[#d9f36b] px-3 py-1.5 text-xs font-bold">{draft.work_title}</span>
                  ) : null}
                </div>
                {aiMessages.length ? (
                  <div className="mt-5 space-y-2">
                    {aiMessages.slice(-4).map((message, index) => (
                      <div
                        key={`${message.role}-${index}-${message.text}`}
                        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          message.role === 'assistant'
                            ? 'bg-[#f3f5fa] text-[#232323]'
                            : 'ml-auto bg-[#232323] text-white'
                        }`}
                      >
                        {message.text}
                      </div>
                    ))}
                  </div>
                ) : null}
                {aiDraft.needs_clarification && aiUserTurns < 6 ? (
                  <div className="mt-4 flex gap-2">
                    <input
                      value={aiFollowUp}
                      onChange={(event) => setAiFollowUp(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void submitAiFollowUp();
                        }
                      }}
                      placeholder="Ответьте помощнику"
                      className="min-w-0 flex-1 rounded-2xl bg-[#eef1f7] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d9f36b]"
                    />
                    <button
                      type="button"
                      onClick={submitAiFollowUp}
                      disabled={!aiFollowUp.trim() || aiLoading}
                      className="rounded-2xl bg-[#232323] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                      Ответить
                    </button>
                  </div>
                ) : null}
                {aiDraft.needs_clarification && aiUserTurns >= 6 ? (
                  <div className="mt-4 rounded-2xl bg-[#fff6dc] px-4 py-3 text-sm font-semibold text-[#232323]">
                    Не получилось уверенно определить услугу. Выберите категорию вручную — введённое описание сохранится.
                  </div>
                ) : null}
                {aiDraftReady || aiUserTurns >= 6 ? (
                  <button
                    onClick={next}
                    className="mt-5 inline-flex h-12 items-center gap-3 rounded-xl bg-[#d9f36b] px-6 text-base font-black text-[#232323] transition hover:bg-[#c7e85a]"
                  >
                    {aiDraftReady ? text.request.continue : 'Выбрать категорию'} <ArrowRight className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        );
      case 'category':
        return (
          <ChoiceStep
            title={step.title}
            items={categoryOptions.map((category) => category.label)}
            value={selectedCategoryLabel}
            onSelect={(item) => {
              const option = categoryOptions.find((category) => category.label === item);
              if (option) selectCategory(option);
              else update('category', item);
            }}
          />
        );
      case 'work':
        return (
          <ChoiceStep
            title={step.title}
            items={works.map((work) => work.title)}
            value={draft.work_title || ''}
            loading={worksLoading}
            emptyText="Для этой категории пока нет отдельных работ. Можно продолжить дальше."
            onSelect={(item) => {
              const work = works.find((current) => current.title === item);
              if (work) selectWork(work);
            }}
          />
        );
      case 'work_questions':
        return (
          <>
            <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            {questionsLoading ? (
              <div className="mt-6 rounded-3xl border border-[#dfe4ee] bg-[#f8f9fb] p-5 text-base font-semibold text-[#232323]">
                Загружаем вопросы...
              </div>
            ) : (
              <div className="mt-7 max-w-3xl space-y-5">
                {workQuestionFields.map((field) => (
                  <label key={field.key} className="block space-y-2">
                    <span className="text-sm font-bold text-[#232323]">
                      {field.question}
                      {field.isRequired ? ' *' : ''}
                    </span>
                    {field.helpText ? <span className="block text-xs text-[#7d849b]">{field.helpText}</span> : null}
                    {renderClarifyField(field)}
                  </label>
                ))}
              </div>
            )}
            {submitError && step.key === 'work_questions' ? (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{submitError}</div>
            ) : null}
          </>
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
              onConfirmedChange={setAddressConfirmed}
              addressPlaceholder={text.request.streetPlaceholder}
            />
            {submitError && step.key === 'address' ? (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{submitError}</div>
            ) : null}
          </>
        );
      case 'budget':
        return (
          <>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#232323] md:text-5xl">{step.title}</h1>
            {step.subtitle ? <p className="mt-4 text-lg text-[#232323]">{step.subtitle}</p> : null}
            <div className="mt-8 max-w-xl rounded-3xl bg-[#f3f5fa] p-2">
              <div className="grid grid-cols-2 gap-2">
                {(['fixed', 'range'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => update('budget_type', type)}
                    className={`rounded-2xl px-4 py-3 text-sm font-black ${
                      (draft.budget_type || 'fixed') === type ? 'bg-white text-[#232323] shadow-sm' : 'text-[#7d849b]'
                    }`}
                  >
                    {type === 'fixed' ? 'Точная сумма' : 'Интервал'}
                  </button>
                ))}
              </div>
            </div>
            {(draft.budget_type || 'fixed') === 'range' ? (
              <div className="mt-4 grid max-w-xl gap-3 sm:grid-cols-2">
                <input
                  value={draft.budget_min || ''}
                  onChange={(event) => update('budget_min', event.target.value.replace(/\D/g, ''))}
                  placeholder="От, ₽"
                  inputMode="numeric"
                  className={inputClass}
                />
                <input
                  value={draft.budget_max || ''}
                  onChange={(event) => update('budget_max', event.target.value.replace(/\D/g, ''))}
                  placeholder="До, ₽"
                  inputMode="numeric"
                  className={inputClass}
                />
              </div>
            ) : (
              <input
                value={draft.budget || ''}
                onChange={(event) => update('budget', event.target.value.replace(/\D/g, ''))}
                placeholder={text.request.budgetPlaceholder}
                inputMode="numeric"
                className={`${inputClass} mt-4 max-w-[290px]`}
              />
            )}
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
                  <PendingPhotoPreview key={`${file.name}-${file.lastModified}-${index}`} file={file}>
                    <button
                      type="button"
                      onClick={() => removePendingPhoto(index)}
                      className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black shadow group-hover:flex"
                    >
                      ×
                    </button>
                  </PendingPhotoPreview>
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
                  {resendTimer > 0 ? `Получить код в Telegram (${resendTimer}с)` : 'Получить код в Telegram'}
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

  if (!authLoading && isSpecialist) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f1] px-4">
        <div className="max-w-md rounded-[28px] bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-black text-[#232323]">Создание заявки недоступно мастеру</h1>
          <p className="mt-3 text-sm leading-6 text-[#7d849b]">
            В аккаунте мастера можно выбирать задания и откликаться на них. Создавать заявки может только клиент.
          </p>
          <Link href="/works" className="mt-5 inline-flex rounded-2xl bg-[#232323] px-5 py-3 text-sm font-black text-white">
            Перейти к заданиям
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f5fa] text-[#232323]">
      <header className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4">
        <Link href="/" className="text-3xl font-black tracking-tight text-[#232323]">
          Treabo
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium md:gap-8">
          <label className="hidden min-w-[150px] items-center gap-2 md:flex">
            <MapPin className="h-4 w-4 text-[#232323]" />
            <RussiaCityInput
              value={draft.city || text.city}
              onChange={(city) => update('city', city)}
              inputClassName="w-full bg-transparent text-sm font-medium text-[#232323] outline-none placeholder:text-[#232323]"
              placeholder={text.city}
            />
          </label>
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
                {step.key === 'details' && (draft.details || draft.photos?.length || draft.pendingPhotoFiles?.length)
                  ? text.request.continue
                  : step.action || text.request.continue}{' '}
                <ArrowRight className="h-5 w-5" />
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
  loading,
  emptyText,
  onSelect,
}: {
  title: string;
  items: string[];
  value?: string;
  loading?: boolean;
  emptyText?: string;
  onSelect: (item: string) => void;
}) {
  return (
    <>
      <h1 className="text-4xl font-black leading-tight text-[#232323] md:text-5xl">{title}</h1>
      <div className="mt-9 max-w-xl space-y-1">
        {loading ? (
          <div className="rounded-3xl border border-[#dfe4ee] bg-[#f8f9fb] p-5 text-base font-semibold text-[#232323]">
            Загружаем...
          </div>
        ) : items.length ? (
          items.map((item) => <Option key={item} label={item} active={value === item} onClick={() => onSelect(item)} />)
        ) : emptyText ? (
          <div className="rounded-3xl border border-[#dfe4ee] bg-[#f8f9fb] p-5 text-base font-semibold text-[#232323]">
            {emptyText}
          </div>
        ) : null}
      </div>
    </>
  );
}
