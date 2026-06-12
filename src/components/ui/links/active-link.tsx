import type { LinkProps } from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AnchorLink from '@/components/ui/links/anchor-link';
import classNames from 'classnames';

interface ActiveLinkProps extends LinkProps {
  activeClassName?: string;
  children?: React.ReactNode;
}
const ActiveLink: React.FC<
  ActiveLinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
> = ({ href, className, activeClassName = 'active', ...props }) => {
  const router = useRouter();
  const [pathname, setPathname] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady) {
      setPathname(router.pathname);
    }
  }, [router.isReady, router.pathname]);
  
  // Безопасно извлекаем строку href
  let hrefString = '';
  if (typeof href === 'string') {
    hrefString = href;
  } else if (href && typeof href === 'object' && 'pathname' in href) {
    hrefString = href.pathname || '';
  } else if (href) {
    hrefString = String(href);
  }
  
  // Проверяем точное совпадение или если pathname начинается с href (для вложенных страниц)
  // Во время SSR pathname может быть null, поэтому проверяем его наличие
  const isActive = pathname && hrefString && (
    pathname === hrefString || 
    (hrefString !== '/' && pathname.startsWith(hrefString + '/'))
  );
  
  return (
    <AnchorLink
      href={href}
      className={classNames(className, {
        [activeClassName]: isActive,
      })}
      {...props}
    />
  );
};

export default ActiveLink;
