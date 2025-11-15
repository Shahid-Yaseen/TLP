# Installing Required Software for iOS and Android Development

## Current Status

- ❌ Xcode: Not installed
- ❌ Android SDK: Not installed  
- ❌ Java: Not installed
- ❌ ANDROID_HOME: Not configured

## Installation Steps

### For iOS Development (macOS Only)

#### Step 1: Install Xcode

**Option A: Via App Store (Recommended)**
1. Open the **App Store** on your Mac
2. Search for "Xcode"
3. Click **Get** or **Install** (this is a large download, ~15GB)
4. Wait for installation to complete (can take 30-60 minutes)

**Option B: Via Terminal**
```bash
# This will open App Store to Xcode page
open "macappstore://apps.apple.com/app/xcode/id497799835"
```

#### Step 2: Install Xcode Command Line Tools

After Xcode is installed:
```bash
sudo xcode-select --install
```

If prompted, click "Install" and wait for completion.

#### Step 3: Accept Xcode License

```bash
sudo xcodebuild -license accept
```

#### Step 4: Install CocoaPods (for iOS dependencies)

```bash
sudo gem install cocoapods
```

### For Android Development

#### Step 1: Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Step 2: Install Java (JDK)

```bash
# Install OpenJDK 17 (recommended for React Native)
brew install openjdk@17

# Link it
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk

# Set JAVA_HOME
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc
```

#### Step 3: Install Android Studio

**Option A: Via Homebrew (Recommended)**
```bash
brew install --cask android-studio
```

**Option B: Manual Download**
1. Go to https://developer.android.com/studio
2. Download Android Studio for Mac
3. Open the downloaded .dmg file
4. Drag Android Studio to Applications folder
5. Open Android Studio from Applications

#### Step 4: Configure Android Studio

1. **First Launch Setup:**
   - Open Android Studio
   - Choose "Standard" installation
   - Let it download Android SDK components (this takes time)

2. **Install SDK Components:**
   - Go to **Tools → SDK Manager**
   - In **SDK Platforms** tab, check:
     - ✅ Android 13.0 (Tiramisu) - API Level 33
     - ✅ Android 12.0 (S) - API Level 31
   - In **SDK Tools** tab, check:
     - ✅ Android SDK Build-Tools
     - ✅ Android SDK Command-line Tools
     - ✅ Android SDK Platform-Tools
     - ✅ Android Emulator
     - ✅ Intel x86 Emulator Accelerator (HAXM installer)
   - Click **Apply** and wait for installation

3. **Create Android Virtual Device (AVD):**
   - Go to **Tools → Device Manager**
   - Click **Create Device**
   - Select a device (e.g., Pixel 5)
   - Select a system image (e.g., Android 13.0)
   - Click **Finish**

#### Step 5: Set Environment Variables

Add these to your `~/.zshrc` file:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Java
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

Then reload:
```bash
source ~/.zshrc
```

### Verify Installation

Run these commands to verify:

```bash
# Check Xcode
xcodebuild -version

# Check Java
java -version

# Check Android SDK
echo $ANDROID_HOME
adb version

# Check React Native CLI
npx react-native --version
```

## Quick Installation Script

I'll create an automated script to help with installation. Run:

```bash
cd mobile
chmod +x install-dev-tools.sh
./install-dev-tools.sh
```

## After Installation

1. **Restart your terminal** to load new environment variables
2. **Restart Expo server:**
   ```bash
   cd mobile
   npm start
   ```
3. **Test iOS:**
   ```bash
   npm run ios
   ```
4. **Test Android:**
   ```bash
   npm run android
   ```

## Troubleshooting

### Xcode Issues
- If Xcode is "installed" but not working, try: `sudo xcode-select --reset`
- Make sure you accept the license: `sudo xcodebuild -license accept`

### Android Issues
- If `adb` not found, check `ANDROID_HOME` is set correctly
- If emulator won't start, check HAXM is installed
- For M1/M2 Macs, use ARM64 system images

### Java Issues
- Make sure Java 17 is installed: `java -version` should show version 17
- If multiple Java versions, set JAVA_HOME explicitly

## Notes

- **Xcode installation**: ~15GB, takes 30-60 minutes
- **Android Studio**: ~1GB, plus SDK components (~5GB)
- **Total space needed**: ~20-25GB
- **Internet required**: All downloads require stable internet connection



