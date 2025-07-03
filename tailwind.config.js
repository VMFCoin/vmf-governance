/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        screens: {
            'xs': '475px',
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
        },
        extend: {
            colors: {
                // American Flag Patriotic Theme
                patriotBlue: '#1B2951', // Dark navy blue from flag
                patriotRed: '#B22234', // True red from American flag
                patriotWhite: '#FFFFFF', // Pure white
                backgroundDark: '#0A1628', // Very dark navy background
                backgroundLight: '#1B2951', // Lighter navy for cards
                backgroundAccent: '#2A3B5C', // Medium navy for sections
                textBase: '#F8F9FA', // Off-white text
                textSecondary: '#D1D5DB', // Light gray text
                starGold: '#FFD700', // Gold for stars
            },
            fontFamily: {
                display: ['Sora', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem' }],
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],
                'base': ['1rem', { lineHeight: '1.5rem' }],
                'lg': ['1.125rem', { lineHeight: '1.75rem' }],
                'xl': ['1.25rem', { lineHeight: '1.75rem' }],
                '2xl': ['1.5rem', { lineHeight: '2rem' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
                '5xl': ['3rem', { lineHeight: '1' }],
                '6xl': ['3.75rem', { lineHeight: '1' }],
                '7xl': ['4.5rem', { lineHeight: '1' }],
                '8xl': ['6rem', { lineHeight: '1' }],
                '9xl': ['8rem', { lineHeight: '1' }],
                // Responsive text sizes
                'hero-mobile': ['2.5rem', { lineHeight: '1.1' }],
                'hero-tablet': ['3.5rem', { lineHeight: '1.1' }],
                'hero-desktop': ['4.5rem', { lineHeight: '1.1' }],
                'section-mobile': ['1.75rem', { lineHeight: '1.2' }],
                'section-tablet': ['2.25rem', { lineHeight: '1.2' }],
                'section-desktop': ['3rem', { lineHeight: '1.2' }],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
                '144': '36rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'flag-wave': 'flagWave 3s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                flagWave: {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(1deg)' },
                    '75%': { transform: 'rotate(-1deg)' },
                },
            },
            boxShadow: {
                'patriot-glow': '0 0 20px rgba(178, 34, 52, 0.3)',
                'blue-glow': '0 0 20px rgba(27, 41, 81, 0.4)',
                'card-hover': '0 10px 40px rgba(0, 0, 0, 0.3)',
            },
            backgroundImage: {
                'flag-stars': "radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.1) 1px, transparent 1px)",
                'patriot-gradient': 'linear-gradient(135deg, #1B2951 0%, #0A1628 100%)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
        function ({ addUtilities }) {
            const newUtilities = {
                '.scrollbar-hide': {
                    /* IE and Edge */
                    '-ms-overflow-style': 'none',
                    /* Firefox */
                    'scrollbar-width': 'none',
                    /* Safari and Chrome */
                    '&::-webkit-scrollbar': {
                        display: 'none'
                    }
                }
            }
            addUtilities(newUtilities)
        }
    ],
} 