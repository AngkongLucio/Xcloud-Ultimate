# iOS / TrollStore build status

## Current verified state

- The repository is a React Native 0.72.14 application with an Android project.
- The repository tree currently has no `ios/` directory, Xcode project, or iOS Podfile.
- The streaming implementation is Android-specific: the home screen calls Android-only APIs such as `ToastAndroid`, and streaming uses native Android view managers and Java/Kotlin modules.
- The app's documented protocol and login flow are PlayStation Remote Play / PSN, not Xbox Cloud Gaming.

## What is needed before a working iPad IPA exists

1. Generate and configure the React Native iOS target and CocoaPods dependencies.
2. Port or replace the Android-only native modules: Chiaki streaming view/session, controller/USB rumble, registry credentials, discovery/wakeup, video/audio pipeline, and platform notifications.
3. Replace Android-only UI APIs with platform-neutral implementations.
4. Decide whether the product remains a PlayStation Remote Play client with an Xbox-inspired skin, or becomes a separate Xbox Cloud Gaming web client. A UI reskin cannot change the streaming protocol.
5. Build on macOS with Xcode for arm64 iOS, validate on an iPad, then package/sign the app for TrollStore installation.

## Important

This branch only applies the Xbox-inspired green/dark visual theme to the existing React Native UI. It does not claim to provide an iOS port or a working IPA. Do not install an artifact until an actual iOS build has been produced and tested.
