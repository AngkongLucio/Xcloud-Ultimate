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


## Shared-JavaScript safety work completed

The following guards are compatibility protections, not native iOS streaming implementations:

- `StreamView`, `StreamTextureView`, and `StreamFsrView` only resolve their Android native view managers on Android. On other platforms they render a plain empty React Native view, and their Android view-manager commands are not dispatched.
- `ButtonView` resolves the Android native button view only on Android. On iOS it uses a React Native `Pressable` and preserves press-in/press-out callbacks for UI safety.
- The iOS Stream screen remains an explicit unsupported-platform fallback. The empty view is not a decoder, renderer, or successful stream session.

These changes must still pass TypeScript/lint, Android regression, and iOS Xcode/device validation before release.

## Additional shared-JavaScript compatibility fixes

- `ConsoleEdit.tsx`: replaced Android-only toast calls with cross-platform alerts for validation and save/delete feedback.
- `LoginUsername.tsx`: replaced Android-only toasts with alerts, URL-encodes the username query parameter, and always clears the loading state after success or failure.
- `LoginBase64Id.tsx`: replaced Android-only toast feedback with a cross-platform alert.
- `ManualLogin.tsx`: checks whether the Android-only `HolepunchManager.getDeviceUid` bridge exists before generating a PSN login URL. On iOS, it now explains that the device identity bridge is not ported instead of crashing or displaying an endless spinner.
- `auth/index.ts`: malformed redirect URLs and redirects without an authorization code now reject instead of leaving the token exchange promise pending. Removed logging of raw redirect URLs and token/user response payloads to reduce accidental credential exposure.

These changes improve shared-JavaScript behavior but do not implement the missing iOS device identity, PSN registration, Chiaki streaming, or native networking bridge. The login and redirect flows still require validation against the actual iOS build and current Sony endpoints.

### Further Android-only screen guards

- `Logs.tsx`: log listing and sharing now check for the Android `LogsModule`; unsupported iOS builds show an explanatory message instead of dereferencing a missing native module.
- `CustomGamepad.jsx`: immersive-mode calls are Android-only and method-guarded. The shared editor layout remains available without calling the Android fullscreen bridge.
- `GameMapDetail.jsx`: Android gamepad screen-state and key-event subscriptions are skipped when the native `GamepadManager` is unavailable.
- `DualSenseWeb.jsx`: the Android asset-backed USB DualSense test page is not mounted on iOS; its native event emitter is created only on Android, and the output bridge is checked before use.
- `Users.tsx`: account deletion feedback now uses a cross-platform alert.

These guards prevent known missing-module crashes; they do not replace Android USB, gamepad, fullscreen, or log-sharing implementations with iOS equivalents.

### Network discovery and wake-up caveats

- `src/discovery/index.ts` now starts its timeout before UDP bind, so a bind callback that never arrives cannot leave the discovery promise pending forever. Socket errors reject and the Registry screen handles them.
- `src/wakeup/index.ts` and `src/utils/udp.js` still depend on `react-native-udp` socket binding/broadcast behavior. They have not been validated on iOS; do not assume that the Local Network usage string alone enables broadcast or wake-up.
- The generated iOS app includes `NSLocalNetworkUsageDescription`. Physical-device testing must confirm that iOS presents the permission prompt and that the selected UDP library supports the exact bind, broadcast, and receive operations used by the app.
- `scripts/build-ios-core.sh` and the scaffold script are preparation tools only; neither proves the iOS app compiles or can stream.

- `Login.jsx`: checks for the Android-only `HolepunchManager.getDeviceUid` before opening the embedded PSN login flow. On iOS it explains that the identity bridge is missing rather than throwing during screen initialization.
- `Settings.jsx` and `Users.tsx`: app-process restart calls after logout or deleting the final account are Android-only. iOS now asks the user to close and reopen the app after clearing the account state.
- `ConsoleEdit.tsx`: all validation and save/delete feedback uses cross-platform alerts; no Android toast API remains in this screen.
- `Home.jsx`: expired-session cleanup no longer attempts to restart the iOS process. Android retains its existing restart behavior; iOS receives close/reopen guidance after the stored session and cookies are cleared.

## Additional Chiaki RUDP hardening (static source changes)

- RUDP nested-message parsing now validates minimum header size, declared packet length, and nested-message boundaries before copying payloads. Malformed/truncated nested packets return an invalid-data error and allocated message memory is released on parse failure.
- RUDP raw sends now reject null/empty payloads, use the platform-sized socket result type, and verify that the complete datagram was accepted by the socket.
- RUDP initialization rejects a null or invalid socket before allocating synchronization and retransmission resources.
- RUDP request/retry handling now propagates send errors instead of waiting for a response after a failed send.
- POSIX stop-pipe readiness polling preserves a zero-duration first poll, while retaining the monotonic deadline across interrupted select() calls.

- RUDP retransmission-buffer shutdown now sets its stop flag under the buffer mutex, checks condition signaling and thread joining, and propagates shutdown errors so the parent RUDP instance is not freed while its worker may still be running.
- RUDP send-buffer insertion now honors its documented buffer-ownership contract on mutex failures and validates the queued payload; a failed initial worker wake-up rolls back the queued packet.

- RUDP parsing now checks the protocol magic value; receive paths use bounded heap buffers instead of variable-length stack arrays, validate receive arguments, and free buffers on every return path.
- Retransmission packet-type reads use memcpy rather than potentially unaligned integer dereferences; send-buffer insertion rejects packets shorter than the RUDP header.

- RUDP send entry points reject null handles/buffers and cap variable payload sizes to the protocol's 12-bit length field, preventing oversized stack arrays and truncated length headers.

These are source-level defensive changes only. They have not been compiled or exercised against a PlayStation console, simulator, or physical iPad. They do not implement the iOS streaming bridge or make the app IPA-ready.
