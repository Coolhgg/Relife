# 🌅 Relife - Smart Alarm & Theme Customization App

[![Security Analysis](https://github.com/Coolhgg/Relife/actions/workflows/security-analysis.yml/badge.svg)](https://github.com/Coolhgg/Relife/actions/workflows/security-analysis.yml)
[![Security Monitoring](https://github.com/Coolhgg/Relife/actions/workflows/security-monitoring.yml/badge.svg)](https://github.com/Coolhgg/Relife/actions/workflows/security-monitoring.yml)
[![CodeQL](https://github.com/Coolhgg/Relife/actions/workflows/security-analysis.yml/badge.svg?event=schedule)](https://github.com/Coolhgg/Relife/security/code-scanning)
[![Dependabot Status](https://img.shields.io/badge/dependabot-active-brightgreen.svg)](https://github.com/Coolhgg/Relife/network/dependencies)

A comprehensive smart alarm application with advanced theme customization and cloud synchronization
capabilities.

## ✨ Features

### 🎨 Advanced Theme System

- **10 Custom Themes** with unique personalities:
  - **🎮 Gaming** - Neon RGB colors perfect for gaming setups
  - **💼 Professional** - Clean corporate design for work environments
  - **📺 Retro** - 80s-inspired neon aesthetics
  - **🌆 Cyberpunk** - Futuristic matrix-style theme
  - **🎯 Focus** - Minimal grayscale for concentration

### 🌟 Seasonal Themes

- **🌸 Spring** - Fresh greens and pastels
- **☀️ Summer** - Bright blues and warm oranges
- **🍁 Autumn** - Rich oranges and golden tones
- **❄️ Winter** - Cool blues and winter teals

### ☁️ Cloud Sync

- **Real-time synchronization** across all devices
- **Intelligent conflict resolution** with multiple merge strategies
- **Offline support** with 24-hour local caching
- **Authentication integration** for secure sync
- **Auto-sync** with configurable intervals

### 🚀 Smart Alarm Features

- **AI-powered wake optimization** based on sleep patterns
- **Adaptive snooze intervals** that learn from your habits
- **Weather-aware scheduling** with automatic adjustments
- **Voice mood detection** and personalized responses
- **Advanced scheduling** with complex condition support
- **Accessibility features** with screen reader support

### 📊 Analytics & Monitoring

- **Performance monitoring** with Core Web Vitals tracking
- **User behavior analytics** with privacy-first approach
- **Sleep pattern analysis** and insights
- **Theme usage statistics** and recommendations

### 🔒 Security & Compliance

- **Automated security scanning** with CodeQL and Dependabot
- **Daily vulnerability assessments** for dependencies
- **Secrets detection** with TruffleHog integration
- **License compliance monitoring** for legal compliance
- **CSRF protection** and secure headers implementation
- **Data encryption** at rest and in transit
- **Privacy-first design** with minimal data collection
- **Security incident response** procedures and monitoring

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS V4 with custom theme system
- **State Management**: React Context + Hooks
- **Database**: Supabase with real-time subscriptions
- **Authentication**: Supabase Auth with multi-provider support
- **PWA**: Service Workers + Web App Manifest
- **Testing**: Jest + React Testing Library + Playwright
- **Deployment**: Docker + Cloudflare Workers
- **Mobile**: Capacitor (iOS/Android)

## 🌍 Internationalization

**22 Languages Supported** - Making productivity accessible worldwide:

- **English**: `en` (US), `en-GB` (UK), `en-AU` (Australia)
- **Spanish**: `es` (Spain), `es-MX` (Mexico), `es-419` (Latin America)
- **French**: `fr` (France), `fr-CA` (Canada)
- **European**: `de` (German), `it` (Italian), `pt` (Portuguese), `pt-BR` (Brazilian Portuguese),
  `ru` (Russian)
- **Asian**: `ja` (Japanese), `zh` (Chinese Simplified), `zh-TW` (Chinese Traditional), `ko`
  (Korean), `hi` (Hindi)
- **Southeast Asian**: `th` (Thai), `vi` (Vietnamese), `bn` (Bengali), `id` (Indonesian)
- **Middle Eastern**: `ar` (Arabic)

### Translation Features

- **Cultural localization** - Adapted content for local customs and preferences
- **Right-to-left support** - Automatic layout mirroring for Arabic and other RTL languages
- **Regional variants** - Specific adaptations for different regions (e.g., Mexican vs. Spanish
  Spanish)
- **Comprehensive coverage** - 535+ translation keys per language across 6 categories

### Contributing Translations

Want to help make Relife available in more languages or improve existing translations?

📚 **[Translation Guidelines](TRANSLATION_GUIDELINES.md)** - Complete guide for contributors 🚀
**[Quick Start for Translators](docs/TRANSLATOR_QUICK_START.md)** - Get started in 5 minutes 🔧
**[Troubleshooting Guide](docs/TRANSLATION_TROUBLESHOOTING.md)** - Common issues and solutions

Check translation status and contribute:

```bash
# Check current translation completeness
node scripts/manage-translations.mjs validate

# Generate templates for missing translations
node scripts/manage-translations.mjs generate
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Docker (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Coolhgg/Relife.git
   cd Relife
   ```

2. **Install dependencies**

   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**

   ```bash
   bun dev
   # or
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Docker Setup

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d
```

## 🎨 Theme Customization

### Using Existing Themes

1. Navigate to **Settings** → **Theme & Personalization**
2. Choose from organized categories:
   - Primary Themes (Light, Dark, Auto)
   - Accessibility Themes (High Contrast, Focus)
   - Specialized Themes (Gaming, Professional, Retro, Cyberpunk)
   - Seasonal Themes (Spring, Summer, Autumn, Winter)
   - Nature & Abstract Themes

### Cloud Sync Setup

1. Navigate to **Settings** → **Cloud Sync**
2. Toggle **Enable Cloud Sync**
3. Configure sync preferences:
   - Auto-sync theme changes
   - Sync personalization settings
   - Sync custom themes (if applicable)

### Custom Themes

The app supports custom theme creation through the `useTheme` hook:

```typescript
import { useTheme } from './hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, themeConfig } = useTheme();

  // Switch themes
  const switchToGaming = () => setTheme('gaming');

  // Access theme colors
  const primaryColor = themeConfig.colors.primary[500];
}
```

## 📱 Mobile Apps

Build native mobile apps using Capacitor:

### iOS

```bash
bun run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

### Android

```bash
bun run build
npx cap add android
npx cap sync android
npx cap open android
```

## 🔧 Configuration

### Environment Variables

```env
# Core App
VITE_APP_NAME="Relife"
VITE_API_BASE_URL="https://api.relife.app"

# Supabase
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Cloud Sync
VITE_CLOUD_SYNC_ENABLED=true
VITE_SYNC_INTERVAL=30000

# Analytics
VITE_POSTHOG_KEY="your-posthog-key"
VITE_ANALYTICS_ENABLED=true
```

### Theme Configuration

Themes are configured in `src/hooks/useTheme.ts` with complete color palettes:

```typescript
const GAMING_THEME = {
  colors: {
    primary: { 500: '#00ff88' },
    secondary: { 500: '#4040ff' },
    accent: { 500: '#ff007f' },
  },
  // ... complete theme configuration
};
```

## 🧪 Testing

```bash
# Unit tests
bun test

# E2E tests
bun run test:e2e

# Type checking
bun run typecheck

# Linting
bun run lint
```

## 📦 Build & Deploy

### Development Build

```bash
bun run build:dev
```

### Production Build

```bash
bun run build
```

### Deploy to Cloudflare

```bash
bun run deploy
```

## 🎯 Key Architecture

### Theme System

- **ThemeProvider**: Context-based theme management
- **CloudSyncService**: Handles cross-device synchronization
- **CSS Variables**: Dynamic theme switching without page reload
- **Conflict Resolution**: Intelligent merging of theme preferences

### Smart Alarm Core

- **AlarmEngine**: Core scheduling and triggering logic
- **AIAutomation**: Machine learning for sleep optimization
- **WeatherIntegration**: Weather-aware alarm adjustments
- **VoiceEngine**: Natural language processing for interactions

### Data Flow

```
User Input → Theme/Alarm State → Local Storage → Cloud Sync → Real-time Updates
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- TailwindCSS for the utility-first CSS framework
- Supabase for the backend infrastructure
- Vite for the blazing fast build tool

---

**Made with ❤️ for better mornings and beautiful themes**
