import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'https://api.sancan.ru';
    const url = new URL(`${apiUrl}/places/feed`);

    // Копируем все query параметры
    Object.keys(req.query).forEach(key => {
      url.searchParams.set(key, req.query[key] as string);
    });

    console.log('API Route: Proxying to', url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();
    console.log('API Route: Response status:', response.status);

    res.status(response.status).json(JSON.parse(data));
  } catch (error) {
    console.error('API Route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
