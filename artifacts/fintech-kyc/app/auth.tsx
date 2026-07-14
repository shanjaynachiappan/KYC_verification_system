import React, { useRef, useState } from 'react';
import {
  Animated,
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
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import PrimaryButton from '@/components/PrimaryButton';
import InputField from '@/components/InputField';
import { mockSignIn, mockSignUp } from '@/services/mockApi';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameErr, setUsernameErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalErr, setGlobalErr] = useState('');

  const passwordRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    Haptics.selectionAsync();
    setMode(m);
    setUsernameErr('');
    setPasswordErr('');
    setGlobalErr('');
    Animated.spring(slideAnim, {
      toValue: m === 'signup' ? 1 : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  };

  const validate = () => {
    let valid = true;
    setUsernameErr('');
    setPasswordErr('');
    setGlobalErr('');
    if (!username.trim()) {
      setUsernameErr('Username is required.');
      valid = false;
    }
    if (!password) {
      setPasswordErr('Password is required.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordErr('At least 6 characters required.');
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      const fn = mode === 'signin' ? mockSignIn : mockSignUp;
      const res = await fn({ username, password });
      if (!res.success) {
        setGlobalErr(res.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/identity');
      }
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.text} />
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

        {/* Toggle */}
        <View style={[styles.toggleWrap, { backgroundColor: colors.muted }]}>
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.toggleBtn,
                mode === m && { backgroundColor: colors.background, shadowColor: colors.shadow },
                mode === m && styles.toggleActive,
              ]}
              onPress={() => switchMode(m)}
            >
              <Text
                style={[
                  styles.toggleLabel,
                  { color: mode === m ? colors.text : colors.mutedForeground },
                ]}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChangeText={(t) => { setUsername(t); setUsernameErr(''); }}
            error={usernameErr}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <InputField
            ref={passwordRef}
            label="Password"
            placeholder="Enter your password"
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
            <View style={[styles.globalErrBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.globalErrText, { color: colors.destructive }]}>{globalErr}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PrimaryButton
            label={mode === 'signin' ? 'Sign In' : 'Create Account'}
            onPress={handleSubmit}
            loading={loading}
          />
          <PrimaryButton
            label="Continue as Guest"
            onPress={() => router.push('/identity')}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navBar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  titleWrap: {
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  toggleWrap: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  toggleActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  form: {
    marginBottom: 8,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -6,
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  globalErrBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  globalErrText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  actions: {
    gap: 10,
    marginTop: 16,
  },
});
