# iOS native streaming port — source audit and implementation decision

## Executive decision

Do not compile or copy the Android JNI layer into an iOS target. The existing Chiaki protocol library is a plausible shared core, but the current Android media and platform glue must be replaced. The iOS implementation should expose a small C ABI from the shared protocol/session layer and implement media, controller, lifecycle, and React Native integration with Apple frameworks.

This is an engineering design checkpoint, not a claim that streaming is implemented.

## What the repository actually contains

### Shared protocol layer

- `lib/` contains a Chiaki 2.2.0 C protocol/session library.
- The current `lib/CMakeLists.txt` is not platform-neutral: it links prebuilt Android ABI paths for OpenSSL, zlib, curl and SDL2, plus json-c and miniupnpc.
- The root `CMakeLists.txt` currently adds the Android native target unconditionally.
- `lib/protobuf/CMakeLists.txt` requires a host `protoc` and Python nanopb generation. A macOS build must pin/provide those tools or use checked-in generated sources.
- The current third-party tree contains Android prebuilt crypto/network/media libraries; those binaries cannot be linked into an iOS arm64 app.

### Android-only session and media glue

- `chiaki-jni.c` is a ~60 KB JNI adapter. It calls Java/Kotlin callbacks and owns Android-specific session/view integration.
- `video-decoder.c` uses Android NDK MediaCodec, Android choreographer, Android looper and Android native windows.
- `audio-output.cpp` uses Oboe/AAudio, which is the Android audio output path.
- `log.c` uses `android/log.h` and JNI callbacks.
- The stream React Native components use `requireNativeComponent` and `UIManager.dispatchViewManagerCommand` for Android view managers. They are not an iOS implementation.

## iOS replacement architecture

### Shared protocol/session core

1. Move the Chiaki C library behind a platform-neutral C interface. Keep protocol/session structs private to the implementation.
2. Remove Android ABI hard-coded paths from the core CMake target. Make crypto, curl, json-c, miniupnpc, nanopb and jerasure explicit platform dependencies.
3. Build all dependencies for iOS device arm64 and simulator architectures; never link Android `.so` or Android ABI `.a` files.
4. Keep Android's JNI adapter and current Android CMake target behind `if(ANDROID)`; add a separate iOS target rather than changing Android source behavior.
5. Keep license headers and AGPL/OpenSSL additional-permission notices with all derived code.

### iOS media and device adapters

| Android implementation | iOS implementation |
|---|---|
| MediaCodec decoder | VideoToolbox decompression session |
| Android native window / SurfaceTexture | CVPixelBuffer output rendered by Metal or AVSampleBufferDisplayLayer |
| Oboe audio output | AudioUnit or AVAudioEngine |
| JNI callbacks | Objective-C++ wrapper and React Native native module/events |
| Android controller/sensor code | GameController, CoreMotion and supported CoreHaptics APIs |
| Android Choreographer | CADisplayLink with careful frame pacing |
| Android logcat | os_log / unified logging |

Video must remain native: decode to CVPixelBuffer and render without copying every frame through JavaScript. Audio callbacks must be real-time safe and must not allocate or block. Session callbacks must be marshalled safely to the React Native event queue.

### React Native contract

The existing JS stream wrapper expects commands for session start/stop, focus, button/trigger/stick input, touchpad, performance stats, sleep, sensors and text input. Implement a documented iOS view/module contract before wiring the UI back to streaming. Do not register a fake native view just to satisfy `requireNativeComponent`.

## External codebase findings

- `streetpea/chiaki-ng` is the active upstream lineage and has a more current shared core than this repository's embedded Chiaki 2.2.0 code. Evaluate an upstream core update before implementing new iOS-only changes against the older fork.
- `mB14ck22/tp-play` is a useful reference for the intended Swift/SwiftUI + shared C/C++ architecture. Its own README explicitly says its iOS shell currently builds independently but is not connected to the Chiaki core; it is not a ready-to-drop-in working engine.
- `Teuns/Chiaki-4-iOS` is not a safe base for production streaming: its README reports broken VideoToolbox output, non-working audio and registration/discovery limitations.

These references are research leads, not dependencies copied into this project.

## Required implementation sequence

1. **Dependency and licensing audit:** pin an upstream Chiaki-ng baseline or document why the embedded core remains; inventory all transitive dependencies and licenses.
2. **Portable core build:** create an iOS-only CMake target for the protocol library, with Apple-built dependencies and no Android paths.
3. **Native session wrapper:** implement create/register/connect/disconnect/event lifecycle using Objective-C++ and a narrow C ABI.
4. **Video path:** VideoToolbox decode, bounded frame queue, Metal/CoreVideo presentation and display-synchronized frame pacing.
5. **Audio path:** Opus decode (where negotiated) and low-latency AudioUnit/AVAudioEngine output with interruption handling.
6. **Input path:** GameController mapping, touchpad/touch events, motion input and supported haptics.
7. **React Native integration:** iOS native view/module, events, commands and JS platform adapter.
8. **CI and device validation:** macOS/Xcode build, arm64 IPA packaging, install on physical iPad, then test registration and local/remote PS4/PS5 streaming.

## Release gates

An iOS shell or IPA is not a streaming release. Mark the port ready only after:
- iOS Release build succeeds on a macOS/Xcode runner;
- PSN login/registration and console connection are verified;
- real video and audio render in sync on an iPad;
- controller input, touchpad, reconnect, interruption and teardown pass;
- Android build and runtime remain unaffected.

## Current status

The shared JavaScript safety changes and iOS fallback are committed on the feature branch. The native audit confirms that a real iOS port needs a platform-specific media stack and a portable build of the Chiaki core. No iOS native session module, iOS project, build, device test or IPA has been produced yet.
