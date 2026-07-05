import type { TreaboUpload } from '@/data/treabo';

export type MissingQuestionObject = {
  question_id?: number | null;
  field_key?: string | null;
  question: string;
  type: 'text' | 'textarea' | 'number' | 'yesno' | 'select' | 'multiselect' | 'photo';
  options?: string[] | null;
  placeholder?: string | null;
  help_text?: string | null;
  is_required?: boolean;
};

export type AiDraft = {
  detected_language: string;
  title: string;
  category_slug?: string;
  category_id?: string | null;
  work_id?: number | null;
  city: string | null;
  urgency: string;
  description: string;
  master_summary: string;
  missing_questions: Array<string | MissingQuestionObject>;
  confidence: number;
};

export type ClarifyFieldType =
  | 'text'
  | 'textarea'
  | 'area'
  | 'yesno'
  | 'datetime'
  | 'photos'
  | 'select'
  | 'multiselect';

export type ClarifyField = {
  key: string;
  question: string;
  type: ClarifyFieldType;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  questionId?: number | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  'bathroom-renovation': 'Ремонт ванной',
  'tile-work': 'Плиточные работы',
  plumbing: 'Сантехника',
  electrical: 'Электрика',
  'air-conditioners': 'Кондиционеры',
  painting: 'Покраска стен',
  other: 'Другое',
};

const LABEL_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([slug, label]) => [label, slug]),
);

const URGENCY_LABELS: Record<string, string> = {
  urgent: 'Срочно',
  this_week: 'В течение недели',
  this_month: 'В течение месяца',
  flexible: 'Когда удобно специалисту',
  unknown: 'Уточнить',
};

export function categorySlugToLabel(slug: string) {
  return CATEGORY_LABELS[slug] || slug;
}

export function categoryLabelToSlug(label: string) {
  return LABEL_TO_SLUG[label] || 'other';
}

export function urgencyToLabel(urgency: string) {
  return URGENCY_LABELS[urgency] || urgency;
}

export function inferClarifyFieldType(question: string): ClarifyFieldType {
  const q = question.toLowerCase();
  if (/площад|м²|кв\.?\s*м/.test(q)) return 'area';
  if (/фото|снимк|изображен/.test(q)) return 'photos';
  if (/материал|куплен|закуп/.test(q)) return 'yesno';
  if (/когда|дата|время|приехать|осмотр|срок/.test(q)) return 'datetime';
  return 'text';
}

export function mapApiTypeToClarifyType(
  type: MissingQuestionObject['type'] | string,
): ClarifyFieldType {
  switch (type) {
    case 'number':
      return 'area';
    case 'photo':
      return 'photos';
    case 'textarea':
      return 'textarea';
    case 'yesno':
      return 'yesno';
    case 'select':
      return 'select';
    case 'multiselect':
      return 'multiselect';
    default:
      return 'text';
  }
}

export function normalizeMissingQuestion(
  item: string | MissingQuestionObject,
  index: number,
): ClarifyField | null {
  if (typeof item === 'string') {
    const question = item.trim();
    if (!question) return null;
    const type = inferClarifyFieldType(question);
    if (type === 'datetime' || type === 'photos') return null;
    return {
      key: `q_${index}`,
      question,
      type,
    };
  }

  if (!item?.question?.trim()) return null;

  const type = mapApiTypeToClarifyType(item.type);
  if (type === 'datetime') return null;

  return {
    key: item.field_key?.trim() || (item.question_id != null ? `q_${item.question_id}` : `q_${index}`),
    question: item.question.trim(),
    type,
    options: item.options?.length ? item.options : undefined,
    placeholder: item.placeholder || undefined,
    helpText: item.help_text || undefined,
    isRequired: item.is_required,
    questionId: item.question_id ?? null,
  };
}

export function buildClarifyFields(aiDraft: AiDraft | null): ClarifyField[] {
  if (!aiDraft?.missing_questions?.length) return [];
  return aiDraft.missing_questions
    .map((item, index) => normalizeMissingQuestion(item, index))
    .filter((field): field is ClarifyField => field !== null);
}

export function needsManualCategory(aiDraft: AiDraft | null) {
  if (!aiDraft) return true;
  if (aiDraft.category_id) return aiDraft.confidence < 0.5;
  return !aiDraft.category_slug || aiDraft.category_slug === 'other' || aiDraft.confidence < 0.5;
}

export function needsManualCity(aiDraft: AiDraft | null, city?: string) {
  if (city?.trim()) return false;
  return !aiDraft?.city;
}

export function needsManualUrgency(aiDraft: AiDraft | null, deadline?: string) {
  if (deadline?.trim()) return false;
  return !aiDraft?.urgency || aiDraft.urgency === 'unknown';
}

export function generateLocalAiDraft(text: string, defaultCity = 'Москва'): AiDraft {
  const normalized = text.toLowerCase();
  const hasBath = /ванн|сануз|душ/.test(normalized);
  const hasTile = /плит/.test(normalized);
  const hasPaint = /покрас|краск|стен/.test(normalized);
  const isUrgent = /сроч|сегодня/.test(normalized);
  const cityMatch = normalized.match(/москв|спб|питер|санкт-петербург|казан|новосиб/);
  let city: string | null = null;
  if (cityMatch) {
    if (/москв/.test(normalized)) city = 'Москва';
    else if (/спб|питер|санкт/.test(normalized)) city = 'Санкт-Петербург';
    else if (/казан/.test(normalized)) city = 'Казань';
    else if (/новосиб/.test(normalized)) city = 'Новосибирск';
  }

  const category = hasBath
    ? 'bathroom-renovation'
    : hasTile
      ? 'tile-work'
      : hasPaint
        ? 'painting'
        : 'other';

  return {
    detected_language: 'ru',
    title: hasBath
      ? 'Ремонт ванной комнаты'
      : hasTile
        ? 'Плиточные работы'
        : hasPaint
          ? 'Покраска стен'
          : 'Заявка для специалиста',
    category_slug: category,
    city,
    urgency: isUrgent ? 'urgent' : 'unknown',
    description: `Клиент описал задачу так: ${text}. Нужны дополнительные детали для оценки стоимости и сроков.`,
    master_summary: `${hasBath ? 'Ванная' : hasTile ? 'Плитка' : hasPaint ? 'Покраска' : 'Работа'}, ${isUrgent ? 'срочно' : 'срок уточнить'}${city ? `, ${city}` : `, ${defaultCity}`}.`,
    missing_questions: [
      'Какая площадь работ?',
      'Есть ли фотографии?',
      'Материалы уже куплены?',
      'Когда специалист может приехать на осмотр?',
    ],
    confidence: 0.55,
  };
}

export function buildTaskDescription(draft: Record<string, any>): string {
  const parts: string[] = [];

  if (draft.prompt) {
    parts.push(`Запрос клиента: ${draft.prompt}`);
  }
  if (draft.aiDraft?.description) {
    parts.push(draft.aiDraft.description);
  }
  if (draft.aiDraft?.master_summary) {
    parts.push(`Кратко: ${draft.aiDraft.master_summary}`);
  }

  const answers = draft.aiAnswers as Record<string, string> | undefined;
  if (answers && Object.keys(answers).length) {
    const questionMap = new Map<string, string>();
    const missing = draft.aiDraft?.missing_questions;
    if (Array.isArray(missing)) {
      missing.forEach((item, index) => {
        if (typeof item === 'string') {
          questionMap.set(`q_${index}`, item);
        } else if (item && typeof item === 'object' && item.question) {
          const key =
            item.field_key?.trim() ||
            (item.question_id != null ? `q_${item.question_id}` : `q_${index}`);
          questionMap.set(key, item.question);
        }
      });
    }
    if (Array.isArray(draft.workQuestions)) {
      draft.workQuestions.forEach((item: any) => {
        if (!item?.question) return;
        const key = item.field_key?.trim() || `work_q_${item.id}`;
        questionMap.set(key, item.question);
      });
    }

    const clarifyLines = Object.entries(answers)
      .filter(([, value]) => value?.trim())
      .map(([key, value]) => `${questionMap.get(key) || key}: ${value}`);
    if (clarifyLines.length) {
      parts.push('Уточнения:\n' + clarifyLines.join('\n'));
    }
  }

  if (draft.details?.trim()) {
    parts.push(`Дополнительные пожелания: ${draft.details.trim()}`);
  }

  return parts.filter(Boolean).join('\n\n');
}

export function buildTaskAiDetails(draft: Record<string, any>) {
  const aiDraft = draft.aiDraft as AiDraft | undefined;
  const answers = (draft.aiAnswers || {}) as Record<string, string>;
  const questionMap = new Map<string, string>();

  if (Array.isArray(aiDraft?.missing_questions)) {
    aiDraft.missing_questions.forEach((item, index) => {
      if (typeof item === 'string') {
        questionMap.set(`q_${index}`, item);
      } else if (item && typeof item === 'object' && item.question) {
        const key =
          item.field_key?.trim() ||
          (item.question_id != null ? `q_${item.question_id}` : `q_${index}`);
        questionMap.set(key, item.question);
      }
    });
  }
  if (Array.isArray(draft.workQuestions)) {
    draft.workQuestions.forEach((item: any) => {
      if (!item?.question) return;
      const key = item.field_key?.trim() || `work_q_${item.id}`;
      questionMap.set(key, item.question);
    });
  }

  const question_answers = Object.entries(answers)
    .filter(([, value]) => value?.trim())
    .map(([key, answer]) => ({
      key,
      question: questionMap.get(key) || key,
      answer,
    }));

  return {
    prompt: draft.prompt || null,
    title: draft.title || aiDraft?.title || null,
    category_id: draft.category_id || aiDraft?.category_id || null,
    category_slug: draft.category_slug || aiDraft?.category_slug || null,
    work_id: draft.work_id || aiDraft?.work_id || null,
    work_title: draft.work_title || null,
    city: draft.city || aiDraft?.city || null,
    urgency: draft.deadline || aiDraft?.urgency || null,
    master_summary: aiDraft?.master_summary || null,
    ai_description: aiDraft?.description || null,
    question_answers,
    additional_details: draft.details?.trim() || null,
  };
}

export function resolveTaskCategory(draft: Record<string, any>): string {
  if (draft.category_slug) {
    return draft.category_slug;
  }
  if (draft.aiDraft?.category_slug && draft.aiDraft.category_slug !== 'other') {
    return draft.aiDraft.category_slug;
  }
  if (draft.category) {
    return categoryLabelToSlug(draft.category);
  }
  if (draft.category_id) {
    return String(draft.category_id);
  }
  return 'other';
}

export function resolveTaskTitle(draft: Record<string, any>, fallback: string): string {
  const aiTitle = String(draft.aiDraft?.title || '').trim();
  const genericAiTitle =
    !aiTitle ||
    aiTitle.toLowerCase().includes('заявка для специалиста') ||
    aiTitle.toLowerCase().includes('request for specialist');
  const promptTitle = String(draft.prompt || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/[.!?\n]/)
    .find(Boolean)
    ?.trim();

  return (
    String(draft.title || '').trim() ||
    (!genericAiTitle ? aiTitle : '') ||
    (promptTitle ? promptTitle.slice(0, 96) : '') ||
    draft.category ||
    fallback
  );
}

export function formatRubles(value: number | null | undefined) {
  if (value == null) return '';
  return new Intl.NumberFormat('ru-RU').format(value);
}

export function parseBudgetInput(value: string): number | null {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return null;
  return Number(digits);
}

export type WizardDraft = Record<string, any> & {
  id?: string;
  prompt?: string;
  title?: string;
  category?: string;
  category_id?: string | null;
  category_slug?: string | null;
  work_id?: number | string | null;
  work_title?: string | null;
  workQuestions?: any[];
  city?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  budget?: string;
  budget_type?: 'fixed' | 'range';
  budget_min?: string;
  budget_max?: string;
  deadline?: string;
  details?: string;
  phone?: string;
  aiDraft?: AiDraft;
  aiAnswers?: Record<string, string>;
  photos?: TreaboUpload[];
  pendingPhotoFiles?: File[];
  saved?: boolean;
  taskId?: string;
};
