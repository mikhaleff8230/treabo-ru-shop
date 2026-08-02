export const YANDEX_METRIKA_ID = 111174536;

export type YandexMetrikaGoal =
  | 'request_form_open'
  | 'request_created'
  | 'specialist_registration'
  | 'customer_registration';

type YandexMetrika = (
  counterId: number,
  method: 'reachGoal' | 'hit',
  target: string,
  params?: Record<string, unknown>,
) => void;

declare global {
  interface Window {
    ym?: YandexMetrika;
  }
}

export function reachYandexMetrikaGoal(
  goal: YandexMetrikaGoal,
  params?: Record<string, unknown>,
) {
  if (typeof window !== 'undefined') {
    window.ym?.(YANDEX_METRIKA_ID, 'reachGoal', goal, params);
  }
}

export function trackYandexMetrikaPageView(url: string) {
  if (typeof window !== 'undefined') {
    window.ym?.(YANDEX_METRIKA_ID, 'hit', url, {
      referer: document.referrer,
      title: document.title,
    });
  }
}
