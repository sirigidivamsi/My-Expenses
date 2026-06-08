import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as z from 'zod';
import { Button } from '../../components/common/Button';
import { TextInput } from '../../components/common/TextInput';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';

// Google SVG Logo Component
const GoogleLogo = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </Svg>
);

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setGuest = useAuthStore((state) => state.setGuest);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

      if (error) throw error;
      
      if (authData?.session) {
        setSession(authData.session);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Authentication Failed', error.message || 'Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Authentication Failed', error.message || 'Google authentication failed.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleGuestMode = () => {
    setGuest(true);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.appName, { color: colors.primary }]}>My Expenses</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Master your money, effortlessly
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Welcome Back</Text>

          <TouchableOpacity
            style={[
              styles.googleBtn,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
            onPress={handleGoogleSignIn}
            disabled={googleSubmitting || submitting}
            activeOpacity={0.8}
          >
            {googleSubmitting ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <View style={styles.googleContent}>
                <GoogleLogo />
                <Text style={[styles.googleText, { color: colors.text }]}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or sign in with email</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>
          
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Email Address"
                placeholder="yourname@domain.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Password"
                placeholder="••••••••"
                isPassword
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Log In"
            onPress={handleSubmit(onSubmit)}
            isLoading={submitting}
            style={styles.actionBtn}
          />
        </View>

        <View style={styles.footerSection}>
          <Button
            title="Start Without Account"
            variant="outline"
            onPress={handleGuestMode}
            style={styles.guestBtn}
          />

          <View style={styles.signupPrompt}>
            <Text style={{ color: colors.textSecondary }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: '500',
  },
  formCard: {
    width: '100%',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  googleBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtn: {
    width: '100%',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  guestBtn: {
    width: '100%',
    marginBottom: 24,
  },
  signupPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
