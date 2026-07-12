import TreaboAuthModal from '@/components/auth/treabo-auth-modal';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';
import { useRouter } from 'next/router';

export default function TreaboRoleAuthPage({ role }: { role: 'customer' | 'specialist' }) {
  const auth = useTreaboAuth();
  const router = useRouter();
  return (
    <main className={`min-h-screen ${role === 'specialist' ? 'bg-[#f1f2f6]' : 'bg-[#f7f8f3]'}`}>
      <TreaboAuthModal
        open
        onClose={() => void router.push('/')}
        initialTab={router.query.tab === 'register' ? 'register' : 'login'}
        initialRole={role}
        onSuccess={() => void router.push(role === 'specialist' ? '/works' : '/')}
        login={auth.login}
        register={auth.register}
        sendOtp={auth.sendOtp}
        verifyOtp={auth.verifyOtp}
      />
    </main>
  );
}
