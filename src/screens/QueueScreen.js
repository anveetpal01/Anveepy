import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';

const COLORS = { bg: '#121212', surface: '#1E1E1E', green: '#1DB954', text: '#FFF', muted: '#B3B3B3', card: '#282828' };

function formatTime(ms) {
  if (!ms || isNaN(ms)) return '';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function QueueScreen({ navigation }) {
  const { queue, queueIndex, currentSong, playFromQueue, removeFromQueue } = usePlayerStore();

  const renderItem = ({ item, index }) => {
    const isCurrent = index === queueIndex;
    return (
      <TouchableOpacity
        style={[s.row, isCurrent && s.rowActive]}
        onPress={() => playFromQueue(index)}
        disabled={isCurrent}
      >
        <View style={s.indexCol}>
          {isCurrent ? (
            <Ionicons name="volume-high" size={16} color={COLORS.green} />
          ) : (
            <Text style={s.indexText}>{index + 1}</Text>
          )}
        </View>
        <View style={s.info}>
          <Text style={[s.title, isCurrent && { color: COLORS.green }]} numberOfLines={1}>{item.title}</Text>
          <Text style={s.artist} numberOfLines={1}>{item.artist}</Text>
        </View>
        <Text style={s.dur}>{formatTime(item.duration)}</Text>
        {!isCurrent && (
          <TouchableOpacity onPress={() => removeFromQueue(index)} style={s.removeBtn}>
            <Ionicons name="close" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Queue</Text>
        <Text style={s.headerSub}>{queue.length} songs</Text>
      </View>
      <FlatList
        data={queue}
        keyExtractor={(item, i) => item.uri + i}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={s.empty}>Queue is empty.</Text>}
        initialScrollIndex={Math.max(0, queueIndex - 2)}
        getItemLayout={(_, index) => ({ length: 64, offset: 64 * index, index })}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 16 },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
  headerSub: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', height: 64, paddingHorizontal: 16 },
  rowActive: { backgroundColor: 'rgba(29,185,84,0.08)' },
  indexCol: { width: 28, alignItems: 'center' },
  indexText: { color: COLORS.muted, fontSize: 13 },
  info: { flex: 1, marginHorizontal: 12 },
  title: { color: COLORS.text, fontSize: 15, fontWeight: '500' },
  artist: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  dur: { color: COLORS.muted, fontSize: 12, marginRight: 8 },
  removeBtn: { padding: 4 },
  empty: { color: COLORS.muted, textAlign: 'center', marginTop: 40 },
});
