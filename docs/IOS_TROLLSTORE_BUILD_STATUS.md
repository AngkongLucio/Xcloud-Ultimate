# iOS / TrollStore build status

## Current verified state

- The repository is a React Native 0.72.14 application with an Android project.
- The repository tree currently has no `ios/` directory, Xcode project, or iOS Podfile.
- The Android streaming implementation still depends on Chiaki JNI, Android video/audio APIs, and Android native view managers. Shared JavaScript now has platform guards and an explicit iOS Stream fallback; those guards do not implement streaming on iOS.
- The app's documented protocol and login flow are PlayStation Remote Play / PSN, not Xbox Cloud Gaming.

## What is needed before a working iPad IPA exists

1. Generate and configure the React Native iOS target and CocoaPods dependencies.
2. Port or replace the Android-only native modules: Chiaki streaming view/session, controller/USB rumble, registry credentials, discovery/wakeup, video/audio pipeline, and platform notifications.
3. Replace Android-only UI APIs with platform-neutral implementations.
4. Decide whether the product remains a PlayStation Remote Play client with an Xbox-inspired skin, or becomes a separate Xbox Cloud Gaming web client. A UI reskin cannot change the streaming protocol.
5. Build on macOS with Xcode for arm64 iOS, validate on an iPad, then package/sign the app for TrollStore installation.

## Important

This branch includes an iOS project-scaffold generator and a manual GitHub Actions workflow that can attempt an unsigned iOS shell-preview IPA build on macOS. The workflow has not yet been run, so no IPA is currently verified or available. Even if the shell-preview build succeeds, it will not provide working remote-play streaming, audio, or controller support. Do not describe a shell preview as a completed iOS port.

## Detailed implementation checklist

See [IOS_PORT_PLAN.md](./IOS_PORT_PLAN.md) for the phased port plan, native module inventory, streaming-engine requirements, acceptance criteria, and release validation checklist.


## Shell preview workflow

See [IOS_TROLLSTORE_PREVIEW.md](./IOS_TROLLSTORE_PREVIEW.md) for the manual GitHub Actions build and TrollStore test instructions. The workflow is a build attempt, not a passing build result.
