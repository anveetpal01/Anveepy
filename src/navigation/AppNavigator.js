import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import LibraryScreen from '../screens/LibraryScreen';
import NowPlayingScreen from '../screens/NowPlayingScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import ArtistScreen from '../screens/ArtistScreen';
import AlbumScreen from '../screens/AlbumScreen';
import QueueScreen from '../screens/QueueScreen';
import StatsScreen from '../screens/StatsScreen';
import MiniPlayer from '../components/MiniPlayer';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const COLORS = {
  bg: '#121212',
  surface: '#1E1E1E',
  green: '#1DB954',
  text: '#FFFFFF',
  muted: '#B3B3B3',
};

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopColor: '#282828', height: 60 },
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Search: focused ? 'search' : 'search-outline',
            Library: focused ? 'library' : 'library-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: 'bold' },
          cardStyle: { backgroundColor: COLORS.bg },
        }}
      >
        <Stack.Screen name="Main" component={HomeTabs} options={{ headerShown: false }} />
        <Stack.Screen name="NowPlaying" component={NowPlayingScreen} options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="Playlist" component={PlaylistScreen} options={{ title: '' }} />
        <Stack.Screen name="Artist" component={ArtistScreen} options={{ title: '' }} />
        <Stack.Screen name="Album" component={AlbumScreen} options={{ title: '' }} />
        <Stack.Screen name="Queue" component={QueueScreen} options={{ title: 'Queue' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
      <MiniPlayer />
    </NavigationContainer>
  );
}
