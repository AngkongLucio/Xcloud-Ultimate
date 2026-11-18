#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VCPKG_ROOT="${VCPKG_ROOT:-}"
VCPKG_INSTALL_ROOT="${VCPKG_INSTALL_ROOT:-$ROOT_DIR/vcpkg_installed}"
IOS_DEPS_PREFIX="$VCPKG_INSTALL_ROOT/arm64-ios"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: iOS device dependencies must be built on macOS with Xcode." >&2
  exit 2
fi
if ! command -v xcodebuild >/dev/null 2>&1 || ! command -v xcrun >/dev/null 2>&1; then
  echo "Error: select/install Xcode before building iOS dependencies." >&2
  exit 2
fi
if [[ -z "$VCPKG_ROOT" || ! -x "$VCPKG_ROOT/vcpkg" ]]; then
  echo "Error: set VCPKG_ROOT to an existing, bootstrapped vcpkg checkout." >&2
  echo "See https://learn.microsoft.com/vcpkg/get_started/get-started" >&2
  exit 2
fi

OVERLAY_DIR="$ROOT_DIR/cmake/vcpkg"
TRIPLET_FILE="$OVERLAY_DIR/arm64-ios.cmake"
if [[ ! -f "$TRIPLET_FILE" ]]; then
  echo "Error: missing iOS vcpkg triplet: $TRIPLET_FILE" >&2
  exit 2
fi

mkdir -p "$VCPKG_INSTALL_ROOT"
"$VCPKG_ROOT/vcpkg" install openssl curl zlib \
  --triplet arm64-ios \
  --overlay-triplets="$OVERLAY_DIR" \
  --x-install-root="$VCPKG_INSTALL_ROOT"

echo
echo "iOS dependency installation finished."
echo "Prefix: $IOS_DEPS_PREFIX"
echo "Next: export IOS_DEPS_PREFIX='$IOS_DEPS_PREFIX' and run scripts/build-ios-core.sh"
echo "Note: this builds dependencies only; it does not create an app or IPA."
