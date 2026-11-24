import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View, Linking, Pressable} from 'react-native';
import {Button, Card, Chip, Searchbar, Text} from 'react-native-paper';
import {storage} from '../store/mmkv';
import {useIsFocused} from '@react-navigation/native';

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isFocused = useIsFocused();
  const [compactCards, setCompactCards] = useState(() => storage.getBoolean('xbox.ui.compactCards') ?? false);
  const [focusOutline, setFocusOutline] = useState(() => storage.getBoolean('xbox.ui.focusOutline') ?? true);

  useEffect(() => {
    if (isFocused) {
      setCompactCards(storage.getBoolean('xbox.ui.compactCards') ?? false);
      setFocusOutline(storage.getBoolean('xbox.ui.focusOutline') ?? true);
    }
  }, [isFocused]);

  const visibleGames = useMemo(() => GAMES.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (category === 'All' || game.genre === category);
  }), [search, category]);

  const openXbox = title => {
    if (title) {
      storage.set('xbox.activity.lastTitle', title);
      storage.set('xbox.activity.lastOpenedAt', Date.now());
      storage.set('xbox.activity.launchCount', (storage.getNumber('xbox.activity.launchCount') ?? 0) + 1);
    }
    Linking.openURL(XBOX_PLAY).catch(() => {});
  };
  const moveSelection = offset => {
    if (!visibleGames.length) { return; }
    setSelectedIndex(current => (current + offset + visibleGames.length) % visibleGames.length);
  };
  const openSelectedGame = () => {
    if (visibleGames.length) { openXbox(visibleGames[selectedIndex]?.title); }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="labelLarge" style={styles.eyebrow}>XCLOUD ULTIMATE</Text>
      <Text variant="headlineMedium" style={styles.heading}>Game Library</Text>
      <Text variant="bodyMedium" style={styles.description}>
        Search these example titles, then open the official Xbox catalog to check current cloud availability in your region and subscription.
      </Text>

      <Searchbar
        placeholder="Search games"
        value={search}
        onChangeText={value => { setSearch(value); setSelectedIndex(0); }}
        style={styles.search}
        inputStyle={styles.searchInput}
        iconColor="#a9c5a9"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {CATEGORIES.map(item => (
          <Chip
            key={item}
            selected={category === item}
            onPress={() => { setCategory(item); setSelectedIndex(0); }}
            style={styles.chip}
            textStyle={styles.chipText}>
            {item}
          </Chip>
        ))}
      </ScrollView>

      <View style={styles.grid}>
        {visibleGames.map((game, index) => (
          <Pressable
            key={game.title}
            focusable
            accessible
            accessibilityRole="button"
            accessibilityLabel={game.title + ', ' + game.genre + '. Open Xbox catalog.'}
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
        ))}
      </View>

      <View style={styles.controllerPanel}>
        <Text variant="titleMedium" style={styles.controllerTitle}>Controller navigation</Text>
        <View style={styles.dpadRow}>
          <Button compact mode="outlined" textColor="#dce9dc" onPress={() => moveSelection(-2)}>↑</Button>
        </View>
        <View style={styles.dpadRow}>
          <Button compact mode="outlined" textColor="#dce9dc" onPress={() => moveSelection(-1)}>←</Button>
          <Button compact mode="contained" buttonColor="#107c10" onPress={openSelectedGame}>A · Select</Button>
          <Button compact mode="outlined" textColor="#dce9dc" onPress={() => moveSelection(1)}>→</Button>
        </View>
        <View style={styles.dpadRow}>
          <Button compact mode="outlined" textColor="#dce9dc" onPress={() => moveSelection(2)}>↓</Button>
          <Button compact mode="text" textColor="#9cdb8a" onPress={() => navigation.goBack()}>B · Back</Button>
        </View>
        <Text variant="bodySmall" style={styles.controllerHint}>Use these on-screen controls to move the highlight and open the selected title in Xbox.</Text>
      </View>

      {visibleGames.length === 0 && (
        <Text variant="bodyMedium" style={styles.empty}>No matching titles. Try another search.</Text>
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
  filters: {gap: 8, paddingBottom: 16},
  chip: {backgroundColor: '#202920'},
  chipText: {color: '#e6eee6'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  gameCardPressable: {width: '48%', flexGrow: 1, borderRadius: 14},
  focusedGameCard: {borderWidth: 2, borderColor: '#9cdb8a', borderRadius: 14},
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
