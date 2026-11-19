# iOS / iPadOS Validation Test Plan

## Purpose

This plan defines release checks for bringing the React Native application to iOS without regressing Android. Passing JavaScript compatibility checks does not mean native streaming is implemented.

## Test environments

Run the suite on:
- An iOS Simulator for navigation, layout, accessibility, and non-hardware UI checks.
- A physical iPad running the minimum supported iOS version.
- A physical iPad running the target OS used for release validation.

Record the device model, OS build, Xcode version, CocoaPods version, lockfile revision, and app commit for every run.

## Release gates

A test is Blocked when its required iOS native implementation or test environment does not exist. Never mark a blocked test passed based on static inspection or Android behavior.

| Area | Required result | Current status |
|---|---|---|
| iOS project generation | Reproducible Xcode project and workspace | Blocked: requires macOS/Xcode |
| CocoaPods | Clean pod install from lockfile | Blocked: not run |
| Build | Debug and Release arm64 iPhoneOS builds | Blocked: not run |
| Launch | Cold launch, warm launch, background/foreground | Blocked: no iOS app target |
| Dashboard | Xbox-themed screens render and navigate without Android-only module errors | Partial: JS guards added; no iOS runtime test |
| Local network | Clear permission explanation; discovery after approval | Blocked: native discovery validation pending |
| Console discovery | Discover consoles on same LAN; handle denied permission and empty results | Blocked |
| Registration / login | Pairing, PIN entry, credentials, errors, and cancellation work | Blocked |
| Wake / connect | Wake request and session setup report actionable errors | Blocked |
| Stream video | Stable VideoToolbox frames with correct orientation and color | Blocked: iOS decoder/surface not implemented |
| Stream audio | Audio starts/stops with correct route and no persistent leak | Blocked: iOS audio output not implemented |
| Controller | GameController mapping, reconnect, disconnect, and input work | Blocked: iOS native bridge not implemented |
| Touch controls | On-screen controls remain responsive | Partial: shared UI compatibility only |
| Haptics / motion | Supported hardware features work; unsupported features fail gracefully | Blocked |
| Orientation | Portrait/landscape transitions preserve layout | Blocked |
| Lifecycle | Interruptions, suspension, and resume do not leave stale sessions | Blocked |
| File transfer / registry | Document picker URLs and sandbox access work safely | Blocked |
| Settings persistence | MMKV settings survive relaunch and upgrade | Blocked |
| External display / PiP | Supported behavior validated or explicitly hidden | Blocked |
| Accessibility | VoiceOver, focus order, contrast, and Dynamic Type are usable | Not tested |
| Android regression | Existing Android build and stream path still work | Must pass before merge |

## Detailed execution checklist

### 1. Project and build integrity
- [ ] Generate the iOS project using the repository scaffold script on a clean macOS checkout.
- [ ] Confirm bundle identifier and AppDelegate module name are consistent.
- [ ] Install JavaScript dependencies using the pinned package manager and lockfile.
- [ ] Install CocoaPods dependencies from the iOS directory.
- [ ] Build the Simulator target.
- [ ] Build a Release arm64 iPhoneOS target.
- [ ] Confirm Android-only source and frameworks are not linked into the iOS target.
- [ ] Archive the build and verify signing configuration without committing certificates or provisioning secrets.

### 2. Dashboard and shared JavaScript
- [ ] Cold launch opens the Xbox-inspired dashboard.
- [ ] Dashboard header, cards, navigation, icons, and theme render correctly.
- [ ] Open every settings and information screen.
- [ ] Confirm Android-only native view managers are never resolved on iOS.
- [ ] Confirm iOS does not invoke Android-only UIManager view commands.
- [ ] Confirm unavailable native features show a clear explanation instead of crashing.
- [ ] Verify there are no unhandled promise rejections or native-module lookup errors.

### 3. Network and pairing
- [ ] First discovery attempt explains why Local Network access is needed.
- [ ] Accepting permission enables discovery.
- [ ] Denying permission shows recovery instructions and does not crash.
- [ ] Re-enabling permission in Settings restores discovery.
- [ ] Test console absent, offline, malformed response, timeout, and LAN change.
- [ ] Complete registration/pairing and verify credential persistence.
- [ ] Verify credentials are not logged in plaintext.

### 4. Streaming and controller
- [ ] Confirm the iOS Chiaki session bridge connects and disconnects cleanly.
- [ ] Verify VideoToolbox decoder creation, frame delivery, rotation, and teardown.
- [ ] Verify audio session configuration, route changes, interruptions, and teardown.
- [ ] Test every supported controller mapping, analog range, trigger, and button.
- [ ] Test controller disconnect/reconnect during a stream.
- [ ] Test touch controls while video is active.
- [ ] Verify stream stop, navigation away, backgrounding, and force quit release native resources.

### 5. Lifecycle, files, and settings
- [ ] Test background/foreground during discovery, pairing, and streaming.
- [ ] Test audio interruptions and Bluetooth route changes.
- [ ] Test orientation changes before and during streaming.
- [ ] Import and export supported files using security-scoped document URLs.
- [ ] Verify settings persistence across relaunch and app update.
- [ ] Verify restart-related actions use an iOS-supported UX; do not use private process-restart APIs.

### 6. Performance and stability
- [ ] Run a 30-minute stream soak test.
- [ ] Record frame pacing, dropped frames, audio underruns, memory, and thermal state.
- [ ] Repeat with Wi-Fi signal degradation and recovery.
- [ ] Verify no progressive memory growth after repeated connect/disconnect cycles.
- [ ] Test Low Power Mode and thermal pressure.
- [ ] Confirm errors are actionable and the app remains recoverable.

## Evidence required for each test

Record:
- Test ID and date/time.
- Device model and OS build.
- App commit SHA and build configuration.
- Preconditions and exact steps.
- Expected and actual result.
- Pass / Fail / Blocked.
- Relevant Xcode device logs, crash report, and screen recording where useful.

## Merge policy

Do not merge the iOS port into the default branch until:
1. The iOS project and pods install reproducibly.
2. Debug and Release arm64 builds succeed.
3. All required native modules are implemented rather than stubbed.
4. Physical-device discovery, pairing, streaming, audio, and controller tests pass.
5. Android build and streaming regression tests pass.

A successful shared-JavaScript audit or Chiaki protocol-core build alone is not an IPA release candidate.
