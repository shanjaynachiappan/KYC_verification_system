import React, { useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/contexts/AppContext';
import PrimaryButton from '@/components/PrimaryButton';
import InputField from '@/components/InputField';
import { mockSignIn, mockSignUp } from '@/services/mockApi';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp, signIn, isSignedUp } = useApp();

  const [mode, setMode] = useState<Mode>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameErr, setUsernameErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [globalErr, setGlobalErr] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    // Guard: can't switch to sign-in without an account
    if (m === 'signin' && !isSignedUp) {
      setGlobalErr('Please create an account first before signing in.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setMode(m);
    setUsernameErr('');
    setPasswordErr('');
    setGlobalErr('');
  };

  const validate = () => {
    let valid = true;
    setUsernameErr('');
    setPasswordErr('');
    setGlobalErr('');
    if (!username.trim()) { setUsernameErr('Username is required.'); valid = false; }
    if (!password) { setPasswordErr('Password is required.'); valid = false; }
    else if (password.length < 6) { setPasswordErr('At least 6 characters.'); valid = false; }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (mode === 'signin' && !isSignedUp) {
      setGlobalErr('No account found. Please sign up first.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await mockSignUp({ username, password });
        if (!res.success) {
          setGlobalErr(res.message);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        await signUp({ username });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/identity');
      } else {
        const res = await mockSignIn({ username, password });
        if (!res.success) {
          setGlobalErr(res.message);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        const ok = await signIn(username);
        if (!ok) {
          setGlobalErr('Username does not match your registered account.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.text }]}>
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {mode === 'signin'
              ? 'Sign in to continue your verification'
              : 'Register to start your KYC journey'}
          </Text>
        </View>

        {/* Mode toggle */}
        <View style={[styles.toggleWrap, { backgroundColor: colors.muted }]}>
          {(['signup', 'signin'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.toggleBtn,
                mode === m && [styles.toggleActive, { backgroundColor: colors.background }],
              ]}
              onPress={() => switchMode(m)}
            >
              <Text style={[styles.toggleLabel, { color: mode === m ? colors.text : colors.mutedForeground }]}>
                {m === 'signup' ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lock notice for sign-in without account */}
        {mode === 'signin' && !isSignedUp && (
          <View style={[styles.lockNotice, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={15} color={colors.mutedForeground} />
            <Text style={[styles.lockText, { color: colors.mutedForeground }]}>
              You need to create an account before signing in.
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <InputField
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChangeText={(t) => { setUsername(t); setUsernameErr(''); }}
            error={usernameErr}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <InputField
            ref={passwordRef}
            label="Password"
            placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Enter your password'}
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordErr(''); }}
            error={passwordErr}
            isPassword
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          {mode === 'signin' && (
            <TouchableOpacity style={styles.forgotRow}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>
          )}
          {globalErr ? (
            <View style={[styles.errBox, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.destructive} />
              <Text style={[styles.errText, { color: colors.destructive }]}>{globalErr}</Text>
            </View>
          ) : null}
        </View>

        {/* CTA */}
        <PrimaryButton
          label={mode === 'signup' ? 'Create Account' : 'Sign In'}
          onPress={handleSubmit}
          loading={loading}
          disabled={mode === 'signin' && !isSignedUp}
        />
        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          By continuing you agree to our{' '}
          <Text style={{ color: colors.primary }}>Terms</Text> &{' '}
          <Text style={{ color: colors.primary }}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: { paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
  titleWrap: { marginBottom: 28 },
  title: { fontSize: 30, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  toggleWrap: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  toggleActive: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  toggleLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  lockNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16 },
  lockText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  form: { marginBottom: 8 },
  forgotRow: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 16 },
  forgotText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  errText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  legal: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: 14 },
});
