import React from 'react';
import {View, StyleSheet, Linking} from 'react-native';
import {Button, Text} from 'react-native-paper';

const XBOX_CLOUD_URL = 'https://www.xbox.com/play';

export default function XboxCloudScreen() {
  const openXboxCloud = () => {
    Linking.openURL(XBOX_CLOUD_URL).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Xbox Cloud Gaming
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        Launch the official Xbox Cloud Gaming website in your browser. Sign in
        with your Microsoft account there; this app does not collect or store
        your Xbox password.
      </Text>
      <Button mode="contained" icon="microsoft-xbox" onPress={openXboxCloud}>
        Open Xbox Cloud Gaming
      </Button>
      <Text variant="bodySmall" style={styles.note}>
        Streaming availability, controller support, and video quality depend on
        Xbox service support and your browser/device.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
  },
  note: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
});
