declare global {
  interface Window {
    ymaps?: {
      ready: (callback: () => void) => void;
      Map: new (...args: any[]) => any;
      Placemark: new (...args: any[]) => any;
    };
  }
}

let ymapsLoadPromise: Promise<void> | null = null;

export function loadYmaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('no window'));
  }

  if (window.ymaps?.ready) {
    return new Promise((resolve) => window.ymaps!.ready(() => resolve()));
  }

  if (ymapsLoadPromise) return ymapsLoadPromise;

  ymapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      if (window.ymaps?.ready) {
        window.ymaps.ready(() => resolve());
        return;
      }
      reject(new Error('ymaps missing'));
    };
    script.onerror = () => reject(new Error('ymaps load failed'));
    document.head.appendChild(script);
  });

  return ymapsLoadPromise;
}

export function isYmapsReady(): boolean {
  return typeof window !== 'undefined' && typeof window.ymaps?.Map === 'function';
}
