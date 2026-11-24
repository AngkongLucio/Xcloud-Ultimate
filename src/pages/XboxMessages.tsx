import React, {useEffect, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Pressable} from 'react-native';
import {Button, Card, Text, TextInput} from 'react-native-paper';
import {storage} from '../store/mmkv';

const readArray = key => {
  try {
    const raw = storage.getString(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) { return []; }
};

export default function XboxMessagesScreen() {
  const isFocused = useIsFocused();
  const [friends, setFriends] = useState(() => readArray('xbox.friends.local'));
  const [threads, setThreads] = useState(() => readArray('xbox.messages.local'));
  const [activeFriend, setActiveFriend] = useState(null);
  const [draft, setDraft] = useState('');

  const refresh = () => {
    setFriends(readArray('xbox.friends.local'));
    setThreads(readArray('xbox.messages.local'));
  };
  useEffect(() => { if (isFocused) refresh(); }, [isFocused]);

  const saveThreads = next => {
    setThreads(next);
    storage.set('xbox.messages.local', JSON.stringify(next));
  };

  const openThread = friend => {
    setActiveFriend(friend);
    setDraft('');
  };

  const sendMessage = () => {
    const body = draft.trim();
    if (!body || !activeFriend) return;
    const existing = threads.find(item => item.friendId === activeFriend.id);
    const messages = existing ? existing.messages : [];
    const nextMessages = [...messages, {id: String(Date.now()), body, sentAt: Date.now(), sender: 'me'}];
    const next = existing
      ? threads.map(item => item.friendId === activeFriend.id ? {...item, messages: nextMessages, updatedAt: Date.now()} : item)
      : [...threads, {friendId: activeFriend.id, friendName: activeFriend.name, avatar: activeFriend.avatar || '🎮', messages: nextMessages, updatedAt: Date.now()}];
    saveThreads(next);
    setDraft('');
  };

  const removeThread = friendId => saveThreads(threads.filter(item => item.friendId !== friendId));
  const orderedThreads = [...threads].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {activeFriend ? (
        <>
          <View style={styles.chatHeader}>
            <Button compact mode="text" textColor="#9cdb8a" onPress={() => setActiveFriend(null)} icon="arrow-left">Inbox</Button>
            <Text variant="titleLarge" style={styles.headerName}>{activeFriend.avatar || '🎮'}  {activeFriend.name}</Text>
            <Text style={styles.localTag}>LOCAL CHAT</Text>
          </View>
          <ScrollView style={styles.messageScroll} contentContainerStyle={styles.messageContent}>
            {(threads.find(item => item.friendId === activeFriend.id)?.messages || []).map(message => (
              <View key={message.id} style={[styles.messageBubble, message.sender === 'me' ? styles.myMessage : styles.theirMessage]}>
                <Text style={styles.messageText}>{message.body}</Text>
                <Text style={styles.messageTime}>{message.sentAt ? new Date(message.sentAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}</Text>
              </View>
            ))}
            {!threads.some(item => item.friendId === activeFriend.id && item.messages?.length) ? (
              <Text style={styles.emptyHint}>No messages yet. Send a local test message below.</Text>
            ) : null}
          </ScrollView>
          <View style={styles.composer}>
            <TextInput mode="outlined" value={draft} onChangeText={setDraft} placeholder="Write a message..." multiline textColor="#fff" outlineColor="#526552" activeOutlineColor="#9cdb8a" style={styles.composerInput} />
            <Button mode="contained" icon="send" onPress={sendMessage} disabled={!draft.trim()} style={styles.sendButton}>Send</Button>
          </View>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
          <Text variant="headlineMedium" style={styles.heading}>Messages</Text>
          <Text variant="bodyMedium" style={styles.intro}>A local chat mock-up for players in your companion friends list. Messages stay on this device.</Text>
          <Text variant="titleLarge" style={styles.sectionTitle}>Conversations</Text>
          {orderedThreads.length ? orderedThreads.map(thread => {
            const friend = friends.find(item => item.id === thread.friendId) || {id: thread.friendId, name: thread.friendName || 'Player', avatar: thread.avatar || '🎮'};
            const last = thread.messages?.[thread.messages.length - 1];
            return (
              <Pressable key={thread.friendId} onPress={() => openThread(friend)} accessibilityRole="button">
                <Card style={styles.threadCard}>
                  <Card.Content style={styles.threadRow}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{friend.avatar}</Text></View>
                    <View style={styles.threadCopy}>
                      <Text variant="titleMedium" style={styles.friendName}>{friend.name}</Text>
                      <Text numberOfLines={1} style={styles.preview}>{last?.body || 'Start a conversation'}</Text>
                    </View>
                    <Button compact mode="text" textColor="#e5a0a0" onPress={() => removeThread(thread.friendId)}>Delete</Button>
                  </Card.Content>
                </Card>
              </Pressable>
            );
          }) : (
            <Card style={styles.emptyCard}><Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text variant="titleMedium" style={styles.friendName}>No conversations yet</Text>
              <Text style={styles.preview}>Choose one of your local players below to start.</Text>
            </Card.Content></Card>
          )}
          <Text variant="titleLarge" style={[styles.sectionTitle, styles.playersTitle]}>Start a chat</Text>
          {friends.length ? friends.map(friend => (
            <Pressable key={friend.id} onPress={() => openThread(friend)} accessibilityRole="button">
              <View style={styles.playerRow}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{friend.avatar || '🎮'}</Text></View>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>
          )) : <Text style={styles.preview}>Add players in Friends before starting a local chat.</Text>}
          <Text style={styles.footer}>Not connected to Xbox Network or Microsoft messaging. No messages are sent to other people; this screen only stores local test messages.</Text>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#101510'},
  content: {padding: 18, paddingBottom: 36},
  eyebrow: {color: '#8fbc8f', letterSpacing: 2, fontWeight: '700'},
  heading: {color: '#fff', fontWeight: '800', marginTop: 5},
  intro: {color: '#aebcaf', lineHeight: 21, marginTop: 8, marginBottom: 20},
  sectionTitle: {color: '#fff', fontWeight: '700', marginBottom: 12},
  threadCard: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 14, marginBottom: 9},
  threadRow: {flexDirection: 'row', alignItems: 'center', gap: 11},
  avatar: {width: 46, height: 46, borderRadius: 23, backgroundColor: '#294d30', alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontSize: 24},
  threadCopy: {flex: 1},
  friendName: {color: '#fff', fontWeight: '700'},
  preview: {color: '#aab5aa', fontSize: 12, marginTop: 4},
  emptyCard: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 14},
  emptyContent: {alignItems: 'center', paddingVertical: 24, gap: 7},
  emptyIcon: {fontSize: 34},
  playersTitle: {marginTop: 24},
  playerRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#354136'},
  chevron: {color: '#9cdb8a', fontSize: 25},
  footer: {color: '#829082', lineHeight: 19, marginTop: 22},
  chatHeader: {paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#354136'},
  headerName: {color: '#fff', fontWeight: '700', marginLeft: 8},
  localTag: {color: '#9cdb8a', fontSize: 10, letterSpacing: 1.2, fontWeight: '700', marginLeft: 8, marginTop: 3},
  messageScroll: {flex: 1},
  messageContent: {padding: 16, gap: 10, flexGrow: 1, justifyContent: 'flex-end'},
  messageBubble: {maxWidth: '84%', borderRadius: 15, paddingHorizontal: 13, paddingVertical: 9},
  myMessage: {alignSelf: 'flex-end', backgroundColor: '#245b2b', borderBottomRightRadius: 4},
  theirMessage: {alignSelf: 'flex-start', backgroundColor: '#252d26', borderBottomLeftRadius: 4},
  messageText: {color: '#fff', fontSize: 15, lineHeight: 20},
  messageTime: {color: '#c3d4c3', fontSize: 10, textAlign: 'right', marginTop: 5},
  emptyHint: {color: '#829082', textAlign: 'center', marginVertical: 24},
  composer: {flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#354136'},
  composerInput: {flex: 1, maxHeight: 110, backgroundColor: '#1b211c'},
  sendButton: {backgroundColor: '#107c10', marginBottom: 5},
});
