import { Fragment, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Dialog } from '@/components/ui/dialog';
import { Transition } from '@/components/ui/transition';
import { DRAWER_VIEW, useDrawer } from '@/components/drawer-views/context';
const CartDrawerView = dynamic(
  () => import('@/components/cart/cart-drawer-view')
);
const SidebarDrawerView = dynamic(() => import('@/layouts/_layout-sidebar'));

function renderDrawerContent(view: DRAWER_VIEW | string) {
  switch (view) {
    case 'MOBILE_MENU':
      return <SidebarDrawerView />;
    default:
      return <CartDrawerView />;
  }
}

export default function DrawersContainer() {
  const router = useRouter();
  const { view, isOpen, closeDrawer } = useDrawer();
  useEffect(() => {
    // close search modal when route change
    router.events.on('routeChangeStart', closeDrawer);
    return () => {
      router.events.off('routeChangeStart', closeDrawer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Определяем направление drawer: слева для мобильного меню, справа для корзины
  const isLeftDrawer = view === 'MOBILE_MENU';
  const enterFrom = isLeftDrawer ? '-translate-x-full' : 'translate-x-full';
  const enterTo = 'translate-x-0';
  const leaveFrom = 'translate-x-0';
  const leaveTo = isLeftDrawer ? '-translate-x-full' : 'translate-x-full';
  const positionClass = isLeftDrawer ? 'left-0' : 'right-0';
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-[9999]"
        onClose={closeDrawer}
      >
        {/* ЗАТЕМНЕНИЕ */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10" />
        </Transition.Child>

        {/* 🌌 SYSTEM GLOW — ПОВЕРХ OVERLAY, НО ПОД DRAWER */}
        <div className="fixed inset-0 pointer-events-none z-[15]">
          <div className="system-glow" />
        </div>

        {/* DRAWER */}
        <Transition.Child
          as={Fragment}
          enter="transform transition ease-in-out duration-300"
          enterFrom={enterFrom}
          enterTo={enterTo}
          leave="transform transition ease-in-out duration-300"
          leaveFrom={leaveFrom}
          leaveTo={leaveTo}
        >
          <div className={`fixed inset-y-0 ${positionClass} z-20 flex`}>
            <div className="w-screen max-w-md bg-light/90 backdrop-blur-xl dark:bg-dark-300/90 relative z-20" onClick={(e) => e.stopPropagation()}>
              {view && renderDrawerContent(view)}
            </div>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
