import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const STORAGE_KEYS = {
  SONGS: 'anveepy_songs',
  PLAYLISTS: 'anveepy_playlists',
  LIKED_SONGS: 'anveepy_liked',
  RECENTLY_PLAYED: 'anveepy_recent',
  SETTINGS: 'anveepy_settings',
  STATS: 'anveepy_stats',
  MOODS: 'anveepy_moods',
};

let soundObject = null;

export const usePlayerStore = create((set, get) => ({
  songs: [],
  playlists: [],
  likedSongs: [],
  recentlyPlayed: [],

  currentSong: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,

  shuffle: false,
  repeatMode: 'off',
  volume: 1.0,
  playbackSpeed: 1.0,
  crossfade: 0,
  sleepTimer: null,
  sleepTimerInterval: null,

  // stats: { uri -> { playCount, totalListenMs, lastPlayed } }
  stats: {},
  // moods: { uri -> 'happy' | 'sad' | 'chill' | 'party' | 'focus' }
  moods: {},

  // ── Storage ───────────────────────────────────────────────────
  loadFromStorage: async () => {
    try {
      const [songs, playlists, liked, recent, settings, stats, moods] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SONGS),
        AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS),
        AsyncStorage.getItem(STORAGE_KEYS.LIKED_SONGS),
        AsyncStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.STATS),
        AsyncStorage.getItem(STORAGE_KEYS.MOODS),
      ]);
      set({
        songs: songs ? JSON.parse(songs) : [],
        playlists: playlists ? JSON.parse(playlists) : [],
        likedSongs: liked ? JSON.parse(liked) : [],
        recentlyPlayed: recent ? JSON.parse(recent) : [],
        stats: stats ? JSON.parse(stats) : {},
        moods: moods ? JSON.parse(moods) : {},
        ...(settings ? JSON.parse(settings) : {}),
      });
    } catch (e) { console.error('loadFromStorage', e); }
  },

  saveSettings: async () => {
    const { shuffle, repeatMode, volume, crossfade, playbackSpeed } = get();
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ shuffle, repeatMode, volume, crossfade, playbackSpeed }));
  },

  // ── Library ───────────────────────────────────────────────────
  addSongs: async (newSongs) => {
    const { songs } = get();
    const existing = new Set(songs.map((s) => s.uri));
    const toAdd = newSongs.filter((s) => !existing.has(s.uri));
    const updated = [...songs, ...toAdd];
    set({ songs: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(updated));
  },

  removeSong: async (uri) => {
    const { songs, likedSongs, playlists } = get();
    const updatedSongs = songs.filter((s) => s.uri !== uri);
    const updatedLiked = likedSongs.filter((u) => u !== uri);
    const updatedPlaylists = playlists.map((p) => ({ ...p, songs: p.songs.filter((u) => u !== uri) }));
    set({ songs: updatedSongs, likedSongs: updatedLiked, playlists: updatedPlaylists });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(updatedSongs)),
      AsyncStorage.setItem(STORAGE_KEYS.LIKED_SONGS, JSON.stringify(updatedLiked)),
      AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updatedPlaylists)),
    ]);
  },

  // ── Likes ─────────────────────────────────────────────────────
  toggleLike: async (uri) => {
    const { likedSongs } = get();
    const updated = likedSongs.includes(uri)
      ? likedSongs.filter((u) => u !== uri)
      : [...likedSongs, uri];
    set({ likedSongs: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.LIKED_SONGS, JSON.stringify(updated));
  },
  isLiked: (uri) => get().likedSongs.includes(uri),

  // ── Playlists ─────────────────────────────────────────────────
  createPlaylist: async (name) => {
    const { playlists } = get();
    const p = { id: Date.now().toString(), name, songs: [], createdAt: Date.now() };
    const updated = [...playlists, p];
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
    return p;
  },
  renamePlaylist: async (id, name) => {
    const updated = get().playlists.map((p) => (p.id === id ? { ...p, name } : p));
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
  },
  deletePlaylist: async (id) => {
    const updated = get().playlists.filter((p) => p.id !== id);
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
  },
  addToPlaylist: async (playlistId, songUri) => {
    const updated = get().playlists.map((p) =>
      p.id === playlistId && !p.songs.includes(songUri) ? { ...p, songs: [...p.songs, songUri] } : p
    );
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
  },
  removeFromPlaylist: async (playlistId, songUri) => {
    const updated = get().playlists.map((p) =>
      p.id === playlistId ? { ...p, songs: p.songs.filter((u) => u !== songUri) } : p
    );
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
  },

  // ── Recently Played ───────────────────────────────────────────
  addToRecent: async (uri) => {
    const filtered = get().recentlyPlayed.filter((u) => u !== uri);
    const updated = [uri, ...filtered].slice(0, 50);
    set({ recentlyPlayed: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(updated));
  },

  // ── Playback ──────────────────────────────────────────────────
  playSong: async (song, songList = null) => {
    const { songs, shuffle, addToRecent, recordPlay } = get();
    const list = songList || songs;
    let queue = [...list];
    let idx = queue.findIndex((s) => s.uri === song.uri);
    if (idx === -1) { queue = [song, ...queue]; idx = 0; }
    if (shuffle) {
      const rest = queue.filter((s) => s.uri !== song.uri);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      queue = [song, ...rest]; idx = 0;
    }
    set({ queue, queueIndex: idx, currentSong: song, isLoading: true });
    addToRecent(song.uri);
    recordPlay(song.uri);
    await get()._load(song.uri);
  },

  _load: async (uri) => {
    try {
      if (soundObject) { await soundObject.unloadAsync(); soundObject = null; }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: get().volume, rate: get().playbackSpeed, shouldCorrectPitch: true },
        (status) => {
          if (!status.isLoaded) return;
          set({ position: status.positionMillis, duration: status.durationMillis || 0 });
          if (status.didJustFinish) {
            get().recordListenTime(uri, status.durationMillis || 0);
            get()._onEnd();
          }
        }
      );
      soundObject = sound;
      set({ isPlaying: true, isLoading: false });
    } catch (e) {
      console.error('_load error', e);
      set({ isLoading: false });
    }
  },

  _onEnd: () => {
    const { repeatMode, queue, queueIndex } = get();
    if (repeatMode === 'one') {
      soundObject?.setPositionAsync(0);
      soundObject?.playAsync();
    } else if (queueIndex < queue.length - 1) {
      get().playNext();
    } else if (repeatMode === 'all') {
      const song = queue[0];
      set({ queueIndex: 0, currentSong: song });
      get().addToRecent(song.uri);
      get()._load(song.uri);
    } else {
      set({ isPlaying: false });
    }
  },

  togglePlayPause: async () => {
    if (!soundObject) return;
    const { isPlaying } = get();
    if (isPlaying) { await soundObject.pauseAsync(); set({ isPlaying: false }); }
    else { await soundObject.playAsync(); set({ isPlaying: true }); }
  },

  playNext: async () => {
    const { queue, queueIndex, repeatMode } = get();
    let next = queueIndex + 1;
    if (next >= queue.length) { if (repeatMode === 'all') next = 0; else return; }
    const song = queue[next];
    set({ queueIndex: next, currentSong: song });
    get().addToRecent(song.uri);
    get().recordPlay(song.uri);
    await get()._load(song.uri);
  },

  playPrevious: async () => {
    const { queue, queueIndex, position } = get();
    if (position > 3000 || queueIndex === 0) { soundObject?.setPositionAsync(0); return; }
    const song = queue[queueIndex - 1];
    set({ queueIndex: queueIndex - 1, currentSong: song });
    get().addToRecent(song.uri);
    await get()._load(song.uri);
  },

  seekTo: async (millis) => {
    if (!soundObject) return;
    await soundObject.setPositionAsync(millis);
    set({ position: millis });
  },

  setVolume: async (vol) => {
    set({ volume: vol });
    if (soundObject) await soundObject.setVolumeAsync(vol);
    get().saveSettings();
  },

  setPlaybackSpeed: async (speed) => {
    set({ playbackSpeed: speed });
    if (soundObject) await soundObject.setRateAsync(speed, true);
    get().saveSettings();
  },

  toggleShuffle: () => { set((s) => ({ shuffle: !s.shuffle })); get().saveSettings(); },

  cycleRepeat: () => {
    const next = get().repeatMode === 'off' ? 'all' : get().repeatMode === 'all' ? 'one' : 'off';
    set({ repeatMode: next });
    get().saveSettings();
  },

  addToQueue: (song) => {
    const { queue, queueIndex } = get();
    set({ queue: [...queue.slice(0, queueIndex + 1), song, ...queue.slice(queueIndex + 1)] });
  },
  removeFromQueue: (index) => {
    const { queue, queueIndex } = get();
    if (index === queueIndex) return;
    const newQueue = queue.filter((_, i) => i !== index);
    set({ queue: newQueue, queueIndex: index < queueIndex ? queueIndex - 1 : queueIndex });
  },
  playFromQueue: async (index) => {
    const { queue } = get();
    const song = queue[index];
    set({ queueIndex: index, currentSong: song });
    get().addToRecent(song.uri);
    await get()._load(song.uri);
  },

  // ── Sleep Timer ───────────────────────────────────────────────
  setSleepTimer: (minutes) => {
    const { sleepTimerInterval } = get();
    if (sleepTimerInterval) clearInterval(sleepTimerInterval);
    if (!minutes) { set({ sleepTimer: null, sleepTimerInterval: null }); return; }
    const endsAt = Date.now() + minutes * 60 * 1000;
    const interval = setInterval(() => {
      if (Date.now() >= endsAt) {
        soundObject?.pauseAsync();
        set({ isPlaying: false, sleepTimer: null, sleepTimerInterval: null });
        clearInterval(interval);
      }
    }, 1000);
    set({ sleepTimer: endsAt, sleepTimerInterval: interval });
  },
  getSleepTimerRemaining: () => {
    const { sleepTimer } = get();
    return sleepTimer ? Math.max(0, sleepTimer - Date.now()) : null;
  },

  setCrossfade: (seconds) => { set({ crossfade: seconds }); get().saveSettings(); },

  // ── Stats ─────────────────────────────────────────────────────
  recordPlay: async (uri) => {
    const { stats } = get();
    const entry = stats[uri] || { playCount: 0, totalListenMs: 0, lastPlayed: null };
    const updated = { ...stats, [uri]: { ...entry, playCount: entry.playCount + 1, lastPlayed: Date.now() } };
    set({ stats: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
  },

  recordListenTime: async (uri, ms) => {
    if (!ms || ms < 5000) return;
    const { stats } = get();
    const entry = stats[uri] || { playCount: 0, totalListenMs: 0, lastPlayed: null };
    const updated = { ...stats, [uri]: { ...entry, totalListenMs: entry.totalListenMs + ms } };
    set({ stats: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
  },

  // ── Mood Tags ─────────────────────────────────────────────────
  setMood: async (uri, mood) => {
    const { moods } = get();
    const updated = mood ? { ...moods, [uri]: mood } : Object.fromEntries(Object.entries(moods).filter(([k]) => k !== uri));
    set({ moods: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.MOODS, JSON.stringify(updated));
  },

  getMood: (uri) => get().moods[uri] || null,
}));
