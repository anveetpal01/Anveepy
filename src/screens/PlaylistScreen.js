import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import SongItem from '../components/SongItem';

const COLORS = { bg: '#121212', surface: '#1E1E1E', green: '#1DB954', text: '#FFF', muted: '#B3B3B3', card: '#282828' };

export default function PlaylistScreen({ route, navigation }) {
  const { playlistId } = route.params;
  const { playlists, songs, playSong, deletePlaylist, renamePlaylist } = usePlayerStore();
  const playlist = playlists.find((p) => p.id === playlistId);
  const [renameModal, setRenameModal] = useState(false);
  const [newName, setNewName] = useState('');

  if (!playlist) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 40 }}>Playlist not found.</Text>
      </SafeAreaView>
    );
  }

  const playlistSongs = playlist.songs.map((uri) => songs.find((s) => s.uri === uri)).filter(Boolean);

  const handleDelete = () => {
    Alert.alert('Delete Playlist', `Delete "${playlist.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deletePlaylist(playlistId); navigation.goBack(); } },
    ]);
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    await renamePlaylist(playlistId, newName.trim());
    setRenameModal(false);
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.artBox}>
          <Ionicons name="list" size={48} color={COLORS.green} />
        </View>
        <Text style={s.title}>{playlist.name}</Text>
        <Text style={s.subtitle}>{playlistSongs.length} songs</Text>
        <View style={s.actions}>
          {playlistSongs.length > 0 && (
            <TouchableOpacity style={s.playAllBtn} onPress={() => playSong(playlistSongs[0], playlistSongs)}>
              <Ionicons name="play" size={18} color="#000" />
              <Text style={s.playAllText}>Play All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.actionBtn} onPress={() => { setNewName(playlist.name); setRenameModal(true); }}>
            <Ionicons name="pencil-outline" size={20} color={COLORS.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={playlistSongs}
        keyExtractor={(item) => item.uri}
        renderItem={({ item }) => (
          <SongItem song={item} onPress={() => playSong(item, playlistSongs)} navigation={navigation} playlistId={playlistId} />
        )}
        ListEmptyComponent={<Text style={s.empty}>No songs in this playlist. Add songs from Library.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <Modal visible={renameModal} transparent animationType="fade">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setRenameModal(false)}>
          <View style={s.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={s.modalTitle}>Rename Playlist</Text>
            <TextInput
              style={s.modalInput}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              selectionColor={COLORS.green}
              placeholderTextColor={COLORS.muted}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setRenameModal(false)}>
                <Text style={{ color: COLORS.muted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRename} style={s.saveBtn}>
                <Text style={{ color: '#000', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { alignItems: 'center', padding: 24 },
  artBox: { width: 120, height: 120, borderRadius: 8, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
  playAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.green, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 6 },
  playAllText: { color: '#000', fontWeight: 'bold' },
  actionBtn: { padding: 8 },
  empty: { color: COLORS.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: 32, lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 32 },
  modalBox: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 24 },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalInput: { backgroundColor: COLORS.card, color: COLORS.text, padding: 12, borderRadius: 8, fontSize: 15, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, alignItems: 'center' },
  saveBtn: { backgroundColor: COLORS.green, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 16 },
});
