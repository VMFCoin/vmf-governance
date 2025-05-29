# VMF Voice - Veterans DAO Governance Platform

A Web3-native DAO supporting U.S. Veterans using VMF Coin. Built with Next.js 14, TypeScript, TailwindCSS, and RainbowKit.

## 🎯 Project Overview

VMF Voice is a decentralized autonomous organization (DAO) platform designed specifically for U.S. Veterans. It enables community governance through proposal voting, initiative submissions, and collaborative decision-making using VMF Coin tokens.

## 🚀 Tech Stack

- **Frontend:** Next.js 14 App Router + TypeScript
- **Styling:** TailwindCSS with custom VMF theme
- **Wallet Integration:** RainbowKit + Wagmi + Viem
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Mock Data:** Faker.js

## 🏗️ Project Structure

```
vmf-gov-ui/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── globals.css      # Global styles with VMF theme
│   │   ├── layout.tsx       # Root layout with providers
│   │   ├── page.tsx         # Landing page
│   │   ├── providers.tsx    # Wallet and query providers
│   │   ├── vote/           # Voting pages (Phase 3)
│   │   ├── submit/         # Proposal submission (Phase 4)
│   │   └── community/      # Community features (Phase 5)
│   ├── components/          # Reusable UI components (Phase 2)
│   ├── lib/                 # Utilities and configurations
│   │   └── wagmi.ts        # Wallet configuration
│   ├── stores/              # Zustand state stores (Phase 6)
│   ├── types/               # TypeScript type definitions
│   └── data/                # Mock data generators (Phase 6)
├── public/                  # Static assets
├── docs/                    # Documentation
├── todo.md                  # Development roadmap
└── progress.md              # Progress tracking
```

## 🎨 VMF Design System

### Colors

- **VMF Blue:** `#004AAD` - Primary brand color
- **VMF Red:** `#FF3B30` - Alert/danger states
- **VMF Orange:** `#FF6B00` - Accent color
- **Background Dark:** `#10141F` - Main background
- **Background Light:** `#1B1F2A` - Card/section background
- **Text Base:** `#E5E5E5` - Primary text color

### Typography

- **Display Font:** Sora (headlines, heroic text)
- **Body Font:** Inter (high readability)

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- npm 8+

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd vmf-gov-ui
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your WalletConnect Project ID:

   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id-here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 📋 Development Phases

This project is being developed in 8 structured phases:

1. **✅ Phase 1:** Project Foundation & Setup (COMPLETED)
2. **🚧 Phase 2:** Core UI Components & Design System
3. **⏳ Phase 3:** Voting System & Proposal Management
4. **⏳ Phase 4:** Proposal Submission System
5. **⏳ Phase 5:** Community Features & DAO Calendar
6. **⏳ Phase 6:** State Management & Data Layer
7. **⏳ Phase 7:** Animations & Micro-interactions
8. **⏳ Phase 8:** Testing & Optimization

See `todo.md` for detailed task breakdowns and `progress.md` for current status.

## 🔗 Key Features (Planned)

### Current (Phase 1)

- ✅ Next.js 14 App Router setup
- ✅ TailwindCSS with VMF theme
- ✅ RainbowKit wallet integration
- ✅ Basic routing structure
- ✅ Responsive landing page

### Upcoming Features

- **Voting System:** Vote on proposals with Yes/No/Abstain options
- **Proposal Management:** Submit and manage governance proposals
- **Community Hub:** Idea submissions with upvote/downvote system
- **DAO Calendar:** National holiday-based voting events
- **Voting Power:** Token-based voting weight visualization
- **Real-time Updates:** Optimistic UI updates for seamless UX

## 🎯 Routes

- `/` - Landing dashboard
- `/vote` - Active proposals listing
- `/proposal/[id]` - Single proposal detail page
- `/submit` - Multi-step proposal submission
- `/community` - Community ideas and calendar

## 🔧 Configuration

### Wallet Integration

The app uses RainbowKit for wallet connections with support for:

- MetaMask, WalletConnect, Coinbase Wallet, and more
- Multiple networks: Mainnet, Polygon, Optimism, Arbitrum, Base
- ENS name resolution
- Testnet support for development

### Styling

Custom TailwindCSS configuration with:

- VMF brand colors and typography
- Custom animations and transitions
- Responsive design utilities
- Accessibility-compliant contrast ratios

## 🧪 Mock Data

Currently using mock data for all functionality until smart contract integration:

- Simulated VMF token balances
- Mock proposal data with voting results
- Fake user profiles and voting history
- Placeholder community posts and reactions

## 🚀 Deployment

The app is configured for deployment on Vercel with:

- Automatic builds from Git
- Environment variable management
- Edge runtime optimization
- Image optimization

## 📝 Contributing

1. Follow the phase-based development approach
2. Maintain TypeScript strict mode compliance
3. Use the established design system
4. Ensure accessibility standards (WCAG 2.1 AA)
5. Write clean, documented code

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Support

For questions or support, please refer to the project documentation or create an issue in the repository.

---

**VMF Voice** - Empowering U.S. Veterans through decentralized governance
