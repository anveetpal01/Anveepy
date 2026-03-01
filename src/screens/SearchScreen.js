import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import SongItem from '../components/SongItem';

const COLORS = { bg: '#121212', surface: '#1E1E1E', green: '#1DB954', text: '#FFF', muted: '#B3B3B3', card: '#282828' };
const MOOD_EMOJI = { happy: '😄', sad: '😢', chill: '😌', party: '🎉', focus: '🎯' };
const MOODS = ['happy', 'sad', 'chill', 'party', 'focus'];

export default function SearchScreen({ navigation }) {
  const { songs, playSong, moods } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('songs');
  const [activeMood, setActiveMood] = useState(null);

  const results = useMemo(() => {
    if (activeMood) return songs.filter((s) => moods[s.uri] === activeMood);
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    if (filter === 'songs') return songs.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
    if (filter === 'artists') {
      const seen = new Set();
      return songs.filter((s) => {
        if (s.artist.toLowerCase().includes(q) && !seen.has(s.artist)) { seen.add(s.artist); return true; }
        return false;
      });
    }
    if (filter === 'albums') {
      const seen = new Set();
      return songs.filter((s) => {
        if (s.album.toLowerCase().includes(q) && !seen.has(s.album)) { seen.add(s.album); return true; }
        return false;
      });
    }
    return [];
  }, [query, filter, songs, activeMood, moods]);

  const filterBtn = (label, key) => (
    <TouchableOpacity style={[s.filterBtn, filter === key && s.filterBtnActive]} onPress={() => { setFilter(key); setActiveMood(null); }}>
      <Text style={[s.filterText, filter === key && s.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    if (filter === 'artists' && !activeMood) {
      return (
        <TouchableOpacity style={s.row} onPress={() => navigation.navigate('Artist', { artist: item.artist })}>
          <View style={s.rowArt}><Ionicons name="person" size={20} color={COLORS.muted} /></View>
          <Text style={s.rowTitle}>{item.artist}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
        </TouchableOpacity>
      );
    }
    if (filter === 'albums' && !activeMood) {
      return (
        <TouchableOpacity style={s.row} onPress={() => navigation.navigate('Album', { album: item.album })}>
          <View style={s.rowArt}><Ionicons name="disc" size={20} color={COLORS.muted} /></View>
          <Text style={s.rowTitle}>{item.album}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
        </TouchableOpacity>
      );
    }
    return <SongItem song={item} onPress={() => playSong(item, results)} navigation={navigation} />;
  };

  const showEmpty = !activeMood && query.length === 0;
  const showNoResults = !activeMood && query.length > 0 && results.length === 0;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={s.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.muted} style={s.searchIcon} />
        <TextInput
          style={s.input}
          placeholder="Songs, artists, albums…"
          placeholderTextColor={COLORS.muted}
          value={query}
          onChangeText={(t) => { setQuery(t); setActiveMood(null); }}
          returnKeyType="search"
          selectionColor={COLORS.green}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.filters}>
        {filterBtn('Songs', 'songs')}
        {filterBtn('Artists', 'artists')}
        {filterBtn('Albums', 'albums')}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.moodRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {MOODS.map((mood) => (
          <TouchableOpacity
            key={mood}
            style={[s.moodBtn, activeMood === mood && s.moodBtnActive]}
            onPress={() => setActiveMood(activeMood === mood ? null : mood)}
          >
            <Text style={s.moodEmoji}>{MOOD_EMOJI[mood]}</Text>
            <Text style={[s.moodText, activeMood === mood && s.moodTextActive]}>{mood}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showEmpty ? (
        <View style={s.empty}>
          <Ionicons name="search-outline" size={60} color={COLORS.muted} />
          <Text style={s.emptyText}>Search your music or pick a mood</Text>
        </View>
      ) : showNoResults ? (
        <View style={s.empty}>
          <Ionicons name="sad-outline" size={60} color={COLORS.muted} />
          <Text style={s.emptyText}>No results for "{query}"</Text>
        </View>
      ) : activeMood && results.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 48 }}>{MOOD_EMOJI[activeMood]}</Text>
          <Text style={s.emptyText}>No {activeMood} songs yet</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 8 }}>Set mood on songs from the Now Playing screen</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, i) => item.uri + i}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={activeMood ? (
            <Text style={s.moodHeader}>{MOOD_EMOJI[activeMood]} {activeMood} — {results.length} songs</Text>
          ) : null}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, margin: 16, marginBottom: 8, borderRadius: 10, paddingHorizontal: 12, height: 46 },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, color: COLORS.text, fontSize: 15 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.card },
  filterBtnActive: { backgroundColor: COLORS.green },
  filterText: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#000' },
  moodRow: { marginBottom: 8 },
  moodBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.card },
  moodBtnActive: { backgroundColor: COLORS.green },
  moodEmoji: { fontSize: 16 },
  moodText: { color: COLORS.muted, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  moodTextActive: { color: '#000' },
  moodHeader: { color: COLORS.muted, fontSize: 14, padding: 16, paddingBottom: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.muted, marginTop: 12, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 },
  rowArt: { width: 44, height: 44, borderRadius: 4, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowTitle: { flex: 1, color: COLORS.text, fontSize: 15 },
});
