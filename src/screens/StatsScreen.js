import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';

const COLORS = { bg: '#121212', surface: '#1E1E1E', green: '#1DB954', text: '#FFF', muted: '#B3B3B3', card: '#282828' };

function fmtMs(ms) {
  if (!ms) return '0 min';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export default function StatsScreen({ navigation }) {
  const { songs, stats, likedSongs } = usePlayerStore();

  const computed = useMemo(() => {
    const entries = Object.entries(stats);
    if (entries.length === 0) return null;

    const totalListenMs = entries.reduce((sum, [, v]) => sum + (v.totalListenMs || 0), 0);
    const totalPlays = entries.reduce((sum, [, v]) => sum + (v.playCount || 0), 0);

    // Top 5 most played songs
    const topSongs = entries
      .sort((a, b) => (b[1].playCount || 0) - (a[1].playCount || 0))
      .slice(0, 5)
      .map(([uri, v]) => ({ song: songs.find((s) => s.uri === uri), ...v }))
      .filter((x) => x.song);

    // Top artists by listen time
    const artistTime = {};
    entries.forEach(([uri, v]) => {
      const song = songs.find((s) => s.uri === uri);
      if (!song) return;
      artistTime[song.artist] = (artistTime[song.artist] || 0) + (v.totalListenMs || 0);
    });
    const topArtists = Object.entries(artistTime)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Most loyal song (highest play count)
    const loyalEntry = entries.sort((a, b) => (b[1].playCount || 0) - (a[1].playCount || 0))[0];
    const loyalSongData = loyalEntry
      ? { song: songs.find((s) => s.uri === loyalEntry[0]), ...loyalEntry[1] }
      : null;

    // Fun insight based on total listen time
    const hours = totalListenMs / 3600000;
    const insight =
      hours < 1
        ? "You're just getting started. Keep listening!"
        : hours < 5
        ? `You've spent ${fmtMs(totalListenMs)} with your music so far. Nice start!`
        : hours < 20
        ? `${fmtMs(totalListenMs)} of music — you're building a solid listening habit!`
        : `Wow! ${fmtMs(totalListenMs)} of music. You're a true music lover! 🎧`;

    return { totalListenMs, totalPlays, topSongs, topArtists, loyalSongData, insight };
  }, [stats, songs]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.title}>Your Stats</Text>
      </View>

      {!computed ? (
        <View style={s.empty}>
          <Ionicons name="bar-chart-outline" size={64} color={COLORS.muted} />
          <Text style={s.emptyTitle}>No stats yet</Text>
          <Text style={s.emptySub}>Start listening to see your insights</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Overview Cards */}
          <View style={s.cardRow}>
            <View style={s.card}>
              <Ionicons name="time-outline" size={24} color={COLORS.green} />
              <Text style={s.cardValue}>{fmtMs(computed.totalListenMs)}</Text>
              <Text style={s.cardLabel}>Total Listen Time</Text>
            </View>
            <View style={s.card}>
              <Ionicons name="play-circle-outline" size={24} color={COLORS.green} />
              <Text style={s.cardValue}>{computed.totalPlays}</Text>
              <Text style={s.cardLabel}>Total Plays</Text>
            </View>
          </View>

          <View style={s.cardRow}>
            <View style={s.card}>
              <Ionicons name="heart-outline" size={24} color={COLORS.green} />
              <Text style={s.cardValue}>{likedSongs.length}</Text>
              <Text style={s.cardLabel}>Liked Songs</Text>
            </View>
            <View style={s.card}>
              <Ionicons name="musical-notes-outline" size={24} color={COLORS.green} />
              <Text style={s.cardValue}>{songs.length}</Text>
              <Text style={s.cardLabel}>Songs in Library</Text>
            </View>
          </View>

          {/* Fun Insight */}
          <View style={s.insightBox}>
            <Text style={s.insightEmoji}>🎧</Text>
            <Text style={s.insightText}>{computed.insight}</Text>
          </View>

          {/* Most Loyal Song */}
          {computed.loyalSongData?.song && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Most Loyal Song</Text>
              <View style={s.loyalCard}>
                <View style={s.loyalArt}>
                  <Ionicons name="heart" size={24} color={COLORS.green} />
                </View>
                <View style={s.loyalInfo}>
                  <Text style={s.loyalTitle} numberOfLines={1}>{computed.loyalSongData.song.title}</Text>
                  <Text style={s.loyalArtist}>{computed.loyalSongData.song.artist}</Text>
                  <Text style={s.loyalStat}>Played {computed.loyalSongData.playCount}x</Text>
                </View>
              </View>
            </View>
          )}

          {/* Top Songs */}
          {computed.topSongs.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Most Played Songs</Text>
              {computed.topSongs.map((item, i) => (
                <View key={item.song.uri} style={s.rankRow}>
                  <Text style={s.rank}>#{i + 1}</Text>
                  <View style={s.rankInfo}>
                    <Text style={s.rankTitle} numberOfLines={1}>{item.song.title}</Text>
                    <Text style={s.rankSub}>{item.song.artist}</Text>
                  </View>
                  <View style={s.rankStats}>
                    <Text style={s.rankStat}>{item.playCount} plays</Text>
                    <Text style={s.rankTime}>{fmtMs(item.totalListenMs)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Top Artists */}
          {computed.topArtists.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Top Artists by Time</Text>
              {computed.topArtists.map(([artist, ms], i) => (
                <View key={artist} style={s.rankRow}>
                  <Text style={s.rank}>#{i + 1}</Text>
                  <View style={s.rankInfo}>
                    <Text style={s.rankTitle} numberOfLines={1}>{artist}</Text>
                  </View>
                  <Text style={s.rankStat}>{fmtMs(ms)}</Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  emptySub: { color: COLORS.muted, fontSize: 14, marginTop: 8 },
  cardRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 12 },
  card: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 16, alignItems: 'center', gap: 6 },
  cardValue: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
  cardLabel: { color: COLORS.muted, fontSize: 12, textAlign: 'center' },
  insightBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 14, gap: 10 },
  insightEmoji: { fontSize: 22 },
  insightText: { flex: 1, color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  loyalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, padding: 14 },
  loyalArt: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  loyalInfo: { flex: 1 },
  loyalTitle: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  loyalArtist: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  loyalStat: { color: COLORS.green, fontSize: 12, marginTop: 4 },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  rank: { color: COLORS.green, fontWeight: 'bold', fontSize: 15, width: 30 },
  rankInfo: { flex: 1, marginHorizontal: 8 },
  rankTitle: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  rankSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  rankStats: { alignItems: 'flex-end' },
  rankStat: { color: COLORS.muted, fontSize: 12 },
  rankTime: { color: COLORS.green, fontSize: 11, marginTop: 2 },
});
