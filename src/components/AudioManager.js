import React, { useEffect } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { usePlayerStore } from '../store/playerStore';

export default function AudioManager() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const { setPlayerRef, updatePosition, handleSongEnd, isPlaying } = usePlayerStore();

  useEffect(() => {
    setPlayerRef(player);
    return () => setPlayerRef(null);
  }, [player]);

  useEffect(() => {
    if (!status) return;
    updatePosition(status.currentTime ?? 0, status.duration ?? 0);
    if (status.didJustFinish) {
      handleSongEnd();
    }
  }, [status]);

  return null;
}
