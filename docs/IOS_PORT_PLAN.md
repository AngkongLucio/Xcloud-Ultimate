# iOS / iPadOS port plan

This document is the implementation checklist for a real iOS target. It intentionally does not add a placeholder iOS app or a fake IPA.

## Product identity

The current codebase is PeaSyo/Pixiu v1: a PlayStation 4/5 Remote Play client using the Chiaki protocol and PSN authentication. The Xbox wording and green dashboard skin are branding only. They do not make this an Xbox Cloud Gaming client.

## Verified architecture and blockers

- React Native is pinned to 0.72.14 in `package.json`.
- There is no `ios/` directory, Xcode project, or `Podfile` on this branch.
- `src/pages/Home.jsx` imports `ToastAndroid`; Android toast calls must be replaced by a cross-platform notification abstraction.
- `src/App.tsx` directly calls `NativeModules.UsbRumbleManager.setBindUsbDevice`; that module is Android-specific.
- Android native code includes controller/gamepad, sensor, haptic, Wi-Fi performance, USB rumble, external display, picture-in-picture, logs, battery and fullscreen modules.
- `android/app/src/main/cpp` contains the Chiaki JNI bridge, audio decoder/output and controller/haptic code. The JNI bridge is not reusable as an iOS implementation.
- Android manifest declares USB services, external display service, Android permissions and a FileProvider. These need iOS-specific equivalents or deliberate feature fallbacks.
- The app's existing authentication, registration, discovery, wake-up and streaming flows are for PlayStation consoles, not Xbox Cloud Gaming.

## Port strategy

### Phase 1 — establish a valid iOS React Native target

- Generate an iOS target compatible with the existing React Native 0.72.14 dependency graph.
- Add a Podfile and lockfile generated on macOS with the matching CocoaPods toolchain.
- Configure bundle identifier, iPad orientations, launch screen, app icons, URL schemes and required network capabilities.
- Confirm every JavaScript dependency either has iOS support or is isolated behind a platform adapter.
- Add an iOS CI build on a macOS runner only after the target and pods are valid.

### Phase 2 — make the shared JavaScript application platform-safe

- Replace direct `ToastAndroid` usage with a shared toast/alert adapter and implement iOS behavior.
- Guard all Android-only native module calls with platform capability checks.
- Keep unsupported Android-only settings hidden or disabled on iOS instead of allowing undefined native-module calls.
- Verify storage, cookies, document picking, networking, orientation and WebView behavior on iOS.
- Preserve the existing Android implementation and behavior.

### Phase 3 — port the streaming engine (critical path)

- Build or integrate a maintained Chiaki-compatible iOS native core for arm64.
- Implement an iOS React Native native module/view for session lifecycle, video frames, audio output, input events, metrics and teardown.
- Replace JNI with Objective-C/Objective-C++ or Swift bridging; reuse portable C/C++ only where its dependencies and license permit.
- Implement video rendering using an iOS-native GPU path (Metal/CoreVideo) and low-latency audio using AVAudioEngine or AudioUnit.
- Validate codec support, HDR behavior, frame pacing, audio/video synchronization, reconnect and background/foreground transitions on a physical iPad.
- Do not claim streaming works until a real PS4/PS5 session has been tested.

### Phase 4 — controller and device feature parity

- Map supported Bluetooth game controllers through iOS GameController APIs.
- Implement supported haptics through CoreHaptics where the hardware and iOS APIs permit; do not promise Android USB rumble or adaptive-trigger parity.
- Rework sensors, external display, battery, logs and fullscreen behavior using iOS APIs where available.
- Document features that iPadOS does not expose to third-party apps.

### Phase 5 — signing, packaging and device validation

- Build Release for arm64 on a macOS/Xcode runner.
- Verify app entitlements and URL schemes; do not request private entitlements as a workaround.
- Package an IPA and verify its contents/signature.
- Install on a test iPad and test login, console registration, local streaming, remote streaming, controller input, audio, video, reconnect and app lifecycle.
- Only then publish an IPA and mark the build as installable.

## Acceptance criteria

- Android build remains unaffected.
- iOS Release build completes on a macOS runner.
- No required screen crashes because an Android native module is missing.
- PSN authentication and console registration work on iOS.
- A real console stream renders with synchronized audio and responsive input on an iPad.
- Unsupported Android-only features are clearly unavailable rather than silently broken.
- The delivered IPA is produced by CI and its build artifact is downloadable and verified.

## Current status

Only the Xbox-inspired visual reskin has been applied on the feature branch. No iOS native port, iOS build, device test or IPA exists yet. The next engineering milestone is Phase 1 plus the JavaScript platform audit; the streaming engine port remains the main blocker.
