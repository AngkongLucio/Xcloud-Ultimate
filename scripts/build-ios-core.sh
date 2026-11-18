#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${IOS_BUILD_DIR:-$ROOT_DIR/build/ios-arm64}"
IOS_DEPS_PREFIX="${IOS_DEPS_PREFIX:-}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: iOS device builds require macOS with Xcode." >&2
  exit 2
fi
if ! command -v xcodebuild >/dev/null 2>&1 || ! command -v xcrun >/dev/null 2>&1; then
  echo "Error: Xcode command-line tools are required." >&2
  exit 2
fi
if ! command -v cmake >/dev/null 2>&1 || ! command -v protoc >/dev/null 2>&1 || ! command -v python3 >/dev/null 2>&1; then
  echo "Error: install CMake, protobuf (protoc), and Python 3 first." >&2
  exit 2
fi
if [[ -z "$IOS_DEPS_PREFIX" || ! -d "$IOS_DEPS_PREFIX" ]]; then
  echo "Error: set IOS_DEPS_PREFIX to an iOS-device dependency prefix." >&2
  exit 2
fi

SDK_PATH="$(xcrun --sdk iphoneos --show-sdk-path)"
if [[ ! -d "$SDK_PATH" ]]; then
  echo "Error: the iPhoneOS SDK is unavailable." >&2
  exit 2
fi

require_file() {
  local pattern="$1"
  if ! find "$IOS_DEPS_PREFIX" -type f -name "$pattern" -print -quit | grep -q .; then
    echo "Error: missing $pattern under $IOS_DEPS_PREFIX" >&2
    exit 2
  fi
}

require_file ssl.h
require_file curl.h
require_file libcrypto.a
require_file libssl.a
require_file libcurl.a

# Reject host-only archives. This checks the architecture slice; the prefix
# must additionally have been built against the iPhoneOS SDK (not macOS).
while IFS= read -r archive; do
  info="$(lipo -info "$archive")"
  echo "$info"
  if ! grep -q 'arm64' <<<"$info"; then
    echo "Error: archive has no arm64 slice: $archive" >&2
    exit 2
  fi
done < <(find "$IOS_DEPS_PREFIX" -type f \\( -name libcrypto.a -o -name libssl.a -o -name libcurl.a \\))

cmake -S "$ROOT_DIR" -B "$BUILD_DIR" -G Xcode \
  -DCMAKE_TOOLCHAIN_FILE="$ROOT_DIR/cmake/ios-arm64.toolchain.cmake" \
  -DCMAKE_PREFIX_PATH="$IOS_DEPS_PREFIX" \
  -DOPENSSL_ROOT_DIR="$IOS_DEPS_PREFIX" \
  -DCURL_ROOT="$IOS_DEPS_PREFIX" \
  -DCHIAKI_ENABLE_ANDROID=OFF \
  -DCHIAKI_ENABLE_TESTS=OFF \
  -DCHIAKI_ENABLE_CLI=OFF \
  -DCHIAKI_ENABLE_GUI=OFF \
  -DCHIAKI_ENABLE_SETSU=OFF \
  -DCHIAKI_ENABLE_FFMPEG_DECODER=OFF \
  -DCHIAKI_ENABLE_PI_DECODER=OFF \
  -DCHIAKI_LIB_OPENSSL_EXTERNAL_PROJECT=OFF \
  -DCHIAKI_LIB_ENABLE_OPUS=OFF \
  -DCHIAKI_USE_SYSTEM_NANOPB=OFF \
  -DCHIAKI_USE_SYSTEM_JERASURE=OFF

cmake --build "$BUILD_DIR" --config Release --target chiaki-lib
echo "Built Chiaki protocol core. This is not an iOS app or IPA."
