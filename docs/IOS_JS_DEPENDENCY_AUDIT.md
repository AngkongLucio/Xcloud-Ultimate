# iOS JavaScript Dependency Audit

**Scope:** React Native 0.72.14 shared JavaScript dependencies and iOS readiness.
**Status:** Static source audit only. No CocoaPods resolution, Xcode build, simulator run, or device test has been performed.

This audit does not claim that the app is iOS-ready. The repository still needs a generated iOS project and real native implementations for the Chiaki streaming stack.

## Findings

| Dependency / area | Current use | iOS assessment / required validation |
|---|---|---|
| `react-native-udp` | PS4/PS5 discovery, wake-up, and local UDP messaging | Native iOS socket support must be confirmed with the exact pinned package version. Test broadcast, bind, IPv4/IPv6, socket cleanup, and Local Network permission behavior on a physical device. |
| `react-native-mmkv` 2.x | Persistent settings and token stores | Requires its iOS native pod and compatible native build. Confirm the pod is installed and verify persistence/migration on iOS. |
| `react-native-fs` | File access / transfer workflows | Validate iOS sandbox paths, document-picker URLs, and read/write permissions; Android paths must not be reused. |
| `react-native-network-info` | Network diagnostics | Confirm the package's iOS implementation and permission behavior; do not assume Android interface details exist on iOS. |
| `react-native-orientation-locker` | Orientation control | Validate iOS supported orientations and Info.plist / application delegate integration. |
| `react-native-haptic-feedback` | Haptic feedback | Confirm iOS haptic types and graceful behavior on unsupported devices. |
| `react-native-edge-to-edge` | Android system-bar presentation | The app root now renders `SystemBars` only on Android. Do not mount this Android-specific UI on iOS. |
| `react-native-restart` | App restart workflow | iOS does not provide a general public API to programmatically restart an app. Hide or redesign this action on iOS rather than invoking an unsupported native method. |
| `react-native-splash-screen` | Native splash screen | Requires iOS launch-screen integration; validate separately from Android setup. |
| `react-native-document-picker` | File selection / transfer | Validate security-scoped URLs and iOS document-provider behavior. |
| `react-native-gesture-handler`, `react-native-reanimated`, `react-native-svg` | Shared controller and UI rendering | Include required iOS pods and validate gesture initialization, worklets, SVG rendering, and release build configuration. |
| `react-native-webview` | Web content / controller pages | Validate navigation, cookies, local-network access, and content process lifecycle on iOS. |
| `react-native-quick-base64`, `react-native-url-polyfill`, buffer packages | Encoding and URL compatibility | Run iOS bundle/runtime tests for the exact installed versions. |
| Clipboard, NetInfo, Slider, Safe Area, Screens, Vector Icons, Paper, A11y | Shared UI and platform services | Confirm autolinking and pod integration; test the relevant screens on an iOS simulator and device. |
| Chiaki JNI / Android MediaCodec / Oboe / Android native views | Remote-play streaming and controller bridge | Android-only. These are not made iOS-compatible by JS guards; implement the Objective-C++ / VideoToolbox / AudioUnit / GameController equivalents described in the native port plan. |

## Shared JavaScript guard added

- `src/App.tsx` now imports `Platform` and renders `SystemBars` only when `Platform.OS === 'android'`.
- Android USB rumble binding remains guarded by checking that the native method exists.
- Existing stream view wrappers continue to avoid resolving Android native view managers on iOS. The iOS stream screen remains an explicit unsupported-platform fallback.

## iOS permission and integration checklist

Before testing local discovery or file workflows, review the generated iOS target's `Info.plist` and native configuration for:

- A clear `NSLocalNetworkUsageDescription` explaining that the app searches for PlayStation consoles on the local network.
- Any Bonjour service declarations only if the final implementation actually uses Bonjour; the current UDP broadcast code alone is not a reason to invent service types.
- Document-picker / file-provider integration and sandbox-safe URL handling.
- Supported orientation declarations matching the UI and stream design.
- Required CocoaPods, Reanimated Babel configuration, and native module setup for the exact lockfile versions.

Do not add camera, microphone, Bluetooth, or location usage strings unless the final iOS implementation actually requests those capabilities.

## Release gate

1. Generate the iOS project on macOS using the repository scaffold script.
2. Install pods and resolve every native dependency for the pinned React Native version.
3. Fix unsupported APIs deliberately; do not add empty native stubs or silently disable core features.
4. Run TypeScript, lint, and JS bundle checks.
5. Build the iOS simulator target and a physical-device arm64 target.
6. Test login, persistence, discovery, wake-up, file transfer, controller UI, lifecycle, and network permission prompts.
7. Implement and test the real iOS Chiaki streaming bridge before claiming remote-play support or producing a release IPA.

A successful dependency or protocol-core build alone is not a working iOS app and is not an installable IPA.
