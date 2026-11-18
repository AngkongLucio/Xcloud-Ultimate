# Building the shared Chiaki protocol core for iOS

This is a native-core build step only. It does not create an iOS app, React Native target, stream renderer, or IPA.

## What changed in the build system

- The root CMake project adds `android/app` only when `CHIAKI_ENABLE_ANDROID=ON`. The existing Gradle configuration already passes this flag and also uses the Android NDK toolchain.
- Android ABI-specific OpenSSL, zlib, curl and SDL2 libraries are now selected only in the Android branch of `lib/CMakeLists.txt`.
- Non-Android builds resolve OpenSSL, CURL and zlib for the active target with CMake package discovery.
- JSON-C is built static for iOS; miniupnpc is already configured as a static target.
- The Android Gradle flags and Android native target remain in place.

## iOS device configure command

Run this on macOS with Xcode command-line tools, CMake, Python 3 and host `protoc` installed. The repository toolchain file selects the iOS device SDK, arm64 architecture and iOS 15 deployment target; it rejects non-macOS hosts. Build iOS-compatible OpenSSL and curl (and Opus if enabled) first, using the same iOS SDK, architecture and deployment target. Set `IOS_DEPS_PREFIX` to that dependency prefix; it must contain CMake package metadata and libraries built for iOS arm64, not macOS or Android.

```sh
xcode-select --install
brew install cmake protobuf

export IOS_DEPS_PREFIX="$HOME/ios-deps/arm64"
cmake -S . -B build/ios-arm64 -G Xcode \
  -DCMAKE_SYSTEM_NAME=iOS \
  -DCMAKE_OSX_SYSROOT=iphoneos \
  -DCMAKE_OSX_ARCHITECTURES=arm64 \
  -DCMAKE_OSX_DEPLOYMENT_TARGET=15.0 \
  -DCMAKE_PREFIX_PATH="$IOS_DEPS_PREFIX" \
  -DCHIAKI_ENABLE_ANDROID=OFF \
  -DCHIAKI_ENABLE_TESTS=OFF \
  -DCHIAKI_ENABLE_CLI=OFF \
  -DCHIAKI_ENABLE_GUI=OFF \
  -DCHIAKI_LIB_OPENSSL_EXTERNAL_PROJECT=OFF \
  -DCHIAKI_LIB_ENABLE_OPUS=OFF

cmake --build build/ios-arm64 --config Release --target chiaki-lib
```

The command deliberately disables Opus until an iOS-built Opus package is available. For a complete stream audio path, build Opus for iOS and reconfigure with `-DCHIAKI_LIB_ENABLE_OPUS=ON`.

## Toolchain behavior\n\n`cmake/ios-arm64.toolchain.cmake` sets the iOS device SDK, `arm64`, minimum iOS 15.0, host-tool lookup for build-time programs, target-only lookup for libraries/headers/packages, and static-library try-compiles. It does not build third-party dependencies or replace Xcode.\n\n## Expected dependency prefix

The prefix must provide iOS arm64 builds and CMake package configs/find modules for:
- OpenSSL (Crypto)
- libcurl
- zlib (or the iOS SDK's compatible zlib package)

The repository builds nanopb, jerasure/gf-complete, JSON-C and miniupnpc from source. The protobuf descriptor generation also needs host `protoc` and Python 3.

## Important limitations

- The upstream C sources have not yet been compiled with an iOS SDK in this environment.
- This build target is the shared protocol library only. The Android JNI, MediaCodec, Oboe and native view code are intentionally excluded.
- A successful `chiaki-lib` build is not a functioning iOS client. The Objective-C++ session bridge, VideoToolbox renderer, AudioUnit output, GameController input, React Native iOS project and device validation remain separate work.
- Android regression build and iOS arm64 build must both pass before merging this work into `main`.

## Android regression configure

The existing Android Gradle build passes `-DCHIAKI_ENABLE_ANDROID=ON`. Do not manually disable this flag in Android builds. Build with the repository's Gradle wrapper and configured Android SDK/NDK.
