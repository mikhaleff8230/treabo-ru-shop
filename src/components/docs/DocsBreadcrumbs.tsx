import AnchorLink from '@/components/ui/links/anchor-link';
import { useRouter } from 'next/router';
import routes from '@/config/routes';
import { getDocBySlug } from '@/data/static/knowledge-base-nav';
import { ChevronRight } from '@/components/icons/chevron-right';

interface DocsBreadcrumbsProps {
  slug?: string;
}

export default function DocsBreadcrumbs({ slug }: DocsBreadcrumbsProps) {
  const router = useRouter();
  const doc = slug ? getDocBySlug(slug) : null;
  const helpPath = routes.help || '/help';
  const knowledgeBasePath = routes.knowledgeBase || '/help/knowledge-base';

  return (
    <nav className="mb-6 flex items-center space-x-2 text-sm">
      <AnchorLink
        href={helpPath}
        className="text-dark-600 hover:text-brand dark:text-dark-400 dark:hover:text-brand"
      >
        Помощь
      </AnchorLink>
      <ChevronRight className="h-4 w-4 text-dark-400 dark:text-dark-500" />
      <AnchorLink
        href={knowledgeBasePath}
        className="text-dark-600 hover:text-brand dark:text-dark-400 dark:hover:text-brand"
      >
        База знаний
      </AnchorLink>
      {doc && (
        <>
          <ChevronRight className="h-4 w-4 text-dark-400 dark:text-dark-500" />
          <span className="text-dark dark:text-light">{doc.title}</span>
        </>
      )}
    </nav>
  );
}

