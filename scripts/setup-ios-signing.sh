#!/bin/bash

# iOS Signing Setup for Relife App
# This script helps set up iOS code signing certificates and provisioning profiles

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IOS_DIR="$PROJECT_ROOT/ios"

echo "🍎 iOS Signing Setup for Relife App"
echo "==================================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ iOS signing setup requires macOS"
    echo "   This script must be run on a Mac with Xcode installed"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed or not in PATH"
    echo "   Please install Xcode from the App Store"
    exit 1
fi

# Check if we're logged into Xcode
if ! xcrun security find-certificate -a | grep -q "iPhone Developer\|iPhone Distribution\|Apple Development\|Apple Distribution"; then
    echo "⚠️  No iOS development certificates found in keychain"
    echo "   You may need to:"
    echo "   1. Sign in to Xcode with your Apple ID"
    echo "   2. Download development certificates"
    echo "   3. Install provisioning profiles"
fi

echo ""
echo "📋 Current Project Configuration"
echo "--------------------------------"
echo "Bundle ID: com.scrapybara.relife"
echo "App Name: Relife Alarm"
echo "Xcode Project: $IOS_DIR/App/App.xcodeproj"

# Function to setup development signing
setup_development() {
    echo ""
    echo "🔧 Setting up Development Signing"
    echo "---------------------------------"
    
    echo "Enter your Apple Developer Team ID:"
    echo "(Find this at https://developer.apple.com/account -> Membership)"
    read -r team_id
    
    if [ -z "$team_id" ]; then
        echo "❌ Team ID is required"
        return 1
    fi
    
    # Update project settings for development
    cat > "$IOS_DIR/signing-config-dev.xcconfig" << EOF
// Development Signing Configuration
// Generated on $(date)

DEVELOPMENT_TEAM = $team_id
CODE_SIGN_STYLE = Automatic
CODE_SIGN_IDENTITY = Apple Development
PROVISIONING_PROFILE_SPECIFIER = 
PRODUCT_BUNDLE_IDENTIFIER = com.scrapybara.relife.dev
EOF

    echo "✅ Development signing configuration created"
    echo "📁 Configuration saved to: ios/signing-config-dev.xcconfig"
}

# Function to setup distribution signing
setup_distribution() {
    echo ""
    echo "📦 Setting up Distribution Signing"
    echo "----------------------------------"
    
    echo "Enter your Apple Developer Team ID:"
    read -r team_id
    
    if [ -z "$team_id" ]; then
        echo "❌ Team ID is required"
        return 1
    fi
    
    echo "Select signing method:"
    echo "1) Automatic (recommended)"
    echo "2) Manual (advanced users)"
    read -r signing_method
    
    if [ "$signing_method" = "1" ]; then
        # Automatic signing
        cat > "$IOS_DIR/signing-config-release.xcconfig" << EOF
// Release Signing Configuration  
// Generated on $(date)

DEVELOPMENT_TEAM = $team_id
CODE_SIGN_STYLE = Automatic
CODE_SIGN_IDENTITY = Apple Distribution
PROVISIONING_PROFILE_SPECIFIER = 
PRODUCT_BUNDLE_IDENTIFIER = com.scrapybara.relife
EOF
    else
        # Manual signing
        echo "Enter Distribution Certificate Name (e.g., 'iPhone Distribution: Your Name (TEAMID)'):"
        read -r cert_name
        
        echo "Enter Distribution Provisioning Profile Name:"
        read -r profile_name
        
        cat > "$IOS_DIR/signing-config-release.xcconfig" << EOF
// Release Signing Configuration (Manual)
// Generated on $(date)

DEVELOPMENT_TEAM = $team_id
CODE_SIGN_STYLE = Manual
CODE_SIGN_IDENTITY = $cert_name
PROVISIONING_PROFILE_SPECIFIER = $profile_name
PRODUCT_BUNDLE_IDENTIFIER = com.scrapybara.relife
EOF
    fi
    
    echo "✅ Distribution signing configuration created"
    echo "📁 Configuration saved to: ios/signing-config-release.xcconfig"
}

# Function to validate certificates
validate_certificates() {
    echo ""
    echo "🔍 Validating iOS Certificates"
    echo "------------------------------"
    
    # Check for development certificates
    if xcrun security find-certificate -a | grep -q "Apple Development\|iPhone Developer"; then
        echo "✅ Development certificate found"
    else
        echo "❌ No development certificate found"
    fi
    
    # Check for distribution certificates
    if xcrun security find-certificate -a | grep -q "Apple Distribution\|iPhone Distribution"; then
        echo "✅ Distribution certificate found"
    else
        echo "❌ No distribution certificate found"
    fi
    
    # List available provisioning profiles
    echo ""
    echo "📋 Available Provisioning Profiles:"
    if [ -d "$HOME/Library/MobileDevice/Provisioning Profiles" ]; then
        find "$HOME/Library/MobileDevice/Provisioning Profiles" -name "*.mobileprovision" -exec basename {} \; | sort
    else
        echo "   No provisioning profiles found"
    fi
}

# Function to open Xcode project
open_xcode() {
    echo ""
    echo "🚀 Opening Xcode Project"
    echo "-----------------------"
    
    if [ -f "$IOS_DIR/App/App.xcworkspace" ]; then
        open "$IOS_DIR/App/App.xcworkspace"
        echo "✅ Opened App.xcworkspace in Xcode"
    elif [ -f "$IOS_DIR/App/App.xcodeproj" ]; then
        open "$IOS_DIR/App/App.xcodeproj"
        echo "✅ Opened App.xcodeproj in Xcode"
    else
        echo "❌ No Xcode project found"
        return 1
    fi
}

# Main menu
echo ""
echo "What would you like to do?"
echo "1) Setup Development Signing"
echo "2) Setup Distribution Signing"
echo "3) Validate Certificates"
echo "4) Open Xcode Project"
echo "5) All of the above"
echo "q) Quit"

read -r choice

case $choice in
    1)
        setup_development
        ;;
    2)
        setup_distribution
        ;;
    3)
        validate_certificates
        ;;
    4)
        open_xcode
        ;;
    5)
        validate_certificates
        setup_development
        setup_distribution
        open_xcode
        ;;
    q)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ iOS Signing Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Open the Xcode project"
echo "   2. Select your project in the navigator"
echo "   3. Go to 'Signing & Capabilities' tab"
echo "   4. Ensure 'Automatically manage signing' is checked"
echo "   5. Select your development team"
echo "   6. Build and test on a device"
echo ""
echo "📚 Additional Resources:"
echo "   - Apple Developer Documentation: https://developer.apple.com/documentation/xcode/running-your-app-in-the-simulator-or-on-a-device"
echo "   - Code Signing Guide: https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/"