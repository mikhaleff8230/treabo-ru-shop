import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps, GetStaticPaths } from 'next';
import { useTranslation } from 'next-i18next';
import type { NextPageWithLayout } from '@/types';
import GeneralLayout from '@/layouts/_general-layout';
import PageHeading from '@/components/ui/page-heading';
import Seo from '@/layouts/_seo';
import routes from '@/config/routes';
import { docsNav, getAllDocsSlugs, getDocBySlug as getNavDocBySlug } from '@/data/static/knowledge-base-nav';
import DocsSidebar from '@/components/docs/DocsSidebar';
import DocsBreadcrumbs from '@/components/docs/DocsBreadcrumbs';
import { MDXRemote } from 'next-mdx-remote';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

interface KnowledgeBaseArticlePageProps {
  slug: string;
  source: MDXRemoteSerializeResult;
  frontMatter: {
    title: string;
    description?: string;
  };
}

const KnowledgeBaseArticlePage: NextPageWithLayout<KnowledgeBaseArticlePageProps> = ({
  slug,
  source,
  frontMatter,
}) => {
  const { t } = useTranslation('common');

  return (
    <>
      <Seo
        title={frontMatter.title}
        description={frontMatter.description || `Подробная информация: ${frontMatter.title}`}
        url={`${routes.knowledgeBase}/${slug}`}
      />
      <div className="mx-auto flex h-full w-full max-w-screen-xl flex-col p-4 sm:p-5">
        <DocsBreadcrumbs slug={slug} />
        <PageHeading title={frontMatter.title} subtitle={frontMatter.description} />
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="hidden lg:block lg:w-64 lg:shrink-0">
            <DocsSidebar currentSlug={slug} />
          </aside>
          <div className="flex-1">
            <div className="relative flex w-full flex-col overflow-hidden rounded-md bg-light p-4 shadow-card dark:bg-dark-200 dark:shadow-none xs:p-5 md:p-8 lg:p-10 xl:p-12">
              <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-dark dark:prose-headings:text-light prose-p:text-dark-700 dark:prose-p:text-dark-300 prose-a:text-brand hover:prose-a:text-brand/80 prose-strong:text-dark dark:prose-strong:text-light prose-ul:text-dark-700 dark:prose-ul:text-dark-300 prose-ol:text-dark-700 dark:prose-ol:text-dark-300 prose-table:w-full prose-th:border prose-th:border-light-400 prose-th:dark:border-dark-400 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-td:border prose-td:border-light-400 prose-td:dark:border-dark-400 prose-td:px-4 prose-td:py-2">
                <MDXRemote {...source} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

KnowledgeBaseArticlePage.getLayout = function getLayout(page) {
  return <GeneralLayout>{page}</GeneralLayout>;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { getDocSlugs } = await import('@/lib/mdx');
  const slugs = getDocSlugs();
  const paths = slugs.map((slug) => ({
    params: { slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const slug = params?.slug as string;
  const { getDocBySlug, serializeDocContent } = await import('@/lib/mdx');
  const doc = getDocBySlug(slug);

  if (!doc) {
    return {
      notFound: true,
    };
  }

  // Сериализуем MDX контент
  const mdxSource = await serializeDocContent(doc.content);

  return {
    props: {
      slug,
      source: mdxSource,
      frontMatter: doc.frontMatter,
      ...(await serverSideTranslations(locale!, ['common'])),
    },
    revalidate: 60,
  };
};

export default KnowledgeBaseArticlePage;

