#!/bin/bash

# Validate Mobile Signing Configuration
# This script checks if mobile signing is properly configured

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ANDROID_DIR="$PROJECT_ROOT/android"
IOS_DIR="$PROJECT_ROOT/ios"

echo "📱 Validating Mobile Signing Configuration"
echo "========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "ok")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "warn")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
    esac
}

echo ""
echo "🤖 Android Signing Validation"
echo "-----------------------------"

# Check Android build.gradle
if [ -f "$ANDROID_DIR/app/build.gradle" ]; then
    if grep -q "signingConfigs" "$ANDROID_DIR/app/build.gradle"; then
        print_status "ok" "Android build.gradle has signing configuration"
    else
        print_status "error" "Android build.gradle missing signing configuration"
    fi
    
    # Check for consistent app ID
    if grep -q "com.scrapybara.relife" "$ANDROID_DIR/app/build.gradle"; then
        print_status "ok" "Android app ID is consistent (com.scrapybara.relife)"
    else
        print_status "error" "Android app ID inconsistency detected"
    fi
else
    print_status "error" "Android build.gradle not found"
fi

# Check keystore template
if [ -f "$ANDROID_DIR/keystore.properties.template" ]; then
    print_status "ok" "Keystore properties template exists"
else
    print_status "warn" "Keystore properties template not found"
fi

# Check actual keystore properties
if [ -f "$ANDROID_DIR/keystore.properties" ]; then
    print_status "ok" "Keystore properties file exists"
    
    # Validate keystore properties content
    if grep -q "RELIFE_RELEASE_STORE_FILE" "$ANDROID_DIR/keystore.properties"; then
        print_status "ok" "Release keystore configuration found"
    else
        print_status "warn" "Release keystore configuration incomplete"
    fi
else
    print_status "warn" "Keystore properties not configured (run: npm run sign:android)"
fi

# Check .gitignore protection
if [ -f "$PROJECT_ROOT/.gitignore" ]; then
    if grep -q "keystore.properties" "$PROJECT_ROOT/.gitignore"; then
        print_status "ok" "Keystore files protected in .gitignore"
    else
        print_status "error" "Keystore files not protected in .gitignore"
    fi
else
    print_status "error" ".gitignore file not found"
fi

echo ""
echo "🍎 iOS Signing Validation"
echo "-------------------------"

# Check if running on macOS for iOS validation
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_status "warn" "iOS validation requires macOS (current OS: $OSTYPE)"
else
    # Check Xcode installation
    if command -v xcodebuild &> /dev/null; then
        print_status "ok" "Xcode is installed"
        
        # Check iOS project structure
        if [ -f "$IOS_DIR/App/App.xcodeproj/project.pbxproj" ]; then
            print_status "ok" "iOS Xcode project exists"
        else
            print_status "error" "iOS Xcode project not found"
        fi
        
        # Check Info.plist
        if [ -f "$IOS_DIR/App/App/Info.plist" ]; then
            print_status "ok" "iOS Info.plist exists"
            
            # Check for consistent app name
            if grep -q "Relife Alarm" "$IOS_DIR/App/App/Info.plist"; then
                print_status "ok" "iOS app name is consistent (Relife Alarm)"
            else
                print_status "warn" "iOS app name may be inconsistent"
            fi
            
            # Check for consistent bundle ID reference
            if grep -q "com.scrapybara.relife" "$IOS_DIR/App/App/Info.plist"; then
                print_status "ok" "iOS bundle ID reference is consistent"
            else
                print_status "warn" "iOS bundle ID reference may be inconsistent"
            fi
        else
            print_status "error" "iOS Info.plist not found"
        fi
        
        # Check for development certificates
        if xcrun security find-certificate -a | grep -q "Apple Development\|iPhone Developer"; then
            print_status "ok" "iOS development certificates found"
        else
            print_status "warn" "No iOS development certificates found (run: npm run sign:ios)"
        fi
        
        # Check for distribution certificates
        if xcrun security find-certificate -a | grep -q "Apple Distribution\|iPhone Distribution"; then
            print_status "ok" "iOS distribution certificates found"
        else
            print_status "warn" "No iOS distribution certificates found"
        fi
    else
        print_status "error" "Xcode not installed or not in PATH"
    fi
fi

echo ""
echo "📋 Capacitor Configuration"
echo "--------------------------"

# Check Capacitor config
if [ -f "$PROJECT_ROOT/capacitor.config.ts" ]; then
    print_status "ok" "Capacitor configuration exists"
    
    # Check app ID consistency
    if grep -q "com.scrapybara.relife" "$PROJECT_ROOT/capacitor.config.ts"; then
        print_status "ok" "Capacitor app ID is consistent"
    else
        print_status "error" "Capacitor app ID inconsistency detected"
    fi
    
    # Check app name
    if grep -q "Relife Alarm" "$PROJECT_ROOT/capacitor.config.ts"; then
        print_status "ok" "Capacitor app name is consistent"
    else
        print_status "warn" "Capacitor app name may be inconsistent"
    fi
else
    print_status "error" "Capacitor configuration not found"
fi

echo ""
echo "🚀 Build Scripts"
echo "---------------"

# Check package.json scripts
if [ -f "$PROJECT_ROOT/package.json" ]; then
    if grep -q "sign:android" "$PROJECT_ROOT/package.json"; then
        print_status "ok" "Android signing script available (npm run sign:android)"
    else
        print_status "warn" "Android signing script not found in package.json"
    fi
    
    if grep -q "sign:ios" "$PROJECT_ROOT/package.json"; then
        print_status "ok" "iOS signing script available (npm run sign:ios)"
    else
        print_status "warn" "iOS signing script not found in package.json"
    fi
    
    if grep -q "build:android:release" "$PROJECT_ROOT/package.json"; then
        print_status "ok" "Android release build script available"
    else
        print_status "warn" "Android release build script not found"
    fi
else
    print_status "error" "package.json not found"
fi

echo ""
echo "📄 Documentation"
echo "----------------"

if [ -f "$PROJECT_ROOT/docs/MOBILE_SIGNING_GUIDE.md" ]; then
    print_status "ok" "Mobile signing documentation available"
else
    print_status "warn" "Mobile signing documentation not found"
fi

echo ""
echo "🏆 Summary"
echo "----------"

# Count issues
errors=$(grep -c "❌" <<< "$(print_status "error" "test")" 2>/dev/null || echo 0)
warnings=$(grep -c "⚠️" <<< "$(print_status "warn" "test")" 2>/dev/null || echo 0)

if [ "$errors" -eq 0 ] && [ "$warnings" -eq 0 ]; then
    echo -e "${GREEN}✅ All mobile signing configurations are valid!${NC}"
    echo "   Ready to build and sign mobile apps."
elif [ "$errors" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Configuration mostly valid with $warnings warning(s).${NC}"
    echo "   Consider addressing warnings for optimal setup."
else
    echo -e "${RED}❌ Configuration has issues that need attention.${NC}"
    echo "   Please fix errors before attempting to build signed apps."
fi

echo ""
echo "📚 Next Steps:"
echo "   1. Fix any errors reported above"
echo "   2. Run signing setup scripts if needed:"
echo "      - Android: npm run sign:android"
echo "      - iOS: npm run sign:ios"
echo "   3. Test build signed apps:"
echo "      - Android: npm run build:android:release"
echo "      - iOS: npm run build:ios:archive"
echo "   4. Review documentation: docs/MOBILE_SIGNING_GUIDE.md"