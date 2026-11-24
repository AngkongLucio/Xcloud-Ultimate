import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Alert, ScrollView, StyleSheet, View, Linking, Pressable} from 'react-native';
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
      const normalized = Array.isArray(parsed)
        ? [...new Set(parsed.filter(title => typeof title === 'string' && GAMES.some(game => game.title === title)))]
        : [];
      if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
        storage.set('xbox.library.favorites', JSON.stringify(normalized));
      }
      return normalized;
    } catch (_) {
      storage.delete('xbox.library.favorites');
      return [];
    }
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const libraryScrollRef = useRef(null);
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;
    try {
      const raw = storage.getString('xbox.library.favorites');
      const parsed = raw ? JSON.parse(raw) : [];
      const normalized = Array.isArray(parsed)
        ? [...new Set(parsed.filter(title => typeof title === 'string' && GAMES.some(game => game.title === title)))]
        : [];
      if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
        storage.set('xbox.library.favorites', JSON.stringify(normalized));
      }
      setFavoriteTitles(normalized);
    } catch (_) {
      storage.delete('xbox.library.favorites');
      setFavoriteTitles([]);
    }
  }, [isFocused]);
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

  const favoriteCount = useMemo(
    () => GAMES.filter(game => favoriteTitles.includes(game.title)).length,
    [favoriteTitles],
  );

  const categoryCount = item => GAMES.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (item === 'All' || game.genre === item) && (!favoritesOnly || favoriteTitles.includes(game.title));
  }).length;

  useEffect(() => {
    setSelectedIndex(current => Math.min(current, Math.max(0, visibleGames.length - 1)));
  }, [visibleGames.length]);

  const toggleFavorite = title => {
    if (!GAMES.some(game => game.title === title)) return;
    let latest = [];
    try {
      const raw = storage.getString('xbox.library.favorites');
      const parsed = raw ? JSON.parse(raw) : [];
      latest = Array.isArray(parsed)
        ? [...new Set(parsed.filter(item => typeof item === 'string' && GAMES.some(game => game.title === item)))]
        : [];
    } catch (_) {
      storage.delete('xbox.library.favorites');
    }
    const next = latest.includes(title)
      ? latest.filter(item => item !== title)
      : [...latest, title];
    storage.set('xbox.library.favorites', JSON.stringify(next));
    setFavoriteTitles(next);
  };

  const openXbox = async title => {
    haptic('impactLight');
    try {
      await Linking.openURL(XBOX_PLAY);
    } catch (_) {
      Alert.alert('Unable to open Xbox Cloud Gaming', 'Suriin ang internet connection o buksan ang https://www.xbox.com/play sa Safari.');
      return;
    }
    if (title) {
      const openedAt = Date.now();
      addLocalNotification('Catalog opened', 'You opened ' + title + '.', 'activity');
      storage.set('xbox.activity.lastTitle', title);
      storage.set('xbox.activity.lastOpenedAt', openedAt);
      const launchCount = storage.getNumber('xbox.activity.launchCount') ?? 0;
      const safeLaunchCount = Number.isSafeInteger(launchCount) && launchCount >= 0
        ? launchCount
        : 0;
      storage.set('xbox.activity.launchCount', Math.min(safeLaunchCount + 1, Number.MAX_SAFE_INTEGER));
      let history = [];
      try {
        const storedHistory = storage.getString('xbox.activity.history');
        const parsed = storedHistory ? JSON.parse(storedHistory) : [];
        history = Array.isArray(parsed) ? parsed.filter(item =>
          item && typeof item.title === 'string' &&
          GAMES.some(game => game.title === item.title) &&
          Number.isFinite(item.openedAt) && item.openedAt > 0
        ) : [];
      } catch (_) {
        storage.delete('xbox.activity.history');
      }
      history.unshift({title, openedAt});
      storage.set('xbox.activity.history', JSON.stringify(history.slice(0, 10)));
    }
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
          ★ Favorites ({favoriteCount})
        </Chip>
        {favoriteCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"Clear all " + favoriteCount + " saved favorites"}
            accessibilityHint="Asks for confirmation before removing every saved favorite."
            onPress={() => {
              let current = [];
              try {
                const raw = storage.getString('xbox.library.favorites');
                const parsed = raw ? JSON.parse(raw) : [];
                current = Array.isArray(parsed)
                  ? [...new Set(parsed.filter(title => typeof title === 'string' && GAMES.some(game => game.title === title)))]
                  : [];
              } catch (_) {
                current = [];
              }
              setFavoriteTitles(current);
              if (!current.length) return;
              const titlesToClear = new Set(current);
              Alert.alert(
                'Clear all favorites?',
                'This clears the favorites currently listed. New favorites added while this confirmation is open will be kept. Your game catalog and activity history remain unchanged.',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {text: 'Clear favorites', style: 'destructive', onPress: () => {
                    haptic('impactLight');
                    let latest = [];
                    try {
                      const raw = storage.getString('xbox.library.favorites');
                      const parsed = raw ? JSON.parse(raw) : [];
                      latest = Array.isArray(parsed)
                        ? [...new Set(parsed.filter(title => typeof title === 'string' && GAMES.some(game => game.title === title)))]
                        : [];
                    } catch (_) {
                      latest = [];
                    }
                    const remaining = latest.filter(title => !titlesToClear.has(title));
                    storage.set('xbox.library.favorites', JSON.stringify(remaining));
                    setFavoriteTitles(remaining);
                    setFavoritesOnly(false);
                    setSelectedIndex(0);
                  }},
                ],
              );
            }}
            style={styles.clearFavoritesButton}>
            <Text style={styles.clearFavoritesText}>Clear favorites</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {CATEGORIES.map(item => (
          <Chip
            key={item}
            accessibilityRole="button"
            accessibilityLabel={"Filter games by " + item + ", " + categoryCount(item) + (categoryCount(item) === 1 ? " title" : " titles")}
            accessibilityHint={category === item ? "Currently selected category filter." : "Applies the " + item + " category filter."}
            accessibilityState={{selected: category === item}}
            selected={category === item}
            onPress={() => { haptic(); setCategory(item); setSelectedIndex(0); }}
            style={styles.chip}
            textStyle={styles.chipText}>
            {item} ({categoryCount(item)})
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

      {visibleGames.length === 0 ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
          accessibilityLabel="No games match the current search and filters."
          style={styles.controllerHint}>
          No games found. Try another search or reset your filters.
        </Text>
      ) : null}
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
  favoriteFilterRow: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8},
  clearFavoritesButton: {paddingHorizontal: 10, paddingVertical: 8},
  clearFavoritesText: {color: '#9cdb8a', fontSize: 12, fontWeight: '700'},
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
