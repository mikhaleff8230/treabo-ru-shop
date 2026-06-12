import { useRouter } from 'next/router';
import AnchorLink from '@/components/ui/links/anchor-link';
import routes from '@/config/routes';
import { docsNav } from '@/data/static/knowledge-base-nav';
import { ChevronRight } from '@/components/icons/chevron-right';

interface DocsSidebarProps {
  currentSlug?: string;
}

export default function DocsSidebar({ currentSlug }: DocsSidebarProps) {
  const router = useRouter();
  const knowledgeBasePath = routes.knowledgeBase || '/help/knowledge-base';
  const helpPath = routes.help || '/help';

  return (
    <nav className="space-y-6 lg:sticky lg:top-4">
      <div>
        <AnchorLink
          href={helpPath}
          className="mb-4 block text-sm font-medium text-dark hover:text-brand dark:text-light dark:hover:text-brand"
        >
          ← База знаний
        </AnchorLink>
      </div>
      {docsNav.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-dark-600 dark:text-dark-400">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const isActive = currentSlug === item.slug;
              const itemHref = item.slug ? `${knowledgeBasePath}/${item.slug}` : knowledgeBasePath;
              return (
                <li key={item.slug}>
                  <AnchorLink
                    href={itemHref}
                    className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-brand/10 text-brand font-medium dark:bg-brand/20'
                        : 'text-dark-700 hover:bg-light-400 hover:text-dark dark:text-dark-300 dark:hover:bg-dark-400 dark:hover:text-light'
                    }`}
                  >
                    {isActive && (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span>{item.title}</span>
                  </AnchorLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

