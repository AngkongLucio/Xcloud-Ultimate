import React, {useEffect, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Pressable} from 'react-native';
import {Button, Card, Text, TextInput} from 'react-native-paper';
import {storage} from '../store/mmkv';
import {addLocalNotification} from './XboxNotifications';

const readArray = key => {
  try {
    const raw = storage.getString(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) { return []; }
};

const normalizeFriends = value => {
  if (!Array.isArray(value)) return [];
  const allowedAvatars = ['🎮', '👾', '🚀', '🐉', '🏎️', '⚡'];
  const seenIds = new Set();
  return value
    .filter(item => item && typeof item === 'object' && !Array.isArray(item)
      && typeof item.name === 'string' && item.name.trim())
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
        avatar: allowedAvatars.includes(item.avatar) ? item.avatar : '🎮',
      };
    });
};

const normalizeThreads = value => {
  if (!Array.isArray(value)) return [];
  const seenFriendIds = new Set();
  return value
    .filter(thread => thread && typeof thread === 'object' && !Array.isArray(thread)
      && thread.friendId !== undefined && Array.isArray(thread.messages))
    .map(thread => {
      const friendId = String(thread.friendId).trim().slice(0, 100);
      const messagesSeen = new Set();
      const messages = thread.messages
        .filter(message => message && typeof message === 'object' && !Array.isArray(message)
          && typeof message.body === 'string')
        .map((message, index) => {
          const baseId = String(message.id || 'legacy-' + index).trim().slice(0, 100) || 'legacy-' + index;
          let id = baseId;
          let suffix = 1;
          while (messagesSeen.has(id)) {
            id = (baseId.slice(0, 88) + '-' + suffix).slice(0, 100);
            suffix += 1;
          }
          messagesSeen.add(id);
          return {
            ...message,
            id,
            body: message.body.slice(0, 500),
            sender: message.sender === 'me' ? 'me' : 'them',
            sentAt: Number.isFinite(Number(message.sentAt)) && Number(message.sentAt) > 0 ? Number(message.sentAt) : 0,
          };
        });
      if (!friendId || seenFriendIds.has(friendId)) return null;
      seenFriendIds.add(friendId);
      return {
        ...thread,
        friendId,
        friendName: typeof thread.friendName === 'string' && thread.friendName.trim() ? thread.friendName.trim().slice(0, 20) : 'Player',
        avatar: typeof thread.avatar === 'string' && thread.avatar.length <= 8 ? thread.avatar : '🎮',
        messages,
        updatedAt: Number.isFinite(Number(thread.updatedAt)) && Number(thread.updatedAt) > 0 ? Number(thread.updatedAt) : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))
    .slice(0, 100);
};

const readFriends = () => normalizeFriends(readArray('xbox.friends.local'));
const readThreads = () => {
  try {
    const raw = storage.getString('xbox.messages.local');
    const parsed = raw ? JSON.parse(raw) : [];
    const normalized = normalizeThreads(parsed);
    if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
      storage.set('xbox.messages.local', JSON.stringify(normalized));
    }
    return normalized;
  } catch (_) {
    storage.delete('xbox.messages.local');
    return [];
  }
};

export default function XboxMessagesScreen() {
  const isFocused = useIsFocused();
  const [friends, setFriends] = useState(readFriends);
  const [threads, setThreads] = useState(readThreads);
  const [activeFriend, setActiveFriend] = useState(null);
  const [draft, setDraft] = useState('');
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxSort, setInboxSort] = useState('Recent');
  const [chatSearch, setChatSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  const refresh = () => {
    setFriends(readFriends());
    setThreads(readThreads());
  };
  useEffect(() => { if (isFocused) refresh(); }, [isFocused]);

  const saveThreads = next => {
    const normalized = normalizeThreads(next);
    setThreads(normalized);
    storage.set('xbox.messages.local', JSON.stringify(normalized));
  };

  const openThread = friend => {
    setActiveFriend(friend);
    setDraft('');
    setFeedback('');
  };

  const sendMessage = () => {
    const body = draft.trim();
    if (!body || !activeFriend) return;
    const latestThreads = readThreads();
    const existing = latestThreads.find(item => item.friendId === activeFriend.id);
    const messages = existing ? existing.messages : [];
    const now = Date.now();
    const messageId = 'message-' + now + '-' + Math.random().toString(36).slice(2, 10);
    const nextMessages = [...messages, {id: messageId, body: body.slice(0, 500), sentAt: now, sender: 'me'}].slice(-100);
    const next = existing
      ? latestThreads.map(item => item.friendId === activeFriend.id ? {...item, messages: nextMessages, updatedAt: now} : item)
      : [...latestThreads, {friendId: activeFriend.id, friendName: activeFriend.name, avatar: activeFriend.avatar || '🎮', messages: nextMessages, updatedAt: now}];
    saveThreads(next);
    addLocalNotification('Local message saved', 'A message to ' + activeFriend.name + ' was saved on this device.', 'message');
    setDraft('');
    setFeedback('Message saved locally for ' + activeFriend.name + '. It was not sent to Xbox Network.');
  };

  const removeThread = (friendId, friendName) => {
    Alert.alert(
      'Delete local conversation?',
      'This will permanently remove the conversation with ' + friendName + ' from this device.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const latestThreads = readThreads();
            saveThreads(latestThreads.filter(item => item.friendId !== friendId));
            setFeedback('Local conversation with ' + friendName + ' deleted.');
          },
        },
      ],
      {cancelable: true},
    );
  };
  const orderedThreads = [...threads].sort((a, b) => inboxSort === 'A–Z'
    ? (a.friendName || '').localeCompare(b.friendName || '')
    : (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
  const visibleChatFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(chatSearch.trim().toLowerCase()),
  );

  const visibleThreads = orderedThreads.filter(thread => {
    const last = thread.messages?.[thread.messages.length - 1];
    const query = inboxSearch.trim().toLowerCase();
    return !query || (thread.friendName || '').toLowerCase().includes(query) || (last?.body || '').toLowerCase().includes(query);
  });

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {activeFriend ? (
        <>
          <View style={styles.chatHeader}>
            <Button compact mode="text" textColor="#9cdb8a" accessibilityLabel="Return to messages inbox" onPress={() => setActiveFriend(null)} icon="arrow-left">Inbox</Button>
            <Text variant="titleLarge" style={styles.headerName}>{activeFriend.avatar || '🎮'}  {activeFriend.name}</Text>
            <Text style={styles.localTag}>LOCAL CHAT</Text>
          </View>
          <ScrollView
            style={styles.messageScroll}
            contentContainerStyle={styles.messageContent}
            accessibilityLabel={"Conversation with " + activeFriend.name}>
            <Text
              accessibilityLiveRegion="polite"
              accessibilityLabel={(threads.find(item => item.friendId === activeFriend.id)?.messages || []).length + " messages in conversation with " + activeFriend.name}
              style={styles.conversationCount}>
              {(threads.find(item => item.friendId === activeFriend.id)?.messages || []).length} messages
            </Text>
            {(threads.find(item => item.friendId === activeFriend.id)?.messages || []).map(message => (
              <View key={message.id} accessible accessibilityRole="text" accessibilityLabel={(message.sender === 'me' ? "You: " : friendNameForMessage(activeFriend, message) + ": ") + message.body + (message.sentAt ? ", " + new Date(message.sentAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : "")} style={[styles.messageBubble, message.sender === 'me' ? styles.myMessage : styles.theirMessage]}>
                <Text style={styles.messageText}>{message.body}</Text>
                <Text style={styles.messageTime}>{message.sentAt ? new Date(message.sentAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}</Text>
              </View>
            ))}
            {!threads.some(item => item.friendId === activeFriend.id && item.messages?.length) ? (
              <Text accessibilityLiveRegion="polite" style={styles.emptyHint}>No messages yet. Send a local test message below.</Text>
            ) : null}
          </ScrollView>
          <View style={styles.composer}>
            <View style={styles.composerFields}>
            <TextInput mode="outlined" value={draft} onChangeText={value => { setDraft(value.slice(0, 500)); setFeedback(''); }} placeholder="Write a message..." accessibilityLabel={"Message to " + activeFriend.name} accessibilityHint="Enter up to 500 characters. This message is saved locally on this device only." multiline maxLength={500} textColor="#fff" outlineColor="#526552" activeOutlineColor="#9cdb8a" style={styles.composerInput} />
            <Text accessibilityLiveRegion="polite" accessibilityLabel={draft.length + " of 500 characters"} style={styles.characterCount}>{draft.length}/500 characters</Text>
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" accessibilityLabel={feedback} style={styles.feedback}>{feedback}</Text>
            </View>
            <Button mode="contained" icon="send" accessibilityLabel={"Save local message to " + activeFriend.name} accessibilityHint="Saves this message only on this device. It is not sent over Xbox Network." onPress={sendMessage} disabled={!draft.trim()} style={styles.sendButton}>Send</Button>
          </View>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
          <Text variant="headlineMedium" style={styles.heading}>Messages</Text>
          <Text variant="bodyMedium" style={styles.intro}>A local chat mock-up for players in your companion friends list. Messages stay on this device.</Text>
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.inboxFeedback}>{feedback}</Text>
          <View style={styles.conversationsHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Conversations</Text>
            <Text
              accessibilityLiveRegion="polite"
              accessibilityLabel={visibleThreads.length + " of " + orderedThreads.length + " conversations shown"}
              style={styles.conversationCount}>
              {visibleThreads.length}{inboxSearch.trim() ? " / " + orderedThreads.length : ""}
            </Text>
          </View>
          <TextInput mode="outlined" label="Search conversations" accessibilityLabel="Search local conversations" accessibilityHint="Filters conversations by player name or the latest message text." value={inboxSearch} onChangeText={setInboxSearch} autoCapitalize="none" clearButtonMode="while-editing" textColor="#fff" outlineColor="#526552" activeOutlineColor="#9cdb8a" style={styles.composerInput} />
          {(inboxSearch.trim() || inboxSort !== 'Recent') ? (
            <Button
              compact
              mode="text"
              textColor="#a8e69a"
              accessibilityLabel="Reset conversation search and sorting"
              accessibilityHint="Clears the search and returns conversations to recent activity order."
              onPress={() => {
                setInboxSearch('');
                setInboxSort('Recent');
              }}
              style={styles.resetInboxButton}>
              Reset search & sorting
            </Button>
          ) : null}
          <View style={styles.sortRow} accessibilityLabel="Sort conversations">
            <Text style={styles.sortLabel}>SORT</Text>
            {['Recent', 'A–Z'].map(item => (
              <Pressable key={item} accessibilityRole="button" accessibilityLabel={item === 'Recent' ? 'Sort conversations by recent activity' : 'Sort conversations alphabetically by player'} accessibilityState={{selected: inboxSort === item}} onPress={() => setInboxSort(item)} style={[styles.sortChip, inboxSort === item && styles.sortChipSelected]}>
                <Text style={[styles.sortText, inboxSort === item && styles.sortTextSelected]}>{item}</Text>
              </Pressable>
            ))}

          </View>
          {visibleThreads.length ? visibleThreads.map(thread => {
            const friend = friends.find(item => item.id === thread.friendId) || {id: thread.friendId, name: thread.friendName || 'Player', avatar: thread.avatar || '🎮'};
            const last = thread.messages?.[thread.messages.length - 1];
            return (
              <Card key={thread.friendId} style={styles.threadCard}>
                <Card.Content style={styles.threadRow}>
                  <Pressable style={styles.threadOpen} onPress={() => openThread(friend)} accessibilityRole="button" accessibilityLabel={"Open conversation with " + friend.name + (last?.body ? ". Last message: " + last.body : "")}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{friend.avatar}</Text></View>
                    <View style={styles.threadCopy}>
                      <Text variant="titleMedium" style={styles.friendName}>{friend.name}</Text>
                      <Text numberOfLines={1} style={styles.preview}>{last?.body || 'Start a conversation'}</Text>
                    </View>
                  </Pressable>
                  <Button compact mode="text" textColor="#e5a0a0" accessibilityLabel={"Delete conversation with " + friend.name} onPress={() => removeThread(thread.friendId, friend.name)}>Delete</Button>
                </Card.Content>
              </Card>
            );
          }) : (
            <Card style={styles.emptyCard}><Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyIcon}>{orderedThreads.length ? "🔎" : "💬"}</Text>
              <Text variant="titleMedium" style={styles.friendName}>{orderedThreads.length ? "No matching conversations" : "No conversations yet"}</Text>
              <Text accessibilityLiveRegion="polite" style={styles.preview}>{orderedThreads.length ? "Try another player name or message." : "Choose one of your local players below to start."}</Text>
              {orderedThreads.length && inboxSearch ? <Button compact mode="text" textColor="#a8e69a" accessibilityLabel="Clear conversation search" onPress={() => setInboxSearch("")}>Clear search</Button> : null}
            </Card.Content></Card>
          )}
          <Text variant="titleLarge" style={[styles.sectionTitle, styles.playersTitle]}>Start a chat</Text>
          {friends.length ? (
            <>
              <TextInput
                mode="outlined"
                label="Search players"
                accessibilityLabel="Search players to start a local chat"
                accessibilityHint="Filters your local friends list by display name."
                value={chatSearch}
                onChangeText={setChatSearch}
                autoCapitalize="none"
                clearButtonMode="while-editing"
                textColor="#fff"
                outlineColor="#526552"
                activeOutlineColor="#9cdb8a"
                style={styles.composerInput}
              />
              <Text accessibilityLiveRegion="polite" accessibilityLabel={visibleChatFriends.length + " of " + friends.length + " players available to chat"} style={styles.conversationCount}>
                {visibleChatFriends.length} of {friends.length} players
              </Text>
              {visibleChatFriends.length ? visibleChatFriends.map(friend => (
                <Pressable key={friend.id} onPress={() => openThread(friend)} accessibilityRole="button" accessibilityLabel={"Start local chat with " + friend.name}>
                  <View style={styles.playerRow}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{friend.avatar || '🎮'}</Text></View>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </Pressable>
              )) : (
                <Text accessibilityLiveRegion="polite" style={styles.preview}>No matching players. Try another name.</Text>
              )}
            </>
          ) : <Text style={styles.preview}>Add players in Friends before starting a local chat.</Text>}
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
  conversationsHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
  conversationCount: {color: '#9cdb8a', fontSize: 12, fontWeight: '700'},
  sortRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 12},
  sortLabel: {color: '#829082', fontSize: 10, fontWeight: '800', letterSpacing: 1},
  resetInboxButton: {alignSelf: 'flex-start', marginTop: 2, marginBottom: 4},
  sortChip: {paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#202920', borderWidth: 1, borderColor: '#354136'},
  sortChipSelected: {backgroundColor: '#294d30', borderColor: '#9cdb8a'},
  sortText: {color: '#aab5aa', fontSize: 11, fontWeight: '700'},
  sortTextSelected: {color: '#fff'},
  threadCard: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 14, marginBottom: 9},
  threadRow: {flexDirection: 'row', alignItems: 'center', gap: 11},
  avatar: {width: 46, height: 46, borderRadius: 23, backgroundColor: '#294d30', alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontSize: 24},
  threadOpen: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11},
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
  composerFields: {flex: 1},
  feedback: {color: '#9cdb8a', fontSize: 11, marginTop: 5},
  characterCount: {color: '#829082', fontSize: 10, textAlign: 'right', marginTop: 3},
  inboxFeedback: {color: '#9cdb8a', fontSize: 12, marginBottom: 10},
  composerInput: {flex: 1, maxHeight: 110, backgroundColor: '#1b211c'},
  sendButton: {backgroundColor: '#107c10', marginBottom: 5},
});
