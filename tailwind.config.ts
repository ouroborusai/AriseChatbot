import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          dark: '#0d2f26',
          medium: '#0f4336',
          light: '#122f28',
          green: '#25D366',
          greenHover: '#1ebd58',
          border: '#128C7E',
          bgLight: '#e5ddd5',
          sidebar: '#075E54',
          darker: '#0f4940',
          darkest: '#0d3f36',
          panel: '#f8fcf7',
          messageBg: '#e7f7ed',
          messageHover: '#f2f8f2',
          userMessage: '#dcf8c6',
          chatBg: '#f6fbf5',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
};

export default config;
