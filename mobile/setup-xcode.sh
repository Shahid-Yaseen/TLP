#!/bin/bash

echo "🔧 Setting up Xcode for iOS development..."
echo ""

# Switch to full Xcode installation
echo "1. Switching to full Xcode installation..."
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Accept Xcode license
echo ""
echo "2. Accepting Xcode license..."
sudo xcodebuild -license accept

# Run first launch to install additional components
echo ""
echo "3. Installing additional Xcode components..."
sudo xcodebuild -runFirstLaunch

echo ""
echo "✅ Xcode setup complete!"
echo ""
echo "Now you can run: npm run ios"

