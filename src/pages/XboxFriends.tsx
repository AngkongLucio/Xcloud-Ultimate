import React, {useEffect, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {ScrollView, StyleSheet, View, Pressable} from 'react-native';
import {Button, Card, Text, TextInput} from 'react-native-paper';
import {storage} from '../store/mmkv';

const AVATARS = ['🎮', '👾', '🚀', '🐉', '🏎️', '⚡'];

export default function XboxFriendsScreen() {
  const isFocused = useIsFocused();
  const [friends, setFriends] = useState(() => {
    try {
      const raw = storage.getString('xbox.friends.local');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  });
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🎮');

  const refresh = () => {
    try {
      const raw = storage.getString('xbox.friends.local');
      const parsed = raw ? JSON.parse(raw) : [];
      setFriends(Array.isArray(parsed) ? parsed : []);
    } catch (_) { setFriends([]); }
  };

  useEffect(() => { if (isFocused) refresh(); }, [isFocused]);

  const save = next => {
    setFriends(next);
    storage.set('xbox.friends.local', JSON.stringify(next));
  };

  const addFriend = () => {
    const clean = name.trim().slice(0, 20);
    if (!clean) return;
    if (friends.some(item => item.name.toLowerCase() === clean.toLowerCase())) return;
    save([...friends, {id: String(Date.now()), name: clean, avatar, addedAt: Date.now()}]);
    setName('');
  };

  const removeFriend = id => save(friends.filter(item => item.id !== id));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
      <Text variant="headlineMedium" style={styles.heading}>Friends</Text>
      <Text variant="bodyMedium" style={styles.intro}>Build a local friends list for this companion dashboard. These entries are only saved on this device.</Text>

      <Card style={styles.addCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Add a player</Text>
          <TextInput mode="outlined" label="Player display name" value={name} onChangeText={setName} maxLength={20} autoCapitalize="words" textColor="#fff" outlineColor="#526552" activeOutlineColor="#9cdb8a" style={styles.input} />
          <Text style={styles.avatarLabel}>Choose avatar</Text>
          <View style={styles.avatarRow}>
            {AVATARS.map(item => (
              <Pressable key={item} accessibilityRole="button" accessibilityLabel={'Choose ' + item} onPress={() => setAvatar(item)} style={[styles.avatarChoice, avatar === item && styles.avatarSelected]}>
                <Text style={styles.avatarText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Button mode="contained" icon="account-plus" onPress={addFriend} disabled={!name.trim()} style={styles.addButton}>Add to local list</Button>
        </Card.Content>
      </Card>

      <View style={styles.listHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>My players</Text>
        <Text style={styles.count}>{friends.length}</Text>
      </View>
      {friends.length ? friends.map(friend => (
        <Card key={friend.id} style={styles.friendCard}>
          <Card.Content style={styles.friendRow}>
            <View style={styles.friendAvatar}><Text style={styles.friendEmoji}>{friend.avatar || '🎮'}</Text></View>
            <View style={styles.friendCopy}>
              <Text variant="titleMedium" style={styles.friendName}>{friend.name}</Text>
              <Text variant="bodySmall" style={styles.friendStatus}>LOCAL PLAYER · ADDED {friend.addedAt ? new Date(friend.addedAt).toLocaleDateString() : 'RECENTLY'}</Text>
            </View>
            <Button compact mode="text" textColor="#e5a0a0" onPress={() => removeFriend(friend.id)}>Remove</Button>
          </Card.Content>
        </Card>
      )) : (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text variant="titleMedium" style={styles.friendName}>Your list is empty</Text>
            <Text variant="bodySmall" style={styles.friendStatus}>Add display names above to create your local player list.</Text>
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
  avatarLabel: {color: '#aab5aa', fontSize: 12, fontWeight: '700', marginTop: 16, marginBottom: 9},
  avatarRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 9},
  avatarChoice: {width: 43, height: 43, borderRadius: 12, backgroundColor: '#202920', borderWidth: 1, borderColor: '#354136', alignItems: 'center', justifyContent: 'center'},
  avatarSelected: {borderColor: '#9cdb8a', borderWidth: 2, backgroundColor: '#294d30'},
  avatarText: {fontSize: 23},
  addButton: {alignSelf: 'flex-start', backgroundColor: '#107c10', marginTop: 18},
  listHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  count: {color: '#9cdb8a', fontWeight: '800', fontSize: 16},
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
