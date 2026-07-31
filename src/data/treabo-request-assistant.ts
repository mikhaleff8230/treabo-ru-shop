import { getTreaboPublicApiBase } from '@/data/treabo';

export type RequestDraftQuestion = {
  id: number | null;
  key: string;
  text: string;
  field_type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'select'
    | 'single_select'
    | 'multiselect'
    | 'multi_select'
    | 'yesno'
    | 'boolean'
    | 'photo';
  options?: Array<{ value: unknown; label: string }>;
  required?: boolean;
};

export type RequestDraftSnapshot = {
  id: string;
  status: string;
  version: number;
  initial_text?: string | null;
  title?: string | null;
  description?: string | null;
  category?: { id: string; name: string } | null;
  work?: { id: number | string; stable_key?: string | null; name: string } | null;
  answers: Array<{
    question_id: number;
    question_key: string;
    question: string;
    value: unknown;
    display_value: string;
    confirmed: boolean;
  }>;
  location: {
    city?: string | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    confirmed?: boolean;
    source?: string | null;
  };
  urgency: { code: string; desired_at?: string | null; flexible?: boolean };
  budget: { type: string; amount?: number | null; min?: number | null; max?: number | null; currency: string };
  photos: Array<{ upload_id?: string; url?: string | null; caption?: string | null }>;
  materials: { status: string; provided_by: string; notes?: string | null };
  constraints: string[];
  preferences: string[];
  missing: Array<{ field_key: string; reason: string; blocking: boolean }>;
  confidence: { overall: number; category?: number; work?: number; facts?: number };
  master_summary?: string;
  multiple_services_detected?: boolean;
};

export type RequestDraftUiAction =
  | { type: 'wait' | 'review'; message?: string }
  | { type: 'ask_question'; question: RequestDraftQuestion; message?: string }
  | { type: 'choose_category' | 'choose_service' | 'manual_fallback'; message: string; category_id?: string }
  | {
      type: 'split_intents';
      message: string;
      intents: Array<{ category_id?: string | null; service_id?: number | string | null; label: string; confidence: number }>;
    };

export type RequestDraftResponse = {
  data: {
    draft: RequestDraftSnapshot;
    ui_action: RequestDraftUiAction;
    progress: {
      required_answered: number;
      required_total: number;
      optional_answered: number;
      optional_total: number;
      percent: number;
    };
  };
  recovery_token?: string;
  invalidated_answers?: number[];
};

export class RequestAssistantApiError extends Error {
  code?: string;
  retryable: boolean;

  constructor(message: string, code?: string, retryable = false) {
    super(message);
    this.name = 'RequestAssistantApiError';
    this.code = code;
    this.retryable = retryable;
  }
}

const recoveryKey = 'treabo-request-recovery-token';
const clientDraftKey = 'treabo-request-client-draft-id';

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-4${Math.random()
    .toString(16)
    .slice(2, 5)}-8${Math.random().toString(16).slice(2, 5)}-${Math.random().toString(16).slice(2, 14)}`;
}

export function requestAssistantClientDraftId() {
  if (typeof window === 'undefined') return uuid();
  const current = localStorage.getItem(clientDraftKey);
  if (current) return current;
  const created = uuid();
  localStorage.setItem(clientDraftKey, created);
  return created;
}

export function clearRequestAssistantRecovery() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(recoveryKey);
  localStorage.removeItem(clientDraftKey);
}

function recoveryToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem(recoveryKey);
}

async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${getTreaboPublicApiBase()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(recoveryToken() ? { 'X-Draft-Recovery-Token': recoveryToken()! } : {}),
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload?.error;
    throw new RequestAssistantApiError(
      error?.message || payload?.message || 'Не удалось продолжить диалог.',
      error?.code,
      Boolean(error?.retryable),
    );
  }
  if (payload?.recovery_token && typeof window !== 'undefined') {
    localStorage.setItem(recoveryKey, payload.recovery_token);
  }
  return payload as T;
}

export function createRequestDraft(input: {
  initial_text: string;
  city_hint?: string | null;
  photo_upload_ids?: string[];
  client_draft_id: string;
}) {
  return request<RequestDraftResponse>('/request-drafts', {
    method: 'POST',
    body: JSON.stringify({ ...input, idempotency_key: `create-${input.client_draft_id}` }),
  });
}

export function restoreLatestRequestDraft(clientDraftId: string) {
  return request<RequestDraftResponse>(
    `/request-drafts/latest?client_draft_id=${encodeURIComponent(clientDraftId)}`,
  );
}

export function sendRequestDraftTurn(
  draft: RequestDraftSnapshot,
  input: {
    message?: string;
    answer?: { question_id: number; value: unknown };
    skip_question_id?: number;
  },
) {
  return request<RequestDraftResponse>(`/request-drafts/${encodeURIComponent(draft.id)}/turns`, {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      client_turn_id: uuid(),
      expected_version: draft.version,
      idempotency_key: `turn-${uuid()}`,
    }),
  });
}

export function patchRequestDraft(
  draft: RequestDraftSnapshot,
  changes: Array<{ op: 'replace'; path: string; value: unknown }>,
) {
  return request<RequestDraftResponse>(`/request-drafts/${encodeURIComponent(draft.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ expected_version: draft.version, changes }),
  });
}

export function confirmRequestDraft(draft: RequestDraftSnapshot, token: string) {
  return request<RequestDraftResponse & { data: RequestDraftResponse['data'] & { task_id: string } }>(
    `/request-drafts/${encodeURIComponent(draft.id)}/confirm`,
    {
      method: 'POST',
      body: JSON.stringify({
        expected_version: draft.version,
        consent: true,
        idempotency_key: `publish-${draft.id}`,
      }),
    },
    token,
  );
}
