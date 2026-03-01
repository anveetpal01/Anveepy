import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  ScrollView, Modal, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { usePlayerStore } from '../store/playerStore';

const { width } = Dimensions.get('window');
const COLORS = { bg: '#121212', surface: '#1E1E1E', green: '#1DB954', text: '#FFF', muted: '#B3B3B3', card: '#282828' };

function formatTime(ms) {
  if (!ms || isNaN(ms)) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const MOODS = ['happy', 'sad', 'chill', 'party', 'focus'];
const MOOD_EMOJI = { happy: '😄', sad: '😢', chill: '😌', party: '🎉', focus: '🎯' };

export default function NowPlayingScreen({ navigation }) {
  const {
    currentSong, isPlaying, position, duration,
    shuffle, repeatMode, volume, playbackSpeed,
    togglePlayPause, playNext, playPrevious, seekTo,
    toggleShuffle, cycleRepeat, setVolume, setPlaybackSpeed,
    toggleLike, isLiked, setSleepTimer, getSleepTimerRemaining,
    setCrossfade, crossfade, sleepTimer, queue, queueIndex,
    setMood, getMood,
  } = usePlayerStore();

  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [lyrics, setLyrics] = useState(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => setTimerRemaining(getSleepTimerRemaining()), 1000);
    return () => clearInterval(interval);
  }, [sleepTimer]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 8000, useNativeDriver: true })).start();
    } else {
      spinAnim.stopAnimation();
    }
  }, [isPlaying]);

  // Fetch lyrics when song changes or lyrics panel opens
  useEffect(() => {
    if (!showLyrics || !currentSong) return;
    fetchLyrics();
  }, [showLyrics, currentSong?.uri]);

  const fetchLyrics = async () => {
    setLyricsLoading(true);
    setLyricsError(false);
    setLyrics(null);
    try {
      const title = encodeURIComponent(currentSong.title.replace(/\(.*?\)|\[.*?\]/g, '').trim());
      const artist = encodeURIComponent(currentSong.artist === 'Unknown Artist' ? '' : currentSong.artist);
      const url = `https://lrclib.net/api/search?track_name=${title}&artist_name=${artist}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0 && data[0].plainLyrics) {
        setLyrics(data[0].plainLyrics);
      } else {
        setLyricsError(true);
      }
    } catch (e) {
      setLyricsError(true);
    }
    setLyricsLoading(false);
  };

  if (!currentSong) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="musical-notes-outline" size={80} color={COLORS.muted} />
        <Text style={s.noSong}>Nothing playing</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ color: COLORS.green }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const liked = isLiked(currentSong.uri);
  const progress = duration > 0 ? position / duration : 0;
  const currentMood = getMood(currentSong.uri);

  const timerLabel = () => {
    if (!timerRemaining) return null;
    const m = Math.floor(timerRemaining / 60000);
    const s = Math.floor((timerRemaining % 60000) / 1000);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="chevron-down" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={s.topCenter}>
          <Text style={s.topLabel}>NOW PLAYING</Text>
          <Text style={s.topSub} numberOfLines={1}>
            {queue.length > 0 ? `${queueIndex + 1} / ${queue.length}` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Queue')} style={s.iconBtn}>
          <Ionicons name="list" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {showLyrics ? (
        /* ── Lyrics View ── */
        <View style={s.lyricsContainer}>
          <View style={s.lyricsHeader}>
            <Text style={s.lyricsTitle}>Lyrics</Text>
            <TouchableOpacity onPress={() => setShowLyrics(false)}>
              <Text style={{ color: COLORS.green }}>Hide</Text>
            </TouchableOpacity>
          </View>
          {lyricsLoading ? (
            <ActivityIndicator color={COLORS.green} size="large" style={{ marginTop: 40 }} />
          ) : lyricsError ? (
            <View style={s.lyricsEmpty}>
              <Ionicons name="musical-notes-outline" size={48} color={COLORS.muted} />
              <Text style={s.lyricsEmptyText}>Lyrics not found for this song</Text>
              <TouchableOpacity onPress={fetchLyrics} style={s.retryBtn}>
                <Text style={{ color: COLORS.green }}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.lyricsText}>{lyrics}</Text>
              <View style={{ height: 60 }} />
            </ScrollView>
          )}
        </View>
      ) : (
        /* ── Normal Player View ── */
        <>
          {/* Artwork */}
          <View style={s.artContainer}>
            <Animated.View style={[s.artDisc, { transform: [{ rotate: spin }] }]}>
              <View style={s.artInner}>
                <Ionicons name="musical-note" size={60} color={COLORS.green} />
              </View>
            </Animated.View>
            {currentMood && (
              <Text style={s.moodBadge}>{MOOD_EMOJI[currentMood]} {currentMood}</Text>
            )}
          </View>

          {/* Song Info + Like */}
          <View style={s.infoRow}>
            <View style={s.infoText}>
              <Text style={s.songTitle} numberOfLines={1}>{currentSong.title}</Text>
              <Text style={s.songArtist} numberOfLines={1}>{currentSong.artist}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleLike(currentSong.uri)} style={s.iconBtn}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? COLORS.green : COLORS.muted} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={s.progressContainer}>
            <Slider
              style={s.slider}
              minimumValue={0}
              maximumValue={1}
              value={seeking ? seekValue : progress}
              minimumTrackTintColor={COLORS.green}
              maximumTrackTintColor={COLORS.card}
              thumbTintColor={COLORS.text}
              onSlidingStart={(v) => { setSeeking(true); setSeekValue(v); }}
              onValueChange={(v) => setSeekValue(v)}
              onSlidingComplete={(v) => { setSeeking(false); seekTo(v * duration); }}
            />
            <View style={s.timeRow}>
              <Text style={s.timeText}>{formatTime(seeking ? seekValue * duration : position)}</Text>
              <Text style={s.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={s.controls}>
            <TouchableOpacity onPress={toggleShuffle} style={s.iconBtn}>
              <Ionicons name="shuffle" size={24} color={shuffle ? COLORS.green : COLORS.muted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={playPrevious} style={s.iconBtn}>
              <Ionicons name="play-skip-back" size={32} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={s.playBtn}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={38} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={playNext} style={s.iconBtn}>
              <Ionicons name="play-skip-forward" size={32} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={cycleRepeat} style={s.iconBtn}>
              <Ionicons
                name={repeatMode === 'one' ? 'repeat-outline' : 'repeat'}
                size={24}
                color={repeatMode !== 'off' ? COLORS.green : COLORS.muted}
              />
              {repeatMode === 'one' && <Text style={s.repeatOne}>1</Text>}
            </TouchableOpacity>
          </View>

          {/* Volume */}
          <View style={s.volumeRow}>
            <Ionicons name="volume-low" size={18} color={COLORS.muted} />
            <Slider
              style={s.volumeSlider}
              minimumValue={0} maximumValue={1} value={volume}
              minimumTrackTintColor={COLORS.text} maximumTrackTintColor={COLORS.card}
              thumbTintColor={COLORS.text} onValueChange={setVolume}
            />
            <Ionicons name="volume-high" size={18} color={COLORS.muted} />
          </View>

          {/* Extra Options */}
          <View style={s.extras}>
            <TouchableOpacity style={s.extraBtn} onPress={() => setShowSleepModal(true)}>
              <Ionicons name="moon-outline" size={20} color={sleepTimer ? COLORS.green : COLORS.muted} />
              <Text style={[s.extraText, sleepTimer && { color: COLORS.green }]}>
                {sleepTimer ? timerLabel() : 'Sleep'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.extraBtn} onPress={() => setShowLyrics(true)}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.muted} />
              <Text style={s.extraText}>Lyrics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.extraBtn} onPress={() => setShowAudioModal(true)}>
              <Ionicons name="options-outline" size={20} color={COLORS.muted} />
              <Text style={s.extraText}>{playbackSpeed !== 1 ? `${playbackSpeed}x` : 'Audio'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.extraBtn} onPress={() => setShowMoodModal(true)}>
              <Text style={{ fontSize: 20 }}>{currentMood ? MOOD_EMOJI[currentMood] : '🎭'}</Text>
              <Text style={s.extraText}>Mood</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.extraBtn} onPress={() => navigation.navigate('Artist', { artist: currentSong.artist })}>
              <Ionicons name="person-outline" size={20} color={COLORS.muted} />
              <Text style={s.extraText}>Artist</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Sleep Timer Modal */}
      <Modal visible={showSleepModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} onPress={() => setShowSleepModal(false)} activeOpacity={1}>
          <View style={s.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={s.modalTitle}>Sleep Timer</Text>
            {[5, 10, 15, 30, 45, 60, 90].map((m) => (
              <TouchableOpacity key={m} style={s.timerOption} onPress={() => { setSleepTimer(m); setShowSleepModal(false); }}>
                <Text style={s.timerText}>{m} minutes</Text>
              </TouchableOpacity>
            ))}
            {sleepTimer && (
              <TouchableOpacity style={[s.timerOption, { borderTopWidth: 1, borderTopColor: COLORS.card }]} onPress={() => { setSleepTimer(null); setShowSleepModal(false); }}>
                <Text style={[s.timerText, { color: '#ff6b6b' }]}>Cancel Timer</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Audio Settings Modal (Speed + Crossfade) */}
      <Modal visible={showAudioModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} onPress={() => setShowAudioModal(false)} activeOpacity={1}>
          <View style={s.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={s.modalTitle}>Audio Settings</Text>

            <Text style={s.modalSubtitle}>Playback Speed</Text>
            <View style={s.speedRow}>
              {SPEED_OPTIONS.map((sp) => (
                <TouchableOpacity
                  key={sp}
                  style={[s.speedBtn, playbackSpeed === sp && s.speedBtnActive]}
                  onPress={() => setPlaybackSpeed(sp)}
                >
                  <Text style={[s.speedText, playbackSpeed === sp && s.speedTextActive]}>
                    {sp}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.modalSubtitle, { marginTop: 16 }]}>Crossfade: {crossfade}s</Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0} maximumValue={12} step={1} value={crossfade}
              minimumTrackTintColor={COLORS.green} maximumTrackTintColor={COLORS.card}
              thumbTintColor={COLORS.green} onValueChange={setCrossfade}
            />

            <TouchableOpacity onPress={() => setShowAudioModal(false)} style={s.modalClose}>
              <Text style={{ color: COLORS.green, fontWeight: 'bold' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Mood Modal */}
      <Modal visible={showMoodModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} onPress={() => setShowMoodModal(false)} activeOpacity={1}>
          <View style={s.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={s.modalTitle}>Set Mood</Text>
            <View style={s.moodGrid}>
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood}
                  style={[s.moodBtn, currentMood === mood && s.moodBtnActive]}
                  onPress={() => { setMood(currentSong.uri, currentMood === mood ? null : mood); setShowMoodModal(false); }}
                >
                  <Text style={s.moodEmoji}>{MOOD_EMOJI[mood]}</Text>
                  <Text style={[s.moodLabel, currentMood === mood && { color: '#000' }]}>{mood}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  topCenter: { alignItems: 'center' },
  topLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  topSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  iconBtn: { padding: 10 },
  artContainer: { alignItems: 'center', marginTop: 16, marginBottom: 16 },
  artDisc: { width: width * 0.68, height: width * 0.68, borderRadius: width * 0.34, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', elevation: 12 },
  artInner: { width: width * 0.3, height: width * 0.3, borderRadius: width * 0.15, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  moodBadge: { marginTop: 8, color: COLORS.muted, fontSize: 13, textTransform: 'capitalize' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 8 },
  infoText: { flex: 1 },
  songTitle: { color: COLORS.text, fontSize: 21, fontWeight: 'bold' },
  songArtist: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
  progressContainer: { paddingHorizontal: 16 },
  slider: { width: '100%', height: 40 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  timeText: { color: COLORS.muted, fontSize: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', marginVertical: 12 },
  playBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  repeatOne: { position: 'absolute', bottom: 6, right: 4, color: COLORS.green, fontSize: 9, fontWeight: 'bold' },
  volumeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  volumeSlider: { flex: 1, height: 40, marginHorizontal: 8 },
  extras: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 8, paddingBottom: 16 },
  extraBtn: { alignItems: 'center', gap: 4 },
  extraText: { color: COLORS.muted, fontSize: 11 },
  noSong: { color: COLORS.muted, fontSize: 18, marginTop: 16 },
  backBtn: { marginTop: 20 },
  // Lyrics
  lyricsContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  lyricsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  lyricsTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  lyricsText: { color: COLORS.text, fontSize: 15, lineHeight: 28 },
  lyricsEmpty: { alignItems: 'center', marginTop: 60 },
  lyricsEmptyText: { color: COLORS.muted, fontSize: 15, marginTop: 12 },
  retryBtn: { marginTop: 16 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalSubtitle: { color: COLORS.muted, fontSize: 14, marginBottom: 4 },
  timerOption: { padding: 14 },
  timerText: { color: COLORS.text, fontSize: 16 },
  modalClose: { alignSelf: 'center', marginTop: 16 },
  speedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  speedBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card },
  speedBtnActive: { backgroundColor: COLORS.green },
  speedText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
  speedTextActive: { color: '#000' },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  moodBtn: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 16, backgroundColor: COLORS.card },
  moodBtnActive: { backgroundColor: COLORS.green },
  moodEmoji: { fontSize: 26 },
  moodLabel: { color: COLORS.muted, fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
});
