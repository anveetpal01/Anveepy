import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import SongItem from '../components/SongItem';

const COLORS = { bg: '#121212', surface: '#1E1E1E', green: '#1DB954', text: '#FFF', muted: '#B3B3B3', card: '#282828' };

export default function AlbumScreen({ route, navigation }) {
  const { album } = route.params;
  const { songs, playSong } = usePlayerStore();
  const albumSongs = songs.filter((s) => s.album === album);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View style={s.artBox}>
          <Ionicons name="disc" size={56} color={COLORS.muted} />
        </View>
        <Text style={s.name} numberOfLines={2}>{album}</Text>
        <Text style={s.count}>{albumSongs.length} songs</Text>
        {albumSongs.length > 0 && (
          <TouchableOpacity style={s.playBtn} onPress={() => playSong(albumSongs[0], albumSongs)}>
            <Ionicons name="play" size={18} color="#000" />
            <Text style={s.playText}>Play All</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={albumSongs}
        keyExtractor={(item) => item.uri}
        renderItem={({ item }) => <SongItem song={item} onPress={() => playSong(item, albumSongs)} navigation={navigation} />}
        ListEmptyComponent={<Text style={s.empty}>No songs found.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { alignItems: 'center', padding: 24 },
  artBox: { width: 130, height: 130, borderRadius: 8, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  count: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  playBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.green, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 6, marginTop: 14 },
  playText: { color: '#000', fontWeight: 'bold' },
  empty: { color: COLORS.muted, textAlign: 'center', marginTop: 40 },
});
