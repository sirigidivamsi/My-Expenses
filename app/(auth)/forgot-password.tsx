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
} from 'react-native';
import * as z from 'zod';
import { Button } from '../../components/common/Button';
import { TextInput } from '../../components/common/TextInput';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../services/supabase';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotForm) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email.trim(), {
        redirectTo: 'myexpenses://reset-password',
      });

      if (error) throw error;

      Alert.alert(
        'Reset Link Sent 📬',
        'If an account exists with this email, a password reset link has been sent. Please check your inbox.',
        [{ text: 'Back to Login', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Request Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
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
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email to receive recovery instructions.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Registered Email"
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

          <Button
            title="Send Instructions"
            onPress={handleSubmit(onSubmit)}
            isLoading={submitting}
            style={styles.actionBtn}
          />
        </View>

        <View style={styles.footerSection}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Back to Log In</Text>
          </TouchableOpacity>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    width: '100%',
    marginBottom: 24,
  },
  actionBtn: {
    width: '100%',
    marginTop: 10,
  },
  footerSection: {
    alignItems: 'center',
  },
});
