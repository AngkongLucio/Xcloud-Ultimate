import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  ForwardRefRenderFunction,
} from 'react';
import {
  requireNativeComponent,
  ViewStyle,
  UIManager,
  findNodeHandle,
  Platform,
  View,
} from 'react-native';

interface StreamViewProps {
  style?: ViewStyle;
  streamInfo: any;
  onStreamStateChange?: (state: string) => void;
}

interface StreamViewRef {
  startSession: () => void;
  stopSession: () => void;
  requestFocus: () => void;
  pressButton: (buttonMask: number, isPressed: boolean) => void;
  pressTrigger: (name: string, value: number) => void;
  moveStick: (name: string, x: number, y: number) => void;
  sensorStick: (x: number, y: number) => void;
  tap: (isPressed: boolean, nextId: number, touches: any[]) => void;
  touch: (mask: number, nextId: number, touches: any[]) => void;
  getPerformance: () => void;
  usbController: (controllerStates: any) => void;
  usbDsController: (controllerStates: any) => void;
  sleep: () => void;
  startSensor: () => void;
  stopSensor: () => void;
  sendText: (text: string) => void;
  switchKb: (isReject: boolean) => void;
}

const StreamViewNative =
  Platform.OS === 'android'
    ? requireNativeComponent<StreamViewProps>('StreamFsrView')
    : View;

const StreamFsrView: ForwardRefRenderFunction<
  StreamViewRef,
  StreamViewProps
> = ({style, streamInfo, onStreamStateChange}, ref) => {
  const streamViewRef = useRef(null);

  useImperativeHandle(ref, () => ({
    startSession: () => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.startSession.toString(),
          [viewId],
        );
      }
    },
    stopSession: () => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.stopSession.toString(),
          [viewId],
        );
      }
    },
    requestFocus: () => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.requestFocus.toString(),
          [viewId],
        );
      }
    },
    pressButton: (buttonMask: number, isPressed: boolean) => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.pressButton.toString(),
          [buttonMask, isPressed],
        );
      }
    },
    pressTrigger: (name: string, value: number) => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.pressTrigger.toString(),
          [name, value],
        );
      }
    },
    moveStick: (name: string, x: number, y: number) => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.moveStick.toString(),
          [name, x, y],
        );
      }
    },
    sensorStick: (x: number, y: number) => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.sensorStick.toString(),
          [x, y],
        );
      }
    },
    tap: (isPressed: boolean, nextId: number, touches: any[]) => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.touchpadTap.toString(),
          [isPressed, nextId, ...touches],
        );
      }
    },
    touch: (mask: number, nextId: number, touches: any[]) => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.touchpad.toString(),
          [mask, nextId, ...touches],
        );
      }
    },
    getPerformance: () => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.performance.toString(),
          [],
        );
      }
    },
    usbController: (states: any) => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const {
          flags,
          leftTrigger,
          rightTrigger,
          leftStickX,
          leftStickY,
          rightStickX,
          rightStickY,
        } = states;
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.usbController.toString(),
          [
            flags,
            leftStickX,
            leftStickY,
            rightStickX,
            rightStickY,
            leftTrigger,
            rightTrigger,
          ],
        );
      }
    },
    usbDsController: (states: any) => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const {
          flags,
          leftTrigger,
          rightTrigger,
          leftStickX,
          leftStickY,
          rightStickX,
          rightStickY,
          gyrox,
          gyroy,
          gyroz,
          accelx,
          accely,
          accelz,
          touch0id,
          touch0x,
          touch0y,
          touch1id,
          touch1x,
          touch1y,
        } = states;
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.usbDsController.toString(),
          [
            flags,
            leftStickX,
            leftStickY,
            rightStickX,
            rightStickY,
            leftTrigger,
            rightTrigger,
            gyrox,
            gyroy,
            gyroz,
            accelx,
            accely,
            accelz,
            touch0id,
            touch0x,
            touch0y,
            touch1id,
            touch1x,
            touch1y,
          ],
        );
      }
    },
    sleep: () => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.gotoBed.toString(),
          [viewId],
        );
      }
    },
    startSensor: () => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.startSensor.toString(),
          [viewId],
        );
      }
    },
    stopSensor: () => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.stopSensor.toString(),
          [viewId],
        );
      }
    },
    sendText: (text: string) => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.sendText.toString(),
          [text],
        );
      }
    },
    switchKb: (isReject: boolean) => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.keyboardSwitch.toString(),
          [isReject],
        );
      }
    },
    setLoginPin: (pin: string) => {
      if (Platform.OS === 'android' && streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamFsrView.Commands.setLoginPin.toString(),
          [pin],
        );
      }
    },
  }));

  const handleStreamStateChange = (event: any) => {
    const state = event.nativeEvent.state;
    if (onStreamStateChange) {
      onStreamStateChange(state);
    }
  };

  if (Platform.OS !== 'android') {
    return <View ref={streamViewRef} style={style} />;
  }

  return (
    <StreamViewNative
      ref={streamViewRef}
      style={style}
      streamInfo={streamInfo}
      onStreamStateChange={handleStreamStateChange}
    />
  );
};

export default forwardRef(StreamFsrView);
