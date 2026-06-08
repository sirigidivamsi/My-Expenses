import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Clean and sanitize env strings in case they contain trailing commas or quotes from local configuration
const cleanEnvVar = (val: string): string => {
  if (!val) return '';
  return val.trim().replace(/^['"]|['"]$/g, '').replace(/,$/, '').trim();
};

const rawUrl = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.supabaseUrl || 
  'https://dxznndkbicavwnhqhnzw.supabase.co';

const rawKey = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4em5uZGtiaWNhdnduaHFobnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDM3OTksImV4cCI6MjA5NTYxOTc5OX0.wGAslFVu01fFUXRMH_Mo6fbdmcOryUZ6KyIHlF8yJRo';

const supabaseUrl = cleanEnvVar(rawUrl);
const supabaseAnonKey = cleanEnvVar(rawKey);

// Secure AsyncStorage adapter for Supabase session persistence
const ExpoStorage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Must be false for React Native
  },
});
