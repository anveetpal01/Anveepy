import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, TextInput, Modal, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import SongItem from '../components/SongItem';

const COLORS = { bg: '#121212', surface: '#1E1E1E', green: '#1DB954', text: '#FFF', muted: '#B3B3B3', card: '#282828' };

export default function LibraryScreen({ navigation }) {
  const { songs, playlists, likedSongs, createPlaylist } = usePlayerStore();
  const [tab, setTab] = useState('playlists'); // playlists | songs | liked
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const liked = songs.filter((s) => likedSongs.includes(s.uri));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createPlaylist(newName.trim());
    setNewName('');
    setModalVisible(false);
  };

  const renderPlaylist = ({ item }) => (
    <TouchableOpacity style={s.playlistRow} onPress={() => navigation.navigate('Playlist', { playlistId: item.id })}>
      <View style={s.playlistArt}>
        <Ionicons name="list" size={22} color={COLORS.green} />
      </View>
      <View style={s.playlistInfo}>
        <Text style={s.playlistName}>{item.name}</Text>
        <Text style={s.playlistCount}>{item.songs.length} songs</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
    </TouchableOpacity>
  );

  const tabContent = () => {
    if (tab === 'playlists') {
      return (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={renderPlaylist}
          ListEmptyComponent={<Text style={s.empty}>No playlists yet. Create one!</Text>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      );
    }
    if (tab === 'liked') {
      const { playSong } = usePlayerStore.getState();
      return (
        <FlatList
          data={liked}
          keyExtractor={(item) => item.uri}
          renderItem={({ item }) => (
            <SongItem song={item} onPress={() => playSong(item, liked)} navigation={navigation} />
          )}
          ListEmptyComponent={<Text style={s.empty}>No liked songs yet.</Text>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      );
    }
    // songs tab
    const { playSong } = usePlayerStore.getState();
    return (
      <FlatList
        data={songs}
        keyExtractor={(item) => item.uri}
        renderItem={({ item }) => (
          <SongItem song={item} onPress={() => playSong(item, songs)} navigation={navigation} />
        )}
        ListEmptyComponent={<Text style={s.empty}>No songs found. Add music to your phone.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={s.header}>
        <Text style={s.title}>Your Library</Text>
        {tab === 'playlists' && (
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle" size={28} color={COLORS.green} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {[['playlists', 'Playlists'], ['songs', 'Songs'], ['liked', 'Liked']].map(([key, label]) => (
          <TouchableOpacity key={key} style={[s.tab, tab === key && s.tabActive]} onPress={() => setTab(key)}>
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tabContent()}

      {/* Create Playlist Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={s.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={s.modalTitle}>New Playlist</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Playlist name"
              placeholderTextColor={COLORS.muted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              selectionColor={COLORS.green}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={s.modalCancel}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={s.modalCreate}>
                <Text style={s.modalCreateText}>Create</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.card },
  tabActive: { backgroundColor: COLORS.green },
  tabText: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#000' },
  playlistRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 },
  playlistArt: { width: 52, height: 52, borderRadius: 4, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  playlistInfo: { flex: 1 },
  playlistName: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  playlistCount: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  empty: { color: COLORS.muted, textAlign: 'center', marginTop: 40, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 32 },
  modalBox: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 24 },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalInput: { backgroundColor: COLORS.card, color: COLORS.text, padding: 12, borderRadius: 8, fontSize: 15, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { padding: 10 },
  modalCancelText: { color: COLORS.muted, fontSize: 15 },
  modalCreate: { backgroundColor: COLORS.green, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  modalCreateText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
});
