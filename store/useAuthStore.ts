import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../services/supabase';
import { User, UserPreferences } from '../types';

WebBrowser.maybeCompleteAuthSession();

let isLinkingSetup = false;

interface AuthState {
  user: User | null;
  session: any | null;
  isGuest: boolean;
  preferences: UserPreferences;
  isLoading: boolean;
  setSession: (session: any) => void;
  setGuest: (isGuest: boolean) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setUserProfile: (profile: User) => void;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  handleRedirectUrl: (url: string) => Promise<void>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  user_id: 'guest',
  theme: 'system',
  currency: 'INR',
  notifications_enabled: true,
  recurring_reminders: true,
  budget_alerts: true,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isGuest: false,
      preferences: DEFAULT_PREFERENCES,
      isLoading: true,

      setSession: (session) => {
        if (!session) {
          set({ session: null, user: null, isGuest: false });
        } else {
          const provider = session.user.app_metadata?.provider || 'email';
          const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'Valued User';
          const fullName = session.user.user_metadata?.full_name || name;
          
          const userProfile: User = {
            id: session.user.id,
            name,
            full_name: fullName,
            email: session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url,
            auth_provider: provider === 'google' ? 'google' : 'email',
          };

          set({
            session,
            user: userProfile,
            isGuest: false,
          });

          // Proactively check and ensure user profile exists in database
          supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single()
            .then(({ data: existingUser }) => {
              if (!existingUser) {
                console.log('User profile missing in database on setSession, creating...');
                supabase
                  .from('users')
                  .insert({
                    id: session.user.id,
                    name: userProfile.name,
                    full_name: userProfile.full_name,
                    email: userProfile.email,
                    avatar_url: userProfile.avatar_url,
                    auth_provider: userProfile.auth_provider,
                  })
                  .then(({ error }) => {
                    if (error) console.error('Failed to insert user profile on setSession:', error);
                  });
              }
            });

          // Proactively check and ensure user preferences exist in database
          supabase
            .from('user_preferences')
            .select('user_id')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data: existingPrefs }) => {
              if (!existingPrefs) {
                console.log('User preferences missing in database on setSession, creating...');
                supabase
                  .from('user_preferences')
                  .insert({
                    user_id: session.user.id,
                    theme: 'system',
                    currency: 'INR',
                    notifications_enabled: true,
                    recurring_reminders: true,
                    budget_alerts: true,
                  })
                  .then(({ error }) => {
                    if (error) console.error('Failed to insert user preferences on setSession:', error);
                  });
              }
            });
        }
      },

      setGuest: (isGuest) => {
        set({
          isGuest,
          user: isGuest ? { id: 'guest', name: 'Guest User' } : null,
          session: null,
          preferences: isGuest
            ? { ...DEFAULT_PREFERENCES, user_id: 'guest' }
            : get().preferences,
        });
      },

      updatePreferences: async (prefs) => {
        const currentPrefs = get().preferences;
        const newPrefs = { ...currentPrefs, ...prefs };
        set({ preferences: newPrefs });

        // If logged in, update remote database
        const { user } = get();
        if (user && user.id !== 'guest') {
          try {
            await supabase
              .from('user_preferences')
              .upsert({
                user_id: user.id,
                ...prefs,
                updated_at: new Date().toISOString(),
              });
          } catch (e) {
            console.error('Failed to update remote user preferences', e);
          }
        }
      },

      setUserProfile: (profile) => {
        set({ user: profile });
      },

      signOut: async () => {
        set({ isLoading: true });
        const { isGuest } = get();
        if (!isGuest) {
          await supabase.auth.signOut();
        }
        set({
          user: null,
          session: null,
          isGuest: false,
          preferences: DEFAULT_PREFERENCES,
          isLoading: false,
        });
      },

      signInWithGoogle: async () => {
        set({ isLoading: true });
        try {
          const redirectUrl = Linking.createURL('/');
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl,
              skipBrowserRedirect: true,
            },
          });

          if (error) throw error;

          if (data?.url) {
            const result = await WebBrowser.openAuthSessionAsync(
              data.url,
              redirectUrl
            );

            if (result.type === 'success' && result.url) {
              await get().handleRedirectUrl(result.url);
            }
          }
        } catch (error: any) {
          console.error('Google OAuth sign in failure:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      handleRedirectUrl: async (url: string) => {
        if (!url) return;

        // Parse access_token and refresh_token from the redirected hash fragment
        const params: Record<string, string> = {};
        const separator = url.includes('#') ? '#' : '?';
        const parts = url.split(separator);
        const queryString = parts[1];

        if (queryString) {
          const pairs = queryString.split('&');
          for (const pair of pairs) {
            const [key, val] = pair.split('=');
            if (key && val) {
              params[decodeURIComponent(key)] = decodeURIComponent(val);
            }
          }
        }

        const { access_token, refresh_token } = params;

        if (access_token && refresh_token) {
          set({ isLoading: true });
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (error) throw error;

            if (data?.session) {
              get().setSession(data.session);
            }
          } catch (e) {
            console.error('Failed to restore session via deep link:', e);
          } finally {
            set({ isLoading: false });
          }
        }
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          // Set up linking listener once
          if (!isLinkingSetup) {
            isLinkingSetup = true;
            Linking.addEventListener('url', async (event) => {
              if (event.url) {
                await get().handleRedirectUrl(event.url);
              }
            });

            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
              await get().handleRedirectUrl(initialUrl);
            }
          }

          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            const session = data.session;
            set({ session });

            // Fetch user profile and preferences from database
            const [profileRes, prefsRes] = await Promise.all([
              supabase.from('users').select('*').eq('id', session.user.id).single(),
              supabase.from('user_preferences').select('*').eq('user_id', session.user.id).single(),
            ]);

            const provider = session.user.app_metadata?.provider || 'email';
            const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'Valued User';
            const fullName = session.user.user_metadata?.full_name || name;

            const userProfile: User = profileRes.data
              ? {
                  id: profileRes.data.id,
                  name: profileRes.data.name,
                  full_name: profileRes.data.full_name || profileRes.data.name,
                  email: profileRes.data.email,
                  avatar_url: profileRes.data.avatar_url,
                  auth_provider: profileRes.data.auth_provider || 'email',
                }
              : {
                  id: session.user.id,
                  name,
                  full_name: fullName,
                  email: session.user.email,
                  avatar_url: session.user.user_metadata?.avatar_url,
                  auth_provider: provider === 'google' ? 'google' : 'email',
                };

            const userPrefs: UserPreferences = prefsRes.data
              ? {
                  user_id: prefsRes.data.user_id,
                  theme: prefsRes.data.theme,
                  currency: prefsRes.data.currency,
                  notifications_enabled: prefsRes.data.notifications_enabled,
                  recurring_reminders: prefsRes.data.recurring_reminders,
                  budget_alerts: prefsRes.data.budget_alerts,
                }
              : {
                  ...DEFAULT_PREFERENCES,
                  user_id: session.user.id,
                };

            // Ensure profile exists in database if auth trigger didn't run
            if (!profileRes.data) {
              console.log('User profile missing in database on initializeAuth, creating...');
              const { error } = await supabase.from('users').insert({
                id: session.user.id,
                name: userProfile.name,
                full_name: userProfile.full_name,
                email: userProfile.email,
                avatar_url: userProfile.avatar_url,
                auth_provider: userProfile.auth_provider,
              });
              if (error) console.error('Failed to insert user profile on initializeAuth:', error);
            }

            // Ensure preferences exist in database if auth trigger didn't run
            if (!prefsRes.data) {
              console.log('User preferences missing in database on initializeAuth, creating...');
              const { error } = await supabase.from('user_preferences').insert({
                user_id: session.user.id,
                theme: userPrefs.theme,
                currency: userPrefs.currency,
                notifications_enabled: userPrefs.notifications_enabled,
                recurring_reminders: userPrefs.recurring_reminders,
                budget_alerts: userPrefs.budget_alerts,
              });
              if (error) console.error('Failed to insert user preferences on initializeAuth:', error);
            }

            set({
              user: userProfile,
              preferences: userPrefs,
              isGuest: false,
            });
          } else {
            // Keep existing state (e.g. if already marked as guest)
            const state = get();
            if (!state.isGuest) {
              set({ user: null, session: null, isGuest: false });
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'my-expenses-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isGuest: state.isGuest,
        preferences: state.preferences,
        user: state.user,
      }),
    }
  )
);
export type { AuthState };
