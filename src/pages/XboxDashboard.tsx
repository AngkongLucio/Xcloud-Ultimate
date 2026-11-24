import React, {useEffect, useState} from 'react';
import {ScrollView, View, StyleSheet, Linking, Pressable} from 'react-native';
import {Button, Card, Text} from 'react-native-paper';
import {useIsFocused} from '@react-navigation/native';
import {storage} from '../store/mmkv';

const XBOX_PLAY = 'https://www.xbox.com/play';

const quickLinks = [
  {title: 'Cloud Gaming', subtitle: 'Play games from the cloud', icon: '☁️'},
  {title: 'Game Pass', subtitle: 'Explore your subscription', icon: '🎮'},
  {title: 'Recently played', subtitle: 'Continue where you left off', icon: '▶️'},
];

export default function XboxDashboardScreen({navigation}) {
  const isFocused = useIsFocused();
  const [focusOutline, setFocusOutline] = useState(() => storage.getBoolean('xbox.ui.focusOutline') ?? true);
  const [lastTitle, setLastTitle] = useState(() => storage.getString('xbox.activity.lastTitle') ?? 'No recent launch');
  const [lastOpenedAt, setLastOpenedAt] = useState(() => storage.getNumber('xbox.activity.lastOpenedAt') ?? 0);
  const [gamertag, setGamertag] = useState(() => storage.getString('xbox.profile.gamertag') ?? 'Player');
  const [avatar, setAvatar] = useState(() => storage.getString('xbox.profile.avatar') ?? '🎮');
  useEffect(() => {
    if (isFocused) {
      setFocusOutline(storage.getBoolean('xbox.ui.focusOutline') ?? true);
      setLastTitle(storage.getString('xbox.activity.lastTitle') ?? 'No recent launch');
      setLastOpenedAt(storage.getNumber('xbox.activity.lastOpenedAt') ?? 0);
      setGamertag(storage.getString('xbox.profile.gamertag') ?? 'Player');
      setAvatar(storage.getString('xbox.profile.avatar') ?? '🎮');
    }
  }, [isFocused]);
  const openCloud = () => Linking.openURL(XBOX_PLAY).catch(() => {});
  const openGamePass = () => Linking.openURL('https://www.xbox.com/xbox-game-pass').catch(() => {});
  const handleQuickLink = title => {
    if (title === 'Cloud Gaming') { openCloud(); }
    else if (title === 'Game Pass') { openGamePass(); }
    else { navigation.navigate('XboxLibrary'); }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View>
          <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
          <Text variant="headlineMedium" style={styles.heading}>Home</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('XboxProfile')} style={styles.profileShortcut} accessibilityRole="button" accessibilityLabel="Open player profile">
          <Text style={styles.profileAvatar}>{avatar}</Text>
          <Text style={styles.profileTag}>{gamertag}</Text>
        </Pressable>
        <Text variant="headlineSmall" style={styles.logo}>XBOX</Text>
      </View>

      <Card style={styles.hero} mode="contained">
          <Card.Content>
            <Text variant="labelLarge" style={styles.heroEyebrow}>READY WHEN YOU ARE</Text>
            <Text variant="headlineLarge" style={styles.heroTitle}>Play your way.</Text>
            <Text variant="bodyMedium" style={styles.heroCopy}>
              Jump into Xbox Cloud Gaming using the official Xbox service.
            </Text>
            <Button mode="contained" icon="play" onPress={openCloud} style={styles.playButton}>
              Launch Cloud Gaming
            </Button>
          </Card.Content>
      </Card>

      <View style={styles.actionRow}>
        <Button mode="outlined" icon="account-circle" textColor="#9cdb8a" onPress={() => navigation.navigate('XboxProfile')} style={styles.actionButton}>Profile</Button>
        <Button mode="outlined" icon="view-grid" textColor="#9cdb8a" onPress={() => navigation.navigate('XboxLibrary')} style={styles.actionButton}>
          Game Library
        </Button>
        <Button mode="outlined" icon="cog" textColor="#9cdb8a" onPress={() => navigation.navigate('XboxSettings')} style={styles.actionButton}>
          Settings
        </Button>
      </View>
      <Card style={styles.recentCard} mode="outlined">
        <Card.Content>
          <Text variant="labelLarge" style={styles.recentEyebrow}>RECENT ACTIVITY</Text>
          <Text variant="titleLarge" style={styles.recentTitle}>{lastTitle}</Text>
          <Text variant="bodySmall" style={styles.muted}>{lastOpenedAt ? 'Last catalog launch: ' + new Date(lastOpenedAt).toLocaleString() : 'Your catalog launch activity will appear here.'}</Text>
          <Button compact mode="text" textColor="#9cdb8a" onPress={() => navigation.navigate('XboxLibrary')} style={styles.recentButton}>Open Game Library</Button>
        </Card.Content>
      </Card>
      <Text variant="titleLarge" style={styles.sectionTitle}>Explore</Text>
      {quickLinks.map(item => (
        <Pressable
          key={item.title}
          focusable
          accessible
          accessibilityRole="button"
          accessibilityLabel={item.title + '. ' + item.subtitle}
          onPress={() => handleQuickLink(item.title)}
          style={({focused}) => [styles.linkCardPressable, focusOutline && focused && styles.focusedCard]}>
          <Card style={styles.linkCard} mode="outlined">
          <Card.Content style={styles.linkContent}>
            <Text variant="headlineMedium">{item.icon}</Text>
            <View style={styles.linkText}>
              <Text variant="titleMedium">{item.title}</Text>
              <Text variant="bodySmall" style={styles.muted}>{item.subtitle}</Text>
            </View>
            <Text variant="titleLarge" style={styles.chevron}>›</Text>
          </Card.Content>
          </Card>
        </Pressable>
      ))}

      <Text variant="bodySmall" style={styles.footer}>
        This dashboard is a launcher and companion interface. Focusable shortcuts support accessible navigation; actual D-pad behavior depends on the connected device and iPadOS. Xbox sign-in and streaming stay on the official Xbox website.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#101510'},
  content: {padding: 20, paddingBottom: 36},
  topBar: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24},
  profileShortcut: {alignItems: 'center', justifyContent: 'center', minWidth: 52, marginLeft: 'auto', marginRight: 12},
  profileAvatar: {fontSize: 25},
  profileTag: {color: '#d6e8d5', fontSize: 11, fontWeight: '700', maxWidth: 74},
  eyebrow: {color: '#8fbc8f', letterSpacing: 2, fontWeight: '700'},
  heading: {color: '#fff', fontWeight: '700', marginTop: 4},
  logo: {color: '#7ed957', fontWeight: '900', letterSpacing: 1},
  hero: {backgroundColor: '#18351f', borderRadius: 18, marginBottom: 28},
  heroEyebrow: {color: '#9cdb8a', letterSpacing: 1.5, fontWeight: '700'},
  heroTitle: {color: '#fff', fontWeight: '800', marginTop: 12},
  heroCopy: {color: '#d6e8d5', marginTop: 8, marginBottom: 18, maxWidth: 440},
  playButton: {alignSelf: 'flex-start', backgroundColor: '#107c10'},
  sectionTitle: {color: '#fff', fontWeight: '700', marginBottom: 12},
  recentCard: {backgroundColor: '#1b211c', borderColor: '#425342', borderRadius: 14, marginBottom: 22},
  recentEyebrow: {color: '#9cdb8a', letterSpacing: 1.4, fontWeight: '700'},
  recentTitle: {color: '#fff', fontWeight: '700', marginTop: 7, marginBottom: 4},
  recentButton: {alignSelf: 'flex-start', marginTop: 5},
  libraryButton: {alignSelf: 'flex-start', borderColor: '#527b52', marginBottom: 14},
  actionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14},
  actionButton: {borderColor: '#527b52'},
  linkCardPressable: {borderRadius: 14, marginBottom: 10},
  focusedCard: {borderWidth: 2, borderColor: '#9cdb8a', borderRadius: 14},
  linkCard: {backgroundColor: '#1b211c', borderColor: '#303b31', borderRadius: 14},
  linkContent: {flexDirection: 'row', alignItems: 'center', gap: 14},
  linkText: {flex: 1},
  muted: {color: '#aab5aa', marginTop: 3},
  chevron: {color: '#aab5aa'},
  footer: {color: '#829082', marginTop: 18, lineHeight: 19},
});
