import React, {useCallback} from 'react';
import {requireNativeComponent, Platform, View} from 'react-native';

const RNAnalogStick = Platform.OS === 'android'
  ? requireNativeComponent('AnalogStickView')
  : View;

const AnalogStick = ({
  radius = 150,
  handleRadius = 100,
  onStickChange,
  ...props
}) => {
  const handleAnalogStickChange = useCallback(
    event => {
      if (onStickChange) {
        onStickChange(event.nativeEvent);
      }
    },
    [onStickChange],
  );

  if (Platform.OS !== 'android') {
    return <View {...props} />;
  }

  return (
    <RNAnalogStick
      {...props}
      radius={radius}
      handleRadius={handleRadius}
      onAnalogStickChange={handleAnalogStickChange}
    />
  );
};

export default AnalogStick;
