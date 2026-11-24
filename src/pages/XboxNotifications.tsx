import React, {useEffect, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {TextInput} from 'react-native-paper';
import {Button, Card, Text} from 'react-native-paper';
import {storage} from '../store/mmkv';

const readNotifications = () => {
  try {
    const raw = storage.getString('xbox.notifications.local');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) { return []; }
};

export const addLocalNotification = (title, message, kind = 'activity') => {
  const current = readNotifications();
  const next = [{id: String(Date.now()) + Math.random().toString(36).slice(2, 7), title, message, kind, createdAt: Date.now(), read: false}, ...current].slice(0, 30);
  storage.set('xbox.notifications.local', JSON.stringify(next));
};

export default function XboxNotificationsScreen() {
  const isFocused = useIsFocused();
  const [items, setItems] = useState(readNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const refresh = () => setItems(readNotifications());

  useEffect(() => { if (isFocused) refresh(); }, [isFocused]);

  const markAllRead = () => {
    const next = items.map(item => ({...item, read: true}));
    storage.set('xbox.notifications.local', JSON.stringify(next));
    setItems(next);
  };
  const clearAll = () => {
    storage.delete('xbox.notifications.local');
    setItems([]);
  };

  const markRead = id => {
    const next = items.map(item => item.id === id ? {...item, read: true} : item);
    storage.set('xbox.notifications.local', JSON.stringify(next));
    setItems(next);
  };
  const unread = items.filter(item => !item.read).length;
  const messageCount = items.filter(item => item.kind === 'message').length;
  const friendCount = items.filter(item => item.kind === 'friend').length;
  const activityCount = items.filter(item => item.kind !== 'message' && item.kind !== 'friend').length;
  const visibleItems = items.filter(item => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [item.title, item.message, item.kind].some(value => String(value || '').toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'All' || (statusFilter === 'Unread' ? !item.read : item.read);
    const matchesCategory = categoryFilter === 'All' || (categoryFilter === 'Activity' ? item.kind !== 'message' && item.kind !== 'friend' : item.kind === categoryFilter.toLowerCase().replace(/s$/, ''));
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
      <Text variant="headlineMedium" style={styles.heading}>Notifications</Text>
      <Text variant="bodyMedium" style={styles.intro}>Your local activity updates and companion-app alerts.</Text>
      <View style={styles.summaryRow} accessibilityLabel={"Notification summary: " + activityCount + " activity, " + friendCount + " friends, " + messageCount + " messages"}>
        <View style={styles.summaryItem}><Text style={styles.summaryNumber}>{activityCount}</Text><Text style={styles.summaryLabel}>ACTIVITY</Text></View>
        <View style={styles.summaryItem}><Text style={styles.summaryNumber}>{friendCount}</Text><Text style={styles.summaryLabel}>FRIENDS</Text></View>
        <View style={styles.summaryItem}><Text style={styles.summaryNumber}>{messageCount}</Text><Text style={styles.summaryLabel}>MESSAGES</Text></View>
      </View>
      <View style={styles.toolbar}>
        <Text accessibilityLiveRegion="polite" accessibilityLabel={unread + (unread === 1 ? " unread notification" : " unread notifications")} style={styles.unread}>{unread} UNREAD</Text>
        <Button compact mode="text" textColor="#9cdb8a" accessibilityLabel="Mark all notifications as read" onPress={markAllRead} disabled={!unread}>Mark all read</Button>
        <Button compact mode="text" textColor="#e5a0a0" accessibilityLabel="Clear all local notifications" onPress={clearAll} disabled={!items.length}>Clear all</Button>
      </View>
      <TextInput mode="outlined" label="Search notifications" accessibilityLabel="Search local notifications" accessibilityHint="Filters by notification title, message, or category." value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" clearButtonMode="while-editing" textColor="#fff" outlineColor="#526552" activeOutlineColor="#9cdb8a" style={styles.searchInput} />
      <View style={styles.filterRow} accessibilityLabel="Filter notifications by read status">
        {['All', 'Unread', 'Read'].map(item => (
          <Pressable key={item} accessibilityRole="button" accessibilityLabel={"Show " + item.toLowerCase() + " notifications"} accessibilityState={{selected: statusFilter === item}} onPress={() => setStatusFilter(item)} style={[styles.filterChip, statusFilter === item && styles.filterChipSelected]}>
            <Text style={[styles.filterText, statusFilter === item && styles.filterTextSelected]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.filterRow} accessibilityLabel="Filter notifications by category">
        {['All', 'Activity', 'Friends', 'Messages'].map(item => (
          <Pressable key={item} accessibilityRole="button" accessibilityLabel={"Show " + item.toLowerCase() + " category notifications"} accessibilityState={{selected: categoryFilter === item}} onPress={() => setCategoryFilter(item)} style={[styles.filterChip, categoryFilter === item && styles.filterChipSelected]}>
            <Text style={[styles.filterText, categoryFilter === item && styles.filterTextSelected]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Text accessibilityLiveRegion="polite" accessibilityLabel={visibleItems.length + " of " + items.length + " notifications shown"} style={styles.unread}>{visibleItems.length} / {items.length} SHOWN</Text>
      {visibleItems.length ? visibleItems.map(item => (
        <Pressable key={item.id} accessible accessibilityRole="button" accessibilityLabel={(item.read ? "Read notification: " : "Unread notification: ") + item.title + ". " + item.message + (item.createdAt ? ". " + new Date(item.createdAt).toLocaleString() : "")} accessibilityHint={item.read ? "This notification has already been read." : "Marks this notification as read on this device."} onPress={() => markRead(item.id)}>
        <Card style={[styles.itemCard, !item.read && styles.unreadCard]}>
          <Card.Content>
            <View style={styles.itemHeader}>
              <Text style={styles.kind}>{item.kind === 'message' ? '💬 MESSAGE' : item.kind === 'friend' ? '👥 FRIENDS' : '🎮 ACTIVITY'}</Text>
              {!item.read ? <View style={styles.dot} /> : null}
            </View>
            <Text variant="titleMedium" style={styles.itemTitle}>{item.title}</Text>
            <Text variant="bodyMedium" style={styles.itemMessage}>{item.message}</Text>
            <Text style={styles.time}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Time unavailable'}</Text>
          </Card.Content>
        </Card>
        </Pressable>
      )) : (
        <Card style={styles.emptyCard}><Card.Content style={styles.emptyContent}>
          <Text style={styles.emptyIcon}>{items.length ? "🔎" : "🔔"}</Text>
          <Text accessibilityLiveRegion="polite" variant="titleMedium" style={styles.itemTitle}>{items.length ? "No matching notifications" : "You're all caught up"}</Text>
          <Text style={styles.itemMessage}>{items.length ? "Try another search term or clear the search." : "New local activity notifications will appear here."}</Text>
          {items.length && searchQuery ? <Button compact mode="text" textColor="#a8e69a" accessibilityLabel="Clear notification search" onPress={() => setSearchQuery("")}>Clear search</Button> : null}
        </Card.Content></Card>
      )}
      <Text style={styles.footer}>These notifications are generated by this app only. They are not Xbox Network alerts, push notifications, or Microsoft account messages.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#101510'},
  content: {padding: 18, paddingBottom: 36},
  eyebrow: {color: '#8fbc8f', letterSpacing: 2, fontWeight: '700'},
  heading: {color: '#fff', fontWeight: '800', marginTop: 5},
  intro: {color: '#aebcaf', lineHeight: 21, marginTop: 8, marginBottom: 16},
  summaryRow: {flexDirection: 'row', gap: 9, marginBottom: 14},
  summaryItem: {flex: 1, backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 9},
  summaryNumber: {color: '#fff', fontSize: 20, fontWeight: '800'},
  summaryLabel: {color: '#9cdb8a', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 3},
  toolbar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap'},
  searchInput: {backgroundColor: '#1b211c', marginBottom: 10},
  filterRow: {flexDirection: 'row', gap: 8, marginBottom: 10},
  filterChip: {paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18, backgroundColor: '#202920', borderWidth: 1, borderColor: '#354136'},
  filterChipSelected: {backgroundColor: '#294d30', borderColor: '#9cdb8a'},
  filterText: {color: '#aab5aa', fontSize: 12, fontWeight: '700'},
  filterTextSelected: {color: '#fff'},
  unread: {color: '#9cdb8a', fontSize: 11, fontWeight: '800', letterSpacing: 1},
  itemCard: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 14, marginBottom: 10},
  unreadCard: {borderColor: '#789d70', backgroundColor: '#1d2a1e'},
  itemHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  kind: {color: '#9cdb8a', fontSize: 10, fontWeight: '800', letterSpacing: 1},
  dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#9cdb8a'},
  itemTitle: {color: '#fff', fontWeight: '700'},
  itemMessage: {color: '#c0cbbf', lineHeight: 20, marginTop: 5},
  time: {color: '#829082', fontSize: 10, marginTop: 10},
  emptyCard: {backgroundColor: '#1b211c', borderColor: '#303b31', borderWidth: 1, borderRadius: 14},
  emptyContent: {alignItems: 'center', paddingVertical: 30, gap: 8},
  emptyIcon: {fontSize: 36},
  footer: {color: '#829082', lineHeight: 19, marginTop: 18},
});
