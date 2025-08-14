# Relife Alarm App - Technical Documentation

A modern, feature-rich smart alarm application built with React, TypeScript, and cutting-edge web technologies. This technical documentation covers the development setup, architecture, and implementation details.

## 🛠️ Tech Stack

### Core Technologies
- **Frontend**: React 18 + TypeScript 5.8 + Vite 5
- **Styling**: TailwindCSS 4 + ShadCN UI Components
- **Mobile**: Capacitor 6 (iOS/Android native builds)
- **State Management**: React Hooks + Context API
- **Database**: Supabase (PostgreSQL) + Local SQLite
- **Authentication**: Supabase Auth + Multi-factor support
- **PWA**: Service Workers + Workbox + Web App Manifest

### Advanced Features
- **AI/ML**: TensorFlow.js for sleep pattern analysis
- **Audio**: Web Audio API + MediaSession API
- **Notifications**: Push API + Notification API + Background Sync
- **Accessibility**: Screen Reader APIs + Voice Recognition
- **Analytics**: Custom analytics system + Performance monitoring
- **Security**: CSP headers + CSRF protection + Input validation

## 📁 Project Structure

```
alarm-app/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # ShadCN UI components
│   │   ├── AlarmForm.tsx   # Alarm creation/editing
│   │   ├── AlarmList.tsx   # Alarm management
│   │   ├── BattleSystem.tsx # Gaming battle features
│   │   ├── Gamification.tsx # Achievement system
│   │   └── ...             # Additional components
│   ├── hooks/              # Custom React hooks
│   │   ├── useScreenReaderAnnouncements.ts # Accessibility
│   │   ├── useGamingAnnouncements.ts      # Gaming accessibility
│   │   ├── useAuth.ts                     # Authentication
│   │   └── ...                           # Additional hooks
│   ├── services/           # Business logic & APIs
│   │   ├── alarm.ts        # Alarm management
│   │   ├── analytics.ts    # Analytics system
│   │   ├── audio-manager.ts # Audio handling
│   │   ├── battle.ts       # Gaming battles
│   │   ├── notification.ts # Push notifications
│   │   └── ...            # Additional services
│   ├── utils/              # Helper utilities
│   │   ├── accessibility.ts # Accessibility helpers
│   │   ├── screen-reader.ts # Screen reader integration
│   │   ├── validation.ts   # Input validation
│   │   └── ...            # Additional utilities
│   └── types/              # TypeScript type definitions
├── android/                # Android native build files
├── ios/                   # iOS native build files  
├── public/                # Static assets
├── docs/                  # Additional documentation
└── database/             # Database schema files
```

## 🚀 Development Setup

### Prerequisites
- Node.js 20+ (recommended: 20.12.1)
- Bun 1.2+ (package manager)
- Git 2.30+

### Local Development
```bash
# Clone the repository
git clone https://github.com/Coolhgg/Relife.git
cd Relife/alarm-app

# Install dependencies
bun install

# Start development server
bun dev

# Open browser to http://localhost:5173
```

### Environment Setup
Create `.env` file with required variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ENV=development
```

### Building for Production
```bash
# Build web app
bun build

# Preview production build
bun preview

# Type checking
bun type-check

# Linting
bun lint
```

## 📱 Mobile Development

### Android Build
```bash
# Add Android platform
bunx cap add android

# Build and sync
bun build && bunx cap sync android

# Open in Android Studio
bunx cap open android
```

### iOS Build  
```bash
# Add iOS platform (macOS only)
bunx cap add ios

# Build and sync
bun build && bunx cap sync ios

# Open in Xcode
bunx cap open ios
```

## ♿ Accessibility Architecture

### Screen Reader Integration
- **Comprehensive announcement system** across all components
- **Smart prioritization** - Important events use "assertive", routine updates use "polite"
- **Gaming announcements** - Specialized announcements for battles, achievements, rewards
- **Form accessibility** - Real-time validation feedback and field descriptions
- **Settings accessibility** - Toggle changes, slider adjustments, preference updates

### Key Accessibility Hooks
```typescript
// Base announcement system
useScreenReaderAnnouncements() 

// Gaming-specific announcements
useGamingAnnouncements()

// Form interaction announcements  
useFormAnnouncements()

// Settings change announcements
useSettingsAnnouncements()

// User profile editing announcements
useProfileAnnouncements()
```

### ARIA Implementation
- **Live regions** for dynamic content updates
- **Semantic HTML** with proper heading hierarchy
- **Focus management** for keyboard navigation
- **High contrast** and reduced motion support

## 🎮 Gaming System Architecture

### Battle System
- **Real-time multiplayer battles** with WebSocket connections
- **Achievement tracking** with persistent storage
- **Leaderboards** with ranking algorithms
- **Reward distribution** system

### Core Gaming Services
```typescript
// Battle management
BattleService.createBattle()
BattleService.joinBattle()
BattleService.completeBattle()

// Achievement system
AchievementService.unlockAchievement()
AchievementService.trackProgress()

// Reward distribution
RewardService.claimReward()
RewardService.calculateRewards()
```

## 🔧 Performance Optimizations

### Code Splitting
- **Route-based splitting** with React.lazy()
- **Component-level splitting** for heavy features
- **Dynamic imports** for conditional functionality

### Caching Strategy
- **Service Worker** caching for offline functionality
- **Browser caching** with optimized cache headers
- **Memory management** for audio and image assets

### Bundle Optimization
- **Tree shaking** to eliminate unused code
- **Asset optimization** with Vite's built-in tools
- **Critical resource preloading**

## 🧪 Testing Strategy

### Test Structure
```bash
src/
├── __tests__/              # Integration tests
├── components/__tests__/   # Component tests
├── services/__tests__/     # Service tests
└── utils/__tests__/        # Utility tests
```

### Running Tests
```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Run specific test file
bun test AlarmForm.test.tsx

# Watch mode during development
bun test --watch
```

### Test Coverage Goals
- **Components**: >90% coverage
- **Services**: >95% coverage  
- **Utils**: >95% coverage
- **Critical paths**: 100% coverage

## 📊 Analytics & Monitoring

### Performance Monitoring
- **Core Web Vitals** tracking (LCP, FID, CLS)
- **Custom metrics** for alarm reliability
- **User behavior analytics** with privacy protection
- **Error tracking** with detailed stack traces

### Privacy-First Analytics
- **No personal data collection** without consent
- **Local-first** analytics with optional cloud sync
- **GDPR compliant** with full user control
- **Anonymous usage patterns** only

## 🔒 Security Implementation

### Data Protection
- **End-to-end encryption** for sensitive data
- **Secure token storage** with automatic rotation
- **CSRF protection** on all forms
- **Input sanitization** and validation

### Authentication Security
- **Multi-factor authentication** support
- **Session management** with secure cookies
- **Password security** with bcrypt hashing
- **Account lockout** protection

## 📚 API Documentation

### Alarm Management
```typescript
// Create alarm
AlarmService.createAlarm(alarmData)

// Update alarm  
AlarmService.updateAlarm(id, updates)

// Delete alarm
AlarmService.deleteAlarm(id)

// Get all alarms
AlarmService.getAllAlarms()
```

### Gaming APIs
```typescript  
// Battle system
BattleService.createBattle(battleConfig)
BattleService.getBattleHistory(userId)

// Achievements
AchievementService.getUserAchievements(userId)
AchievementService.getAvailableAchievements()
```

## 🐛 Debugging & Development Tools

### Debug Mode
```bash
# Enable debug logging
VITE_DEBUG=true bun dev

# Component debugging
VITE_DEBUG_COMPONENTS=true bun dev

# Service debugging  
VITE_DEBUG_SERVICES=true bun dev
```

### Browser DevTools Integration
- **React DevTools** for component inspection
- **Performance tab** for optimization
- **Application tab** for PWA debugging
- **Console logging** with structured output

## 🚀 Deployment

### Production Build
```bash
# Full production build
bun build

# Build with analytics
bun build --mode production

# Build for specific environment
bun build --mode staging
```

### Environment Configuration
- **Development**: Hot reload, debug logging, mock services
- **Staging**: Production build, test analytics, staging APIs  
- **Production**: Optimized build, production analytics, live APIs

## 🤝 Development Guidelines

### Code Style
- **TypeScript strict mode** enabled
- **ESLint + Prettier** for consistent formatting
- **Conventional commits** for changelog generation
- **Component-first** architecture

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make commits with conventional format
git commit -m "feat: add new alarm sound feature"

# Push and create PR
git push origin feature/your-feature
```

### Pull Request Requirements
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Accessibility tests verified
- [ ] Performance impact assessed
- [ ] Documentation updated

---

**Ready to contribute?** Check out our [Contributing Guide](../docs/CONTRIBUTING.md) and start building amazing features! 🚀