import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCloudSync } from '../hooks/useCloudSync';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/useAuthStore';
import { scheduleDailyReminder } from '../services/notifications';

// Initialize React Query Client
const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, isGuest, isLoading, initializeAuth } = useAuthStore();
  useCloudSync();

  // Run Auth check on launch
  useEffect(() => {
    initializeAuth();
    scheduleDailyReminder();
  }, []);

  // Secure Route Gatekeeper
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !isGuest) {
      // Redirect to login if unauthenticated and not in auth flow
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // Redirect to main app dashboard if authenticated/guest in login screen
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [user, isGuest, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
