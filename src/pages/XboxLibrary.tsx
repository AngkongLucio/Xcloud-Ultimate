import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ScrollView, StyleSheet, View, Linking, Pressable} from 'react-native';
import {Button, Card, Chip, Searchbar, Text} from 'react-native-paper';
import {storage} from '../store/mmkv';
import {useIsFocused} from '@react-navigation/native';
import {addLocalNotification} from './XboxNotifications';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const XBOX_PLAY = 'https://www.xbox.com/play';
const GAMES = [
  {title: 'Forza Horizon 5', genre: 'Racing', mark: '🏎️'},
  {title: 'Minecraft', genre: 'Adventure', mark: '⛏️'},
  {title: 'Sea of Thieves', genre: 'Adventure', mark: '🏴‍☠️'},
  {title: 'Halo Infinite', genre: 'Action', mark: '🛡️'},
  {title: 'Grounded', genre: 'Adventure', mark: '🕷️'},
  {title: 'Microsoft Flight Simulator', genre: 'Simulation', mark: '✈️'},
];

const CATEGORIES = ['All', 'Action', 'Adventure', 'Racing', 'Simulation'];

export default function XboxLibraryScreen({navigation}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteTitles, setFavoriteTitles] = useState(() => {
    try {
      const raw = storage.getString('xbox.library.favorites');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const libraryScrollRef = useRef(null);
  const isFocused = useIsFocused();
  const [compactCards, setCompactCards] = useState(() => storage.getBoolean('xbox.ui.compactCards') ?? false);
  const [focusOutline, setFocusOutline] = useState(() => storage.getBoolean('xbox.ui.focusOutline') ?? true);
  const haptic = (type = 'selection') => {
    if (!(storage.getBoolean('xbox.ui.haptics') ?? true)) return;
    try { ReactNativeHapticFeedback.trigger(type, {enableVibrateFallback: true, ignoreAndroidSystemSettings: false}); } catch (_) {}
  };

  useEffect(() => {
    if (isFocused) {
      setCompactCards(storage.getBoolean('xbox.ui.compactCards') ?? false);
      setFocusOutline(storage.getBoolean('xbox.ui.focusOutline') ?? true);
    }
  }, [isFocused]);

  const visibleGames = useMemo(() => GAMES.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (category === 'All' || game.genre === category) && (!favoritesOnly || favoriteTitles.includes(game.title));
  }), [search, category, favoritesOnly, favoriteTitles]);

  const toggleFavorite = title => {
    setFavoriteTitles(current => {
      const next = current.includes(title) ? current.filter(item => item !== title) : [...current, title];
      storage.set('xbox.library.favorites', JSON.stringify(next));
      return next;
    });
  };

  const openXbox = title => {
    haptic('impactLight');
    if (title) {
      const openedAt = Date.now();
      addLocalNotification('Catalog opened', 'You opened ' + title + '.', 'activity');
      storage.set('xbox.activity.lastTitle', title);
      storage.set('xbox.activity.lastOpenedAt', openedAt);
      storage.set('xbox.activity.launchCount', (storage.getNumber('xbox.activity.launchCount') ?? 0) + 1);
      let history = [];
      try {
        const storedHistory = storage.getString('xbox.activity.history');
        history = storedHistory ? JSON.parse(storedHistory) : [];
        if (!Array.isArray(history)) history = [];
      } catch (_) {
        history = [];
      }
      history.unshift({title, openedAt});
      storage.set('xbox.activity.history', JSON.stringify(history.slice(0, 10)));
    }
    Linking.openURL(XBOX_PLAY).catch(() => {});
  };
  const moveSelection = direction => {
    if (!visibleGames.length) { return; }
    haptic();
    setSelectedIndex(current => {
      const rowStart = Math.floor(current / 2) * 2;
      const rowEnd = Math.min(rowStart + 1, visibleGames.length - 1);
      if (direction === 'left') return Math.max(rowStart, current - 1);
      if (direction === 'right') return Math.min(rowEnd, current + 1);
      if (direction === 'up') return Math.max(0, current - 2);
      return Math.min(visibleGames.length - 1, current + 2);
    });
  };

  useEffect(() => {
    if (libraryScrollRef.current && visibleGames.length) {
      const row = Math.floor(selectedIndex / 2);
      libraryScrollRef.current.scrollTo({y: Math.max(0, 235 + row * (compactCards ? 145 : 175) - 80), animated: true});
    }
  }, [selectedIndex, visibleGames.length, compactCards]);
  const openSelectedGame = () => {
    if (visibleGames.length) { openXbox(visibleGames[selectedIndex]?.title); }
  };

  return (
    <ScrollView ref={libraryScrollRef} style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
      <Text variant="headlineMedium" style={styles.heading}>Game Library</Text>
      <Text variant="bodyMedium" style={styles.description}>
        Search these example titles, then open the official Xbox catalog to check current cloud availability in your region and subscription.
      </Text>

      <Searchbar
        accessibilityLabel="Search example game titles"
        accessibilityHint="Filters the example game list by title as you type."
        placeholder="Search games"
        value={search}
        onChangeText={value => { setSearch(value); setSelectedIndex(0); }}
        style={styles.search}
        inputStyle={styles.searchInput}
        iconColor="#a9c5a9"
        clearAccessibilityLabel="Clear game search"
      />

      <Text
        variant="labelSmall"
        accessibilityLiveRegion="polite"
        accessibilityLabel={visibleGames.length + (visibleGames.length === 1 ? " matching title" : " matching titles") + (category === "All" ? "" : " in " + category)}
        style={styles.resultCount}>
        {visibleGames.length} {visibleGames.length === 1 ? 'title' : 'titles'} · {category}
      </Text>

      <View style={styles.favoriteFilterRow}>
        <Chip
          accessibilityRole="button"
          accessibilityLabel={favoritesOnly ? "Show all games, favorites filter active" : "Show favorites only"}
          accessibilityState={{selected: favoritesOnly}}
          selected={favoritesOnly}
          onPress={() => { haptic(); setFavoritesOnly(value => !value); setSelectedIndex(0); }}
          style={styles.chip}
          textStyle={styles.chipText}>
          ★ Favorites ({favoriteTitles.length})
        </Chip>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {CATEGORIES.map(item => (
          <Chip
            key={item}
            accessibilityRole="button"
            accessibilityLabel={"Filter games by " + item}
            accessibilityHint={category === item ? "Currently selected category filter." : "Applies the " + item + " category filter."}
            accessibilityState={{selected: category === item}}
            selected={category === item}
            onPress={() => { haptic(); setCategory(item); setSelectedIndex(0); }}
            style={styles.chip}
            textStyle={styles.chipText}>
            {item}
          </Chip>
        ))}
      </ScrollView>

      {(search.trim().length > 0 || category !== 'All' || favoritesOnly) && (
        <Button
          mode="text"
          compact
          accessibilityRole="button"
          accessibilityLabel="Reset library search and filters"
          accessibilityHint="Clears the search, returns to all categories, and turns off favorites-only filtering."
          onPress={() => {
            haptic();
            setSearch('');
            setCategory('All');
            setFavoritesOnly(false);
            setSelectedIndex(0);
          }}
          textColor="#9cdb8a"
          style={styles.resetFilters}>
          Reset search & filters
        </Button>
      )}

      <View style={styles.grid}>
        {visibleGames.map((game, index) => (
          <View key={game.title} style={styles.gameCardContainer}>
            <Pressable
              focusable
              accessible
              accessibilityRole="button"
              accessibilityLabel={(selectedIndex === index ? 'Selected. ' : '') + game.title + ', ' + game.genre + '. Open Xbox catalog.'}
              accessibilityState={{selected: selectedIndex === index}}
              onPress={() => openXbox(game.title)}
              style={({focused}) => [styles.gameCardPressable, focusOutline && (focused || selectedIndex === index) && styles.focusedGameCard]}>
              <Card mode="outlined" style={[styles.gameCard, compactCards && styles.compactGameCard]}>
                <Card.Content style={compactCards && styles.compactGameContent}>
                  <Text variant="displaySmall" style={styles.gameMark}>{game.mark}</Text>
                  <Text variant="titleMedium" style={styles.gameTitle}>{game.title}</Text>
                  <Text variant="bodySmall" style={styles.genre}>{game.genre}</Text>
                  <Text variant="labelSmall" style={styles.selectHint}>Select to view on Xbox</Text>
                </Card.Content>
              </Card>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={(favoriteTitles.includes(game.title) ? 'Remove ' : 'Add ') + game.title + (favoriteTitles.includes(game.title) ? ' from' : ' to') + ' favorites'}
              accessibilityState={{selected: favoriteTitles.includes(game.title)}}
              onPress={() => { haptic(); toggleFavorite(game.title); }}
              style={styles.favoriteButton}>
              <Text style={styles.favoriteButtonText}>{favoriteTitles.includes(game.title) ? '★' : '☆'}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.controllerPanel}>
        <Text variant="titleMedium" style={styles.controllerTitle}>Controller navigation</Text>
        <View style={styles.dpadRow}>
          <Button compact mode="outlined" textColor="#dce9dc" accessibilityLabel="Move selection up" onPress={() => moveSelection('up')}>↑</Button>
        </View>
        <View style={styles.dpadRow}>
          <Button compact mode="outlined" textColor="#dce9dc" accessibilityLabel="Move selection left" onPress={() => moveSelection('left')}>←</Button>
          <Button compact mode="contained" buttonColor="#107c10" accessibilityLabel={"Open selected game: " + (visibleGames[selectedIndex]?.title ?? "No title selected")}
          accessibilityHint="Opens the selected title in the official Xbox catalog." onPress={openSelectedGame}>A · Select</Button>
          <Button compact mode="outlined" textColor="#dce9dc" accessibilityLabel="Move selection right" onPress={() => moveSelection('right')}>→</Button>
        </View>
        <View style={styles.dpadRow}>
          <Button compact mode="outlined" textColor="#dce9dc" accessibilityLabel="Move selection down" onPress={() => moveSelection('down')}>↓</Button>
          <Button compact mode="text" textColor="#9cdb8a" accessibilityLabel="Go back to previous screen" onPress={() => { haptic('impactLight'); navigation.goBack(); }}>B · Back</Button>
        </View>
        <Text variant="bodySmall" accessibilityLiveRegion="polite" accessibilityLabel={visibleGames.length + (visibleGames.length === 1 ? " matching game" : " matching games") + ". Selected: " + (visibleGames[selectedIndex]?.title ?? "No title")} style={styles.controllerHint}>Selected: {visibleGames[selectedIndex]?.title ?? 'No title'}</Text>
        <Text variant="bodySmall" style={styles.controllerHint}>D-pad controls move within the two-column grid; A opens the selected title in the official Xbox catalog. Physical controller input depends on iPadOS and is not directly captured by this screen.</Text>
      </View>

      {visibleGames.length === 0 && (
        <Text accessibilityRole="alert" variant="bodyMedium" style={styles.empty}>No matching titles. Try another search.</Text>
      )}

      <Button mode="contained" icon="microsoft-xbox" onPress={() => openXbox('Xbox Catalog')} style={styles.catalogButton}>
        Browse Official Xbox Catalog
      </Button>
      <Text variant="bodySmall" style={styles.footer}>
        Example list only — not a live Game Pass feed. Focusable cards open the official Xbox catalog; game availability changes by region, plan, and date.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#101510'},
  content: {padding: 18, paddingBottom: 36},
  eyebrow: {color: '#8fbc8f', letterSpacing: 2, fontWeight: '700'},
  heading: {color: '#fff', fontWeight: '800', marginTop: 5},
  description: {color: '#bdc9bd', marginTop: 8, marginBottom: 16, lineHeight: 21},
  search: {backgroundColor: '#202920', borderRadius: 12, marginBottom: 12},
  searchInput: {color: '#fff'},
  resultCount: {color: '#aab5aa', marginBottom: 10, marginLeft: 4},
  filters: {gap: 8, paddingBottom: 16},
  resetFilters: {alignSelf: 'flex-start', marginBottom: 8},
  chip: {backgroundColor: '#202920'},
  chipText: {color: '#e6eee6'},
  favoriteFilterRow: {flexDirection: 'row', marginBottom: 8},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  gameCardContainer: {width: '48%', flexGrow: 1, position: 'relative'},
  gameCardPressable: {width: '100%', borderRadius: 14},
  favoriteButton: {position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: '#101510', borderWidth: 1, borderColor: '#789d70', alignItems: 'center', justifyContent: 'center', zIndex: 2},
  favoriteButtonText: {color: '#9cdb8a', fontSize: 23, lineHeight: 27},
  focusedGameCard: {borderWidth: 2, borderColor: '#9cdb8a', borderRadius: 14, transform: [{scale: 1.015}]},
  gameCard: {backgroundColor: '#1b211c', borderColor: '#344235', borderRadius: 14},
  compactGameCard: {borderRadius: 10},
  compactGameContent: {paddingVertical: 8},
  gameMark: {marginBottom: 10},
  gameTitle: {color: '#fff', minHeight: 48, fontWeight: '700'},
  genre: {color: '#aab5aa', marginTop: 4},
  selectHint: {color: '#9cdb8a', marginTop: 12},
  empty: {color: '#cbd5cb', textAlign: 'center', marginVertical: 28},
  controllerPanel: {marginTop: 22, padding: 14, backgroundColor: '#1b211c', borderColor: '#344235', borderWidth: 1, borderRadius: 14},
  controllerTitle: {color: '#fff', textAlign: 'center', marginBottom: 10},
  dpadRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 6},
  controllerHint: {color: '#aab5aa', textAlign: 'center', marginTop: 8},
  catalogButton: {marginTop: 22, backgroundColor: '#107c10'},
  footer: {color: '#829082', marginTop: 14, lineHeight: 19},
});
