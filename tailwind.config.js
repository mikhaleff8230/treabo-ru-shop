function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    } else {
      return `rgb(var(${variableName}))`;
    }
  };
}
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/layouts/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
      '3xl': '1780px',
      '4xl': '2160px', // only need to control product grid mode in ultra 4k device
    },
    extend: {
      colors: {
        'app-bg': withOpacity('--color-app-bg'),
        'app-surface': withOpacity('--color-app-surface'),
        'app-card': withOpacity('--color-app-card'),
        'app-muted': withOpacity('--color-app-muted'),
        'app-accent': withOpacity('--color-app-accent'),
        brand: {
          DEFAULT: '#E0F316', // Основной лаймовый цвет
          dark: '#B8CC12', // Темный вариант для hover
          50: '#F7FCE0', // Очень светлый
          100: '#EFF9C1', // Светлый
          200: '#E7F6A2', // Светло-лаймовый
          300: '#DFF383', // Средне-светлый
          400: '#D7F064', // Средний
          500: '#E0F316', // Основной
          600: '#B8CC12', // Темнее основной
          700: '#90A50E', // Темный
          800: '#687E0A', // Очень темный
          900: '#405706', // Самый темный
        },
        light: {
          DEFAULT: '#ffffff',
          base: '#646464',
          100: '#f9f9f9',
          200: '#f2f2f2',
          300: '#ededed',
          400: '#e6e6e6',
          500: '#dadada',
          600: '#d2d2d2',
          800: '#bcbcbc',
          900: '#a8a8a8',
        },
        dark: {
          DEFAULT: '#000000',
          base: '#a5a5a5',
          100: '#181818',
          200: '#212121',
          250: '#252525',
          300: '#2a2a2a',
          350: '#2b2b2b',
          400: '#323232',
          450: '#2e2e2e',
          500: '#3e3e3e',
          600: '#4a4a4a',
          700: '#6e6e6e',
          800: '#808080',
          850: '#989898',
          900: '#232323',
          950: '#2b2b2b',
        },
        warning: '#e66767',
        wishlist_price: '#ffffff1a',
        'border-50': withOpacity('--color-border-50'),
        'border-100': withOpacity('--color-border-100'),
        'border-200': withOpacity('--color-border-200'),
        'border-base': withOpacity('--color-border-base'),
        // Promo page colors from Lovable
        'promo-primary': 'hsl(var(--promo-primary))',
        'promo-primary-foreground': 'hsl(var(--promo-primary-foreground))',
        'promo-secondary': 'hsl(var(--promo-secondary))',
        'promo-secondary-foreground': 'hsl(var(--promo-secondary-foreground))',
        'promo-navy': {
          DEFAULT: 'hsl(var(--promo-navy))',
          light: 'hsl(var(--promo-navy-light))',
        },
        'promo-cyan': 'hsl(var(--promo-cyan))',
        'promo-magenta': 'hsl(var(--promo-magenta))',
        'promo-background': 'hsl(var(--promo-background))',
        'promo-foreground': 'hsl(var(--promo-foreground))',
        'promo-card': 'hsl(var(--promo-card))',
        'promo-card-foreground': 'hsl(var(--promo-card-foreground))',
        'promo-border': 'hsl(var(--promo-border))',
      },
      boxShadow: {
        card: '0px 0px 6px rgba(79, 95, 120, 0.1)',
        dropdown: '0px 10px 32px rgba(46, 57, 72, 0.2)',
        'bottom-nav': '0 -2px 3px rgba(0, 0, 0, 0.08)',
        'app-card': '0 10px 30px rgba(0, 0, 0, 0.28)',
        'app-lift': '0 18px 40px rgba(0, 0, 0, 0.38)',
        'app-glow': '0 18px 40px rgba(81, 70, 255, 0.25)',
      },
      borderRadius: {
        'app-sm': '12px',
        'app-md': '16px',
        'app-lg': '20px',
      },
      spacing: {
        'grid-1': '8px',
        'grid-2': '16px',
        'grid-3': '24px',
        'grid-4': '32px',
      },
      fontSize: {
        '10px': '.625rem',
        '13px': '13px',
        '15px': '15px',
      },
      fontFamily: {
        body: ["'Inter', sans-serif"],
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};
