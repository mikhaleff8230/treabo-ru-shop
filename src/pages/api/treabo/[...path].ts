import type { NextApiRequest, NextApiResponse } from 'next';

const trimSlash = (value: string) => value.replace(/\/+$/, '');
const withProffiPrefix = (value: string) => {
  const trimmed = trimSlash(value);
  if (trimmed.endsWith('/api/treabo')) return trimmed;
  return trimmed.endsWith('/proffi') ? trimmed : `${trimmed}/proffi`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl =
    process.env.TREABO_API_ENDPOINT ||
    process.env.NEXT_PUBLIC_TREABO_API_ENDPOINT ||
    'http://127.0.0.1:8001/api/proffi';

  const pathParts = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
      ? [String(req.query.path)]
      : [];
  const path = pathParts.filter(Boolean).join('/');

  const query = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === 'path' || value == null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, String(item)));
      return;
    }
    query.append(key, String(value));
  });

  const queryString = query.toString();
  const targetUrl = `${withProffiPrefix(baseUrl)}/${path}${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body || {}),
    });

    const text = await response.text();
    res.status(response.status);

    try {
      res.json(text ? JSON.parse(text) : null);
    } catch {
      res.send(text);
    }
  } catch {
    res.status(502).json({
      success: false,
      message: 'Laravel API недоступен',
    });
  }
}
