# iOS / TrollStore shell preview

A manual GitHub Actions workflow is available at **Actions → iOS Shell Preview (TrollStore) → Run workflow** on the `feature/xbox-dashboard-ios-prep` branch.

The workflow generates the React Native 0.72.14 iOS shell on a GitHub-hosted macOS runner, installs Yarn and CocoaPods dependencies, builds an arm64 iPhoneOS Release app without Apple code signing, packages the app as an IPA, and uploads the IPA plus build notes as a 7-day artifact.

## Install the preview

1. Open the repository's **Actions** tab.
2. Select **iOS Shell Preview (TrollStore)**.
3. Select branch `feature/xbox-dashboard-ios-prep`.
4. Choose **Run workflow** and wait for the build to finish.
5. Open the successful run and download the `xcloud-ultimate-ios-shell-ipa` artifact.
6. Extract the ZIP artifact, then install `Xcloud-Ultimate-iOS-shell.ipa` with TrollStore on a compatible test iPad.

## Important limitations

This artifact is only a shell/UI preview. It is not a completed remote-play client and it is not Xbox Cloud Gaming. The iOS Stream screen intentionally shows an unsupported-platform fallback. Chiaki iOS session integration, VideoToolbox rendering, AudioUnit audio, controller input, and device-level network behavior still need native implementation and physical iPad testing.

The workflow has been added but has **not yet been run**. No IPA is currently available from this repository until a workflow run succeeds. Do not treat the existence of this workflow as proof that the project compiles.
