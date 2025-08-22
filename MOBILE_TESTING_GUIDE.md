# 📱 Mobile Testing Guide

## Overview

This guide covers the comprehensive mobile testing setup for Relife Alarm, including all Capacitor
plugins, mobile-specific integration tests, and CI/CD pipeline configuration.

## 🏗️ Testing Architecture

### Mock System

- **Location**: `src/__tests__/mocks/capacitor.mock.ts`
- **Coverage**: All 15+ Capacitor plugins with high-fidelity simulation
- **Features**: Cross-platform behavior, realistic async operations, error simulation

### Test Suites

- **Unit Tests**: Individual plugin functionality
- **Integration Tests**: Complete mobile workflows
- **Performance Tests**: Mobile-optimized response times
- **Cross-Platform Tests**: iOS, Android, Web compatibility

## 🔌 Capacitor Plugin Coverage

### Core Plugins

- `@capacitor/core` - Platform detection and plugin management
- `@capacitor/device` - Device info, battery, language
- `@capacitor/app` - App lifecycle and state management
- `@capacitor/network` - Connectivity monitoring

### Notification System

- `@capacitor/local-notifications` - Alarm scheduling and delivery
- `@capacitor/push-notifications` - Remote notifications
- `@capacitor/badge` - App badge count management

### Media & Interaction

- `@capacitor/haptics` - Tactile feedback patterns
- `@capacitor/camera` - Photo capture for profiles
- `@capacitor/filesystem` - Local file management

### Location & Sensors

- `@capacitor/geolocation` - Location-based alarms

### UI & System

- `@capacitor/status-bar` - Status bar customization
- `@capacitor/splash-screen` - Launch screen management
- `@capacitor/keyboard` - Keyboard interaction handling

### Background Processing

- `@capacitor-community/background-mode` - Background execution
- `@capacitor-community/keep-awake` - Screen wake lock

### Storage & Sharing

- `@capacitor/preferences` - Local data persistence
- `@capacitor/share` - Social sharing functionality
- `@capacitor/browser` - In-app browsing

## 🧪 Running Mobile Tests

### Quick Commands

```bash
# Run all mobile mock tests
bun run test:mobile:mock

# Run with real device (requires physical device)
bun run test:mobile:device

# Watch mode for development
bun run test:mobile:watch

# Coverage report
bun run test:mobile:coverage

# Comprehensive integration tests
bun run test:integration:coverage
```

### CI/CD Pipeline

- **Workflow**: `.github/workflows/mobile-testing.yml`
- **Triggers**: Push, PR, daily schedule, manual dispatch
- **Platforms**: iOS simulator, Android emulator, web browser testing
- **Coverage**: All plugins tested across all platforms

## 📋 Test Categories

### 1. Platform Detection Tests

- iOS/Android/Web platform identification
- Device capability detection
- Feature availability checking
- Graceful degradation verification

### 2. Alarm Lifecycle Tests

- **Schedule**: Alarm creation with mobile-specific options
- **Background**: App backgrounding behavior
- **Trigger**: Notification delivery and handling
- **Interaction**: Snooze, dismiss, custom actions
- **Cleanup**: Proper resource management

### 3. Permission Flow Tests

- **Request**: Permission prompts and user interaction
- **Grant/Deny**: Handling all permission states
- **Recovery**: Graceful handling of denied permissions
- **Runtime**: Permission changes during app usage

### 4. Background Execution Tests

- **Reliability**: Alarm accuracy when app is backgrounded
- **Wake Lock**: Screen keeping awake during alarms
- **Battery**: Optimization for low battery scenarios
- **System**: Integration with OS battery optimization

### 5. Cross-Platform Compatibility Tests

- **Feature Parity**: Core functionality across platforms
- **Performance**: Platform-specific optimization
- **UI Adaptation**: Platform-specific interface elements
- **Error Handling**: Platform-specific error scenarios

## 🎯 Critical Test Scenarios

### Real-World Workflows

1. **Morning Routine**: Set alarm → Sleep → Background trigger → User interaction
2. **Travel**: Timezone changes, location updates, network connectivity
3. **Low Battery**: Power-saving mode, reduced functionality, critical alarms
4. **Storage Full**: File management, cleanup, graceful degradation
5. **Permission Loss**: Runtime permission revocation, recovery flows

### Edge Cases

- Network connectivity loss during operations
- Device storage limitations
- OS-level battery optimization interference
- Concurrent alarm operations
- Memory pressure scenarios

## 🔧 Mock Configuration

### Platform Simulation

```typescript
// Switch platform for testing
_mockCapacitorSetup.setPlatform('ios');
_mockCapacitorSetup.setPlatform('android');
_mockCapacitorSetup.setPlatform('web');
```

### Device Characteristics

```typescript
// Configure mock device
_mockCapacitorSetup.setDeviceInfo({
  platform: 'ios',
  model: 'iPhone 13 Pro',
  osVersion: '15.0',
  manufacturer: 'Apple',
});
```

### Permission States

```typescript
// Set permission states
_mockCapacitorSetup.setPermission('notifications', 'granted');
_mockCapacitorSetup.setPermission('camera', 'denied');
_mockCapacitorSetup.setPermission('location', 'prompt');
```

## ⚡ Performance Testing

### Thresholds

- **Alarm Creation**: < 2000ms
- **App Launch**: < 3000ms
- **Notification Delivery**: < 500ms
- **Background Processing**: < 1000ms

### Battery Optimization

- Low battery mode detection
- Reduced haptic feedback intensity
- Optimized notification scheduling
- Background task efficiency

## 🔄 Continuous Integration

### GitHub Actions Workflow

- **Trigger Events**: Push, PR, scheduled, manual
- **Test Matrix**: iOS/Android/Web × Multiple OS versions
- **Emulator Support**: Android API 30-33, iOS 15-16
- **Performance Monitoring**: Regression detection
- **Health Checks**: Daily test validation with issue creation

### Test Reporting

- Comprehensive coverage reports
- Performance metrics tracking
- Cross-platform compatibility matrix
- Failure analysis with actionable insights

## 🛠️ Development Workflow

### Adding New Mobile Features

1. **Update Capacitor Config**: Add new plugin configuration
2. **Enhance Service**: Integrate plugin in `capacitor-enhanced.ts`
3. **Mock Implementation**: Add comprehensive mock to `capacitor.mock.ts`
4. **Write Tests**: Create integration tests for new functionality
5. **Update Documentation**: Document new capabilities and test scenarios

### Debugging Mobile Issues

1. **Check Platform**: Verify correct platform detection
2. **Review Permissions**: Ensure proper permission handling
3. **Test Background**: Validate background execution behavior
4. **Monitor Performance**: Check for performance regressions
5. **Cross-Platform**: Test on all supported platforms

## 📚 Additional Resources

### Files Reference

- **Mock System**: `src/__tests__/mocks/capacitor.mock.ts`
- **Test Helpers**: `tests/utils/mobile-test-helpers.ts`
- **Integration Tests**: `tests/integration/mobile-*.test.tsx`
- **CI/CD Workflow**: `.github/workflows/mobile-testing.yml`
- **Capacitor Config**: `capacitor.config.ts`

### External Documentation

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Testing Guide](https://capacitorjs.com/docs/guides/testing)
- [Vitest Documentation](https://vitest.dev)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 🚀 Getting Started

1. **Install Dependencies**: `bun install`
2. **Run Mock Tests**: `bun run test:mobile:mock`
3. **Check Coverage**: `bun run test:mobile:coverage`
4. **Review Results**: Check `test-results/` directory
5. **View CI Status**: Monitor GitHub Actions workflow

For questions or issues, please refer to the comprehensive test logs or create an issue with the
`mobile-testing` label.
