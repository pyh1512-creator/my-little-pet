/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F6EDE4',
          light: '#FBF7F2',
          dark: '#EADCCB',
        },
        peach: {
          DEFAULT: '#F4B9AE',
          light: '#FAD7D0',
          dark: '#E59688',
        },
        mint: {
          DEFAULT: '#A8CBB9',
          light: '#CFE3D8',
          dark: '#7FAE96',
        },
        lavender: {
          DEFAULT: '#A9BCE0',
          light: '#CFDDF2',
          dark: '#7F99CC',
        },
        cocoa: {
          DEFAULT: '#544C48',
          light: '#7A706B',
          muted: '#9D938D',
        },
      },
      fontFamily: {
        sans: ['"Pretendard"', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
        display: ['"Jua"', '"Pretendard"', '"Noto Sans KR"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 28px -6px rgba(84, 76, 72, 0.10), 0 2px 8px -2px rgba(84, 76, 72, 0.05)',
        card: '0 12px 36px -10px rgba(84, 76, 72, 0.14), 0 4px 12px -4px rgba(84, 76, 72, 0.06)',
        pill: '0 4px 14px -2px rgba(84, 76, 72, 0.12)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
    },
  },
  plugins: [],
};
