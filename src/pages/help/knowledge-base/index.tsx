import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import type { NextPageWithLayout } from '@/types';
import GeneralLayout from '@/layouts/_general-layout';
import PageHeading from '@/components/ui/page-heading';
import GeneralContainer from '@/layouts/_general-container';
import Seo from '@/layouts/_seo';
import routes from '@/config/routes';
import { docsNav } from '@/data/static/knowledge-base-nav';
import AnchorLink from '@/components/ui/links/anchor-link';
import DocsSidebar from '@/components/docs/DocsSidebar';
import { useRouter } from 'next/router';

const KnowledgeBasePage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const knowledgeBasePath = routes.knowledgeBase || '/help/knowledge-base';

  return (
    <>
      <Seo
        title="База знаний"
        description="Подробная документация и руководства по работе с платформой Sancan"
        url={knowledgeBasePath}
      />
      <div className="mx-auto flex h-full w-full max-w-screen-xl flex-col p-4 sm:p-5">
        <PageHeading
          title="База знаний"
          subtitle="Подробная документация и руководства"
        />
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="hidden lg:block lg:w-64 lg:shrink-0">
            <DocsSidebar />
          </aside>
          <div className="flex-1">
            <div className="relative flex w-full flex-col overflow-hidden rounded-md bg-light p-4 shadow-card dark:bg-dark-200 dark:shadow-none xs:p-5 md:p-8 lg:p-10 xl:p-12">
              <div className="space-y-8">
                {docsNav.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-4">
                    <h2 className="text-xl font-semibold text-dark dark:text-light">
                      {section.title}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                      {section.items.map((item) => {
                        const itemHref = item.slug ? `${knowledgeBasePath}/${item.slug}` : knowledgeBasePath;
                        return (
                          <AnchorLink
                            key={item.slug}
                            href={itemHref}
                            className="group block rounded-lg border border-light-400 bg-light p-5 transition-all hover:border-brand hover:shadow-md dark:border-dark-400 dark:bg-dark-300 dark:hover:border-brand"
                          >
                            <h3 className="mb-2 text-lg font-medium text-dark group-hover:text-brand dark:text-light">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-sm text-dark-600 dark:text-dark-400">
                                {item.description}
                              </p>
                            )}
                          </AnchorLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

KnowledgeBasePage.getLayout = function getLayout(page) {
  return <GeneralLayout>{page}</GeneralLayout>;
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
    },
    revalidate: 60,
  };
};

export default KnowledgeBasePage;

