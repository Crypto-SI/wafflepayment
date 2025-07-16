# 🧇 WafflePayment

> *Stack your credits like waffles, pay like a pro!* 

A modern crypto payment platform that lets users purchase credits through multiple payment methods including traditional cards and cryptocurrency. Built with Next.js, Supabase, and Web3 integration.

## ✨ Features

🔐 **Simple Authentication**
- Email-based signup and login
- Secure session management with Supabase Auth
- No wallet required for account creation

💳 **Flexible Payment Options**
- **Stripe Integration**: Pay with credit/debit cards
- **Multi-Chain Crypto**: Support for USDT/USDC across 5+ networks
- **Real-time Processing**: Instant credit addition after payment

🌐 **Multi-Chain Support**
- Ethereum Mainnet
- Polygon
- Arbitrum
- Base
- Optimism

📊 **Credit System**
- Purchase credit packages (1K, 2K, 4K+ credits)
- Monthly subscription options
- Transaction history tracking
- Real-time balance updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for card payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wafflepayment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   
   # WalletConnect
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:9002`

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe, Web3 (Wagmi + RainbowKit)
- **Blockchain**: Multi-chain support via Viem

## 📱 Usage

### For Users
1. **Sign Up**: Create account with email
2. **Choose Package**: Select credit package or subscription
3. **Pay**: Use card (Stripe) or crypto (USDT/USDC)
4. **Enjoy**: Credits added instantly to your account

### Payment Packages
- 🥞 **Single Stack**: 1,000 credits - $25
- 🧇 **Belgian Special**: 2,105 credits - $50 *(Most Popular)*
- 🏗️ **Waffle Tower**: 4,444 credits - $100 *(Best Value)*
- 🎪 **Waffle Club**: 1,000 credits/month - $20 *(Subscription)*

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

### Project Structure
```
src/
├── app/                 # Next.js app router
├── components/          # Reusable UI components
├── lib/                 # Utilities and configurations
├── hooks/               # Custom React hooks
└── mcp/                 # MCP server implementations
```

## 🌟 Special Features

### Buyback & Burn Initiative
11% of all purchases support the **Soonak Meme Token** ecosystem through buyback and burn mechanisms, contributing to the community and token value.

### Security First
- Secure payment processing
- Environment variable protection
- Input validation and sanitization
- Rate limiting on API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

Need help? Reach out to our support team or check the documentation.

---

*Made with 🧇 and ❤️ by the WafflePayment team*
