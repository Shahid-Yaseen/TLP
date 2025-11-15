#!/bin/bash

# TLP Mobile App - Development Tools Installation Script
# This script helps install required software for iOS and Android development

set -e

echo "🚀 TLP Mobile App - Development Tools Installation"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script is for macOS only${NC}"
    exit 1
fi

echo -e "${YELLOW}Checking current installations...${NC}"
echo ""

# Check Homebrew
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}📦 Homebrew not found. Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo -e "${GREEN}✅ Homebrew installed${NC}"
else
    echo -e "${GREEN}✅ Homebrew already installed${NC}"
fi

# Check Xcode
echo ""
echo -e "${YELLOW}Checking Xcode...${NC}"
if xcodebuild -version &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -1)
    echo -e "${GREEN}✅ Xcode found: $XCODE_VERSION${NC}"
else
    echo -e "${RED}❌ Xcode not installed${NC}"
    echo -e "${YELLOW}📱 Please install Xcode from the App Store:${NC}"
    echo "   1. Open App Store"
    echo "   2. Search for 'Xcode'"
    echo "   3. Click Install (this is a large download, ~15GB)"
    echo ""
    read -p "Press Enter after Xcode is installed, or 's' to skip: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        if xcodebuild -version &> /dev/null; then
            echo -e "${GREEN}✅ Xcode installed${NC}"
        else
            echo -e "${RED}❌ Xcode still not found. Please install it manually.${NC}"
        fi
    fi
fi

# Install Xcode Command Line Tools
if xcodebuild -version &> /dev/null; then
    echo ""
    echo -e "${YELLOW}Installing Xcode Command Line Tools...${NC}"
    sudo xcode-select --install 2>/dev/null || echo "Command line tools already installed or installation in progress"
    
    # Accept license
    echo -e "${YELLOW}Accepting Xcode license...${NC}"
    sudo xcodebuild -license accept 2>/dev/null || echo "License already accepted or needs manual acceptance"
    echo -e "${GREEN}✅ Xcode setup complete${NC}"
fi

# Check Java
echo ""
echo -e "${YELLOW}Checking Java...${NC}"
if java -version &> /dev/null 2>&1; then
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    echo -e "${GREEN}✅ Java found: $JAVA_VERSION${NC}"
else
    echo -e "${YELLOW}📦 Installing Java (OpenJDK 17)...${NC}"
    brew install openjdk@17
    
    # Link Java
    sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk 2>/dev/null || true
    
    # Add to PATH
    if ! grep -q "JAVA_HOME" ~/.zshrc; then
        echo '' >> ~/.zshrc
        echo '# Java Configuration' >> ~/.zshrc
        echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
    fi
    
    echo -e "${GREEN}✅ Java installed${NC}"
    echo -e "${YELLOW}⚠️  Please run: source ~/.zshrc${NC}"
fi

# Check Android Studio
echo ""
echo -e "${YELLOW}Checking Android Studio...${NC}"
if [ -d "/Applications/Android Studio.app" ]; then
    echo -e "${GREEN}✅ Android Studio found${NC}"
else
    echo -e "${YELLOW}📦 Installing Android Studio...${NC}"
    brew install --cask android-studio
    echo -e "${GREEN}✅ Android Studio installed${NC}"
    echo -e "${YELLOW}⚠️  Please open Android Studio and complete the setup wizard${NC}"
    echo "   1. Open Android Studio from Applications"
    echo "   2. Choose 'Standard' installation"
    echo "   3. Let it download SDK components"
    echo "   4. Create an Android Virtual Device (AVD)"
fi

# Configure Android Environment Variables
echo ""
echo -e "${YELLOW}Configuring Android environment variables...${NC}"

# Check if ANDROID_HOME is already set
if [ -z "$ANDROID_HOME" ]; then
    ANDROID_SDK_PATH="$HOME/Library/Android/sdk"
    
    if [ -d "$ANDROID_SDK_PATH" ]; then
        # Add to .zshrc if not already there
        if ! grep -q "ANDROID_HOME" ~/.zshrc; then
            echo '' >> ~/.zshrc
            echo '# Android SDK Configuration' >> ~/.zshrc
            echo "export ANDROID_HOME=$ANDROID_SDK_PATH" >> ~/.zshrc
            echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
            echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
            echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.zshrc
            echo 'export PATH=$PATH:$ANDROID_HOME/tools/bin' >> ~/.zshrc
            echo -e "${GREEN}✅ Android environment variables added to ~/.zshrc${NC}"
        else
            echo -e "${GREEN}✅ Android environment variables already configured${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Android SDK not found at $ANDROID_SDK_PATH${NC}"
        echo "   Please open Android Studio and install SDK components first"
    fi
else
    echo -e "${GREEN}✅ ANDROID_HOME already set: $ANDROID_HOME${NC}"
fi

# Install CocoaPods for iOS
echo ""
echo -e "${YELLOW}Checking CocoaPods...${NC}"
if command -v pod &> /dev/null; then
    echo -e "${GREEN}✅ CocoaPods already installed${NC}"
else
    echo -e "${YELLOW}📦 Installing CocoaPods...${NC}"
    sudo gem install cocoapods
    echo -e "${GREEN}✅ CocoaPods installed${NC}"
fi

# Fix package versions
echo ""
echo -e "${YELLOW}Checking package versions...${NC}"
cd "$(dirname "$0")"

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the mobile directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Updating package versions to match Expo SDK...${NC}"
npm install @react-native-async-storage/async-storage@1.21.0 react-native@0.73.6 --save-exact

echo ""
echo -e "${GREEN}=================================================="
echo -e "✅ Installation Complete!"
echo -e "==================================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Restart your terminal or run: source ~/.zshrc"
echo "2. If Android Studio was just installed:"
echo "   - Open Android Studio"
echo "   - Complete the setup wizard"
echo "   - Install SDK components (Tools → SDK Manager)"
echo "   - Create an AVD (Tools → Device Manager)"
echo "3. Start the Expo server:"
echo "   cd mobile && npm start"
echo "4. Test iOS: npm run ios"
echo "5. Test Android: npm run android"
echo ""



