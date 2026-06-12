export const TREABO_PHONE_COUNTRY = 'md';
export const TREABO_PHONE_DIAL = '+373';

export function normalizeTreaboPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  if (digits.startsWith('373') && digits.length >= 11) {
    return `+${digits}`;
  }

  if (digits.length === 8) {
    return `${TREABO_PHONE_DIAL}${digits}`;
  }

  if (digits.startsWith('0') && digits.length === 9) {
    return `${TREABO_PHONE_DIAL}${digits.slice(1)}`;
  }

  if (raw.trim().startsWith('+')) {
    return raw.replace(/[^\d+]/g, '');
  }

  return digits ? `${TREABO_PHONE_DIAL}${digits}` : '';
}

export function formatPhoneForInput(raw?: string | null): string {
  if (!raw) return '';
  const normalized = normalizeTreaboPhone(raw);
  return normalized.replace(/^\+373/, '');
}
