import type { TreaboUpload } from '@/data/treabo';

export type AiDraft = {
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

export type ClarifyFieldType = 'text' | 'area' | 'yesno' | 'datetime' | 'photos';

export type ClarifyField = {
  key: string;
  question: string;
  type: ClarifyFieldType;
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

export function buildClarifyFields(aiDraft: AiDraft | null): ClarifyField[] {
  if (!aiDraft?.missing_questions?.length) return [];
  return aiDraft.missing_questions.map((question, index) => ({
    key: `q_${index}`,
    question,
    type: inferClarifyFieldType(question),
  }));
}

export function needsManualCategory(aiDraft: AiDraft | null) {
  if (!aiDraft) return true;
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
    const clarifyLines = Object.entries(answers)
      .filter(([, value]) => value?.trim())
      .map(([question, value]) => `${question}: ${value}`);
    if (clarifyLines.length) {
      parts.push('Уточнения:\n' + clarifyLines.join('\n'));
    }
  }

  if (draft.details?.trim()) {
    parts.push(`Дополнительные пожелания: ${draft.details.trim()}`);
  }

  return parts.filter(Boolean).join('\n\n');
}

export function resolveTaskCategory(draft: Record<string, any>): string {
  if (draft.aiDraft?.category_slug && draft.aiDraft.category_slug !== 'other') {
    return draft.aiDraft.category_slug;
  }
  if (draft.category) {
    return categoryLabelToSlug(draft.category);
  }
  return 'other';
}

export function resolveTaskTitle(draft: Record<string, any>, fallback: string): string {
  return (
    draft.aiDraft?.title ||
    draft.category ||
    draft.prompt?.slice(0, 80) ||
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
  category?: string;
  city?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  budget?: string;
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
