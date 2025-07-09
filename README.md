# 🧇 Waffle Payments

A modern, premium payment platform that bridges traditional finance and cryptocurrency, allowing users to seamlessly top up credits through multiple payment methods with a delightful waffle-themed experience.

## 🎯 What It Does

**Waffle Payments** is a sophisticated Web3 payment platform designed for maximum flexibility and premium user experience:

### 🔐 **Multi-Modal Authentication**
- **🦊 Crypto Wallet Login**: Supports EVM chains (Ethereum, Polygon, Optimism, Arbitrum, Base) and Solana wallets
- **📧 Traditional Login**: Email/password authentication for users who prefer conventional methods

### 💳 **Flexible Payment Options**
- **⚡ Credit Top-ups**: One-time purchases with tiered pricing
  - 1,000 credits for $25
  - 2,105 credits for $50 (Popular)
  - 4,444 credits for $100 (Best Value)
- **🔄 Subscriptions**: Monthly recurring plans (1,000 credits/month for $20)
- **💰 Payment Methods**: Both Stripe (credit cards) and MetaMask (cryptocurrency)

### 📊 **User Dashboard**
- 📈 Credit balance tracking
- ⭐ Subscription status management  
- 👤 Profile management (name, email, avatar, password changes)
- 📜 Transaction history

### 🎯 **Special Features**
- **🔥 Buyback & Burn Initiative**: 11% of all purchases support the Soonak Meme token ecosystem
- **⭐ CryptoWaffle Subscriber** status for premium users

## 🛠️ Tech Stack

### 🚀 **Frontend Framework**
- **Next.js 15.3.3** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** with custom design system
- **shadcn/ui** components built on Radix UI primitives

### 🎨 **Design System**
Following premium waffle-themed guidelines:
- **🥇 Primary**: Rich Gold (#D4AF37) - premium, valuable feel
- **🏠 Background**: Soft Beige (#F5F5DC) - warm, inviting
- **🍫 Accent**: Chocolate Brown (#8B4513) - contrast and depth
- **📝 Typography**: Poppins (headlines), PT Sans (body text)

### 🔗 **Blockchain Integration**
- **🌐 EVM Chains**: RainbowKit + wagmi for Ethereum, Polygon, Optimism, Arbitrum, Base
- **☀️ Solana**: Official wallet adapters for Phantom and Solflare
- **🦊 MetaMask**: Integrated for crypto payments

### 🧠 **AI Integration**
- **🤖 Google Genkit** with Gemini 2.0 Flash model
- **⚡ Development tools** for AI feature iteration

### 🔧 **Backend & Services**
- **🔥 Firebase** for backend infrastructure
- **💳 Stripe** for traditional payment processing
- **🔄 TanStack Query** for state management and caching
- **🎯 React Hook Form** with Zod validation

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account
- Stripe account (for payments)

### ⚙️ Installation

1. **📥 Clone the repository**
   ```bash
   git clone <repository-url>
   cd wafflepayment
   ```

2. **📦 Install dependencies**
   ```bash
   npm install
   ```

3. **🔑 Environment Setup**
   Create a `.env.local` file with:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   
   # Stripe Configuration  
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   STRIPE_SECRET_KEY=your_stripe_secret
   
   # Google AI (for Genkit)
   GOOGLE_AI_API_KEY=your_google_ai_key
   
   # RainbowKit
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

4. **🏃‍♂️ Start Development Server**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:9002`

## 🛠️ Development Commands

```bash
# 🏃‍♂️ Start development server (port 9002)
npm run dev

# 🤖 Start AI development with Genkit
npm run genkit:dev

# 👀 Watch mode for AI development  
npm run genkit:watch

# 🏗️ Build for production
npm run build

# 🚀 Start production server
npm start

# 🔍 Run linting
npm run lint

# ✅ Type checking
npm run typecheck
```

## 📁 Project Structure

```
wafflepayment/
├── 🎨 src/
│   ├── 🤖 ai/                 # AI integration (Genkit)
│   ├── 📱 app/                # Next.js App Router pages
│   │   ├── 🏠 page.tsx        # Landing/login page
│   │   ├── 📊 dashboard/      # User dashboard
│   │   ├── 💳 top-up/         # Payment flows
│   │   ├── ✅ confirmation/   # Payment confirmation
│   │   └── 📜 history/        # Transaction history
│   ├── 🧩 components/         # Reusable UI components
│   │   ├── 🎛️ ui/            # shadcn/ui components
│   │   └── 🔧 header.tsx     # Navigation components
│   ├── 🎣 hooks/             # Custom React hooks
│   └── 📚 lib/               # Utility functions
├── 📖 docs/                  # Documentation
└── 🎨 styles/               # Global styles
```

## 🔑 Key Features Implementation

### 🔐 **Authentication Flow**
- Multi-wallet support (EVM + Solana)
- Traditional email/password option
- Protected routes with `useAuthGuard`

### 💳 **Payment Processing**
- Stripe integration for fiat payments
- MetaMask for crypto transactions
- Real-time payment confirmation

### 🎨 **UI/UX Excellence**
- Responsive design (mobile-first)
- Dark/light theme support
- Smooth animations and transitions
- Accessibility-focused components

### 🧠 **AI Integration**
- Google Genkit for intelligent features
- Development tools for rapid AI iteration

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Roadmap

- [ ] 🔄 Recurring subscription management
- [ ] 📊 Advanced analytics dashboard
- [ ] 🌍 Multi-language support
- [ ] 📱 Mobile app (React Native)
- [ ] 🤖 Enhanced AI features
- [ ] 🔗 More blockchain integrations

---

Built with ❤️ and 🧇 by the Waffle team
