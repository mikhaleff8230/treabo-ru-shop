export const TREABO_PHONE_COUNTRY = 'ru';
export const TREABO_PHONE_DIAL = '+7';

export function normalizeTreaboPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  if (digits.startsWith('7') && digits.length >= 11) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `${TREABO_PHONE_DIAL}${digits}`;
  }

  if (digits.startsWith('8') && digits.length === 11) {
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
  return normalized.replace(/^\+7/, '');
}
