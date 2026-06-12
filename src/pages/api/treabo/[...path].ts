import type { NextApiRequest, NextApiResponse } from 'next';

const trimSlash = (value: string) => value.replace(/\/+$/, '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl =
    process.env.TREABO_API_ENDPOINT ||
    process.env.NEXT_PUBLIC_TREABO_API_ENDPOINT ||
    'http://127.0.0.1:8001/api';
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path || '');
  const targetUrl = `${trimSlash(baseUrl)}/${path}`;

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
  } catch (error) {
    res.status(502).json({
      success: false,
      message: 'Laravel API недоступен',
    });
  }
}
