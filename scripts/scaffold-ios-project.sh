#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT_DIR/ios"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/peasyo-ios-scaffold.XXXXXX")"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

for tool in node npm npx git; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: $tool is required. Run this script on macOS with Node.js and Git installed." >&2
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

echo "Fetching the official React Native 0.72.17 template source..."
git clone --depth 1 --filter=blob:none --sparse --branch v0.72.17 \
  https://github.com/react/react-native.git "$TMP_DIR/react-native-source"
# Non-cone mode is required because template.config.js is a file, not a directory.
git -C "$TMP_DIR/react-native-source" sparse-checkout set --no-cone \
  'packages/react-native/template/' \
  'packages/react-native/template.config.js'

CUSTOM_TEMPLATE="$TMP_DIR/rn072-template"
mkdir -p "$CUSTOM_TEMPLATE"
cp "$TMP_DIR/react-native-source/packages/react-native/template.config.js" "$CUSTOM_TEMPLATE/template.config.js"
cp -R "$TMP_DIR/react-native-source/packages/react-native/template" "$CUSTOM_TEMPLATE/template"
# React Native CLI treats --template as an installable package. The upstream
# source subtree contains template.config.js and template/, but no package
# manifest at this copied root, so provide one for Yarn's local package install.
cat > "$CUSTOM_TEMPLATE/package.json" <<'TEMPLATE_PACKAGE'
{
  "name": "react-native-template-peasyo",
  "version": "0.72.17",
  "private": true,
  "description": "Local React Native 0.72.17 template for Peasyo iOS shell"
}
TEMPLATE_PACKAGE

if [[ ! -f "$CUSTOM_TEMPLATE/template.config.js" || ! -f "$CUSTOM_TEMPLATE/template/package.json" || ! -f "$CUSTOM_TEMPLATE/template/ios/Podfile" ]]; then
  echo "Error: official React Native 0.72.17 template source is incomplete." >&2
  exit 3
fi

echo "Generating the iOS project with the pinned React Native 0.72.17 template..."
# React Native CLI 11 invokes yarn from its own temporary directory. Pass the
# template as an absolute path so that Yarn can resolve it from that directory.
# Keep Yarn Classic isolated so the runner's Corepack shims are untouched.
YARN_PREFIX="$TMP_DIR/yarn-classic"
npm install --prefix "$YARN_PREFIX" --no-save --no-audit --no-fund yarn@1.22.22
YARN_CLASSIC_JS="$YARN_PREFIX/node_modules/yarn/bin/yarn.js"
if [[ ! -f "$YARN_CLASSIC_JS" ]]; then
  echo "Error: Yarn Classic 1.22.22 was not installed in the temporary prefix." >&2
  exit 2
fi
YARN_SHIM_DIR="$TMP_DIR/yarn-classic-bin"
mkdir -p "$YARN_SHIM_DIR"
cat > "$YARN_SHIM_DIR/yarn" <<'YARN_SHIM'
#!/usr/bin/env bash
exec node "${YARN_CLASSIC_JS:?}" "$@"
YARN_SHIM
chmod +x "$YARN_SHIM_DIR/yarn"
export YARN_CLASSIC_JS
export PATH="$YARN_SHIM_DIR:$PATH"
if [[ "$(yarn --version)" != "1.22.22" ]]; then
  echo "Error: React Native 0.72.17 scaffolding requires Yarn Classic 1.22.22." >&2
  exit 2
fi
# The custom template's package.json pins React Native 0.72.17. The CLI
# rejects combining --version with --template, so the template is the
# single source of truth for the React Native version.
(
  cd "$TMP_DIR"
  npx --yes @react-native-community/cli@11.4.1 init Peasyo \
    --template "$CUSTOM_TEMPLATE" \
    --skip-install
)

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

# Set the user-facing iOS Home Screen name; keep the internal AppRegistry key unchanged.
if /usr/libexec/PlistBuddy -c 'Print :CFBundleDisplayName' "$APP_INFO_PLIST" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName Xcloud Ultimate" "$APP_INFO_PLIST"
else
  /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string Xcloud Ultimate" "$APP_INFO_PLIST"
fi

# UDP console discovery needs iOS Local Network authorization. Do not add
# Bonjour service declarations unless the final implementation uses Bonjour.
if ! /usr/libexec/PlistBuddy -c 'Print :NSLocalNetworkUsageDescription' "$APP_INFO_PLIST" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c 'Add :NSLocalNetworkUsageDescription string "Allow Peasyo to find and connect to PlayStation consoles on your local network."' "$APP_INFO_PLIST"
fi

echo
echo "Created $IOS_DIR from the official React Native 0.72.17 source template."
echo "Bundle identifier: com.peasyo"
echo "Display name: Xcloud Ultimate"
echo "AppRegistry module name: peasyo"
echo
echo "Next steps:"
echo "  1. cd \"$ROOT_DIR\""
echo "  2. yarn install"
echo "  3. cd ios && pod install"
echo "  4. Open ios/Peasyo.xcworkspace in Xcode."

echo "This creates only the React Native iOS shell. Chiaki, VideoToolbox,"
echo "AudioUnit, controller and other iOS native modules are separate work."
