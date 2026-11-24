import React, {useEffect, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {Alert, ScrollView, StyleSheet, View, Pressable} from 'react-native';
import {Button, Card, Text, TextInput} from 'react-native-paper';
import {storage} from '../store/mmkv';

const AVATARS = ['🎮', '👾', '🚀', '🐉', '🏎️', '⚡'];

const normalizeFriends = value => {
  if (!Array.isArray(value)) return [];
  const seenIds = new Set();
  return value
    .filter(item => item && typeof item === 'object' && !Array.isArray(item)
      && typeof item.name === 'string')
    .map((item, index) => {
      const baseId = String(item.id || 'legacy-' + index).trim().slice(0, 100) || 'legacy-' + index;
      let id = baseId;
      let suffix = 1;
      while (seenIds.has(id)) {
        id = (baseId.slice(0, 88) + '-' + suffix).slice(0, 100);
        suffix += 1;
      }
      seenIds.add(id);
      return {
        id,
        name: item.name.trim().slice(0, 20),
        avatar: AVATARS.includes(item.avatar) ? item.avatar : '🎮',
        addedAt: Number.isFinite(Number(item.addedAt)) && Number(item.addedAt) > 0
          ? Number(item.addedAt)
          : 0,
      };
    })
    .filter(item => item.name.length > 0)
    .slice(-100);
};

export default function XboxFriendsScreen() {
  const isFocused = useIsFocused();
  const [friends, setFriends] = useState(() => {
    try {
      const raw = storage.getString('xbox.friends.local');
      const parsed = raw ? JSON.parse(raw) : [];
      return normalizeFriends(parsed);
    } catch (_) { return []; }
  });
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('Recent');
  const [formMessage, setFormMessage] = useState('');
  const [avatar, setAvatar] = useState('🎮');

  const refresh = () => {
    try {
      const raw = storage.getString('xbox.friends.local');
      const parsed = raw ? JSON.parse(raw) : [];
      const normalized = normalizeFriends(parsed);
      if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
        storage.set('xbox.friends.local', JSON.stringify(normalized));
      }
      setFriends(normalized);
    } catch (_) {
      storage.delete('xbox.friends.local');
      setFriends([]);
    }
  };

  useEffect(() => { if (isFocused) refresh(); }, [isFocused]);

  const readLatestFriends = () => {
    try {
      const raw = storage.getString('xbox.friends.local');
      const parsed = raw ? JSON.parse(raw) : [];
      const normalized = normalizeFriends(parsed);
      if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
        storage.set('xbox.friends.local', JSON.stringify(normalized));
      }
      return normalized;
    } catch (_) {
      storage.delete('xbox.friends.local');
      return [];
    }
  };

  const save = next => {
    const normalized = normalizeFriends(next);
    setFriends(normalized);
    storage.set('xbox.friends.local', JSON.stringify(normalized));
  };

  const addFriend = () => {
    const clean = name.trim().slice(0, 20);
    if (!clean) {
      setFormMessage('Enter a player display name first.');
      return;
    }
    const latestFriends = readLatestFriends();
    if (latestFriends.some(item => item.name.toLowerCase() === clean.toLowerCase())) {
      setFriends(latestFriends);
      setFormMessage('That player is already in your local list.');
      return;
    }
    save([...latestFriends, {id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 7), name: clean, avatar, addedAt: Date.now()}].slice(-100));
    setName('');
    setFormMessage(clean + ' was added to your local list.');
  };

  const filteredFriends = friends
    .filter(item => item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    .slice()
    .sort((a, b) => sortOrder === 'A–Z'
      ? a.name.localeCompare(b.name)
      : (Number(b.addedAt) || 0) - (Number(a.addedAt) || 0));

  const removeFriend = id => {
    const removed = friends.find(item => item.id === id);
    if (!removed) return;
    Alert.alert(
      'Remove local player?',
      'Remove ' + removed.name + ' from your local friends list? Any saved message conversation will remain on this device.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const latestFriends = readLatestFriends();
            save(latestFriends.filter(item => item.id !== id));
            setFormMessage(removed.name + ' was removed from your local list. Saved messages were kept.');
          },
        },
      ],
      {cancelable: true},
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
      <Text variant="headlineMedium" style={styles.heading}>Friends</Text>
      <Text variant="bodyMedium" style={styles.intro}>Build a local friends list for this companion dashboard. These entries are only saved on this device.</Text>

      <Card style={styles.addCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Add a player</Text>
          <TextInput mode="outlined" label="Player display name" accessibilityLabel="Player display name" accessibilityHint="Enter a name of up to 20 characters. This adds a local entry only." value={name} onChangeText={value => {setName(value); setFormMessage("");}} maxLength={20} autoCapitalize="words" textColor="#fff" outlineColor="#526552" activeOutlineColor="#9cdb8a" style={styles.input} />
          <Text accessibilityLiveRegion="polite" accessibilityLabel={name.length + " of 20 characters"} style={styles.characterCount}>{name.length}/20 characters</Text>
          <Text style={styles.avatarLabel}>Choose avatar</Text>
          <View style={styles.avatarRow}>
            {AVATARS.map(item => (
              <Pressable key={item} accessibilityRole="button" accessibilityLabel={'Choose avatar ' + item} accessibilityState={{selected: avatar === item}} onPress={() => setAvatar(item)} style={[styles.avatarChoice, avatar === item && styles.avatarSelected]}>
                <Text style={styles.avatarText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Button mode="contained" icon="account-plus" accessibilityLabel="Add player to local friends list" onPress={addFriend} disabled={!name.trim()} style={styles.addButton}>Add to local list</Button>
          {formMessage ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.formMessage}>{formMessage}</Text> : null}
        </Card.Content>
      </Card>

      <View style={styles.listHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>My players</Text>
        <Text style={styles.count} accessibilityLiveRegion="polite" accessibilityLabel={filteredFriends.length + " of " + friends.length + " local players shown"}>{filteredFriends.length}{searchQuery.trim() ? " / " + friends.length : ""}</Text>
      </View>
      <TextInput mode="outlined" label="Search local players" accessibilityLabel="Search local friends list" accessibilityHint="Filters saved local player names as you type." value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" clearButtonMode="while-editing" textColor="#fff" outlineColor="#526552" activeOutlineColor="#9cdb8a" style={styles.input} />
      {(searchQuery.trim() || sortOrder !== 'Recent') ? (
        <Button
          compact
          mode="text"
          textColor="#a8e69a"
          accessibilityLabel="Reset player search and sorting"
          accessibilityHint="Clears the search and returns the list to recently added order."
          onPress={() => {
            setSearchQuery('');
            setSortOrder('Recent');
          }}
          style={styles.resetFriendsButton}>
          Reset search & sorting
        </Button>
      ) : null}
      <View style={styles.sortRow} accessibilityLabel="Sort local players">
        <Text style={styles.sortLabel}>SORT</Text>
        {['Recent', 'A–Z'].map(item => (
          <Pressable key={item} accessibilityRole="button" accessibilityLabel={item === 'Recent' ? 'Sort players by recently added' : 'Sort players alphabetically'} accessibilityState={{selected: sortOrder === item}} onPress={() => setSortOrder(item)} style={[styles.sortChip, sortOrder === item && styles.sortChipSelected]}>
            <Text style={[styles.sortText, sortOrder === item && styles.sortTextSelected]}>{item}</Text>
          </Pressable>
        ))}

      </View>
      {filteredFriends.length ? filteredFriends.map(friend => (
        <Card key={friend.id} style={styles.friendCard} accessible accessibilityLabel={"Local player " + friend.name + (friend.addedAt ? ", added " + new Date(friend.addedAt).toLocaleDateString() : "")}>
          <Card.Content style={styles.friendRow}>
            <View style={styles.friendAvatar}><Text style={styles.friendEmoji}>{friend.avatar || '🎮'}</Text></View>
            <View style={styles.friendCopy}>
              <Text variant="titleMedium" style={styles.friendName}>{friend.name}</Text>
              <Text variant="bodySmall" style={styles.friendStatus}>LOCAL PLAYER · ADDED {friend.addedAt ? new Date(friend.addedAt).toLocaleDateString() : 'RECENTLY'}</Text>
            </View>
            <Button compact mode="text" textColor="#e5a0a0" accessibilityLabel={"Remove " + friend.name + " from local friends"} accessibilityHint="Removes this entry from the local list on this device." onPress={() => removeFriend(friend.id)}>Remove</Button>
          </Card.Content>
        </Card>
      )) : (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text style={styles.emptyIcon}>{friends.length ? "🔎" : "👥"}</Text>
            <Text variant="titleMedium" style={styles.friendName}>{friends.length ? "No matching players" : "Your list is empty"}</Text>
            <Text variant="bodySmall" accessibilityLiveRegion="polite" style={styles.friendStatus}>{friends.length ? "Try another name or clear the search." : "Add display names above to create your local player list."}</Text>
            {friends.length && searchQuery ? <Button compact mode="text" textColor="#a8e69a" accessibilityLabel="Clear player search" onPress={() => setSearchQuery("")}>Clear search</Button> : null}
          </Card.Content>
        </Card>
      )}
      <Text variant="bodySmall" style={styles.footer}>This is not connected to Xbox Network. It cannot search gamertags, show online presence, send messages, or access friends from a Microsoft account.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#101510'},
  content: {padding: 18, paddingBottom: 36},
  eyebrow: {color: '#8fbc8f', letterSpacing: 2, fontWeight: '700'},
  heading: {color: '#fff', fontWeight: '800', marginTop: 5},
  intro: {color: '#aebcaf', lineHeight: 21, marginTop: 8, marginBottom: 18},
  addCard: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 16, marginBottom: 22},
  sectionTitle: {color: '#fff', fontWeight: '700'},
  input: {backgroundColor: '#101510', marginTop: 12},
  characterCount: {color: '#829082', fontSize: 10, textAlign: 'right', marginTop: 3},
  avatarLabel: {color: '#aab5aa', fontSize: 12, fontWeight: '700', marginTop: 16, marginBottom: 9},
  avatarRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 9},
  avatarChoice: {width: 43, height: 43, borderRadius: 12, backgroundColor: '#202920', borderWidth: 1, borderColor: '#354136', alignItems: 'center', justifyContent: 'center'},
  avatarSelected: {borderColor: '#9cdb8a', borderWidth: 2, backgroundColor: '#294d30'},
  avatarText: {fontSize: 23},
  addButton: {alignSelf: 'flex-start', backgroundColor: '#107c10', marginTop: 18},
  formMessage: {color: '#9cdb8a', fontSize: 12, marginTop: 10, lineHeight: 18},
  listHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  count: {color: '#9cdb8a', fontWeight: '800', fontSize: 16},
  sortRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 12},
  sortLabel: {color: '#829082', fontSize: 10, fontWeight: '800', letterSpacing: 1},
  resetFriendsButton: {alignSelf: 'flex-start', marginTop: 2, marginBottom: 4},
  sortChip: {paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#202920', borderWidth: 1, borderColor: '#354136'},
  sortChipSelected: {backgroundColor: '#294d30', borderColor: '#9cdb8a'},
  sortText: {color: '#aab5aa', fontSize: 11, fontWeight: '700'},
  sortTextSelected: {color: '#fff'},
  friendCard: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 14, marginBottom: 10},
  friendRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  friendAvatar: {width: 48, height: 48, borderRadius: 24, backgroundColor: '#294d30', alignItems: 'center', justifyContent: 'center'},
  friendEmoji: {fontSize: 25},
  friendCopy: {flex: 1},
  friendName: {color: '#fff', fontWeight: '700'},
  friendStatus: {color: '#aab5aa', fontSize: 10, marginTop: 4, letterSpacing: 0.5},
  emptyCard: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 14},
  emptyContent: {alignItems: 'center', paddingVertical: 26, gap: 6},
  emptyIcon: {fontSize: 36, marginBottom: 5},
  footer: {color: '#829082', lineHeight: 19, marginTop: 18},
});
