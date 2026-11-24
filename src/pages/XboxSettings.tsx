import React, {useEffect, useRef, useState} from 'react';
import {Alert, Linking, ScrollView, StyleSheet, View} from 'react-native';
import {Button, Card, Divider, Switch, Text} from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import {storage} from '../store/mmkv';

export default function XboxSettingsScreen() {
  const [compactCards, setCompactCards] = useState(() => storage.getBoolean('xbox.ui.compactCards') ?? false);
  const [focusOutline, setFocusOutline] = useState(() => storage.getBoolean('xbox.ui.focusOutline') ?? true);
  const [hapticsEnabled, setHapticsEnabled] = useState(() => storage.getBoolean('xbox.ui.haptics') ?? true);
  const [network, setNetwork] = useState({type: 'Checking…', connected: null, reachable: null});
  const [networkRefreshing, setNetworkRefreshing] = useState(false);
  const networkRequestId = useRef(0);

  useEffect(() => {
    let active = true;
    NetInfo.fetch().then(state => {
      if (active) {
        setNetwork({
          type: state.type || 'unknown',
          connected: state.isConnected,
          reachable: state.isInternetReachable,
        });
      }
    }).catch(() => {
      if (active) setNetwork({type: 'Unavailable', connected: null, reachable: null});
    });
    const unsubscribe = NetInfo.addEventListener(state => {
      if (active) {
        setNetwork({
          type: state.type || 'unknown',
          connected: state.isConnected,
          reachable: state.isInternetReachable,
        });
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const refreshNetwork = async () => {
    const requestId = networkRequestId.current + 1;
    networkRequestId.current = requestId;
    setNetworkRefreshing(true);
    try {
      const state = await NetInfo.fetch();
      if (networkRequestId.current !== requestId) return;
      setNetwork({
        type: state.type || 'unknown',
        connected: state.isConnected,
        reachable: state.isInternetReachable,
      });
    } catch (_) {
      if (networkRequestId.current === requestId) {
        setNetwork({type: 'Unavailable', connected: null, reachable: null});
      }
    } finally {
      if (networkRequestId.current === requestId) setNetworkRefreshing(false);
    }
  };

  const statusText = value => value === true ? 'Yes' : value === false ? 'No' : 'Unknown';

  const resetDisplayPreferences = () => {
    Alert.alert(
      'Reset display preferences?',
      'This restores compact cards off, focus highlight on, and haptic feedback on.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          onPress: () => {
            setCompactCards(false);
            setFocusOutline(true);
            setHapticsEnabled(true);
            storage.set('xbox.ui.compactCards', false);
            storage.set('xbox.ui.focusOutline', true);
            storage.set('xbox.ui.haptics', true);
          },
        },
      ],
      {cancelable: true},
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
      <Text variant="headlineMedium" style={styles.heading}>Console settings</Text>
      <Text variant="bodyMedium" style={styles.intro}>
        Customize this companion dashboard. These options affect this screen only; they do not change Xbox server settings or the actual cloud stream.
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Display & accessibility</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text variant="titleMedium" style={styles.itemTitle}>Compact game cards</Text>
              <Text variant="bodySmall" style={styles.muted}>Use a tighter layout in the dashboard preview.</Text>
            </View>
            <Switch value={compactCards} onValueChange={value => { setCompactCards(value); storage.set("xbox.ui.compactCards", value); }} accessibilityRole="switch" accessibilityLabel="Compact game cards" accessibilityHint="Changes the game card layout in the library." />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text variant="titleMedium" style={styles.itemTitle}>Focus highlight</Text>
              <Text variant="bodySmall" style={styles.muted}>Show a visible outline on focused controls.</Text>
            </View>
            <Switch value={focusOutline} onValueChange={value => { setFocusOutline(value); storage.set("xbox.ui.focusOutline", value); }} accessibilityRole="switch" accessibilityLabel="Focus highlight" accessibilityHint="Shows or hides the visible focus outline." />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text variant="titleMedium" style={styles.itemTitle}>Haptic feedback</Text>
              <Text variant="bodySmall" style={styles.muted}>Enable vibration feedback for supported menu actions.</Text>
            </View>
            <Switch value={hapticsEnabled} onValueChange={value => { setHapticsEnabled(value); storage.set("xbox.ui.haptics", value); }} accessibilityRole="switch" accessibilityLabel="Haptic feedback" accessibilityHint="Turns supported menu vibration feedback on or off." />
          </View>
          <View style={styles.preview}>
            <View style={[styles.previewTile, compactCards && styles.compactTile, focusOutline && styles.focusedTile]}>
              <Text style={styles.previewIcon}>🎮</Text>
              <View style={styles.previewCopy}>
                <Text style={styles.previewTitle}>Game tile preview</Text>
                <Text style={styles.previewSubtitle}>{compactCards ? 'Compact layout' : 'Standard layout'}</Text>
              </View>
            </View>
          </View>
          <Button
            compact
            mode="text"
            textColor="#a8e69a"
            accessibilityLabel="Reset display preferences to defaults"
            accessibilityHint="Turns compact cards off and restores focus highlight and haptic feedback."
            onPress={resetDisplayPreferences}
            style={styles.actionButton}>
            Reset display preferences
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Network information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.muted}>Connection type</Text>
            <Text accessibilityLiveRegion="polite" accessibilityLabel={"Connection type: " + network.type} style={styles.value}>{network.type}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.muted}>Connected</Text>
            <Text accessibilityLiveRegion="polite" accessibilityLabel={"Device connected: " + statusText(network.connected)} style={styles.value}>{statusText(network.connected)}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.muted}>Internet reachable</Text>
            <Text accessibilityLiveRegion="polite" accessibilityLabel={"Internet reachable: " + statusText(network.reachable)} style={styles.value}>{statusText(network.reachable)}</Text>
          </View>
          <Text variant="bodySmall" accessibilityLiveRegion="polite" accessibilityLabel={"Network status. Connection type " + network.type + ". Connected " + statusText(network.connected) + ". Internet reachable " + statusText(network.reachable) + "."} style={styles.note}>
            These are device network-status readings, not Xbox latency, stream bitrate, or server diagnostics.
          </Text>
          <Button mode="outlined" textColor="#a8e69a" loading={networkRefreshing} disabled={networkRefreshing} accessibilityLabel="Refresh device network information" accessibilityHint="Checks the current connection type and internet reachability again." onPress={refreshNetwork} style={styles.actionButton}>
            Refresh network status
          </Button>
          <Button mode="outlined" textColor="#a8e69a" accessibilityLabel="Open iPad device settings" onPress={() => Linking.openSettings().catch(() => {})} style={styles.actionButton}>
            Open device settings
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Controller</Text>
          <Text variant="bodyMedium" style={styles.muted}>
            The library currently includes an on-screen navigation pad. Physical Bluetooth controller input is not mapped to this dashboard yet.
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>App information</Text>
          <View style={styles.infoRow}><Text style={styles.muted}>Application</Text><Text style={styles.value}>Xcloud Ultimate</Text></View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}><Text style={styles.muted}>Project version</Text><Text style={styles.value}>1.8.2</Text></View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}><Text style={styles.muted}>Platform</Text><Text style={styles.value}>React Native</Text></View>
          <Text variant="bodySmall" style={styles.note}>
            Xbox account sign-in and cloud streaming remain on the official Xbox website.
          </Text>
          <Button mode="text" textColor="#a8e69a" accessibilityLabel="Open official Xbox Cloud Gaming website" onPress={() => Linking.openURL('https://www.xbox.com/play').catch(() => {})}>
            Open Xbox Cloud Gaming
          </Button>
        </Card.Content>
      </Card>
      <Text variant="bodySmall" style={styles.footer}>Display preferences are saved on this device and remain after the app is restarted.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#101510'},
  content: {padding: 18, paddingBottom: 36},
  eyebrow: {color: '#8fbc8f', letterSpacing: 2, fontWeight: '700'},
  heading: {color: '#fff', fontWeight: '800', marginTop: 5},
  intro: {color: '#aebcaf', lineHeight: 21, marginTop: 8, marginBottom: 18},
  card: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 16, marginBottom: 14},
  sectionTitle: {color: '#fff', fontWeight: '700', marginBottom: 14},
  settingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 58, gap: 12},
  settingCopy: {flex: 1},
  itemTitle: {color: '#f2f6f1'},
  muted: {color: '#aab5aa', lineHeight: 19},
  divider: {backgroundColor: '#354136', marginVertical: 10},
  preview: {marginTop: 14},
  previewTile: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#172c1b', borderRadius: 12, borderWidth: 1, borderColor: '#334735', padding: 14, gap: 12},
  compactTile: {paddingVertical: 7},
  focusedTile: {borderColor: '#9cdb8a', borderWidth: 2},
  previewIcon: {fontSize: 25},
  previewCopy: {flex: 1},
  previewTitle: {color: '#fff', fontWeight: '700'},
  previewSubtitle: {color: '#aab5aa', fontSize: 12, marginTop: 3},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 28},
  value: {color: '#f2f6f1', fontWeight: '600', textTransform: 'capitalize'},
  note: {color: '#829082', lineHeight: 18, marginTop: 12},
  actionButton: {alignSelf: 'flex-start', borderColor: '#527b52', marginTop: 12},
  footer: {color: '#829082', marginTop: 2, lineHeight: 18},
});
