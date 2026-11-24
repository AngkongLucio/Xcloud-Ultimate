import React, {useState} from 'react';
import {ScrollView, StyleSheet, View, Pressable} from 'react-native';
import {Button, Card, Text, TextInput} from 'react-native-paper';
import {storage} from '../store/mmkv';

const AVATARS = ['🎮', '🛡️', '🚀', '🐉', '⚡', '👾', '🏎️', '🌌'];

export default function XboxProfileScreen() {
  const [gamertag, setGamertag] = useState(() => storage.getString('xbox.profile.gamertag') ?? 'Player');
  const [avatar, setAvatar] = useState(() => storage.getString('xbox.profile.avatar') ?? '🎮');
  const [saved, setSaved] = useState(false);
  const [launchCount, setLaunchCount] = useState(() => storage.getNumber('xbox.activity.launchCount') ?? 0);

  const saveProfile = () => {
    const cleanTag = gamertag.trim().slice(0, 16) || 'Player';
    setGamertag(cleanTag);
    storage.set('xbox.profile.gamertag', cleanTag);
    storage.set('xbox.profile.avatar', avatar);
    setSaved(true);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
      <Text variant="headlineMedium" style={styles.heading}>Player profile</Text>
      <Text variant="bodyMedium" style={styles.intro}>Create a local profile for this companion interface. This is not an Xbox account and does not change your Microsoft gamertag.</Text>

      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <View style={styles.avatarCircle}><Text style={styles.avatarLarge}>{avatar}</Text></View>
          <Text variant="headlineSmall" style={styles.profileName}>{gamertag.trim() || 'Player'}</Text>
          <Text variant="labelMedium" style={styles.profileCaption}>LOCAL PLAYER PROFILE</Text>
        </Card.Content>
      </Card>

      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Player stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text variant="headlineMedium" style={styles.statNumber}>{launchCount}</Text>
              <Text variant="labelSmall" style={styles.statLabel}>CATALOG OPENS</Text>
            </View>
            <View style={styles.statTile}>
              <Text variant="headlineMedium" style={styles.statNumber}>{launchCount >= 1 ? '✓' : '—'}</Text>
              <Text variant="labelSmall" style={styles.statLabel}>FIRST VISIT</Text>
            </View>
          </View>
          <Text variant="titleMedium" style={styles.milestoneTitle}>Local milestones</Text>
          {[
            {label: 'First steps', target: 1},
            {label: 'Explorer', target: 5},
            {label: 'Regular', target: 10},
          ].map(item => (
            <View key={item.label} style={styles.milestoneRow}>
              <View style={styles.milestoneCopy}>
                <Text style={styles.milestoneName}>{item.label}</Text>
                <Text style={styles.milestoneHint}>{Math.min(launchCount, item.target)} / {item.target} catalog opens</Text>
              </View>
              <Text style={styles.milestoneStatus}>{launchCount >= item.target ? '✓' : '○'}</Text>
            </View>
          ))}
          <Text variant="bodySmall" style={styles.statsNote}>These are local companion-app milestones, not official Xbox achievements or playtime.</Text>
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Choose avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map(item => (
              <Pressable key={item} accessibilityRole="button" accessibilityLabel={'Choose avatar ' + item} onPress={() => {setAvatar(item); setSaved(false);}} style={[styles.avatarChoice, avatar === item && styles.avatarSelected]}>
                <Text style={styles.avatarOption}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text variant="titleLarge" style={[styles.sectionTitle, styles.nameHeading]}>Gamertag</Text>
          <TextInput
            mode="outlined"
            label="Display name"
            value={gamertag}
            onChangeText={value => {setGamertag(value.slice(0, 16)); setSaved(false);}}
            maxLength={16}
            autoCapitalize="none"
            style={styles.input}
            textColor="#fff"
            outlineColor="#526552"
            activeOutlineColor="#9cdb8a"
            theme={{colors: {onSurfaceVariant: '#aab5aa'}}}
          />
          <Text variant="bodySmall" style={styles.hint}>Up to 16 characters. Saved only on this device.</Text>
          <Button mode="contained" icon="content-save" onPress={saveProfile} style={styles.saveButton}>Save profile</Button>
          {saved ? <Text variant="bodySmall" style={styles.saved}>Profile saved on this device.</Text> : null}
        </Card.Content>
      </Card>
      <Text variant="bodySmall" style={styles.footer}>Your Xbox sign-in, achievements, friends, and official account details are not accessed or modified by this local profile.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#101510'},
  content: {padding: 18, paddingBottom: 36},
  eyebrow: {color: '#8fbc8f', letterSpacing: 2, fontWeight: '700'},
  heading: {color: '#fff', fontWeight: '800', marginTop: 5},
  intro: {color: '#aebcaf', lineHeight: 21, marginTop: 8, marginBottom: 18},
  statsCard: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 16, marginBottom: 14},
  statsRow: {flexDirection: 'row', gap: 10},
  statTile: {flex: 1, backgroundColor: '#202920', borderRadius: 12, padding: 14},
  statNumber: {color: '#9cdb8a', fontWeight: '800'},
  statLabel: {color: '#aab5aa', letterSpacing: 1, marginTop: 4},
  milestoneTitle: {color: '#fff', fontWeight: '700', marginTop: 20, marginBottom: 8},
  milestoneRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#354136'},
  milestoneCopy: {flex: 1},
  milestoneName: {color: '#f2f6f1', fontWeight: '700'},
  milestoneHint: {color: '#aab5aa', fontSize: 12, marginTop: 3},
  milestoneStatus: {color: '#9cdb8a', fontSize: 22, fontWeight: '800'},
  statsNote: {color: '#829082', lineHeight: 18, marginTop: 12},
  profileCard: {backgroundColor: '#18351f', borderRadius: 18, marginBottom: 16},
  profileContent: {alignItems: 'center', paddingVertical: 24},
  avatarCircle: {width: 92, height: 92, borderRadius: 46, backgroundColor: '#294d30', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#9cdb8a'},
  avatarLarge: {fontSize: 46},
  profileName: {color: '#fff', fontWeight: '800', marginTop: 12},
  profileCaption: {color: '#9cdb8a', letterSpacing: 1.5, marginTop: 4},
  card: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 16},
  sectionTitle: {color: '#fff', fontWeight: '700', marginBottom: 14},
  avatarGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  avatarChoice: {width: '22%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#202920', borderRadius: 12, borderWidth: 1, borderColor: '#354136'},
  avatarSelected: {borderColor: '#9cdb8a', borderWidth: 2, backgroundColor: '#294d30'},
  avatarOption: {fontSize: 29},
  nameHeading: {marginTop: 22},
  input: {backgroundColor: '#101510'},
  hint: {color: '#829082', marginTop: 7},
  saveButton: {alignSelf: 'flex-start', marginTop: 18, backgroundColor: '#107c10'},
  saved: {color: '#9cdb8a', marginTop: 10},
  footer: {color: '#829082', lineHeight: 19, marginTop: 16},
});
