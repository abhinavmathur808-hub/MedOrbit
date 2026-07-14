/**
 * @type {import('tailwindcss').Config}
 *
 * NOTE: This project is on Tailwind CSS v4, which does NOT auto-load this file.
 * The authoritative design system (burgundy palette, fonts, surface tokens)
 * lives in `src/index.css` under `@theme` / `:root`. This config is kept in
 * sync for reference/tooling only; edits here have no effect unless the CSS is
 * given an explicit `@config "../tailwind.config.js"` directive.
 */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Clinical Dark Mode — unified deep medical red / burgundy accent
                burgundy: {
                    50: '#fcf2f4',
                    100: '#f9e0e5',
                    200: '#f1c0ca',
                    300: '#e595a6',
                    400: '#d4637e',
                    500: '#bb3a58',
                    600: '#9b1b30',
                    700: '#7f1729',
                    800: '#691426',
                    900: '#591324',
                    950: '#300a12',
                },
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            animation: {
                blob: "blob 7s infinite",
            },
            keyframes: {
                blob: {
                    "0%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                    "33%": {
                        transform: "translate(30px, -50px) scale(1.1)",
                    },
                    "66%": {
                        transform: "translate(-20px, 20px) scale(0.9)",
                    },
                    "100%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                },
            },
        },
    },
    plugins: [],
}
