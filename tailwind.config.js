/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./index.html",
        "./gerador-cnpj/**/*.html",
        "./validador-cnpj/**/*.html",
        "./validador-cnpj-api/**/*.html",
        "./artigos/**/*.html",
        "./src/**/*.ts"
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
