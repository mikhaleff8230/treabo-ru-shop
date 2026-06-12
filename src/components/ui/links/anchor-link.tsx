import type { LinkProps } from 'next/link';
import NextLink from 'next/link';
import React from 'react';

const AnchorLink: React.FC<
  LinkProps &
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
      children?: React.ReactNode;
    }
> = ({ href, ...props }) => {
  // Проверяем, что href определен и является строкой
  if (!href || typeof href !== 'string') {
    console.warn('AnchorLink: href is not a string', href);
    return <span {...(props as any)} />;
  }
  
  // Если это внешняя ссылка (начинается с http:// или https://), используем обычный <a>
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return <a href={href} {...(props as any)} />;
  }
  
  return <NextLink href={href} {...props} />;
};

export default AnchorLink;
