# Mobile Testing Quick Setup

## ⚡ 30-Second Setup

```bash
# 1. Install dependencies
npm install

# 2. Verify setup
./scripts/test-mobile-setup.sh

# 3. Run first test
npm run test:mobile:mock
```

## 📋 Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] Android Studio installed (for Android testing)
- [ ] Xcode installed (for iOS testing, macOS only)
- [ ] Dependencies installed: `npm install`

### Quick Validation
- [ ] Mock tests pass: `npm run test:mobile:mock`
- [ ] Setup script passes: `./scripts/test-mobile-setup.sh`
- [ ] Build completes: `npm run build && npx cap sync`

### Android Setup (Optional)
- [ ] Android SDK configured
- [ ] AVD created (API 30+)
- [ ] Emulator starts: `$ANDROID_HOME/emulator/emulator -avd TestDevice`
- [ ] Real device tests pass: `npm run test:mobile:device`

### iOS Setup (Optional, macOS only)
- [ ] Xcode command line tools installed
- [ ] iOS Simulator available
- [ ] iOS project builds in Xcode

## 🆘 Common Issues

**Tests failing?**
```bash
# Clear cache and retry
npm run test:mobile:mock -- --clearCache
```

**Device not connecting?**
```bash
# Android
adb kill-server && adb start-server

# iOS
xcrun simctl shutdown all && xcrun simctl boot "iPhone 14"
```

**Build issues?**
```bash
# Clean and rebuild
npx cap clean && npm run build && npx cap sync
```

## 📚 Full Documentation
See [mobile-testing-guide.md](mobile-testing-guide.md) for complete documentation.

---

*Need help? Check the troubleshooting section in the main guide or ask in #mobile-testing*