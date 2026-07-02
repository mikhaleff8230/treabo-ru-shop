import { useMemo } from 'react';
import { useSettings } from '@/data/settings';
import { normalizeTreaboAssetUrl } from '@/data/treabo';

const FALLBACK_LOGO = '/treabo-logo.png';

function resolveLogoUrl(
  logo?: { original?: string | null; thumbnail?: string | null } | null
): string | null {
  const candidate = logo?.original || logo?.thumbnail;
  if (!candidate) {
    return null;
  }

  if (
    candidate.startsWith('/') &&
    !candidate.startsWith('/treabo') &&
    !candidate.startsWith('/api/treabo')
  ) {
    const apiBase = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://127.0.0.1:8001').replace(/\/$/, '');
    return `${apiBase}${candidate}`;
  }

  return normalizeTreaboAssetUrl(candidate) || candidate;
}

export function useTreaboBrandLogo() {
  const { settings, isLoading } = useSettings();

  const src = useMemo(() => {
    const fromSettings =
      resolveLogoUrl(settings?.logo) ?? resolveLogoUrl(settings?.dark_logo);
    return fromSettings || FALLBACK_LOGO;
  }, [settings?.logo, settings?.dark_logo]);

  const alt = settings?.siteTitle || 'Treabo';

  return {
    src,
    alt,
    isLoading,
    hasCustomLogo: src !== FALLBACK_LOGO,
  };
}
