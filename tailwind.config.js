/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    theme: {
        extend: {},
    },
    daisyui: {
        themes: [
            {
                oncehuman: {
                    primary: '#debc4b',
                    secondary: '#23c2c3',
                    accent: '#bd0852',
                    neutral: '#292524',
                    'base-100': '#151513',
                    info: '#98b8dc',
                    success: '#90d3b5',
                    warning: '#c1c38f',
                    error: '#df9c95',
                    '--rounded-btn': '0',
                    '--rounded-badge': '0',
                },
            },
        ],
    },
    plugins: [require('daisyui')],
};
