import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ielts: {
          primary: '#0e7490', // Deep authentic teal/cyan
          primaryHover: '#155e75',
          answered: '#15803d', // IELTS green for answered questions
          answeredBg: '#dcfce7',
          unanswered: '#64748b',
          unansweredBg: '#f1f5f9',
          focused: '#0284c7',
          focusedBg: '#e0f2fe',
          surface: '#ffffff',
          background: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          textMain: '#0f172a',
          textMuted: '#475569',
        },
      },
      borderRadius: {
        DEFAULT: '0.625rem', // 10px rounded default
        sm: '0.5rem', // 8px
        md: '0.75rem', // 12px
        lg: '1rem', // 16px
        xl: '1.25rem', // 20px
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
