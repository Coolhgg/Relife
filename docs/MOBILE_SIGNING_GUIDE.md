# Mobile App Signing Guide

Complete guide for signing the Relife mobile app for Android and iOS app stores.

## Overview

This guide covers the complete process of setting up code signing for both Android and iOS versions of the Relife app, enabling distribution through Google Play Store and Apple App Store.

**App Configuration:**
- **Package ID:** `com.scrapybara.relife`
- **App Name:** Relife Alarm
- **Android Target SDK:** 35 (Android 15)
- **iOS Deployment Target:** 13.0+

## Android Signing

### Prerequisites

- Java JDK installed (OpenJDK 8+ or Oracle JDK)
- Android SDK and build tools
- `keytool` command available

### Quick Setup

Run the automated keystore generation script:

```bash
./scripts/generate-android-keystore.sh
```

This script will:
1. Generate release and debug keystores
2. Create `android/keystore.properties` with signing configuration
3. Add keystore files to `.gitignore`
4. Provide security recommendations

### Manual Setup

#### 1. Generate Release Keystore

```bash
cd android
keytool -genkeypair \
    -alias relife-release \
    -keyalg RSA \
    -keysize 2048 \
    -validity 25000 \
    -keystore keystores/release.keystore \
    -dname "CN=Relife App, OU=Mobile Development, O=Scrapybara, L=San Francisco, ST=CA, C=US"
```

#### 2. Create Keystore Properties

Create `android/keystore.properties` (never commit this file):

```properties
RELIFE_RELEASE_STORE_FILE=keystores/release.keystore
RELIFE_RELEASE_STORE_PASSWORD=your_store_password
RELIFE_RELEASE_KEY_ALIAS=relife-release
RELIFE_RELEASE_KEY_PASSWORD=your_key_password
```

#### 3. Build Signed APK

```bash
cd android
./gradlew assembleRelease
```

The signed APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

### Android Build Configuration

The `android/app/build.gradle` file has been configured with:

- **Signing Configurations:** Separate configs for debug and release
- **Build Types:** Release and debug variants with proper signing
- **Security:** Keystore properties loaded securely
- **Package ID:** Consistent `com.scrapybara.relife`

### Google Play Store Upload

#### 1. Generate Upload Key (Recommended)

For Play App Signing, generate a separate upload key:

```bash
keytool -genkeypair \
    -alias relife-upload \
    -keyalg RSA \
    -keysize 2048 \
    -validity 25000 \
    -keystore keystores/upload.keystore
```

#### 2. Create App Bundle (Recommended)

```bash
cd android
./gradlew bundleRelease
```

Upload the generated AAB file: `android/app/build/outputs/bundle/release/app-release.aab`

## iOS Signing

### Prerequisites

- **macOS** with Xcode installed
- **Apple Developer Account** (Individual or Organization)
- Valid **iOS Development Certificate**
- Valid **iOS Distribution Certificate**

### Quick Setup

Run the iOS signing setup script:

```bash
./scripts/setup-ios-signing.sh
```

This script will:
1. Validate your development environment
2. Create signing configuration files
3. Set up development and distribution profiles
4. Open the Xcode project for final configuration

### Manual Setup

#### 1. Apple Developer Account Setup

1. **Enroll in Apple Developer Program:**
   - Visit [developer.apple.com](https://developer.apple.com)
   - Enroll in the Developer Program ($99/year)
   - Verify your enrollment status

2. **Create App ID:**
   - Login to [developer.apple.com/account](https://developer.apple.com/account)
   - Go to "Certificates, Identifiers & Profiles"
   - Create new App ID: `com.scrapybara.relife`
   - Enable required capabilities (Push Notifications, Background Modes)

#### 2. Certificate Management

**Development Certificate:**
1. Open Xcode → Preferences → Accounts
2. Add your Apple ID
3. Download Development Certificates
4. Or create via Developer Portal → Certificates → "+"

**Distribution Certificate:**
1. Create Certificate Signing Request (CSR) in Keychain Access
2. Upload CSR to Developer Portal
3. Download and install Distribution Certificate

#### 3. Provisioning Profiles

**Development Profile:**
1. Developer Portal → Profiles → "+"
2. Select "iOS App Development"
3. Choose App ID: `com.scrapybara.relife`
4. Select Development Certificate
5. Select test devices
6. Download and install

**Distribution Profile:**
1. Developer Portal → Profiles → "+"
2. Select "App Store" distribution
3. Choose App ID: `com.scrapybara.relife`
4. Select Distribution Certificate
5. Download and install

### Xcode Configuration

#### 1. Open Project

Open `ios/App/App.xcworkspace` in Xcode (use workspace, not project).

#### 2. Configure Signing

1. Select project in navigator
2. Select "App" target
3. Go to "Signing & Capabilities" tab
4. **For Development:**
   - Check "Automatically manage signing"
   - Select your development team
   - Bundle ID: `com.scrapybara.relife.dev`
5. **For Release:**
   - Check "Automatically manage signing"
   - Select your development team
   - Bundle ID: `com.scrapybara.relife`

#### 3. Build Settings

Ensure the following build settings:

```
DEVELOPMENT_TEAM = YOUR_TEAM_ID
PRODUCT_BUNDLE_IDENTIFIER = com.scrapybara.relife
CODE_SIGN_IDENTITY = Apple Distribution (for release)
PROVISIONING_PROFILE_SPECIFIER = (leave empty for automatic)
```

### Building for App Store

#### 1. Archive Build

1. Select "Any iOS Device" or connected device
2. Product → Archive
3. Wait for build to complete
4. Organizer window will open

#### 2. Validate Archive

1. Select archive in Organizer
2. Click "Validate App"
3. Choose distribution method: "App Store Connect"
4. Select signing options: "Automatically manage signing"
5. Click "Validate"

#### 3. Upload to App Store Connect

1. Click "Distribute App"
2. Choose "App Store Connect"
3. Select signing: "Automatically manage signing"
4. Upload
5. Wait for processing (can take hours)

### iOS Configuration Files

#### Development Configuration (`ios/signing-config-dev.xcconfig`)

```
DEVELOPMENT_TEAM = YOUR_TEAM_ID
CODE_SIGN_STYLE = Automatic
CODE_SIGN_IDENTITY = Apple Development
PRODUCT_BUNDLE_IDENTIFIER = com.scrapybara.relife.dev
```

#### Release Configuration (`ios/signing-config-release.xcconfig`)

```
DEVELOPMENT_TEAM = YOUR_TEAM_ID
CODE_SIGN_STYLE = Automatic
CODE_SIGN_IDENTITY = Apple Distribution
PRODUCT_BUNDLE_IDENTIFIER = com.scrapybara.relife
```

## Security Best Practices

### Android

1. **Keystore Security:**
   - Store keystores in secure, backed-up location
   - Use strong, unique passwords
   - Never commit keystore files or passwords to version control
   - Consider using Android App Bundle with Play App Signing

2. **Key Management:**
   - Keep separate keystores for debug and release
   - Backup keystores and passwords securely
   - Consider key rotation strategies for long-term apps

### iOS

1. **Certificate Management:**
   - Store certificates in secure keychain
   - Regular certificate renewal before expiration
   - Backup certificates and private keys
   - Use separate certificates for development and distribution

2. **Team Management:**
   - Limit access to distribution certificates
   - Use appropriate roles in Apple Developer Account
   - Regular audit of team members and access

## Troubleshooting

### Common Android Issues

**Build Error: "Keystore was tampered with"**
- Check keystore password is correct
- Ensure keystore file path is correct
- Verify keystore.properties file format

**Signing Configuration Not Found**
- Ensure keystore.properties exists in android/ directory
- Check file permissions and paths
- Verify keystore files exist in specified locations

### Common iOS Issues

**Code Signing Error**
- Verify certificates are installed in Keychain
- Check bundle identifier matches App ID
- Ensure provisioning profile is valid and not expired

**Archive Failed**
- Clean build folder (Product → Clean Build Folder)
- Verify signing configuration
- Check for code signing issues in build settings

**Upload to App Store Failed**
- Verify archive is valid
- Check App Store Connect status
- Ensure app metadata is complete

## Build Scripts Integration

### Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "build:android": "npx cap sync android && cd android && ./gradlew assembleRelease",
    "build:android:bundle": "npx cap sync android && cd android && ./gradlew bundleRelease",
    "build:ios": "npx cap sync ios && cd ios && xcodebuild -workspace App/App.xcworkspace -scheme App archive",
    "sign:android": "./scripts/generate-android-keystore.sh",
    "sign:ios": "./scripts/setup-ios-signing.sh"
  }
}
```

### Continuous Integration

For CI/CD pipelines, consider:

1. **Android:**
   - Store keystore files as encrypted secrets
   - Use environment variables for passwords
   - Implement keystore backup strategies

2. **iOS:**
   - Use App Store Connect API keys
   - Implement certificate management automation
   - Consider using Fastlane for iOS deployment

## Next Steps

After completing signing setup:

1. **Test Builds:**
   - Build and test on physical devices
   - Verify all app functionality works
   - Test push notifications and background features

2. **Store Preparation:**
   - Prepare app store listings
   - Create screenshots and metadata
   - Set up app pricing and availability

3. **Release Process:**
   - Implement staged rollout strategy
   - Set up crash reporting and analytics
   - Plan post-launch monitoring

## Resources

- [Android App Signing Documentation](https://developer.android.com/studio/publish/app-signing)
- [iOS Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/)
- [Capacitor iOS Deployment Guide](https://capacitorjs.com/docs/ios/deploying-to-app-store)
- [Capacitor Android Deployment Guide](https://capacitorjs.com/docs/android/deploying-to-google-play)
- [Apple Developer Portal](https://developer.apple.com/account)
- [Google Play Console](https://play.google.com/console)