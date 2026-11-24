import React, {useEffect, useState} from 'react';
import {ScrollView, View, StyleSheet, Linking, Pressable, Modal, Animated} from 'react-native';
import {Button, Card, Switch, Text} from 'react-native-paper';
import {useIsFocused} from '@react-navigation/native';
import {storage} from '../store/mmkv';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const XBOX_PLAY = 'https://www.xbox.com/play';

const quickLinks = [
  {title: 'Cloud Gaming', subtitle: 'Play games from the cloud', icon: '☁️'},
  {title: 'Game Pass', subtitle: 'Explore your subscription', icon: '🎮'},
  {title: 'Recently played', subtitle: 'Continue where you left off', icon: '▶️'},
];

export default function XboxDashboardScreen({navigation}) {
  const isFocused = useIsFocused();
  const [focusOutline, setFocusOutline] = useState(() => storage.getBoolean('xbox.ui.focusOutline') ?? true);
  const [compactCards, setCompactCards] = useState(() => storage.getBoolean('xbox.ui.compactCards') ?? false);
  const [hapticsEnabled, setHapticsEnabled] = useState(() => storage.getBoolean('xbox.ui.haptics') ?? true);
  const [quickSettingsVisible, setQuickSettingsVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [bootVisible, setBootVisible] = useState(true);
  const bootOpacity = React.useRef(new Animated.Value(1)).current;
  const bootScale = React.useRef(new Animated.Value(0.88)).current;
  const [lastTitle, setLastTitle] = useState(() => storage.getString('xbox.activity.lastTitle') ?? 'No recent launch');
  const [lastOpenedAt, setLastOpenedAt] = useState(() => storage.getNumber('xbox.activity.lastOpenedAt') ?? 0);
  const [gamertag, setGamertag] = useState(() => storage.getString('xbox.profile.gamertag') ?? 'Player');
  const [avatar, setAvatar] = useState(() => storage.getString('xbox.profile.avatar') ?? '🎮');
  useEffect(() => {
    Animated.parallel([
      Animated.timing(bootScale, {toValue: 1, duration: 650, useNativeDriver: true}),
    ]).start();
    const bootTimer = setTimeout(() => {
      Animated.timing(bootOpacity, {toValue: 0, duration: 350, useNativeDriver: true}).start(({finished}) => {
        if (finished) setBootVisible(false);
      });
    }, 1150);
    return () => clearTimeout(bootTimer);
  }, [bootOpacity, bootScale]);

  useEffect(() => {
    if (isFocused) {
      setFocusOutline(storage.getBoolean('xbox.ui.focusOutline') ?? true);
      setCompactCards(storage.getBoolean('xbox.ui.compactCards') ?? false);
      setHapticsEnabled(storage.getBoolean('xbox.ui.haptics') ?? true);
      setLastTitle(storage.getString('xbox.activity.lastTitle') ?? 'No recent launch');
      setLastOpenedAt(storage.getNumber('xbox.activity.lastOpenedAt') ?? 0);
      setGamertag(storage.getString('xbox.profile.gamertag') ?? 'Player');
      setAvatar(storage.getString('xbox.profile.avatar') ?? '🎮');
    }
  }, [isFocused]);
  const haptic = (type = 'selection') => {
    if (!hapticsEnabled) return;
    try { ReactNativeHapticFeedback.trigger(type, {enableVibrateFallback: true, ignoreAndroidSystemSettings: false}); } catch (_) {}
  };
  const updateHaptics = value => { setHapticsEnabled(value); storage.set('xbox.ui.haptics', value); if (value) { try { ReactNativeHapticFeedback.trigger('impactLight', {enableVibrateFallback: true, ignoreAndroidSystemSettings: false}); } catch (_) {} } };
  const openCloud = () => { haptic('impactLight'); Linking.openURL(XBOX_PLAY).catch(() => {}); };
  const updateFocusOutline = value => { haptic(); setFocusOutline(value); storage.set('xbox.ui.focusOutline', value); };
  const updateCompactCards = value => { haptic(); setCompactCards(value); storage.set('xbox.ui.compactCards', value); };
  const openGamePass = () => Linking.openURL('https://www.xbox.com/xbox-game-pass').catch(() => {});
  const openGuideRoute = route => { haptic('impactLight'); setGuideVisible(false); if (route === 'CloudGaming') { openCloud(); } else { navigation.navigate(route); } };
  const handleQuickLink = title => {
    if (title === 'Cloud Gaming') { openCloud(); }
    else if (title === 'Game Pass') { openGamePass(); }
    else { navigation.navigate('XboxLibrary'); }
  };

  return (
    <View style={styles.root}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View>
          <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
          <Text variant="headlineMedium" style={styles.heading}>Home</Text>
        </View>
        <Pressable onPress={() => { haptic(); navigation.navigate('XboxProfile'); }} style={styles.profileShortcut} accessibilityRole="button" accessibilityLabel="Open player profile">
          <Text style={styles.profileAvatar}>{avatar}</Text>
          <Text style={styles.profileTag}>{gamertag}</Text>
        </Pressable>
        <View style={styles.topActions}>
          <Pressable onPress={() => { haptic(); setGuideVisible(true); }} accessibilityRole="button" accessibilityLabel="Open Xbox guide" style={styles.quickButton}>
            <Text style={styles.quickButtonText}>☰</Text>
          </Pressable>
          <Pressable onPress={() => { haptic(); setQuickSettingsVisible(value => !value); }} accessibilityRole="button" accessibilityLabel="Toggle quick settings" style={styles.quickButton}>
            <Text style={styles.quickButtonText}>⚙</Text>
          </Pressable>
          <Text variant="headlineSmall" style={styles.logo}>XBOX</Text>
        </View>
      </View>

      <Modal visible={guideVisible} transparent animationType="fade" onRequestClose={() => setGuideVisible(false)}>
        <View style={styles.guideOverlay}>
          <Pressable style={styles.guideBackdrop} onPress={() => setGuideVisible(false)} accessibilityRole="button" accessibilityLabel="Close guide" />
          <View style={styles.guideDrawer}>
            <View style={styles.guideTop}>
              <View><Text style={styles.guideEyebrow}>XCLOUD ULTIMATE</Text><Text style={styles.guideHeading}>Guide</Text></View>
              <Pressable onPress={() => { haptic(); setGuideVisible(false); }} style={styles.guideClose}><Text style={styles.guideCloseText}>✕</Text></Pressable>
            </View>
            <Pressable style={styles.guideProfile} onPress={() => openGuideRoute('XboxProfile')}>
              <Text style={styles.guideAvatar}>{avatar}</Text>
              <View style={{flex: 1}}><Text style={styles.guideName}>{gamertag}</Text><Text style={styles.guideHint}>Local player profile</Text></View>
              <Text style={styles.guideChevron}>›</Text>
            </Pressable>
            <Text style={styles.guideSection}>GAMING</Text>
            <Pressable style={styles.guideItem} onPress={() => openGuideRoute('CloudGaming')}><Text style={styles.guideIcon}>☁️</Text><Text style={styles.guideItemText}>Cloud Gaming</Text></Pressable>
            <Pressable style={styles.guideItem} onPress={() => openGuideRoute('XboxLibrary')}><Text style={styles.guideIcon}>🎮</Text><Text style={styles.guideItemText}>Game Library</Text></Pressable>
            <Pressable style={styles.guideItem} onPress={() => openGuideRoute('XboxAchievements')}><Text style={styles.guideIcon}>🏆</Text><Text style={styles.guideItemText}>Achievements</Text></Pressable>
            <Text style={styles.guideSection}>COMMUNITY</Text>
            <Pressable style={styles.guideItem} onPress={() => openGuideRoute('XboxFriends')}><Text style={styles.guideIcon}>👥</Text><Text style={styles.guideItemText}>Friends</Text></Pressable>
            <Pressable style={styles.guideItem} onPress={() => openGuideRoute('XboxMessages')}><Text style={styles.guideIcon}>💬</Text><Text style={styles.guideItemText}>Messages</Text></Pressable>
            <Pressable style={styles.guideItem} onPress={() => openGuideRoute('XboxNotifications')}><Text style={styles.guideIcon}>🔔</Text><Text style={styles.guideItemText}>Notifications</Text></Pressable>
            <View style={styles.guideSpacer} />
            <Text style={styles.guideSection}>SYSTEM</Text>
            <Pressable style={styles.guideItem} onPress={() => openGuideRoute('XboxSettings')}><Text style={styles.guideIcon}>⚙️</Text><Text style={styles.guideItemText}>Settings</Text></Pressable>
            <Text style={styles.guideFoot}>Companion app menu · Xbox sign-in stays official</Text>
          </View>
        </View>
      </Modal>

      {quickSettingsVisible ? (
        <Card style={styles.quickPanel} mode="outlined">
          <Card.Content>
            <View style={styles.quickHeader}>
              <Text variant="titleLarge" style={styles.quickTitle}>Quick Settings</Text>
              <Button compact textColor="#9cdb8a" onPress={() => { haptic(); setQuickSettingsVisible(false); }}>Close</Button>
            </View>
            <View style={styles.quickRow}>
              <View style={styles.quickCopy}><Text style={styles.quickLabel}>Focus highlight</Text><Text style={styles.quickHint}>Visible keyboard focus outline</Text></View>
              <Switch value={focusOutline} onValueChange={updateFocusOutline} />
            </View>
            <View style={styles.quickDivider} />
            <View style={styles.quickRow}>
              <View style={styles.quickCopy}><Text style={styles.quickLabel}>Controller feedback</Text><Text style={styles.quickHint}>Haptic taps for menu actions</Text></View>
              <Switch value={hapticsEnabled} onValueChange={updateHaptics} />
            </View>
            <View style={styles.quickDivider} />
            <View style={styles.quickRow}>
              <View style={styles.quickCopy}><Text style={styles.quickLabel}>Compact game cards</Text><Text style={styles.quickHint}>Tighter game library layout</Text></View>
              <Switch value={compactCards} onValueChange={updateCompactCards} />
            </View>
            <View style={styles.quickActions}>
              <Button compact mode="outlined" textColor="#9cdb8a" onPress={() => { setQuickSettingsVisible(false); navigation.navigate('XboxSettings'); }}>All settings</Button>
              <Button compact mode="outlined" textColor="#9cdb8a" onPress={() => { setQuickSettingsVisible(false); navigation.navigate('XboxNotifications'); }}>Notifications</Button>
              <Button compact mode="contained" buttonColor="#107c10" onPress={openCloud}>Launch cloud</Button>
            </View>
          </Card.Content>
        </Card>
      ) : null}

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
        <Button mode="outlined" icon="account-group" textColor="#9cdb8a" onPress={() => navigation.navigate('XboxFriends')} style={styles.actionButton}>
          Friends
        </Button>
        <Button mode="outlined" icon="trophy" textColor="#9cdb8a" onPress={() => navigation.navigate('XboxAchievements')} style={styles.actionButton}>
          Achievements
        </Button>
        <Button mode="outlined" icon="message-text" textColor="#9cdb8a" onPress={() => navigation.navigate('XboxMessages')} style={styles.actionButton}>
          Messages
        </Button>
        <Button mode="outlined" icon="bell" textColor="#9cdb8a" onPress={() => navigation.navigate('XboxNotifications')} style={styles.actionButton}>
          Notifications
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
    {bootVisible ? (
      <Animated.View pointerEvents="none" style={[styles.bootScreen, {opacity: bootOpacity}]}>
        <Animated.View style={[styles.bootBrand, {transform: [{scale: bootScale}]}]}>
          <View style={styles.bootMark}><Text style={styles.bootX}>X</Text></View>
          <Text style={styles.bootWord}>XBOX</Text>
          <Text style={styles.bootSub}>XCLOUD ULTIMATE</Text>
          <View style={styles.bootTrack}><View style={styles.bootProgress} /></View>
          <Text style={styles.bootLoading}>STARTING YOUR EXPERIENCE</Text>
        </Animated.View>
      </Animated.View>
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#101510'},
  bootScreen: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: '#050805', alignItems: 'center', justifyContent: 'center'},
  bootBrand: {alignItems: 'center', justifyContent: 'center'},
  bootMark: {width: 78, height: 78, borderRadius: 39, borderWidth: 3, borderColor: '#78d64b', alignItems: 'center', justifyContent: 'center', marginBottom: 15, shadowColor: '#63d33b', shadowOpacity: 0.65, shadowRadius: 20, shadowOffset: {width: 0, height: 0}, elevation: 10},
  bootX: {color: '#8be85d', fontSize: 54, fontWeight: '900', lineHeight: 62},
  bootWord: {color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: 5},
  bootSub: {color: '#8be85d', fontSize: 10, fontWeight: '800', letterSpacing: 3, marginTop: 7},
  bootTrack: {width: 148, height: 3, backgroundColor: '#253126', borderRadius: 2, overflow: 'hidden', marginTop: 34},
  bootProgress: {width: '72%', height: 3, backgroundColor: '#78d64b', borderRadius: 2},
  bootLoading: {color: '#778477', fontSize: 9, letterSpacing: 1.5, marginTop: 13},
  screen: {flex: 1, backgroundColor: '#101510'},
  content: {padding: 20, paddingBottom: 36},
  topBar: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24},
  profileShortcut: {alignItems: 'center', justifyContent: 'center', minWidth: 52, marginLeft: 'auto', marginRight: 12},
  topActions: {alignItems: 'center', gap: 8},
  guideOverlay: {flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.58)'},
  guideBackdrop: {flex: 1},
  guideDrawer: {width: '82%', maxWidth: 360, backgroundColor: '#151d16', paddingTop: 54, paddingHorizontal: 18, paddingBottom: 24, borderLeftWidth: 1, borderLeftColor: '#456345'},
  guideTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22},
  guideEyebrow: {color: '#8fbc8f', fontSize: 10, letterSpacing: 2, fontWeight: '800'},
  guideHeading: {color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4},
  guideClose: {width: 36, height: 36, borderRadius: 18, backgroundColor: '#29372b', alignItems: 'center', justifyContent: 'center'},
  guideCloseText: {color: '#d9ead7', fontSize: 17},
  guideProfile: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, backgroundColor: '#223126', borderRadius: 13, marginBottom: 22},
  guideAvatar: {fontSize: 29},
  guideName: {color: '#fff', fontWeight: '800', fontSize: 15},
  guideHint: {color: '#9eae9d', fontSize: 11, marginTop: 3},
  guideChevron: {color: '#9cdb8a', fontSize: 25},
  guideSection: {color: '#85ad7e', fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginBottom: 8, marginTop: 8},
  guideItem: {height: 49, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, borderRadius: 10},
  guideIcon: {fontSize: 20, width: 26},
  guideItemText: {color: '#f1f5ef', fontSize: 15, fontWeight: '600'},
  guideSpacer: {height: 12},
  guideFoot: {color: '#788879', fontSize: 10, marginTop: 16, lineHeight: 15},
  quickButton: {width: 34, height: 34, borderRadius: 17, backgroundColor: '#26372a', alignItems: 'center', justifyContent: 'center'},
  quickButtonText: {color: '#b8e7ad', fontSize: 22, fontWeight: '700'},
  quickPanel: {backgroundColor: '#1b211c', borderColor: '#66845f', borderWidth: 1, borderRadius: 16, marginBottom: 18},
  quickHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8},
  quickTitle: {color: '#fff', fontWeight: '800'},
  quickRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 58, gap: 12},
  quickCopy: {flex: 1},
  quickLabel: {color: '#f2f6f1', fontWeight: '700'},
  quickHint: {color: '#aab5aa', fontSize: 12, marginTop: 3},
  quickDivider: {height: 1, backgroundColor: '#354136'},
  quickActions: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
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
