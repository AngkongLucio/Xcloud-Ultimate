# iOS application scaffold

The repository's shared JavaScript is React Native 0.72.14, but the original project did not contain an `ios/` directory. The generator in `scripts/scaffold-ios-project.sh` creates the native Xcode shell from the matching React Native template without modifying Android files.

## Requirements

- macOS
- Xcode and its command-line tools
- Node.js and npm
- CocoaPods
- The repository dependencies installed with Yarn after scaffolding

## Generate the iOS shell

From the repository root on macOS:

```sh
bash scripts/scaffold-ios-project.sh
yarn install
cd ios
pod install
open Peasyo.xcworkspace
```

The script refuses to overwrite an existing `ios/` directory. It generates the React Native 0.72.14 template, then aligns the iOS bundle identifier with the Android application ID (`com.peasyo`) and the existing JavaScript AppRegistry name (`peasyo`).

## What this does not implement

This is a project-shell generator, not a completed iOS port. It does not implement or claim support for:

- Chiaki session and registration native bridge
- VideoToolbox decoding and native video presentation
- AudioUnit / AVAudioEngine output
- GameController input mapping and controller rumble
- CoreMotion, CoreHaptics, external display, picture-in-picture, or USB-specific features

Those native modules must be implemented and tested separately. The current iOS Stream screen remains an explicit unsupported-platform fallback until the streaming bridge and renderer are complete. Do not package or distribute an IPA as a working remote-play client until those gates pass.

## Build and validation

After CocoaPods installation, open `Peasyo.xcworkspace` in Xcode and build for an iPadOS device. Resolve any podspec or deployment-target incompatibilities against the exact locked dependency versions; do not silently remove Android functionality or dependencies to make the iOS build pass.

A successful Xcode shell build proves only that the React Native shell compiles. It does not prove streaming, controller, audio, or native Chiaki functionality.
