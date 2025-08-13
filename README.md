# Relife - Smart Alarm App

A comprehensive, feature-rich smart alarm application with advanced accessibility, performance monitoring, and AI-powered features.

## 🚀 Features

### Core Alarm Features
- **Smart Alarm Management** - Create, edit, delete, and manage multiple alarms
- **Voice Mood Selection** - Choose from different voice personalities (gentle, motivational, drill-sergeant)
- **Flexible Scheduling** - Set one-time or recurring alarms with custom repeat patterns
- **Advanced Snoozing** - Intelligent snooze with progressive difficulty

### AI & Smart Features
- **AI-Powered Rewards System** - Gamified wake-up experience with achievements
- **Sleep Pattern Analysis** - Track and analyze your sleep patterns
- **Smart Scheduling** - AI-suggested optimal wake times based on sleep cycles
- **Performance Analytics** - Comprehensive app performance monitoring

### Accessibility Features
- **Screen Reader Support** - Full ARIA compliance with live announcements
- **Voice Control** - Voice-activated alarm management and navigation
- **Keyboard Navigation** - Complete keyboard shortcuts and navigation
- **Mobile Accessibility** - Touch gestures and mobile-optimized interactions
- **Enhanced Focus Management** - Advanced focus indicators and management

### Technical Features
- **Offline Support** - Works without internet connection
- **PWA Ready** - Install as a native app on any device
- **Real-time Sync** - Data synchronization across devices
- **Performance Monitoring** - Core Web Vitals tracking and optimization
- **Security** - CSRF protection, data encryption, and secure authentication
- **Cross-Platform** - Web, Android, and iOS support via Capacitor

### User Experience
- **Modern UI/UX** - Clean, intuitive interface with dark/light mode
- **Responsive Design** - Optimized for all screen sizes
- **Analytics Dashboard** - Detailed usage and performance insights
- **User Authentication** - Secure login with Supabase integration
- **Profile Management** - Customizable user profiles and preferences

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Mobile**: Capacitor (iOS & Android)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Hooks + Context
- **Testing**: Jest, React Testing Library
- **Performance**: Web Workers, Service Workers, Lazy Loading
- **Accessibility**: ARIA, Screen Reader APIs, Voice Recognition
- **Analytics**: Custom analytics with privacy compliance

## 📱 Installation & Setup

### Prerequisites
- Node.js 16+
- npm or bun package manager

### Web Development
```bash
cd alarm-app
npm install
npm run dev
```

### Mobile Development
```bash
# iOS
npm run build:ios
npx cap open ios

# Android
npm run build:android
npx cap open android
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run accessibility tests
npm run test:a11y

# Run performance tests
npm run test:performance

# Generate coverage report
npm run test:coverage
```

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: Optimized for LCP, FID, CLS
- **Bundle Size**: Optimized with lazy loading and code splitting
- **Accessibility**: WCAG 2.1 AA compliant

## 🔒 Security

- CSRF protection enabled
- Secure authentication with Supabase
- Data encryption for sensitive information
- Privacy-compliant analytics
- Regular security audits

## 📖 Documentation

- `/docs` - Comprehensive API documentation
- `/alarm-app/README.md` - Development setup guide
- `/alarm-app/TECHNICAL_SUMMARY.md` - Technical architecture overview
- `/alarm-app/ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md` - Accessibility features
- `/alarm-app/PERFORMANCE_OPTIMIZATION_GUIDE.md` - Performance guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests and ensure all pass
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔄 Version History

- **v2.0.0** - Consolidated single app with all features
- **v1.5.0** - Added accessibility improvements
- **v1.4.0** - Performance monitoring and analytics
- **v1.3.0** - AI rewards system
- **v1.2.0** - Mobile app support
- **v1.1.0** - PWA features
- **v1.0.0** - Initial release

---

Built with ❤️ for better mornings and accessible technology.