# iOS native module implementation matrix

This inventory is a porting checklist, not an assertion that iOS implementations already exist. The Android implementations remain authoritative for Android builds.

## Required native replacements

| Android implementation | Responsibility | iOS replacement | Port status |
|---|---|---|---|
| `com.peasyo.lib.Chiaki`, `session.StreamSession`, JNI/C++ bridge | Chiaki registration, session lifecycle, controller state and stream events | Objective-C++ React Native module backed by the portable Chiaki C core | Not implemented |
| `stream.StreamView`, `StreamTextureView`, `StreamFsrView` and view managers | Native video surface and frame presentation | UIKit view backed by VideoToolbox + CVPixelBuffer; Metal or AVSampleBufferDisplayLayer renderer | Not implemented |
| `audio` / Oboe and AAudio output | Low-latency decoded audio output and route handling | AudioUnit or AVAudioEngine output with route/interruption handling | Not implemented |
| `GamepadManager`, `GamepadSensorModule`, controller classes | Physical controller discovery and input mapping | GameController framework, including extended and micro gamepad profiles | Not implemented |
| `HapticModule`, `HapticNative`, controller haptic senders | Device/controller haptics | CoreHaptics where supported; controller haptics through GameController capabilities | Not implemented |
| `SensorModule`, orientation tracking | Motion and orientation input | CoreMotion and UIKit orientation notifications | Not implemented |
| `RegistryManager`, `HolepunchManager` | Console registration and remote connection helpers | iOS networking implementation preserving the existing protocol and credential semantics | Not implemented |
| `BatteryModule` | Device battery information | UIDevice battery monitoring | Not implemented |
| `FullScreenManager`, orientation helpers | Full-screen stream presentation and orientation | UIKit view-controller and supported orientation configuration | Not implemented |
| `PipManager` | Picture-in-picture | AVKit Picture in Picture only after the iOS media pipeline supports it | Not implemented |
| `ExternalDisplayModule`, external display service | External display support | UIKit scene/screen handling and renderer output support | Not implemented |
| `WifiPerformanceModule` | Android-specific Wi-Fi performance hints | No direct equivalent; retain a safe no-op or use only documented iOS APIs | Not implemented |
| `UsbRumbleManager`, USB driver service | USB controller and rumble integration | GameController-supported controller capabilities; no promise of arbitrary USB driver parity | Not implemented |
| `LogsModule` | Native log collection | Unified logging / os_log bridge with bounded export | Not implemented |

## JavaScript integration rules

1. Keep Android native packages and Android-only view managers behind platform-specific files or explicit `Platform.OS === 'android'` branches.
2. Do not call Android-only modules from module initialization. Resolve capabilities lazily and provide an explicit unsupported result on iOS.
3. Do not return a fake successful registration or streaming session when the native iOS implementation is absent.
4. Keep the existing Android implementation and behavior unchanged while the iOS bridge is developed.
5. Add iOS unit tests for module contracts and device tests for controller input, audio route changes, stream interruptions, background/foreground transitions and reconnect behavior.

## Release gates

- [ ] iOS React Native project and CocoaPods workspace compile on a supported Xcode version.
- [ ] Portable Chiaki core builds for iOS arm64 with iOS-targeted dependencies.
- [ ] Objective-C++ bridge implements registration, session lifecycle, events and teardown.
- [ ] VideoToolbox output presents frames without leaking pixel buffers or blocking the render thread.
- [ ] Audio output handles interruptions, route changes and app lifecycle.
- [ ] GameController input maps buttons, sticks, triggers and touchpad semantics.
- [ ] Android regression build succeeds.
- [ ] iOS build and runtime tests pass on a physical device.
- [ ] IPA packaging and TrollStore installation are verified on the target device.

A successful CMake core build alone does not satisfy these release gates.
