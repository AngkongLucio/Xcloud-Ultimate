# iOS Local Network Discovery

## Current implementation

The shared JavaScript discovery path sends PS4/PS5 UDP broadcast discovery packets through `react-native-udp` to `255.255.255.255`. It collects valid `DEVICE` responses, de-duplicates by host ID, ignores malformed packets, and ends the operation after a bounded timeout. Socket errors reject the operation so the Registry screen can stop its loading state and show an actionable error.

The iOS scaffold script adds `NSLocalNetworkUsageDescription` to the generated app `Info.plist`. iOS displays this permission prompt when the app first attempts local-network access.

## Important limitations

- The permission description does not itself grant access; the user must approve the iOS Local Network prompt in Settings or when prompted.
- This does not prove that the installed `react-native-udp` version supports the required UDP broadcast behavior on iOS.
- Router/AP client isolation, guest Wi-Fi, VLAN separation, VPNs, and firewall rules can prevent discovery even when permission is granted.
- No Bonjour service declaration is added because the current discovery implementation uses UDP broadcast, not Bonjour.
- Discovery is not console registration or streaming. The iOS native Chiaki bridge and stream renderer remain unimplemented.

## Required validation on a real iPad

1. Generate the iOS project on macOS using `scripts/scaffold-ios-project.sh`.
2. Install pods and build the app with the repository's pinned React Native dependencies.
3. Install on a physical iPad and accept the Local Network permission prompt.
4. Put the iPad and PS4/PS5 on the same non-isolated LAN.
5. Test PS4 and PS5 discovery separately; verify device IDs, names, addresses, and response ports.
6. Deny Local Network permission and verify the Registry screen exits its loading state and displays a useful error or empty result rather than hanging.
7. Repeat with the console powered off and with the iPad on a guest network.
8. Confirm Android discovery still works after the shared JavaScript changes.

## Release status

Static code preparation only. No iOS pod install, Xcode build, simulator run, or physical-device UDP test has been completed. Do not treat iOS discovery as validated until the steps above pass.

## Dependency verification

The repository lockfile resolves `react-native-udp` to **4.1.7**. That release includes iOS Objective-C sources and a CocoaPods specification depending on React-Core and CocoaAsyncSocket. Its iOS implementation exposes bind, send, receive events, close, and broadcast configuration, which match the basic operations used by the PS4/PS5 discovery function.

This is a static source/API compatibility check, not an iOS build or a real-network test. The library is an older release, so CocoaPods integration, iOS 18 behavior, Local Network permission, and router-specific broadcast behavior still need physical-device validation. The app also contains a separate UDP helper and wake-up path; those flows must be tested independently. The wake-up function now validates its host/credential inputs, binds to the address family matching the target (IPv4 or IPv6), has a bounded bind/send timeout, closes its socket on every completion path, and resolves a boolean result. This remains a best-effort foreground operation: iOS suspends apps in the background and does not guarantee that UDP wake-up sockets remain active while suspended. Test wake-up with the app foregrounded on both IPv4 and IPv6 networks; do not advertise background wake-up as supported.
