#!/bin/bash

# Generate Android Keystores for Relife App
# This script creates both debug and release keystores for signing Android APKs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ANDROID_DIR="$PROJECT_ROOT/android"

echo "🔑 Generating Android Keystores for Relife App"
echo "=============================================="

# Create keystores directory if it doesn't exist
mkdir -p "$ANDROID_DIR/keystores"

# Function to generate keystore
generate_keystore() {
    local keystore_type=$1
    local keystore_file=$2
    local key_alias=$3
    local validity_days=$4
    
    echo ""
    echo "📱 Generating $keystore_type keystore..."
    
    # Prompt for keystore password
    echo "Enter password for $keystore_type keystore:"
    read -s keystore_password
    echo "Confirm password:"
    read -s keystore_password_confirm
    
    if [ "$keystore_password" != "$keystore_password_confirm" ]; then
        echo "❌ Passwords do not match!"
        exit 1
    fi
    
    # Prompt for key password (can be same as keystore password)
    echo "Enter password for $key_alias key (press Enter to use same as keystore):"
    read -s key_password
    
    if [ -z "$key_password" ]; then
        key_password=$keystore_password
    fi
    
    # Generate keystore
    keytool -genkeypair \
        -alias "$key_alias" \
        -keyalg RSA \
        -keysize 2048 \
        -validity "$validity_days" \
        -keystore "$keystore_file" \
        -storepass "$keystore_password" \
        -keypass "$key_password" \
        -dname "CN=Relife App, OU=Mobile Development, O=Scrapybara, L=San Francisco, ST=CA, C=US"
    
    echo "✅ $keystore_type keystore generated: $keystore_file"
    
    # Update keystore properties file
    if [ "$keystore_type" = "Release" ]; then
        echo "RELIFE_RELEASE_STORE_FILE=keystores/$(basename "$keystore_file")" >> "$ANDROID_DIR/keystore.properties.tmp"
        echo "RELIFE_RELEASE_STORE_PASSWORD=$keystore_password" >> "$ANDROID_DIR/keystore.properties.tmp"
        echo "RELIFE_RELEASE_KEY_ALIAS=$key_alias" >> "$ANDROID_DIR/keystore.properties.tmp"
        echo "RELIFE_RELEASE_KEY_PASSWORD=$key_password" >> "$ANDROID_DIR/keystore.properties.tmp"
    else
        echo "RELIFE_DEBUG_STORE_FILE=keystores/$(basename "$keystore_file")" >> "$ANDROID_DIR/keystore.properties.tmp"
        echo "RELIFE_DEBUG_STORE_PASSWORD=$keystore_password" >> "$ANDROID_DIR/keystore.properties.tmp"
        echo "RELIFE_DEBUG_KEY_ALIAS=$key_alias" >> "$ANDROID_DIR/keystore.properties.tmp"
        echo "RELIFE_DEBUG_KEY_PASSWORD=$key_password" >> "$ANDROID_DIR/keystore.properties.tmp"
    fi
}

# Check if keytool is available
if ! command -v keytool &> /dev/null; then
    echo "❌ keytool is not available. Please install Java JDK."
    exit 1
fi

# Initialize keystore properties file
echo "# Generated Android Keystore Configuration" > "$ANDROID_DIR/keystore.properties.tmp"
echo "# $(date)" >> "$ANDROID_DIR/keystore.properties.tmp"
echo "" >> "$ANDROID_DIR/keystore.properties.tmp"

# Generate release keystore
generate_keystore "Release" "$ANDROID_DIR/keystores/release.keystore" "relife-release" 25000

# Ask if user wants debug keystore
echo ""
echo "Do you want to generate a debug keystore? (y/N)"
read -r generate_debug

if [[ $generate_debug =~ ^[Yy]$ ]]; then
    echo "" >> "$ANDROID_DIR/keystore.properties.tmp"
    generate_keystore "Debug" "$ANDROID_DIR/keystores/debug.keystore" "relife-debug" 25000
fi

# Move temporary file to final location
mv "$ANDROID_DIR/keystore.properties.tmp" "$ANDROID_DIR/keystore.properties"

echo ""
echo "✅ Keystore generation complete!"
echo "📝 Configuration saved to: android/keystore.properties"
echo ""
echo "🚀 Next steps:"
echo "   1. Build your app: cd android && ./gradlew assembleRelease"
echo "   2. Your signed APK will be in: android/app/build/outputs/apk/release/"
echo ""
echo "⚠️  SECURITY NOTICE:"
echo "   - Keep your keystore files safe and backed up"
echo "   - Never commit keystore.properties to version control"
echo "   - Store keystore passwords in a secure password manager"

# Add keystore.properties to .gitignore if not already present
GITIGNORE_FILE="$PROJECT_ROOT/.gitignore"
if [ -f "$GITIGNORE_FILE" ]; then
    if ! grep -q "android/keystore.properties" "$GITIGNORE_FILE"; then
        echo "android/keystore.properties" >> "$GITIGNORE_FILE"
        echo "android/keystores/" >> "$GITIGNORE_FILE"
        echo "📝 Added keystore files to .gitignore"
    fi
fi