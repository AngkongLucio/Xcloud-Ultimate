# iOS stream native contract

This document defines the iOS replacement boundary for the Android-only `StreamFsrView`. It is an implementation contract, not a claim that the iOS renderer or stream engine exists.

## Existing JavaScript boundary

`src/components/StreamFsrView.tsx` registers the native view name `StreamFsrView` and exposes these imperative operations:

| Operation | Parameters | iOS responsibility |
|---|---|---|
| `startSession` | none | Create/start one Chiaki session from the supplied stream configuration |
| `stopSession` | none | Stop session, release audio/video resources, cancel callbacks |
| `requestFocus` | none | Restore input focus where applicable |
| `pressButton` | `buttonMask, isPressed` | Send controller button down/up |
| `pressTrigger` | `name, value` | Send analog trigger value |
| `moveStick` | `name, x, y` | Send analog stick value |
| `sensorStick` | `x, y` | Send motion-derived controller input when supported |
| `tap` | `isPressed, nextId, touches[]` | Send touchpad click/tap |
| `touch` | `mask, nextId, touches[]` | Send touchpad contact updates |
| `getPerformance` | none | Emit current stream metrics |
| `usbController` | controller state object | Translate supported controller state into Chiaki input |
| `usbDsController` | DualSense state object | Translate supported state; omit unavailable USB-only capabilities |
| `sleep` | none | Request console standby using the existing session command |
| `startSensor` / `stopSensor` | none | Start/stop supported motion input |
| `sendText` | `text` | Send text to the console session |
| `switchKb` | `isReject` | Handle keyboard visibility/rejection state |
| `setLoginPin` | `pin` | Submit the console login PIN |

The native view emits `onStreamStateChange` with `nativeEvent.state`. Preserve this event contract so the existing stream screen can keep its state machine.

## iOS implementation shape

- Implement a React Native 0.72 iOS view manager named exactly `StreamFsrView` and expose the `streamInfo` view property.
- Implement the imperative commands through the legacy UIManager command API used by the current JS wrapper, or update the JS wrapper and native module together to a supported command mechanism. Do not mix the two contracts.
- Keep session ownership in one native session object. The view owns presentation and forwards commands; it must not create multiple sessions when React re-renders.
- Build the portable Chiaki C library for iOS arm64 and link it to an Objective-C++ adapter. The adapter owns callback lifetime and translates Chiaki events to React Native events.
- Decode supported H.264/HEVC frames with VideoToolbox and render via CoreVideo/Metal or AVSampleBufferDisplayLayer. Select the path only after measuring frame latency on a physical iPad.
- Output audio through AudioUnit or AVAudioEngine with bounded buffering and explicit teardown.
- Map Bluetooth controllers using GameController. Map motion only when the relevant iOS APIs and device support it. USB-specific Android controller commands must not be represented as universally supported on iPadOS.
- Use a serial session queue for Chiaki lifecycle and input ordering. Do not block the main/UI queue with network, decode, or audio work.

## Required lifecycle and error behavior

1. Validate `streamInfo` before creating a session; report a structured error state instead of crashing.
2. Emit state transitions for connecting, connected, stopping, stopped, and failed (retain any existing states the JS screen already handles).
3. Make `stopSession` idempotent. It must stop the Chiaki session, detach callbacks, stop audio, release pixel buffers/layers, and prevent late callbacks from touching a deallocated view.
4. Handle app background/foreground and view unmount explicitly. Never leave a live session running because the React view disappeared.
5. Surface protocol, authentication, network, decoder, and audio errors through the stream state/event contract and native logs.
6. Keep input calls safe before session start and after stop; ignore or report them without dereferencing a released session.

## Feature parity boundaries

- Core PS4/PS5 Remote Play session, video, audio, and controller input are release blockers.
- Touchpad, text input, login PIN, standby, performance telemetry, and motion input should be ported after the core path works.
- Android USB rumble, Android external-display service, Android Picture-in-Picture, and Android-only performance controls require separate iOS designs or explicit unsupported states. Do not silently claim parity.
- The app is a PlayStation Remote Play client with an Xbox-inspired theme; this contract does not add Xbox Cloud Gaming support.

## Acceptance tests before an IPA is called installable

- Create/start/stop/restart a session repeatedly without leaks or stale callbacks.
- Validate a real PS4 and PS5 connection on a physical iPad.
- Verify stable video frame pacing, audio/video synchronization, controller latency, reconnect, sleep/wake, and background/foreground transitions.
- Verify Bluetooth controller mappings and touch controls.
- Verify all failures produce recoverable UI states.
- Run the existing Android build and test the Android stream path to confirm no regression.
