# 🔔 Relife Alarm App - Technical Documentation

A modern, accessible smart alarm application built with React, TypeScript, and comprehensive accessibility features.

## 🏗️ Technical Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + ShadCN/UI
- **State Management**: React Hooks + Context API
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Mobile**: Capacitor for native features
- **Testing**: Jest + React Testing Library + Vitest
- **Accessibility**: Custom hooks + ARIA implementation
- **Performance**: Web Workers + Service Workers + Caching

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # ShadCN UI components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── AlarmForm.tsx    # Alarm creation/editing
│   ├── AlarmList.tsx    # Alarm management
│   ├── BattleSystem.tsx # Gaming features
│   └── ...              # Other components
├── hooks/               # Custom React hooks
│   ├── useScreenReaderAnnouncements.ts
│   ├── useGamingAnnouncements.ts
│   ├── useFormAnnouncements.ts
│   └── ...              # Specialized hooks
├── services/            # Business logic & API calls
│   ├── analytics.ts     # Analytics service
│   ├── alarm.ts         # Alarm management
│   ├── voice.ts         # Voice recognition
│   └── ...              # Other services
├── utils/               # Utility functions
│   ├── screen-reader.ts # Accessibility utilities
│   ├── validation.ts    # Form validation
│   └── ...              # Helper functions
└── types/               # TypeScript definitions
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Development Commands
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Mobile Development
```bash
# Build for mobile
npm run build:mobile

# Sync with Capacitor
npm run cap:sync

# Run on iOS simulator
npm run cap:ios

# Run on Android emulator
npm run cap:android
```

## 🔊 Accessibility Architecture

### Screen Reader System
The app includes a comprehensive screen reader announcement system with specialized hooks:

- **useScreenReaderAnnouncements**: Base system for all announcements
- **useGamingAnnouncements**: Gaming feature announcements (battles, achievements)
- **useFormAnnouncements**: Form validation and interaction feedback
- **useSettingsAnnouncements**: Settings and preference changes
- **useProfileAnnouncements**: User profile editing feedback

### Key Features
- **WCAG 2.1 AA Compliant**: Full accessibility compliance
- **Smart Priority**: Polite vs assertive announcements
- **Debounced Updates**: Prevents announcement spam
- **State Tracking**: Automatic detection of relevant changes
- **Focus Management**: Smart keyboard navigation

## 🎮 Gaming System

### Battle System
- Real-time multiplayer battles
- Challenge friends to wake-up competitions
- Live leaderboards and rankings
- Achievement tracking

### Rewards System
- Experience points and levels
- Badge collection
- Achievement unlocks
- Progress tracking

## 🔐 Security & Privacy

### Data Protection
- End-to-end encryption for sensitive data
- Local storage options for privacy-conscious users
- GDPR compliant data handling
- Secure authentication with Supabase

### Content Security
- CSP headers implementation
- XSS protection
- CSRF token validation
- Secure API endpoints

## 📈 Performance Optimizations

### Loading Strategies
- Critical resource preloading
- Lazy loading for non-critical components
- Progressive image loading
- Service worker caching

### Bundle Optimization
- Code splitting by routes
- Tree shaking for unused code
- Dynamic imports for heavy features
- Optimized asset compression

### Runtime Performance
- React.memo for expensive components
- useMemo/useCallback optimization
- Virtualized lists for large datasets
- Web Workers for heavy computations

## 🧪 Testing Strategy

### Unit Tests
```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration
```

### Accessibility Tests
```bash
# Run accessibility tests
npm run test:a11y
```

### E2E Tests
```bash
# Run end-to-end tests
npm run test:e2e
```

## 🚀 Deployment

### Build Process
```bash
# Production build
npm run build

# Analyze bundle size
npm run analyze
```

### Environment Variables
Required environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_SENTRY_DSN=your_sentry_dsn
```

### Performance Monitoring
- Sentry for error tracking
- Web Vitals monitoring
- Custom analytics dashboard
- Performance budget alerts

## 🔄 API Integration

### Supabase Services
- **Authentication**: User management and sessions
- **Database**: PostgreSQL with real-time subscriptions
- **Storage**: File uploads and management
- **Edge Functions**: Serverless API endpoints

### External APIs
- **Speech API**: Voice recognition and synthesis
- **Weather API**: Smart alarm scheduling
- **Analytics**: User behavior tracking
- **Push Notifications**: Cross-platform notifications

## 🛠️ Development Guidelines

### Code Style
- ESLint + Prettier configuration
- TypeScript strict mode
- Functional components with hooks
- Comprehensive error boundaries

### Accessibility Requirements
- All interactive elements must have proper ARIA labels
- Screen reader announcements for state changes
- Keyboard navigation support
- Color contrast compliance (WCAG AA)

### Performance Requirements
- Lighthouse score 90+ (all categories)
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1

## 📱 Mobile Features

### Capacitor Plugins
- **Notifications**: Local and push notifications
- **Haptics**: Device vibration feedback
- **Device**: Device information and capabilities
- **Storage**: Secure local storage
- **Camera**: Profile picture uploads

### PWA Features
- **Offline Support**: Full app functionality offline
- **Install Prompt**: Native app installation
- **Background Sync**: Data synchronization
- **Push Notifications**: Web push support

## 🐛 Debugging

### Development Tools
```bash
# React DevTools
npm run dev:devtools

# Redux DevTools (if using Redux)
npm run dev:redux

# Accessibility audit
npm run audit:a11y
```

### Logging
- Console logging in development
- Sentry error reporting in production
- Performance monitoring
- User action tracking

## 🤝 Contributing

### Development Workflow
1. Create feature branch from main
2. Implement changes with tests
3. Run accessibility audit
4. Submit pull request
5. Code review and merge

### Accessibility Testing Checklist
- [ ] Screen reader compatibility (NVDA, JAWS, VoiceOver)
- [ ] Keyboard navigation functionality
- [ ] Color contrast validation
- [ ] Focus management verification
- [ ] ARIA label accuracy

## 📚 Additional Resources

- [Accessibility Implementation Guide](./docs/ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md)
- [Performance Optimization Guide](./docs/PERFORMANCE_OPTIMIZATION_GUIDE.md)
- [Mobile Build Guide](./docs/MOBILE_BUILD_GUIDE.md)
- [Security Guidelines](./docs/SECURITY_ACCESSIBILITY_STATUS.md)

---

**Built with accessibility, performance, and user experience as top priorities.**