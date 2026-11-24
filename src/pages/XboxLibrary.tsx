import React, {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View, Linking, Pressable} from 'react-native';
import {Button, Card, Chip, Searchbar, Text} from 'react-native-paper';

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

export default function XboxLibraryScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const visibleGames = useMemo(() => GAMES.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (category === 'All' || game.genre === category);
  }), [search, category]);

  const openXbox = () => Linking.openURL(XBOX_PLAY).catch(() => {});

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
        onChangeText={setSearch}
        style={styles.search}
        inputStyle={styles.searchInput}
        iconColor="#a9c5a9"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {CATEGORIES.map(item => (
          <Chip
            key={item}
            selected={category === item}
            onPress={() => setCategory(item)}
            style={styles.chip}
            textStyle={styles.chipText}>
            {item}
          </Chip>
        ))}
      </ScrollView>

      <View style={styles.grid}>
        {visibleGames.map(game => (
          <Pressable
            key={game.title}
            focusable
            accessible
            accessibilityRole="button"
            accessibilityLabel={game.title + ', ' + game.genre + '. Open Xbox catalog.'}
            onPress={openXbox}
            style={({focused}) => [styles.gameCardPressable, focused && styles.focusedGameCard]}>
          <Card mode="outlined" style={styles.gameCard}>
            <Card.Content>
              <Text variant="displaySmall" style={styles.gameMark}>{game.mark}</Text>
              <Text variant="titleMedium" style={styles.gameTitle}>{game.title}</Text>
              <Text variant="bodySmall" style={styles.genre}>{game.genre}</Text>
              <Text variant="labelSmall" style={styles.selectHint}>Select to view on Xbox</Text>
            </Card.Content>
          </Card>
          </Pressable>
        ))}
      </View>

      {visibleGames.length === 0 && (
        <Text variant="bodyMedium" style={styles.empty}>No matching titles. Try another search.</Text>
      )}

      <Button mode="contained" icon="microsoft-xbox" onPress={openXbox} style={styles.catalogButton}>
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
  gameMark: {marginBottom: 10},
  gameTitle: {color: '#fff', minHeight: 48, fontWeight: '700'},
  genre: {color: '#aab5aa', marginTop: 4},
  selectHint: {color: '#9cdb8a', marginTop: 12},
  empty: {color: '#cbd5cb', textAlign: 'center', marginVertical: 28},
  catalogButton: {marginTop: 22, backgroundColor: '#107c10'},
  footer: {color: '#829082', marginTop: 14, lineHeight: 19},
});
