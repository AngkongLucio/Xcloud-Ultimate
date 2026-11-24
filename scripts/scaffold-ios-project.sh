#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT_DIR/ios"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/peasyo-ios-scaffold.XXXXXX")"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

for tool in node npm npx; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: $tool is required. Run this script on macOS with Node.js installed." >&2
    exit 2
  fi
done

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: iOS project scaffolding requires macOS and Xcode tooling." >&2
  exit 2
fi

if [[ -e "$IOS_DIR" ]]; then
  echo "Error: $IOS_DIR already exists. Refusing to overwrite an existing iOS project." >&2
  exit 2
fi

if ! xcode-select -p >/dev/null 2>&1; then
  echo "Error: Xcode command line tools are not configured. Run xcode-select --install." >&2
  exit 2
fi

echo "Generating a clean React Native 0.72.14 iOS template..."
cd "$TMP_DIR"
# RN 0.72.14's template is published separately from the React Native package.
# CLI 11.3.10 rejects --template together with --version, so pin the matching
# community template package directly; its package metadata pins RN 0.72.14.
npx --yes @react-native-community/cli@11.3.10 init Peasyo --template @react-native-community/template@0.72.14 --skip-install

if [[ ! -d "$TMP_DIR/Peasyo/ios/Peasyo.xcodeproj" || ! -f "$TMP_DIR/Peasyo/ios/Podfile" ]]; then
  echo "Error: React Native CLI did not produce the expected iOS project structure." >&2
  exit 3
fi

cp -R "$TMP_DIR/Peasyo/ios" "$IOS_DIR"

# Match the existing Android application ID and AppRegistry name.
find "$IOS_DIR" -type f \( -name '*.pbxproj' -o -name '*.plist' -o -name '*.mm' -o -name '*.h' -o -name '*.m' -o -name 'Podfile' \) -print0 |
while IFS= read -r -d '' file; do
  /usr/bin/sed -i '' 's/org\.reactjs\.native\.example\.[^; ]*/com.peasyo/g' "$file"
  /usr/bin/sed -i '' 's/self\.moduleName = @"Peasyo";/self.moduleName = @"peasyo";/' "$file"
done

APP_INFO_PLIST="$IOS_DIR/Peasyo/Info.plist"
if [[ ! -f "$APP_INFO_PLIST" ]]; then
  echo "Error: expected app Info.plist was not generated at $APP_INFO_PLIST." >&2
  exit 3
fi

# UDP console discovery needs iOS Local Network authorization. Do not add
# Bonjour service declarations unless the final implementation uses Bonjour.
if ! /usr/libexec/PlistBuddy -c 'Print :NSLocalNetworkUsageDescription' "$APP_INFO_PLIST" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c 'Add :NSLocalNetworkUsageDescription string "Allow Peasyo to find and connect to PlayStation consoles on your local network."' "$APP_INFO_PLIST"
fi

echo
echo "Created $IOS_DIR from the official React Native 0.72.14 template."
echo "Bundle identifier: com.peasyo"
echo "AppRegistry module name: peasyo"
echo
echo "Next steps:"
echo "  1. cd \"$ROOT_DIR\""
echo "  2. yarn install"
echo "  3. cd ios && pod install"
echo "  4. Open ios/Peasyo.xcworkspace in Xcode."

echo "This creates only the React Native iOS shell. Chiaki, VideoToolbox,"
echo "AudioUnit, controller and other iOS native modules are separate work."
