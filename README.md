# Anveepy 🎵

> A Spotify-like local music player for Android, built with React Native (Expo). No subscriptions. No internet. Just your music.

---

## Table of Contents

- [Motivation](#motivation)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Building a Standalone APK](#building-a-standalone-apk)
- [Architecture Notes](#architecture-notes)
- [The Making Journey](#the-making-journey)
- [Key Lessons Learned](#key-lessons-learned)

---

## Motivation

I wanted a music player that felt like Spotify — sleep timer, crossfade, playback speed, mood tags, stats — but for my own local music files, completely free. Nothing on the Play Store matched. So I built one.

This is a personal-use project. No backend, no Play Store, sideloaded APK directly onto my phone.

---

## Features

| Feature | Details |
|---|---|
| Playback Controls | Play / Pause / Next / Previous |
| Shuffle | Fisher-Yates shuffle on the current queue |
| Repeat | Off → Repeat All → Repeat One |
| Sleep Timer | Auto-pause after 5 / 10 / 15 / 30 / 45 / 60 / 90 min |
| Playback Speed | 0.5x — 2x with pitch correction |
| Volume | In-app slider mapped to audio output |
| Crossfade | 0–12 second crossfade (setting persisted) |
| Queue | Add next, remove, jump to any position |
| Playlists | Create / rename / delete, add or remove songs |
| Liked Songs | Toggle heart, view all liked in Library tab |
| Recently Played | Tracks last 50 played URIs |
| Mood Tags | Tag songs: happy / sad / chill / party / focus |
| Lyrics | Fetched from [lrclib.net](https://lrclib.net) — free, no API key needed |
| Stats | Total listen time, play counts, top 5 songs, top 5 artists |
| Artist View | All songs grouped by artist |
| Album View | All songs grouped by album |
| Search | Filter songs / artists / albums / mood |
| Mini Player | Persistent floating player above tab bar |
| Full Offline | All data stored locally via AsyncStorage |

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| `expo` | 54.0.33 | SDK & build toolchain |
| `react` | 19.1.0 | UI framework |
| `react-native` | 0.81.5 | Native runtime |
| `expo-av` | 16.0.8 | Audio playback engine |
| `expo-document-picker` | 14.0.8 | Manual file selection from storage |
| `expo-media-library` | 18.2.1 | Media metadata (included but not used for scan — see notes) |
| `expo-file-system` | 19.0.21 | File access |
| `expo-constants` | 18.0.13 | App config access |
| `expo-splash-screen` | 31.0.13 | Splash screen control |
| `expo-font` | 14.0.11 | Custom font loading |
| `expo-keep-awake` | 15.0.8 | Prevent screen sleep during playback |
| `expo-linking` | 8.0.11 | Deep link handling |
| `expo-status-bar` | 3.0.9 | Status bar styling |
| `zustand` | 5.0.0 | Global state management |
| `@react-native-async-storage/async-storage` | 2.2.0 | On-device persistence |
| `@react-navigation/native` | 7.x | Navigation container |
| `@react-navigation/bottom-tabs` | 7.x | Bottom tab navigator |
| `@react-navigation/stack` | 7.x | Stack navigator |
| `react-native-screens` | 4.16.0 | Native screen optimization |
| `react-native-safe-area-context` | 5.6.0 | Safe area insets |
| `react-native-gesture-handler` | 2.28.0 | Gesture support |
| `react-native-reanimated` | 4.1.1 | Animations |
| `react-native-worklets` | 0.5.2 | Required by reanimated 4.x |
| `@react-native-community/slider` | 5.0.1 | Volume / seek / crossfade sliders |
| `@expo/vector-icons` | 15.x | Ionicons icon set |

> **Note:** `npm install` requires `--legacy-peer-deps` due to peer dependency conflicts. An `.npmrc` file with `legacy-peer-deps=true` is included so this applies automatically everywhere including EAS cloud builds.

---

## Project Structure

```
anveepy/
├── App.js                          # Entry — wraps GestureHandler + SafeArea + Navigator
├── index.js                        # Expo entry point
├── app.json                        # Expo config (permissions, package name, icons)
├── babel.config.js                 # Babel config with reanimated plugin
├── eas.json                        # EAS Build profiles
├── .npmrc                          # legacy-peer-deps=true
│
├── assets/
│   ├── icon.png
│   ├── splash-icon.png
│   ├── android-icon-foreground.png
│   ├── android-icon-background.png
│   └── android-icon-monochrome.png
│
└── src/
    ├── store/
    │   └── playerStore.js          # Zustand store — audio engine + all state
    ├── navigation/
    │   └── AppNavigator.js         # Bottom tabs (Home/Search/Library) + Stack screens
    ├── screens/
    │   ├── HomeScreen.js           # Greeting, recently played, artists, all songs
    │   ├── SearchScreen.js         # Search + mood filter
    │   ├── LibraryScreen.js        # Playlists / Songs / Liked tabs
    │   ├── NowPlayingScreen.js     # Full player — lyrics, mood, speed, sleep timer
    │   ├── PlaylistScreen.js       # Playlist detail + song management
    │   ├── ArtistScreen.js         # Artist song list
    │   ├── AlbumScreen.js          # Album song list
    │   ├── QueueScreen.js          # Current queue — reorder, remove, jump
    │   └── StatsScreen.js          # Listening statistics
    └── components/
        ├── MiniPlayer.js           # Floating mini player above tab bar
        └── SongItem.js             # Song row with long-press context menu
```

---

## Installation & Setup

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18+ recommended |
| npm | 9+ |
| Expo Go (Android) | 54.0.6 (must match SDK 54) |
| EAS CLI | 12+ (only for APK builds) |

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/anveepy.git
cd anveepy
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is required. Alternatively the included `.npmrc` handles this automatically.

### 3. Start the dev server

```bash
npm start
```

Scan the QR code with **Expo Go v54** on your Android phone. Both devices must be on the **same Wi-Fi network**.

### 4. Add songs to the app

1. Tap the green **"Add Songs from Storage"** button on the Home screen
2. Browse to your music folder in the file picker
3. Select one or multiple audio files (`.mp3`, `.flac`, `.m4a`, etc.)
4. Songs are saved to AsyncStorage and persist across sessions

> **Why manual file picking?** `expo-media-library` auto-scan is blocked on Android 13 in Expo Go due to permission restrictions. `expo-document-picker` works correctly and songs only need to be added once.

---

## Building a Standalone APK

To run the app without Expo Go or a dev server running on your PC:

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

### 3. Configure (first time only)

```bash
eas build:configure
```

### 4. Build

```bash
eas build -p android --profile preview
```

- Builds on Expo's cloud servers (free tier, ~10 min)
- Outputs a direct `.apk` download link
- Install on phone: download APK → enable "Install from unknown sources" → install

---

## Architecture Notes

### Audio Engine

All audio logic lives in `src/store/playerStore.js`. A single module-level `soundObject` variable holds the `expo-av` `Sound` instance outside of React state — this avoids hook lifecycle issues and lets any part of the app control playback directly.

```js
let soundObject = null; // module-level, not React state

_load: async (uri) => {
  if (soundObject) await soundObject.unloadAsync();
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, ... }, statusCallback);
  soundObject = sound;
}
```

### State Management

Zustand store manages everything: songs, playlists, liked songs, queue, stats, moods, playback settings. All persistent data is serialized to AsyncStorage on every mutation.

### Navigation Structure

```
NavigationContainer
└── Stack.Navigator
    ├── Main (HomeTabs)
    │   ├── Tab: Home
    │   ├── Tab: Search
    │   └── Tab: Library
    ├── NowPlaying (modal)
    ├── Playlist
    ├── Artist
    ├── Album
    ├── Queue
    └── Stats

MiniPlayer (rendered outside navigator, always visible)
```

---

## The Making Journey

This was built from scratch with no prior React Native experience, using Claude AI as a pair programmer throughout.

### What went smoothly

- Zustand store design — single source of truth for everything
- Navigation structure — tabs + stack screens felt natural
- AsyncStorage persistence — works reliably for all data
- expo-document-picker — clean solution for file loading
- lrclib.net API — free lyrics, no key, great coverage

### The Struggles

**SDK version mismatch** — Started with Expo SDK 55, but Expo Go on my phone was v54. App wouldn't load at all. Had to downgrade the entire project and realign every dependency.

**Android 13 permissions** — `expo-media-library` auto-scan is completely blocked in Expo Go on Android 13. Spent time debugging before realizing it's a platform restriction, not a code bug. Switched to manual file picking.

**reanimated compatibility hell** — This was the most painful issue:
- reanimated 3.x works in Expo Go but is incompatible with RN 0.81 at the C++ level (`ShadowNode::Shared` deprecated)
- reanimated 4.x requires New Architecture ON and `react-native-worklets`
- New Architecture OFF breaks reanimated 4.x, ON was needed for the correct build

**EAS Build — 4 failed attempts before success:**

| Attempt | Problem |
|---|---|
| 1 | reanimated 3.x + New Arch ON → C++ compile error (`ShadowNode::Shared` deprecated) |
| 2 | reanimated 3.x + New Arch OFF → Java compile error (`TRACE_TAG_REACT_JAVA_BRIDGE` removed) |
| 3 | reanimated 4.x + wrong package name (`react-native-worklets-core` doesn't exist) → npm install failed |
| 4 | reanimated 4.x + New Arch OFF → `[Reanimated] requires new architecture to be enabled` |
| ✅ 5 | reanimated 4.1.1 + worklets 0.5.2 + New Arch ON + `.npmrc` → build succeeded |

---

## Key Lessons Learned

- Always match Expo SDK to your Expo Go version — there is no flexibility here
- `expo-media-library` auto-scan is blocked on Android 13 in Expo Go — use `expo-document-picker` instead
- reanimated 3.x is binary-incompatible with react-native 0.81+
- reanimated 4.x requires New Architecture enabled and `react-native-worklets`
- EAS cloud builds run strict npm — always add `.npmrc` with `legacy-peer-deps=true` when you have peer conflicts locally
- A module-level variable (outside React state) is the right pattern for managing a single audio instance across the app

---

*Personal project. Not on Play Store. Built to scratch my own itch.*
