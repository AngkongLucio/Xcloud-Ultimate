import React, {useEffect, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {Alert, ScrollView, StyleSheet, View, Pressable} from 'react-native';
import {Button, Card, ProgressBar, Text, TextInput} from 'react-native-paper';
import {storage} from '../store/mmkv';

const AVATARS = ['🎮', '🛡️', '🚀', '🐉', '⚡', '👾', '🏎️', '🌌'];

export default function XboxProfileScreen({navigation}) {
  const isFocused = useIsFocused();
  const [gamertag, setGamertag] = useState(() => storage.getString('xbox.profile.gamertag') ?? 'Player');
  const [avatar, setAvatar] = useState(() => storage.getString('xbox.profile.avatar') ?? '🎮');
  const [saved, setSaved] = useState(false);
  const [launchCount, setLaunchCount] = useState(() => storage.getNumber('xbox.activity.launchCount') ?? 0);
  const [activity, setActivity] = useState(() => {
    try {
      const saved = storage.getString('xbox.activity.history');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  });

  const [activitySort, setActivitySort] = useState('Newest');
  const sortedActivity = [...activity].sort((a, b) => {
    const aTime = Number(a?.openedAt) || 0;
    const bTime = Number(b?.openedAt) || 0;
    return activitySort === 'Oldest' ? aTime - bTime : bTime - aTime;
  });

  const activityRange = activity.reduce((range, entry) => {
    const timestamp = Number(entry?.openedAt);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return range;
    return {
      first: range.first === null ? timestamp : Math.min(range.first, timestamp),
      latest: range.latest === null ? timestamp : Math.max(range.latest, timestamp),
    };
  }, {first: null, latest: null});

  useEffect(() => {
    if (isFocused) {
      setLaunchCount(storage.getNumber('xbox.activity.launchCount') ?? 0);
      try {
        const saved = storage.getString('xbox.activity.history');
        const parsed = saved ? JSON.parse(saved) : [];
        setActivity(Array.isArray(parsed) ? parsed : []);
      } catch (_) {
        setActivity([]);
      }
    }
  }, [isFocused]);

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
          <Text variant="headlineSmall" accessibilityLiveRegion="polite" accessibilityLabel={"Profile preview name: " + (gamertag.trim() || 'Player')} style={styles.profileName}>{gamertag.trim() || 'Player'}</Text>
          <Text variant="labelMedium" style={styles.profileCaption}>LOCAL PLAYER PROFILE</Text>
        </Card.Content>
      </Card>

      <Button mode="contained" icon="trophy" accessibilityLabel="View local achievements and badges" onPress={() => navigation.navigate('XboxAchievements')} style={styles.achievementButton}>View Achievements</Button>
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Player stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text variant="headlineMedium" accessibilityLiveRegion="polite" accessibilityLabel={launchCount + " catalog opens recorded locally"} style={styles.statNumber}>{launchCount}</Text>
              <Text variant="labelSmall" style={styles.statLabel}>CATALOG OPENS</Text>
            </View>
            <View style={styles.statTile}>
              <Text variant="headlineMedium" style={styles.statNumber}>{launchCount >= 1 ? '✓' : '—'}</Text>
              <Text variant="labelSmall" style={styles.statLabel}>FIRST VISIT</Text>
            </View>
            <View style={styles.statTile}>
              <Text variant="headlineMedium" accessibilityLabel={activity.length + " recent catalog entries saved"} style={styles.statNumber}>{activity.length}</Text>
              <Text variant="labelSmall" style={styles.statLabel}>SAVED ENTRIES</Text>
            </View>
          </View>
          <Text variant="titleMedium" style={styles.milestoneTitle}>Local milestones</Text>
          {[
            {label: 'First steps', target: 1},
            {label: 'Explorer', target: 5},
            {label: 'Regular', target: 10},
            {label: 'Dedicated', target: 25},
          ].map(item => (
            <View key={item.label} style={styles.milestoneRow}>
              <View style={styles.milestoneCopy}>
                <Text style={styles.milestoneName}>{item.label}</Text>
                <Text accessibilityLabel={item.label + ": " + Math.min(launchCount, item.target) + " of " + item.target + " catalog opens"} style={styles.milestoneHint}>{Math.min(launchCount, item.target)} / {item.target} catalog opens</Text>
                <ProgressBar
                  progress={Math.min(launchCount / item.target, 1)}
                  color="#9cdb8a"
                  style={styles.milestoneProgress}
                  accessibilityLabel={item.label + " milestone progress: " + Math.min(launchCount, item.target) + " of " + item.target + (launchCount >= item.target ? ", completed" : ", in progress")}
                />
              </View>
              <Text accessibilityLabel={item.label + (launchCount >= item.target ? " completed" : " not yet completed")} style={styles.milestoneStatus}>{launchCount >= item.target ? '✓' : '○'}</Text>
            </View>
          ))}
          <Text variant="bodySmall" style={styles.statsNote}>These are local companion-app milestones, not official Xbox achievements or playtime.</Text>
        </Card.Content>
      </Card>
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Recent activity</Text>
          <Text variant="bodySmall" accessibilityLiveRegion="polite" accessibilityLabel={activity.length + (activity.length === 1 ? " recent catalog entry" : " recent catalog entries")} style={styles.statsNote}>{activity.length} {activity.length === 1 ? 'entry' : 'entries'} · Maximum 10 saved</Text>
          {activityRange.first !== null ? (
            <Text
              accessibilityLabel={"Saved activity spans from " + new Date(activityRange.first).toLocaleDateString() + " to " + new Date(activityRange.latest).toLocaleDateString()}
              style={styles.activityRange}>
              {activityRange.first === activityRange.latest
                ? "Activity date: " + new Date(activityRange.first).toLocaleDateString()
                : "Activity span: " + new Date(activityRange.first).toLocaleDateString() + " – " + new Date(activityRange.latest).toLocaleDateString()}
            </Text>
          ) : null}
          {activity.length > 1 ? (
            <View style={styles.activitySortRow} accessibilityLabel="Sort recent activity">
              {['Newest', 'Oldest'].map(option => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={"Sort activity: " + option}
                  accessibilityState={{selected: activitySort === option}}
                  onPress={() => setActivitySort(option)}
                  style={[styles.activitySortChip, activitySort === option && styles.activitySortChipSelected]}>
                  <Text style={[styles.activitySortText, activitySort === option && styles.activitySortTextSelected]}>{option}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {activity.length ? sortedActivity.map((entry, index) => (
            <View key={String(entry.openedAt) + '-' + index} accessible accessibilityRole="text" accessibilityLabel={(entry.title || "Xbox Catalog") + (entry.openedAt ? ", opened " + new Date(entry.openedAt).toLocaleString() : ", time unavailable")} style={styles.activityRow}>
              <View style={styles.activityIcon}><Text style={styles.activityEmoji}>▶</Text></View>
              <View style={styles.activityCopy}>
                <Text accessibilityLabel={"Recently opened catalog item: " + (entry.title || "Xbox Catalog")} style={styles.activityTitle}>{entry.title || 'Xbox Catalog'}</Text>
                <Text style={styles.activityTime}>{entry.openedAt ? new Date(entry.openedAt).toLocaleString() : 'Time unavailable'}</Text>
              </View>
            </View>
          )) : <Text style={styles.statsNote}>No catalog activity yet. Open a title from the Library to start your history.</Text>}
          {activity.length > 0 ? (
            <Button mode="text" textColor="#a8e69a" compact accessibilityLabel="Clear local activity history" onPress={() => Alert.alert(
              'Clear activity history?',
              'This permanently deletes the saved local history entries. Your catalog open count and local badges will remain unchanged.',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Clear history',
                  style: 'destructive',
                  onPress: () => {
                    storage.delete('xbox.activity.history');
                    setActivity([]);
                  },
                },
              ],
              {cancelable: true},
            )}>Clear local history</Button>
          ) : null}
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Choose avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map(item => (
              <Pressable key={item} accessibilityRole="button" accessibilityLabel={'Choose avatar ' + item} accessibilityState={{selected: avatar === item}} onPress={() => {setAvatar(item); setSaved(false);}} style={[styles.avatarChoice, avatar === item && styles.avatarSelected]}>
                <Text style={styles.avatarOption}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text variant="bodySmall" accessibilityLiveRegion="polite" accessibilityLabel={'Selected profile avatar: ' + avatar} style={styles.hint}>Selected avatar: {avatar}</Text>
          <Text variant="titleLarge" style={[styles.sectionTitle, styles.nameHeading]}>Gamertag</Text>
          <TextInput
            mode="outlined"
            label="Display name"
            accessibilityLabel="Local profile display name"
            accessibilityHint="Up to 16 characters. This is not your Microsoft gamertag."
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
          <Text
            variant="bodySmall"
            accessibilityLiveRegion="polite"
            accessibilityLabel={gamertag.length + " of 16 characters used"}
            style={styles.characterCount}>
            {gamertag.length}/16 characters
          </Text>
          <Text variant="bodySmall" style={styles.hint}>Up to 16 characters. Saved only on this device.</Text>
          <Button mode="contained" icon="content-save" accessibilityLabel="Save local player profile" accessibilityHint="Saves the display name and avatar only on this device." onPress={saveProfile} style={styles.saveButton}>Save profile</Button>
          {saved ? <Text variant="bodySmall" accessibilityLiveRegion="polite" accessibilityLabel="Profile saved successfully on this device" style={styles.saved}>Profile saved on this device.</Text> : null}
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
  achievementButton: {alignSelf: 'flex-start', backgroundColor: '#107c10', marginBottom: 14},
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
  milestoneProgress: {height: 5, borderRadius: 5, backgroundColor: '#344235', marginTop: 7},
  milestoneStatus: {color: '#9cdb8a', fontSize: 22, fontWeight: '800'},
  statsNote: {color: '#829082', lineHeight: 18, marginTop: 12},
  activityRange: {color: '#9cdb8a', fontSize: 11, marginTop: 6},
  activitySortRow: {flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 4},
  activitySortChip: {paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#202920', borderWidth: 1, borderColor: '#354136'},
  activitySortChipSelected: {backgroundColor: '#294d30', borderColor: '#9cdb8a'},
  activitySortText: {color: '#aab5aa', fontSize: 11, fontWeight: '700'},
  activitySortTextSelected: {color: '#fff'},
  activityRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#354136', gap: 12},
  activityIcon: {width: 34, height: 34, borderRadius: 17, backgroundColor: '#294d30', alignItems: 'center', justifyContent: 'center'},
  activityEmoji: {color: '#9cdb8a', fontWeight: '800'},
  activityCopy: {flex: 1},
  activityTitle: {color: '#f2f6f1', fontWeight: '700'},
  activityTime: {color: '#aab5aa', fontSize: 11, marginTop: 3},
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
  characterCount: {color: '#9cdb8a', fontSize: 11, fontWeight: '700', textAlign: 'right', marginTop: 6},
  saveButton: {alignSelf: 'flex-start', marginTop: 18, backgroundColor: '#107c10'},
  saved: {color: '#9cdb8a', marginTop: 10},
  footer: {color: '#829082', lineHeight: 19, marginTop: 16},
});
