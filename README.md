# Smart Alarm - Relife ⏰

A comprehensive, accessible smart alarm application with advanced features including gamification, AI automation, and industry-leading accessibility support.

## 🚀 Features

### ✨ Core Alarm Functionality
- Smart alarm scheduling with multiple time zones
- Voice mood selection (motivational, calm, energetic, etc.)
- Recurring alarms with custom schedules
- Snooze and dismiss functionality

### 🎮 Gamification & Social
- Battle system with friends
- Reward points and achievements
- Community hub and leaderboards
- AI-powered challenge generation

### ♿ Accessibility Excellence
- **WCAG 2.1 AA Compliant** with 37+ accessibility settings
- Comprehensive screen reader support
- Enhanced keyboard navigation (15+ shortcuts)
- Visual accessibility (high contrast, font scaling, color blind friendly)
- Motor accessibility (larger touch targets, haptic feedback)
- Cognitive accessibility (reduced motion, clear navigation)

### 📱 Mobile & PWA Support
- Native Android and iOS apps via Capacitor
- Progressive Web App (PWA) with offline support
- Cross-platform synchronization
- Background notifications

### 🔍 Analytics & Performance
- Real-time performance monitoring
- User behavior analytics with privacy compliance
- Advanced caching and optimization
- Core Web Vitals tracking

## 🛠 Quick Start

### Prerequisites
- Node.js 20+
- Bun (recommended) or npm
- For mobile builds: Android Studio / Xcode

### Installation
```bash
cd alarm-app
bun install
```

### Development
```bash
bun dev
```

### Build for Production
```bash
bun build
```

### Mobile Development
```bash
# Android
bun run build:android

# iOS  
bun run build:ios
```

## 📁 Project Structure

```
alarm-app/
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Business logic and APIs
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript definitions
├── android/                # Android app configuration
├── ios/                    # iOS app configuration
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🎯 Accessibility Features

The app includes comprehensive accessibility features:

- **Visual**: High contrast, font scaling, color blind support
- **Motor**: Enhanced focus rings, larger touch targets, keyboard navigation
- **Auditory**: Screen reader optimization, speech rate control
- **Cognitive**: Reduced motion, simplified navigation, clear feedback

Access via: Settings → Accessibility Dashboard

## 🧪 Testing

```bash
# Unit tests
bun test

# Accessibility tests
bun test:a11y

# Performance tests  
bun test:performance
```

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- [Accessibility Implementation](docs/ACCESSIBILITY_IMPLEMENTATION_COMPLETE.md)
- [Performance Optimization](docs/PERFORMANCE_OPTIMIZATION_GUIDE.md)
- [Mobile Build Guide](docs/MOBILE_BUILD_GUIDE.md)
- [Deployment Guide](docs/FINAL_DEPLOYMENT_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🌟 Features at a Glance

| Category | Features |
|----------|----------|
| **Alarms** | Smart scheduling, Voice moods, Recurring patterns |
| **Gamification** | Battle system, Rewards, Achievements, Leaderboards |
| **Accessibility** | 37+ settings, WCAG 2.1 compliance, Screen reader support |
| **Mobile** | Native apps, PWA, Offline support, Background notifications |
| **Analytics** | Performance monitoring, User insights, Privacy compliant |
| **Tech Stack** | React 19, TypeScript, Tailwind CSS, Capacitor, Supabase |

Built with ❤️ for universal accessibility and an amazing user experience.