import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';

const COLORS = { bg: '#121212', surface: '#1E1E1E', green: '#1DB954', text: '#FFF', muted: '#B3B3B3', card: '#282828' };

function formatTime(ms) {
  if (!ms || isNaN(ms)) return '';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function SongItem({ song, onPress, navigation, playlistId }) {
  const { toggleLike, isLiked, addToQueue, playlists, addToPlaylist, removeFromPlaylist, removeSong } = usePlayerStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);

  const liked = isLiked(song.uri);

  const handleAddToPlaylist = async (playlistId) => {
    await addToPlaylist(playlistId, song.uri);
    setPlaylistModalVisible(false);
    setMenuVisible(false);
  };

  const handleRemoveFromPlaylist = async () => {
    if (!playlistId) return;
    await removeFromPlaylist(playlistId, song.uri);
    setMenuVisible(false);
  };

  const handleDelete = () => {
    Alert.alert('Remove Song', `Remove "${song.title}" from library?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await removeSong(song.uri); setMenuVisible(false); } },
    ]);
  };

  return (
    <>
      <TouchableOpacity style={s.row} onPress={onPress} onLongPress={() => setMenuVisible(true)}>
        <View style={s.art}>
          <Ionicons name="musical-note" size={20} color={COLORS.green} />
        </View>
        <View style={s.info}>
          <Text style={s.title} numberOfLines={1}>{song.title}</Text>
          <Text style={s.artist} numberOfLines={1}>{song.artist}</Text>
        </View>
        <Text style={s.dur}>{formatTime(song.duration)}</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={s.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={18} color={COLORS.muted} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Context Menu */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={s.menu} onStartShouldSetResponder={() => true}>
            <Text style={s.menuSongTitle} numberOfLines={1}>{song.title}</Text>
            <Text style={s.menuArtist} numberOfLines={1}>{song.artist}</Text>
            <View style={s.menuDivider} />

            <TouchableOpacity style={s.menuItem} onPress={() => { toggleLike(song.uri); setMenuVisible(false); }}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? COLORS.green : COLORS.text} />
              <Text style={s.menuText}>{liked ? 'Unlike' : 'Like'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.menuItem} onPress={() => { addToQueue(song); setMenuVisible(false); }}>
              <Ionicons name="add-circle-outline" size={20} color={COLORS.text} />
              <Text style={s.menuText}>Add to Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.menuItem} onPress={() => { setPlaylistModalVisible(true); }}>
              <Ionicons name="list-outline" size={20} color={COLORS.text} />
              <Text style={s.menuText}>Add to Playlist</Text>
            </TouchableOpacity>

            {navigation && (
              <TouchableOpacity style={s.menuItem} onPress={() => { navigation.navigate('Artist', { artist: song.artist }); setMenuVisible(false); }}>
                <Ionicons name="person-outline" size={20} color={COLORS.text} />
                <Text style={s.menuText}>Go to Artist</Text>
              </TouchableOpacity>
            )}

            {playlistId && (
              <TouchableOpacity style={s.menuItem} onPress={handleRemoveFromPlaylist}>
                <Ionicons name="remove-circle-outline" size={20} color="#ff6b6b" />
                <Text style={[s.menuText, { color: '#ff6b6b' }]}>Remove from Playlist</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.menuItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
              <Text style={[s.menuText, { color: '#ff6b6b' }]}>Remove from Library</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add to Playlist Picker */}
      <Modal visible={playlistModalVisible} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setPlaylistModalVisible(false)}>
          <View style={[s.menu, { maxHeight: 400 }]} onStartShouldSetResponder={() => true}>
            <Text style={s.menuSongTitle}>Add to Playlist</Text>
            <View style={s.menuDivider} />
            {playlists.length === 0 ? (
              <Text style={{ color: COLORS.muted, padding: 16 }}>No playlists. Create one in Library.</Text>
            ) : (
              playlists.map((p) => (
                <TouchableOpacity key={p.id} style={s.menuItem} onPress={() => handleAddToPlaylist(p.id)}>
                  <Ionicons name="list" size={20} color={COLORS.green} />
                  <Text style={s.menuText}>{p.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  art: { width: 44, height: 44, borderRadius: 4, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, marginRight: 8 },
  title: { color: COLORS.text, fontSize: 15, fontWeight: '500' },
  artist: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  dur: { color: COLORS.muted, fontSize: 12, marginRight: 4 },
  moreBtn: { padding: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  menu: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  menuSongTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  menuArtist: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: COLORS.card, marginVertical: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
  menuText: { color: COLORS.text, fontSize: 16 },
});
