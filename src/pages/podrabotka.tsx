import type { GetServerSideProps } from 'next';

export default function PodrabotkaRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/works',
    permanent: true,
  },
});
