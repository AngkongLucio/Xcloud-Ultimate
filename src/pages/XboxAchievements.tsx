import React, {useEffect, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Card, ProgressBar, Text} from 'react-native-paper';
import {storage} from '../store/mmkv';

const BADGES = [
  {id: 'first', title: 'First Steps', description: 'Open the Xbox catalog for the first time.', target: 1, icon: '🚀'},
  {id: 'explorer', title: 'Explorer', description: 'Open the catalog five times.', target: 5, icon: '🧭'},
  {id: 'regular', title: 'Regular Player', description: 'Open the catalog ten times.', target: 10, icon: '🎮'},
  {id: 'veteran', title: 'Dedicated', description: 'Open the catalog twenty-five times.', target: 25, icon: '🏆'},
];

export default function XboxAchievementsScreen() {
  const isFocused = useIsFocused();
  const [count, setCount] = useState(() => storage.getNumber('xbox.activity.launchCount') ?? 0);

  useEffect(() => {
    if (isFocused) setCount(storage.getNumber('xbox.activity.launchCount') ?? 0);
  }, [isFocused]);

  const unlocked = BADGES.filter(item => count >= item.target).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
      <Text variant="headlineMedium" style={styles.heading}>Achievements</Text>
      <Text variant="bodyMedium" style={styles.intro}>Earn local badges by opening titles from this companion app's sample library.</Text>
      <Card style={styles.summary}>
        <Card.Content>
          <Text style={styles.summaryLabel}>LOCAL BADGES UNLOCKED</Text>
          <Text variant="displaySmall" style={styles.score}>{unlocked} / {BADGES.length}</Text>
          <ProgressBar progress={unlocked / BADGES.length} color="#9cdb8a" style={styles.progress} />
          <Text style={styles.summaryHint}>{count} catalog opens recorded on this device</Text>
        </Card.Content>
      </Card>
      {BADGES.map(item => {
        const earned = count >= item.target;
        const progress = Math.min(count / item.target, 1);
        return (
          <Card key={item.id} style={[styles.badgeCard, earned && styles.earnedCard]}>
            <Card.Content>
              <View style={styles.badgeRow}>
                <View style={[styles.iconCircle, earned && styles.earnedIcon]}><Text style={styles.badgeIcon}>{item.icon}</Text></View>
                <View style={styles.badgeCopy}>
                  <Text variant="titleMedium" style={styles.badgeTitle}>{item.title}</Text>
                  <Text variant="bodySmall" style={styles.badgeDescription}>{item.description}</Text>
                </View>
                <Text style={styles.status}>{earned ? '✓' : '🔒'}</Text>
              </View>
              <View style={styles.progressMeta}>
                <Text style={styles.progressText}>{Math.min(count, item.target)} / {item.target}</Text>
                <Text style={styles.progressText}>{earned ? 'UNLOCKED' : 'IN PROGRESS'}</Text>
              </View>
              <ProgressBar progress={progress} color={earned ? '#9cdb8a' : '#607560'} style={styles.progress} />
            </Card.Content>
          </Card>
        );
      })}
      <Text variant="bodySmall" style={styles.footer}>These badges are created and stored locally. They are not official Xbox achievements, Gamerscore, account data, or proof of gameplay.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#101510'},
  content: {padding: 18, paddingBottom: 36},
  eyebrow: {color: '#8fbc8f', letterSpacing: 2, fontWeight: '700'},
  heading: {color: '#fff', fontWeight: '800', marginTop: 5},
  intro: {color: '#aebcaf', lineHeight: 21, marginTop: 8, marginBottom: 18},
  summary: {backgroundColor: '#18351f', borderRadius: 16, marginBottom: 16},
  summaryLabel: {color: '#9cdb8a', letterSpacing: 1.2, fontWeight: '700'},
  score: {color: '#fff', fontWeight: '800', marginTop: 6},
  summaryHint: {color: '#c3d4c3', fontSize: 12, marginTop: 10},
  progress: {height: 8, borderRadius: 8, backgroundColor: '#344235', marginTop: 8},
  badgeCard: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 14, marginBottom: 12},
  earnedCard: {borderColor: '#789d70'},
  badgeRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  iconCircle: {width: 52, height: 52, borderRadius: 26, backgroundColor: '#293329', alignItems: 'center', justifyContent: 'center'},
  earnedIcon: {backgroundColor: '#294d30'},
  badgeIcon: {fontSize: 26},
  badgeCopy: {flex: 1},
  badgeTitle: {color: '#fff', fontWeight: '700'},
  badgeDescription: {color: '#aab5aa', lineHeight: 17, marginTop: 3},
  status: {fontSize: 20, color: '#9cdb8a'},
  progressMeta: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 14},
  progressText: {color: '#aab5aa', fontSize: 10, letterSpacing: 0.8, fontWeight: '700'},
  footer: {color: '#829082', lineHeight: 19, marginTop: 8},
});
