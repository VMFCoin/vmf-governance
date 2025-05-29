import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'

// Mock Next.js router
jest.mock('next/router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        reload: jest.fn(),
        pathname: '/',
        query: {},
        asPath: '/',
        route: '/',
        events: {
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
        },
    }),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        button: ({ children, ...props }) => <button {...props}>{children}</button>,
        span: ({ children, ...props }) => <span {...props}>{children}</span>,
        p: ({ children, ...props }) => <p {...props}>{children}</p>,
        h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
        h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
        h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
    },
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({
        start: jest.fn(),
        stop: jest.fn(),
        set: jest.fn(),
    }),
}))

// Mock RainbowKit
jest.mock('@rainbow-me/rainbowkit', () => ({
    ConnectButton: () => <button>Connect Wallet</button>,
    RainbowKitProvider: ({ children }) => children,
    getDefaultWallets: () => ({
        connectors: [],
        wallets: [],
    }),
}))

// Mock Wagmi
jest.mock('wagmi', () => ({
    useAccount: () => ({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        isConnecting: false,
        isDisconnected: false,
    }),
    useBalance: () => ({
        data: { formatted: '1000', symbol: 'VMF' },
        isLoading: false,
        error: null,
    }),
    WagmiConfig: ({ children }) => children,
    createConfig: () => ({}),
    configureChains: () => ({
        chains: [],
        publicClient: {},
        webSocketPublicClient: {},
    }),
}))

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
    QueryClient: jest.fn().mockImplementation(() => ({
        getQueryData: jest.fn(),
        setQueryData: jest.fn(),
        invalidateQueries: jest.fn(),
    })),
    QueryClientProvider: ({ children }) => children,
    useQuery: () => ({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
    }),
    useMutation: () => ({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isLoading: false,
        error: null,
    }),
}))

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    observe() {
        return null
    }
    disconnect() {
        return null
    }
    unobserve() {
        return null
    }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() { }
    observe() {
        return null
    }
    disconnect() {
        return null
    }
    unobserve() {
        return null
    }
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})

// Mock Clipboard API - only if it doesn't exist
if (!navigator.clipboard) {
    Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: {
            writeText: jest.fn().mockResolvedValue(undefined),
            readText: jest.fn().mockResolvedValue(''),
        },
    })
}

// Suppress specific console errors during tests
const originalError = console.error
beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
                args[0].includes('Warning: Received `true` for a non-boolean attribute'))
        ) {
            return
        }
        originalError.call(console, ...args)
    }
})

afterAll(() => {
    console.error = originalError
}) 