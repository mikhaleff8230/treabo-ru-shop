import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

const languages = [
  { value: 'ro', label: 'RO' },
  { value: 'ru', label: 'RU' },
];

export function TreaboLanguageSwitcher() {
  const router = useRouter();
  const currentLocale = router.locale || 'ro';

  function switchLanguage(locale: string) {
    Cookies.set('NEXT_LOCALE', locale, { expires: 365 });
    const cleanPath = router.asPath.replace(/^\/(ro|ru)(?=\/|$)/, '') || '/';
    const targetPath = locale === 'ro' ? cleanPath : `/ru${cleanPath === '/' ? '' : cleanPath}`;
    router.push(targetPath, undefined, { locale });
  }

  return (
    <div className="inline-flex rounded-full bg-[#202b3d] p-1 text-[11px] font-black uppercase text-white shadow-sm">
      {languages.map((language) => {
        const active = currentLocale === language.value;

        return (
          <button
            key={language.value}
            type="button"
            onClick={() => switchLanguage(language.value)}
            className={`h-7 min-w-[38px] rounded-full px-3 transition ${
              active ? 'bg-white text-[#202b3d]' : 'text-white/75 hover:text-white'
            }`}
            aria-pressed={active}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
