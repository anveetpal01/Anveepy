import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { usePlayerStore } from '../store/playerStore';
import SongItem from '../components/SongItem';

const COLORS = { bg: '#121212', surface: '#1E1E1E', green: '#1DB954', text: '#FFF', muted: '#B3B3B3', card: '#282828' };

export default function HomeScreen({ navigation }) {
  const { songs, recentlyPlayed, addSongs, loadFromStorage, playSong } = usePlayerStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  const pickAudioFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: false,
      });
      if (result.canceled) return;

      const mapped = result.assets.map((a) => ({
        id: a.uri,
        uri: a.uri,
        title: (a.name || a.uri.split('/').pop()).replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: a.duration ? a.duration * 1000 : 0,
        artwork: null,
      }));
      await addSongs(mapped);
    } catch (e) {
      console.error('pickAudioFiles error', e);
    }
  };

  const recentSongs = recentlyPlayed
    .map((uri) => songs.find((s) => s.uri === uri))
    .filter(Boolean)
    .slice(0, 6);

  const artists = [...new Map(songs.map((s) => [s.artist, s])).values()];

  const greetingText = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.greeting}>{greetingText()}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')} style={s.statsBtn}>
            <Ionicons name="bar-chart-outline" size={22} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* Add Music Button */}
        <TouchableOpacity style={s.addBtn} onPress={pickAudioFiles}>
          <Ionicons name="add-circle" size={22} color="#000" />
          <Text style={s.addBtnText}>Add Songs from Storage</Text>
        </TouchableOpacity>

        {songs.length === 0 && (
          <View style={s.emptyState}>
            <Ionicons name="musical-notes-outline" size={64} color={COLORS.muted} />
            <Text style={s.emptyTitle}>No songs yet</Text>
            <Text style={s.emptySubtitle}>Tap "Add Songs from Storage" above{'\n'}to pick your music files</Text>
          </View>
        )}

        {/* Recently Played */}
        {recentSongs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recently Played</Text>
            <View style={s.gridTwo}>
              {recentSongs.map((song) => (
                <TouchableOpacity key={song.uri} style={s.quickCard} onPress={() => playSong(song)}>
                  <View style={s.quickArt}>
                    <Ionicons name="musical-note" size={20} color={COLORS.green} />
                  </View>
                  <Text style={s.quickTitle} numberOfLines={2}>{song.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Artists */}
        {artists.length > 1 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Artists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {artists.slice(0, 15).map((song) => (
                <TouchableOpacity
                  key={song.artist}
                  style={s.artistCard}
                  onPress={() => navigation.navigate('Artist', { artist: song.artist })}
                >
                  <View style={s.artistArt}>
                    <Ionicons name="person" size={28} color={COLORS.muted} />
                  </View>
                  <Text style={s.artistName} numberOfLines={1}>{song.artist}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Songs */}
        {songs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>All Songs ({songs.length})</Text>
            {songs.slice(0, 10).map((song) => (
              <SongItem key={song.uri} song={song} onPress={() => playSong(song, songs)} navigation={navigation} />
            ))}
            {songs.length > 10 && (
              <TouchableOpacity style={s.seeAll} onPress={() => navigation.navigate('Library')}>
                <Text style={s.seeAllText}>See all {songs.length} songs →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  statsBtn: { padding: 8 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.green, marginHorizontal: 16, marginBottom: 20,
    paddingVertical: 13, paddingHorizontal: 20, borderRadius: 30,
  },
  addBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 32 },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  gridTwo: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickCard: { backgroundColor: COLORS.card, borderRadius: 6, flexDirection: 'row', alignItems: 'center', width: '48%', overflow: 'hidden' },
  quickArt: { width: 52, height: 52, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  quickTitle: { flex: 1, color: COLORS.text, fontSize: 12, fontWeight: '600', paddingHorizontal: 8 },
  artistCard: { alignItems: 'center', marginRight: 16, width: 90 },
  artistArt: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  artistName: { color: COLORS.text, fontSize: 12, textAlign: 'center' },
  seeAll: { marginTop: 12, alignItems: 'center', padding: 12, backgroundColor: COLORS.card, borderRadius: 8 },
  seeAllText: { color: COLORS.green, fontWeight: '600' },
});
