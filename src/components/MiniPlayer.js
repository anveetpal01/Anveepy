import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';

const { width } = Dimensions.get('window');
const COLORS = { bg: '#121212', surface: '#1E1E1E', green: '#1DB954', text: '#FFF', muted: '#B3B3B3', card: '#282828' };

export default function MiniPlayer() {
  const navigation = useNavigation();
  const { currentSong, isPlaying, togglePlayPause, playNext, position, duration } = usePlayerStore();

  if (!currentSong) return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={s.wrapper}>
      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <TouchableOpacity style={s.container} activeOpacity={0.9} onPress={() => navigation.navigate('NowPlaying')}>
        {/* Art */}
        <View style={s.art}>
          <Ionicons name="musical-note" size={18} color={COLORS.green} />
        </View>

        {/* Info */}
        <View style={s.info}>
          <Text style={s.title} numberOfLines={1}>{currentSong.title}</Text>
          <Text style={s.artist} numberOfLines={1}>{currentSong.artist}</Text>
        </View>

        {/* Controls */}
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); togglePlayPause(); }} style={s.btn}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); playNext(); }} style={s.btn}>
          <Ionicons name="play-skip-forward" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 60, left: 0, right: 0 },
  progressBar: { height: 2, backgroundColor: COLORS.card },
  progressFill: { height: 2, backgroundColor: COLORS.green },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card,
  },
  art: { width: 40, height: 40, borderRadius: 4, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  info: { flex: 1 },
  title: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  artist: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  btn: { padding: 8 },
});
