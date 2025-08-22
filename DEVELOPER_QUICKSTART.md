# 🚀 Developer Quickstart Guide

> **Post-Consolidation Setup** - Updated after merging 22+ branches into unified repository

## Quick Setup

**Prerequisites:** Node.js 20+, Git, and your favorite IDE

```bash
# 1. Clone and setup
git clone https://github.com/Coolhgg/Relife.git
cd Relife
bun install

# 2. Start development
bun run dev        # Main alarm app
bun run dev:email  # Email campaign dashboard

# 3. Run tests
bun run test       # Unit tests
bun run type-check # TypeScript validation
bun run lint       # Code quality
```

## 📱 What's in the Repository

After our recent consolidation, we now have a clean, focused structure:

### 🔥 Main Applications

1. **Smart Alarm App** (`src/`)
   - React + TypeScript PWA
   - AI-powered alarms, themes, gamification
   - Premium subscriptions, battle modes
   - 22+ language support, full accessibility

2. **Email Campaign Dashboard** (`relife-campaign-dashboard/`)
   - Marketing automation with 6 personas
   - AI content optimization, A/B testing
   - Campaign analytics and conversion tracking

### 📱 Mobile Setup

- **Android**: `android/` - Production-ready Gradle project
- **iOS**: `ios/` - Complete Xcode project with Swift
- **Capacitor**: `capacitor.config.ts` - Native mobile integration

## 🛠 Development Commands

### Core Development

```bash
bun run dev                    # Start main app (localhost:5173)
bun run dev:email             # Start email dashboard (localhost:5174)
bun run build                 # Production build
bun run preview               # Preview production build
```

### Quality Assurance

```bash
bun run test                  # Run all unit tests
bun run test:watch           # Watch mode testing
bun run test:integration     # Integration tests
bun run type-check           # TypeScript validation
bun run lint                 # ESLint + auto-fix
bun run a11y:test           # Accessibility testing
```

### Mobile Development

```bash
bun run build:mobile        # Build for mobile
bun run android:build       # Android production build
bun run ios:build           # iOS production build
bun run mobile:sync         # Sync changes to mobile
```

## 🎯 Feature Overview

### Smart Alarm Features

- **AI Optimization**: Weather-based scheduling, sleep pattern analysis
- **Voice Commands**: Natural language alarm setting, status inquiries
- **Battle System**: Competitive wake-up challenges with friends
- **Premium Features**: Advanced themes, unlimited alarms, analytics
- **Accessibility**: Full WCAG compliance, 22+ language support

### Email Campaign Features

- **Persona Targeting**: 6 micro-personas (Struggling Sam, Busy Ben, etc.)
- **AI Content**: GPT-powered email optimization and personalization
- **Advanced Analytics**: Cohort analysis, conversion tracking, A/B testing
- **Integration**: MailChimp, ConvertKit, ActiveCampaign support

## 📂 Key Directories

```
src/
├── components/          # React components (400+ components)
├── hooks/              # Custom React hooks (50+ hooks)
├── services/           # API services and integrations
├── themes/             # Theme system (10+ custom themes)
├── __tests__/          # Test suites (comprehensive coverage)
└── types/              # TypeScript definitions

relife-campaign-dashboard/
├── src/components/     # Email campaign UI components
├── src/services/       # Marketing automation services
└── src/backend/        # Campaign analytics and optimization

tests/
├── e2e/               # End-to-end Playwright tests
├── integration/       # Cross-component integration tests
└── utils/             # Testing utilities and helpers
```

## 🧪 Testing Strategy

### Unit Tests

- **Jest + Vitest**: Fast unit testing with React Testing Library
- **Coverage Target**: >80% code coverage maintained
- **Mocking**: Comprehensive mocks for external services

### Integration Tests

- **Component Integration**: Cross-component workflow testing
- **API Integration**: External service integration validation
- **Mobile Testing**: Capacitor and native functionality tests

### E2E Tests

- **Playwright**: Multi-browser automated testing
- **Accessibility**: Automated WCAG compliance testing
- **Performance**: Core Web Vitals and performance metrics

## 🎨 Theming & Customization

### Built-in Themes

- **10+ Predefined Themes**: Dark, light, high-contrast, seasonal
- **Custom Theme Creator**: Visual theme builder with live preview
- **Sound Themes**: Custom audio themes with AI-generated sounds
- **Accessibility**: High contrast, large fonts, reduced motion support

### Theme Development

```bash
bun run theme:create     # Launch theme creator
bun run theme:validate  # Validate theme accessibility
bun run sounds:generate # Generate custom sound themes
```

## 🌍 Internationalization

### Supported Languages (22+)

- English, Spanish, French, German, Italian, Portuguese
- Japanese, Korean, Chinese (Simplified/Traditional)
- Arabic, Hebrew, Russian, Dutch, Swedish, Norwegian
- And more with RTL language support

### Translation Workflow

```bash
bun run i18n:extract    # Extract translatable strings
bun run i18n:validate   # Validate translation files
bun run i18n:missing    # Find missing translations
```

## 🚀 Deployment

### Development Deploy

```bash
bun run build          # Production build
bun run deploy:dev     # Deploy to development environment
```

### Mobile Deploy

```bash
bun run mobile:build   # Build mobile apps
bun run android:deploy # Deploy to Google Play Console
bun run ios:deploy     # Deploy to App Store Connect
```

## 📚 Documentation

### Essential Reads

- **[Theme System Guide](docs/THEME_SYSTEM.md)** - Custom theming and sound themes
- **[Translation Guide](docs/TRANSLATOR_QUICK_START.md)** - Adding new languages
- **[Accessibility Guide](docs/A11Y-Guide.md)** - WCAG compliance and testing
- **[Mobile Setup](mobile-testing-guide.md)** - iOS/Android development

### Campaign Documentation

- **[Persona Strategy](ENHANCED_PERSONA_FOCUS_STRATEGY.md)** - 6 micro-personas guide
- **[Email Campaigns](EMAIL_CAMPAIGN_SETUP_GUIDE.md)** - Campaign automation setup
- **[Analytics Integration](PERSONA_ANALYTICS_INTEGRATION_GUIDE.md)** - Data tracking

## 🐛 Troubleshooting

### Common Issues

**Build Errors?**

```bash
rm -rf node_modules bun.lock
bun install
```

**TypeScript Errors?**

```bash
bun run type-check --watch
# Check src/types/ for missing definitions
```

**Test Failures?**

```bash
bun run test --coverage
# Review coverage report at coverage/lcov-report/index.html
```

**Mobile Build Issues?**

```bash
bun run mobile:clean
bun run mobile:sync
```

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Run tests: `bun run test && bun run type-check`
3. Commit with conventional format: `feat: add amazing feature`
4. Push and create PR with comprehensive description

### Code Standards

- **ESLint**: Enforced code style and best practices
- **TypeScript**: Strict mode with comprehensive type coverage
- **Accessibility**: WCAG AA compliance required
- **Testing**: New features require tests (unit + integration)

---

## 🎉 Success Metrics

Our recent consolidation achieved:

- ✅ **22+ branches merged** into clean, unified structure
- ✅ **2 focused applications** (main app + email campaigns)
- ✅ **Complete mobile integration** (Android + iOS)
- ✅ **Comprehensive testing** (unit, integration, e2e, a11y)
- ✅ **Developer experience** optimized for productivity

**Ready to build something amazing?** 🚀

Start with `bun run dev` and explore the consolidated features!
