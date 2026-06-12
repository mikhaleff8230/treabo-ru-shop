const path = require('path');

const defaultLanguage = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || 'ro';

const isMultilangEnable =
  process.env.NEXT_PUBLIC_ENABLE_MULTI_LANG === 'true' &&
  !!process.env.NEXT_PUBLIC_AVAILABLE_LANGUAGES;

function generateLocales() {
  if (isMultilangEnable) {
    return process.env.NEXT_PUBLIC_AVAILABLE_LANGUAGES.split(',')
      .map((l) => l.trim())
      .filter(Boolean);
  }

  return [defaultLanguage];
}

module.exports = {
  i18n: {
    defaultLocale: defaultLanguage,
    locales: generateLocales(),
    localeDetection: false,
  },
  localePath: path.resolve('./public/locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
