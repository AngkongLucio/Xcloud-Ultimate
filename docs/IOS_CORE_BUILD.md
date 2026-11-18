# Building the shared Chiaki protocol core for iOS

This is a native-core build step only. It does not create an iOS app, React Native target, stream renderer, or IPA.

## Build iOS device dependencies

Run on macOS with Xcode selected and an existing, bootstrapped [vcpkg](https://learn.microsoft.com/vcpkg/get_started/get-started) checkout. vcpkg verifies the source archives against the hashes recorded by its port definitions. The repository supplies an overlay triplet that targets static arm64 iOS device libraries and chainloads the repository's iOS toolchain.

```sh
export VCPKG_ROOT="$HOME/vcpkg"
export IOS_DEPS_PREFIX="$PWD/vcpkg_installed/ios-arm64"
chmod +x scripts/build-ios-deps.sh scripts/build-ios-core.sh
./scripts/build-ios-deps.sh
./scripts/build-ios-core.sh
```

The dependency helper installs OpenSSL, curl and zlib. It uses vcpkg's port versions and hashes from the checked-out vcpkg registry; for reproducible builds, pin the vcpkg checkout to a known commit and retain that commit with build logs. Do not use Homebrew's ordinary macOS libraries as iOS dependencies.

## What changed in the build system

- The root CMake project adds `android/app` only when `CHIAKI_ENABLE_ANDROID=ON`. The existing Gradle configuration already passes this flag and also uses the Android NDK toolchain.
- Android ABI-specific OpenSSL, zlib, curl and SDL2 libraries are selected only in the Android branch of `lib/CMakeLists.txt`.
- Non-Android builds resolve OpenSSL, CURL and zlib for the active target with CMake package discovery.
- JSON-C is built static for iOS; miniupnpc is already configured as a static target.
- The Android Gradle configuration and native target remain in place.

## iOS device core build

```sh
xcode-select --install
brew install cmake protobuf
export IOS_DEPS_PREFIX="$PWD/vcpkg_installed/ios-arm64"
./scripts/build-ios-core.sh
```

The repository toolchain selects the iOS device SDK, arm64 architecture and iOS 15 deployment target; it rejects non-macOS hosts. The dependency prefix must contain iOS-built headers, libraries and CMake package metadata.

The core helper deliberately disables Opus until an iOS-built Opus package is available. For a complete stream audio path, build Opus for iOS and reconfigure with `-DCHIAKI_LIB_ENABLE_OPUS=ON`.

## Toolchain behavior

`cmake/ios-arm64.toolchain.cmake` sets the iOS device SDK, `arm64`, minimum iOS 15.0, host-tool lookup for build-time programs, target-only lookup for libraries/headers/packages, and static-library try-compiles. It does not build third-party dependencies or replace Xcode.

## Expected dependency prefix

The prefix must provide iOS arm64 builds and CMake package configs/find modules for:
- OpenSSL (Crypto)
- libcurl
- zlib

The repository builds nanopb, jerasure/gf-complete, JSON-C and miniupnpc from source. Protobuf descriptor generation also needs host `protoc` and Python 3.

## Important limitations

- The upstream C sources have not yet been compiled with an iOS SDK in this environment.
- This build target is the shared protocol library only. The Android JNI, MediaCodec, Oboe and native view code are intentionally excluded.
- A successful `chiaki-lib` build is not a functioning iOS client. The Objective-C++ session bridge, VideoToolbox renderer, AudioUnit output, GameController input, React Native iOS project and device validation remain separate work.
- Android regression build and iOS arm64 build must both pass before merging this work into `main`.

## Android regression configure

The existing Android Gradle build passes `-DCHIAKI_ENABLE_ANDROID=ON`. Do not manually disable this flag in Android builds. Build with the repository's Gradle wrapper and configured Android SDK/NDK.

## CI workflow

The manual GitHub Actions workflow requires a configured self-hosted macOS runner with Xcode, CMake, protobuf, a pinned vcpkg checkout, and `IOS_DEPS_PREFIX` exported in the runner service environment. Run `scripts/build-ios-deps.sh` before `scripts/build-ios-core.sh`. No CI build result is claimed until a run completes successfully.
