import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/data/client';
import type { Product, Category } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');

  // Получаем товары (ограничим 20 для примера)
  const productPaginator = await client.products.all({ limit: 20 });
  const products: Product[] = productPaginator.data || [];

  // Получаем категории
  const categoryPaginator = await client.categories.all();
  const categories: Category[] = categoryPaginator.data || [];

  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE yml_catalog SYSTEM "shops.dtd">
<yml_catalog date="${now}">
  <shop>
    <name>Магазин sancan.ru</name>
    <company>ООО \"Компания\"</company>
    <url>https://sancan.ru/</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
      ${categories
        .map(
          (cat) =>
            `<category id="${cat.id}">${cat.name}</category>`
        )
        .join('\n      ')}
    </categories>
    <offers>
      ${products
        .map(
          (p) => `
      <offer id="${p.id}" available="${p.in_stock > 0 ? 'true' : 'false'}">
        <url>https://sancan.ru/product/${p.slug}</url>
        <price>${p.sale_price || p.price}</price>
        <currencyId>RUR</currencyId>
        <categoryId>${p.type?.id || ''}</categoryId>
        <picture>${p.image?.original || ''}</picture>
        <name>${p.name}</name>
        <description>${p.description?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</description>
      </offer>`
        )
        .join('\n      ')}
    </offers>
  </shop>
</yml_catalog>`;
  res.status(200).send(xml);
} 