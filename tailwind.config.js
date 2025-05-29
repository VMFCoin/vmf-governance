/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
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
    ],
} 