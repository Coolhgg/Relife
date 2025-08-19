# Mobile Testing Guide - Relife Alarm App

## 📱 Overview

This guide covers the comprehensive mobile testing infrastructure for the Relife alarm application, including Capacitor plugin testing, device emulation, and CI/CD integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/bun installed
- Android Studio (for Android testing)
- Xcode (for iOS testing, macOS only)

### Installation
```bash
# Install dependencies
npm install

# Install Capacitor platforms (if not already done)
npx cap add android
npx cap add ios

# Build and sync
npm run build
npx cap sync
```

## 🧪 Testing Modes

### 1. Mock Testing (Fast, Default)
Uses simulated Capacitor plugins for rapid development and CI.

```bash
# Run unit tests with mocked plugins
npm run test:mobile:mock

# Run with coverage
npm run test:mobile:coverage

# Watch mode for development
npm run test:mobile:watch
```

### 2. Real Device Testing
Tests against actual device/emulator with real Capacitor plugins.

```bash
# Run tests on real device/emulator
npm run test:mobile:device

# Run smoke tests
npm run test:mobile:smoke
```

### 3. Native E2E Testing (Detox)
Full native app testing with Detox framework.

```bash
# Build and test Android
npm run test:detox:build:android
npm run test:detox:android

# Build and test iOS (macOS only)
npm run test:detox:build:ios
npm run test:detox:ios
```

## 📋 Testing Workflows

### Daily Development Workflow
```bash
# 1. Start with fast mock tests during development
npm run test:mobile:mock

# 2. Validate on real device before committing
npm run test:mobile:device

# 3. Optional: Run native tests for critical features
npm run test:detox:android
```

### Pre-Deployment Workflow
```bash
# 1. Full test suite
npm run test:mobile:coverage

# 2. Real device validation
npm run test:mobile:device

# 3. Native smoke tests
npm run test:mobile:smoke

# 4. Build verification
npm run build
npx cap sync
```

## 🔧 Environment Configuration

### Mock vs Real Device Toggle
Control testing mode with environment variables:

```bash
# Use mocks (default)
USE_REAL_DEVICE=false npm run test

# Use real devices
USE_REAL_DEVICE=true npm run test
```

### Plugin Mock Configuration
Located in `tests/mocks/capacitor-plugins.ts`:

```typescript
export const CapacitorMocks = {
  Alarm: {
    schedule: jest.fn(),
    cancel: jest.fn(),
    getAll: jest.fn(() => Promise.resolve([]))
  },
  Audio: {
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    setVolume: jest.fn()
  },
  Notifications: {
    schedule: jest.fn(),
    cancel: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve({ display: 'granted' }))
  }
  // ... more plugins
};
```

## 📱 Device Setup

### Android Setup
1. **Install Android Studio** and Android SDK
2. **Create AVD (Android Virtual Device)**:
   ```bash
   # List available AVDs
   $ANDROID_HOME/tools/bin/avdmanager list avd
   
   # Create new AVD (API 30+)
   $ANDROID_HOME/tools/bin/avdmanager create avd -n TestDevice -k "system-images;android-30;google_apis;x86_64"
   ```

3. **Start emulator**:
   ```bash
   # Start emulator
   $ANDROID_HOME/emulator/emulator -avd TestDevice
   
   # Verify connection
   adb devices
   ```

4. **Build and install app**:
   ```bash
   npm run build
   npx cap sync android
   cd android && ./gradlew assembleDebug
   
   # Install APK
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### iOS Setup (macOS only)
1. **Install Xcode** from Mac App Store
2. **Open iOS Simulator**:
   ```bash
   # List available simulators
   xcrun simctl list devices
   
   # Boot specific simulator
   xcrun simctl boot "iPhone 14"
   ```

3. **Build and install**:
   ```bash
   npm run build
   npx cap sync ios
   npx cap open ios
   # Build in Xcode and install to simulator
   ```

## 🧩 Plugin Testing Strategies

### Unit Testing with Mocks
Best for rapid development and CI:

```typescript
// Example: Alarm component test
import { render, fireEvent } from '@testing-library/react';
import { AlarmForm } from '../components/AlarmForm';
import { CapacitorMocks } from '../tests/mocks/capacitor-plugins';

test('should schedule alarm when form submitted', async () => {
  const { getByTestId } = render(<AlarmForm />);
  
  fireEvent.click(getByTestId('save-alarm'));
  
  expect(CapacitorMocks.Alarm.schedule).toHaveBeenCalledWith({
    time: '07:00',
    enabled: true,
    days: [1, 2, 3, 4, 5]
  });
});
```

### Integration Testing with Real Plugins
For critical path validation:

```typescript
// Example: E2E alarm flow
import { MobileTestHelpers } from '../tests/utils/mobile-test-helpers';

test('alarm scheduling integration', async () => {
  const helper = new MobileTestHelpers();
  
  // Schedule alarm
  await helper.scheduleAlarm('07:00', ['monday', 'tuesday']);
  
  // Verify in native plugin
  const alarms = await helper.getAllAlarms();
  expect(alarms).toHaveLength(1);
  expect(alarms[0].time).toBe('07:00');
});
```

## 🔍 Debugging & Troubleshooting

### Common Issues

#### Mock Tests Failing
```bash
# Clear Jest cache
npm run test:mobile:mock -- --clearCache

# Verify mock configuration
grep -r "jest.mock" tests/mocks/
```

#### Real Device Tests Failing
```bash
# Check device connection
adb devices  # Android
xcrun simctl list devices  # iOS

# Verify app installation
adb shell pm list packages | grep relife  # Android
xcrun simctl listapps booted | grep relife  # iOS
```

#### Plugin Integration Issues
```bash
# Check plugin registration
adb logcat | grep -i capacitor  # Android
tail -f ~/Library/Developer/CoreSimulator/Devices/*/data/var/mobile/Containers/Data/Application/*/tmp/console.log  # iOS
```

### Debug Mode
Enable verbose logging:

```bash
# Enable debug logs
DEBUG=capacitor* npm run test:mobile:device

# Enable Detox debug
DETOX_LOG_LEVEL=debug npm run test:detox:android
```

### Log Locations
- **Android logs**: `adb logcat`
- **iOS logs**: Console.app or Xcode device logs
- **Jest logs**: `tests/logs/`
- **CI artifacts**: GitHub Actions artifacts tab

## 📊 CI/CD Integration

### GitHub Actions Workflow
The mobile testing CI runs automatically on PRs:

```yaml
# .github/workflows/mobile-testing.yml
name: Mobile Testing
on: [push, pull_request]

jobs:
  mock-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Mock Testing
        run: npm run test:mobile:mock
  
  android-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Android Emulator Testing
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 30
          script: npm run test:mobile:smoke
```

### CI Artifacts
- Screenshots from emulator runs
- Device logs and crash reports
- Test reports (HTML/JSON)
- APK build artifacts

### Local CI Testing
```bash
# Simulate CI environment locally
USE_REAL_DEVICE=false npm run ci:test:mobile

# Run setup validation
./scripts/test-mobile-setup.sh
```

## 📝 Best Practices

### Test Organization
```
tests/
├── mocks/
│   └── capacitor-plugins.ts      # Plugin mocks
├── utils/
│   └── mobile-test-helpers.ts    # Test utilities
├── e2e/
│   └── mobile/                   # E2E mobile tests
└── smoke/
    └── capacitor-integration.test.ts  # Basic integration tests
```

### Writing Effective Tests

#### 1. Start with Mocks
```typescript
// Good: Fast, reliable unit test
test('alarm validation', async () => {
  const result = await validateAlarmTime('25:00');
  expect(result.isValid).toBe(false);
});
```

#### 2. Use Real Devices for Critical Paths
```typescript
// Good: Integration test for critical functionality
test('alarm actually rings on device', async () => {
  await helper.scheduleAlarm('now + 1 minute');
  await helper.waitForAlarmRing(70000); // Wait 70s
  expect(helper.isAlarmRinging()).toBe(true);
});
```

#### 3. Mock External Dependencies
```typescript
// Mock external services in mobile tests
jest.mock('../services/analytics', () => ({
  track: jest.fn(),
  identify: jest.fn()
}));
```

### Performance Guidelines
- **Use mocks for 90% of tests** (fast feedback loop)
- **Use real devices for 10% of critical tests** (confidence in functionality)
- **Run native tests only for major releases** (comprehensive but slow)
- **Parallelize test execution** when possible

### Code Coverage
Target coverage levels:
- **Unit tests with mocks**: >95%
- **Integration tests**: >80% of critical paths
- **E2E smoke tests**: 100% of core user journeys

## 🛠 Development Tools

### Useful Commands
```bash
# Quick plugin check
npx cap ls                         # List installed plugins

# Debug plugin issues
npx cap doctor                     # Diagnose setup issues

# Clean and rebuild
npx cap clean && npm run build && npx cap sync

# Monitor device logs
npm run mobile:logs:android        # Android logs
npm run mobile:logs:ios            # iOS logs
```

### IDE Integration
Recommended VS Code extensions:
- **Jest Runner**: Run individual tests
- **Capacitor**: Syntax highlighting for configs
- **Android iOS Emulator**: Quick emulator control

### Useful Resources
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Detox Testing Guide](https://github.com/wix/Detox/blob/master/docs/README.md)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Android Testing](https://developer.android.com/training/testing)
- [iOS Testing](https://developer.apple.com/documentation/xctest)

## 📞 Getting Help

### Internal Resources
- **Mobile Testing Channel**: #mobile-testing (Slack)
- **Code Reviews**: Tag `@mobile-team` for plugin-related changes
- **Documentation**: This guide + inline code comments

### External Resources
- **Capacitor Community**: [Discord](https://discord.com/invite/UPYYRhtyzp)
- **GitHub Issues**: File issues with reproduction steps
- **Stack Overflow**: Tag questions with `capacitor` and `ionic`

---

## 🏁 Quick Reference

### Most Common Commands
```bash
# Daily development
npm run test:mobile:mock           # Fast mock testing
npm run test:mobile:device         # Real device validation

# Pre-commit
npm run test:mobile:coverage       # Coverage report
./scripts/test-mobile-setup.sh     # Validate setup

# Debugging
npm run mobile:logs:android        # View Android logs
npm run mobile:logs:ios            # View iOS logs

# CI simulation
USE_REAL_DEVICE=false npm run ci:test:mobile
```

### Environment Variables
- `USE_REAL_DEVICE=true|false` - Toggle mock/real device testing
- `DEBUG=capacitor*` - Enable debug logging
- `DETOX_LOG_LEVEL=debug` - Detox verbose logging

### File Locations
- **Mocks**: `tests/mocks/capacitor-plugins.ts`
- **Utils**: `tests/utils/mobile-test-helpers.ts`
- **Config**: `.detoxrc.json`, `jest.config.js`
- **CI**: `.github/workflows/mobile-testing.yml`

---

*Last updated: August 2025*