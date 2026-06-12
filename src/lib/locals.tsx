import { useRouter } from 'next/router';
import { SAFlag } from '@/components/icons/flags/SAFlag';
import { CNFlag } from '@/components/icons/flags/CNFlag';
import { USFlag } from '@/components/icons/flags/USFlag';
import { DEFlag } from '@/components/icons/flags/DEFlag';
import { ILFlag } from '@/components/icons/flags/ILFlag';
import { RUFlag } from '@/components/icons/flags/RUFlag';
import { ESFlag } from '@/components/icons/flags/ESFlag';

import { SAFlagRound } from '@/components/icons/flags/SAFlagRound';
import { CNFlagRound } from '@/components/icons/flags/CNFlagRound';
import { DEFlagRound } from '@/components/icons/flags/DEFlagRound';
import { ESFlagRound } from '@/components/icons/flags/ESFlagRound';
import { RUFlagRound } from '@/components/icons/flags/RUFlagRound';
import { USFlagRound } from '@/components/icons/flags/USFlagRound';
import { ILFlagRound } from '@/components/icons/flags/ILFlagRound';

const localeRTLList = ['ar', 'he'];
export function useIsRTL() {
  const { locale } = useRouter();
  if (locale && localeRTLList.includes(locale)) {
    return { isRTL: true, alignLeft: 'right', alignRight: 'left' };
  }
  return { isRTL: false, alignLeft: 'left', alignRight: 'right' };
}

export let languageMenu = [
  {
    id: 'ro',
    name: 'Romana',
    value: 'ro',
    icon: <span className="text-xs font-black">RO</span>,
    iconMobile: <span className="flex h-full w-full items-center justify-center bg-white text-[10px] font-black text-[#232323]">RO</span>,
  },
  {
    id: 'ar',
    name: 'عربى',
    value: 'ar',
    icon: <SAFlag width="20px" height="15px" />,
    iconMobile: <SAFlagRound />,
  },
  {
    id: 'zh',
    name: '中国人',
    value: 'zh',
    icon: <CNFlag width="20px" height="15px" />,
    iconMobile: <CNFlagRound />,
  },
  {
    id: 'en',
    name: 'English',
    value: 'en',
    icon: <USFlag width="20px" height="15px" />,
    iconMobile: <USFlagRound />,
  },
  {
    id: 'de',
    name: 'Deutsch',
    value: 'de',
    icon: <DEFlag width="20px" height="15px" />,
    iconMobile: <DEFlagRound />,
  },
  {
    id: 'he',
    name: 'rעברית',
    value: 'he',
    icon: <ILFlag width="20px" height="15px" />,
    iconMobile: <ILFlagRound />,
  },
  {
    id: 'ru',
    name: 'Русский',
    value: 'ru',
    icon: <RUFlag width="20px" height="15px" />,
    iconMobile: <RUFlagRound />,
  },
  {
    id: 'es',
    name: 'Español',
    value: 'es',
    icon: <ESFlag width="20px" height="15px" />,
    iconMobile: <ESFlagRound />,
  },
];
