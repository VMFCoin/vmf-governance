/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
    // Disable ESLint during build for deployment
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Disable TypeScript errors during build for deployment
    typescript: {
        ignoreBuildErrors: true,
    },

    experimental: {
        optimizePackageImports: [
            '@radix-ui/react-icons',
            'framer-motion',
            'lucide-react',
        ],
    },

    // Image optimization
    images: {
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    // Webpack optimizations with Web3 fixes
    webpack: (config, { dev, isServer }) => {
        // Fix for pino-pretty and other optional dependencies
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
            crypto: false,
        };

        // Ignore optional dependencies that cause warnings
        config.externals.push('pino-pretty', 'lokijs', 'encoding');

        // Optimize bundle splitting
        if (!dev && !isServer) {
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    default: false,
                    vendors: false,
                    // Vendor chunk for large libraries
                    vendor: {
                        name: 'vendor',
                        chunks: 'all',
                        test: /node_modules/,
                        priority: 20,
                    },
                    // Separate chunk for UI libraries
                    ui: {
                        name: 'ui',
                        chunks: 'all',
                        test: /node_modules\/(framer-motion|@radix-ui|lucide-react)/,
                        priority: 30,
                    },
                    // Separate chunk for Web3 libraries
                    web3: {
                        name: 'web3',
                        chunks: 'all',
                        test: /node_modules\/(wagmi|@rainbow-me|viem|@tanstack)/,
                        priority: 30,
                    },
                    // Common chunk for shared code
                    common: {
                        name: 'common',
                        minChunks: 2,
                        chunks: 'all',
                        priority: 10,
                        reuseExistingChunk: true,
                    },
                },
            }
        }

        return config;
    },

    // Headers for performance and security
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                ],
            },
            {
                source: '/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
}

module.exports = withBundleAnalyzer(nextConfig) 