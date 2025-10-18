/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './*.html',
    './artigos/**/*.html',
    './gerador-cnpj/**/*.html',
    './validador-cnpj/**/*.html',
    './validador-cnpj-api/**/*.html',
    './src/**/*.{ts,js}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
