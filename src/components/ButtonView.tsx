import React from 'react';
import {requireNativeComponent, ViewProps, Platform, Pressable} from 'react-native';

type RNButtonViewProps = ViewProps & {
  onPressIn?: () => void;
  onPressOut?: () => void;
};

const RNButtonView: any = Platform.OS === 'android'
  ? requireNativeComponent<RNButtonViewProps>('ButtonView')
  : Pressable;

interface ButtonViewProps extends RNButtonViewProps {
  buttonName: string;
}

const ButtonView: React.FC<ButtonViewProps> = props => {
  const {onPressIn, onPressOut, buttonName, ...rest} = props;

  const handlePressIn = React.useCallback(() => {
    onPressIn?.();
  }, [onPressIn]);

  const handlePressOut = React.useCallback(() => {
    onPressOut?.();
  }, [onPressOut]);

  if (Platform.OS !== 'android') {
    return (
      <Pressable
        {...rest}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      />
    );
  }

  return (
    <RNButtonView
      {...rest}
      buttonName={buttonName}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    />
  );
};

export default ButtonView;
