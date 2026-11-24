import React, {useEffect, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {Alert, ScrollView, StyleSheet, View, Pressable} from 'react-native';
import {Button, Card, ProgressBar, Text, TextInput} from 'react-native-paper';
import {storage} from '../store/mmkv';

const AVATARS = ['🎮', '🛡️', '🚀', '🐉', '⚡', '👾', '🏎️', '🌌'];

const normalizeActivityHistory = value =>
  Array.isArray(value)
    ? value.filter(entry => entry !== null && typeof entry === 'object' && !Array.isArray(entry))
    : [];

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
      return normalizeActivityHistory(parsed);
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

  const uniqueActivityTitles = new Set(
    activity
      .map(entry => String(entry?.title || '').trim())
      .filter(Boolean),
  ).size;

  const mostOpenedTitle = activity.reduce((counts, entry) => {
    const title = String(entry?.title || '').trim();
    if (title) counts[title] = (counts[title] || 0) + 1;
    return counts;
  }, {});
  const topActivity = Object.entries(mostOpenedTitle).sort((a, b) => b[1] - a[1])[0] || null;

  const activityLeaderboard = Object.entries(mostOpenedTitle)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3);

  const activeDays = new Set(
    activity
      .map(entry => Number(entry?.openedAt))
      .filter(timestamp => Number.isFinite(timestamp) && timestamp > 0)
      .map(timestamp => new Date(timestamp).toLocaleDateString()),
  ).size;

  const activityStreak = (() => {
    const dayStarts = [...new Set(
      activity
        .map(entry => Number(entry?.openedAt))
        .filter(timestamp => Number.isFinite(timestamp) && timestamp > 0)
        .map(timestamp => {
          const date = new Date(timestamp);
          return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        }),
    )].sort((a, b) => b - a);

    if (!dayStarts.length) return 0;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = yesterday.getTime();
    if (dayStarts[0] !== todayStart && dayStarts[0] !== yesterdayStart) return 0;

    let streak = 1;
    for (let index = 1; index < dayStarts.length; index += 1) {
      const previousDay = new Date(dayStarts[index - 1]);
      previousDay.setDate(previousDay.getDate() - 1);
      if (dayStarts[index] !== previousDay.getTime()) break;
      streak += 1;
    }
    return streak;
  })();

  const longestActivityStreak = (() => {
    const dayStarts = [...new Set(
      activity
        .map(entry => Number(entry?.openedAt))
        .filter(timestamp => Number.isFinite(timestamp) && timestamp > 0)
        .map(timestamp => {
          const date = new Date(timestamp);
          return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        }),
    )].sort((a, b) => a - b);

    let longest = 0;
    let current = 0;
    dayStarts.forEach((day, index) => {
      const previousDay = index > 0 ? new Date(dayStarts[index - 1]) : null;
      if (previousDay) previousDay.setDate(previousDay.getDate() + 1);
      current = previousDay && day === previousDay.getTime() ? current + 1 : 1;
      longest = Math.max(longest, current);
    });
    return longest;
  })();

  const titledActivityCount = Object.values(mostOpenedTitle).reduce((total, count) => total + count, 0);
  const repeatOpenCount = Object.values(mostOpenedTitle).reduce((total, count) => total + Math.max(count - 1, 0), 0);

  const activityTitleGroups = Object.entries(mostOpenedTitle)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const activityTitleBreakdown = activityTitleGroups.map(([title, count]) => ({
    title,
    count,
    percentage: titledActivityCount ? Math.round((count / titledActivityCount) * 100) : 0,
  }));

  const activityInsights = {
    totalOpens: activity.length,
    uniqueTitles: uniqueActivityTitles,
    repeatOpens: repeatOpenCount,
    repeatRate: titledActivityCount ? Math.round((repeatOpenCount / titledActivityCount) * 100) : 0,
    titledEntries: titledActivityCount,
    untitledEntries: Math.max(activity.length - titledActivityCount, 0),
    activeDays,
    averageOpensPerActiveDay: activeDays ? (activity.length / activeDays).toFixed(1) : '0.0',
    mostActiveDay: (() => {
      const counts = activity.reduce((days, entry) => {
        const timestamp = Number(entry?.openedAt);
        if (!Number.isFinite(timestamp) || timestamp <= 0) return days;
        const date = new Date(timestamp);
        const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        days[key] = (days[key] || 0) + 1;
        return days;
      }, {});
      return Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]) || Number(b[0]) - Number(a[0]))[0] || null;
    })(),
  };

  useEffect(() => {
    if (isFocused) {
      setLaunchCount(storage.getNumber('xbox.activity.launchCount') ?? 0);
      try {
        const saved = storage.getString('xbox.activity.history');
        const parsed = saved ? JSON.parse(saved) : [];
        setActivity(normalizeActivityHistory(parsed));
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
            <View style={styles.statTile}>
              <Text variant="headlineMedium" accessibilityLabel={uniqueActivityTitles + " unique catalog titles in saved history"} style={styles.statNumber}>{uniqueActivityTitles}</Text>
              <Text variant="labelSmall" style={styles.statLabel}>UNIQUE TITLES</Text>
            </View>
          </View>
          {topActivity ? (
            <View style={styles.topActivity}>
              <Text style={styles.topActivityLabel}>MOST OPENED IN SAVED HISTORY</Text>
              <Text style={styles.topActivityTitle}>{topActivity[0]}</Text>
              <Text accessibilityLabel={topActivity[1] + " saved catalog entries"} style={styles.topActivityCount}>{topActivity[1]} {topActivity[1] === 1 ? 'entry' : 'entries'}</Text>
            </View>
          ) : null}
          {activityLeaderboard.length > 1 ? (
            <View style={styles.leaderboard}>
              <Text style={styles.topActivityLabel}>TOP 3 IN SAVED HISTORY</Text>
              {activityLeaderboard.map(([title, count], index) => (
                <View key={title} style={styles.leaderboardRow} accessibilityLabel={"Rank " + (index + 1) + ": " + title + ", " + count + (count === 1 ? " entry" : " entries")}>
                  <Text style={styles.leaderboardRank}>{index + 1}</Text>
                  <Text numberOfLines={1} style={styles.leaderboardTitle}>{title}</Text>
                  <Text style={styles.leaderboardCount}>{count}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {activityTitleBreakdown.length > 0 ? (
            <View style={styles.titleBreakdown}>
              <Text style={styles.topActivityLabel}>TITLE BREAKDOWN</Text>
              {activityTitleBreakdown.map(item => (
                <View key={item.title} style={styles.breakdownRow} accessibilityLabel={item.title + ": " + item.count + " opens, " + item.percentage + " percent of titled entries"}>
                  <View style={styles.breakdownCopy}>
                    <Text numberOfLines={1} style={styles.insightLabel}>{item.title}</Text>
                    <View style={styles.insightTrack}>
                      <View style={[styles.insightFill, {width: item.percentage + '%'}]} />
                    </View>
                  </View>
                  <Text style={styles.insightValue}>{item.count}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.activityInsights}>
            <Text style={styles.topActivityLabel}>ACTIVITY INSIGHTS · SAVED HISTORY</Text>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Repeat opens</Text>
              <Text accessibilityLabel={activityInsights.repeatOpens + " repeat opens"} style={styles.insightValue}>{activityInsights.repeatOpens}</Text>
            </View>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Untitled entries</Text>
              <Text accessibilityLabel={activityInsights.untitledEntries + " saved entries without a title"} style={styles.insightValue}>{activityInsights.untitledEntries}</Text>
            </View>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Active days</Text>
              <Text accessibilityLabel={activityInsights.activeDays + " distinct activity days in saved history"} style={styles.insightValue}>{activityInsights.activeDays}</Text>
            </View>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Average opens / active day</Text>
              <Text accessibilityLabel={activityInsights.averageOpensPerActiveDay + " average catalog opens per active day"} style={styles.insightValue}>{activityInsights.averageOpensPerActiveDay}</Text>
            </View>
            {activityInsights.mostActiveDay ? (
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Most active day</Text>
                <Text
                  accessibilityLabel={activityInsights.mostActiveDay[1] + " catalog opens on " + new Date(Number(activityInsights.mostActiveDay[0])).toLocaleDateString()}
                  style={styles.insightValue}>
                  {new Date(Number(activityInsights.mostActiveDay[0])).toLocaleDateString()} · {activityInsights.mostActiveDay[1]}
                </Text>
              </View>
            ) : null}
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Current streak</Text>
              <Text accessibilityLabel={activityStreak + " consecutive active days, based on saved history"} style={styles.insightValue}>{activityStreak} {activityStreak === 1 ? 'day' : 'days'}</Text>
            </View>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Longest streak</Text>
              <Text accessibilityLabel={longestActivityStreak + " days, longest consecutive activity streak in saved history"} style={styles.insightValue}>{longestActivityStreak} {longestActivityStreak === 1 ? 'day' : 'days'}</Text>
            </View>
            <View style={styles.insightTrack}>
              <View style={[styles.insightFill, {width: activityInsights.repeatRate + '%'}]} />
            </View>
            <Text style={styles.insightFootnote}>{activityInsights.repeatRate}% of saved entries are repeat opens</Text>
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
          <Text variant="bodySmall" style={styles.statsNote}>Catalog activity only — opening a title does not confirm gameplay or track playtime.</Text>
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
  activityInsights: {backgroundColor: '#202920', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#354136'},
  titleBreakdown: {backgroundColor: '#202920', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#354136'},
  breakdownRow: {flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10},
  breakdownCopy: {flex: 1},
  insightRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10},
  insightLabel: {color: '#d7dfd5', fontSize: 12},
  insightValue: {color: '#fff', fontWeight: '800', fontSize: 14},
  insightTrack: {height: 6, borderRadius: 4, backgroundColor: '#354136', overflow: 'hidden', marginTop: 8},
  insightFill: {height: 6, borderRadius: 4, backgroundColor: '#9cdb8a'},
  insightFootnote: {color: '#aab5aa', fontSize: 10, marginTop: 6},
  leaderboard: {backgroundColor: '#202920', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#354136'},
  leaderboardRow: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7},
  leaderboardRank: {color: '#9cdb8a', fontWeight: '800', width: 18},
  leaderboardTitle: {color: '#fff', flex: 1, fontSize: 12},
  leaderboardCount: {color: '#aab5aa', fontSize: 12, fontWeight: '700'},
  topActivity: {backgroundColor: '#202920', borderRadius: 12, padding: 12, marginTop: 14, borderWidth: 1, borderColor: '#354136'},
  topActivityLabel: {color: '#9cdb8a', fontSize: 10, letterSpacing: 1, fontWeight: '700'},
  topActivityTitle: {color: '#fff', fontWeight: '700', marginTop: 6},
  topActivityCount: {color: '#aab5aa', fontSize: 11, marginTop: 3},
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
