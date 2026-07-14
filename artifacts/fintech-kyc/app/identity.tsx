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
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import PrimaryButton from '@/components/PrimaryButton';
import InputField from '@/components/InputField';
import { postIdentity } from '@/services/mockApi';

export default function IdentityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaarErr, setAadhaarErr] = useState('');
  const [panErr, setPanErr] = useState('');
  const [loading, setLoading] = useState(false);

  const panRef = useRef<TextInput>(null);

  const formatAadhaar = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 12);
    return clean.replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(' ')
    );
  };

  const validate = () => {
    let valid = true;
    setAadhaarErr('');
    setPanErr('');
    const rawAadhaar = aadhaar.replace(/\s/g, '');
    if (!/^\d{12}$/.test(rawAadhaar)) {
      setAadhaarErr('Enter a valid 12-digit Aadhaar number.');
      valid = false;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      setPanErr('Enter a valid PAN (e.g. ABCDE1234F).');
      valid = false;
    }
    return valid;
  };

  const handleContinue = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      const res = await postIdentity({ aadhaarNumber: aadhaar, panNumber: pan.toUpperCase() });
      if (!res.success) {
        if (res.message.toLowerCase().includes('aadhaar')) setAadhaarErr(res.message);
        else setPanErr(res.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/processing');
      }
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const progress = 2 / 3;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 2 of 3</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Feather name="shield" size={28} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Identity Verification</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your Aadhaar and PAN details are used solely for KYC verification and stored securely.
        </Text>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.primaryLight, borderColor: colors.accent }]}>
          <Feather name="lock" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Data is encrypted with 256-bit SSL and never shared with third parties.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField
            label="Aadhaar Number"
            placeholder="XXXX XXXX XXXX"
            value={aadhaar}
            onChangeText={(t) => { setAadhaar(formatAadhaar(t)); setAadhaarErr(''); }}
            error={aadhaarErr}
            keyboardType="numeric"
            maxLength={14}
            returnKeyType="next"
            onSubmitEditing={() => panRef.current?.focus()}
            hint="12-digit number on your Aadhaar card"
          />
          <InputField
            ref={panRef}
            label="PAN Number"
            placeholder="ABCDE1234F"
            value={pan}
            onChangeText={(t) => { setPan(t.toUpperCase()); setPanErr(''); }}
            error={panErr}
            autoCapitalize="characters"
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            hint="10-character alphanumeric PAN"
          />
        </View>

        <PrimaryButton
          label="Continue to Verification"
          onPress={handleContinue}
          loading={loading}
        />

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          By proceeding, you consent to verification as per applicable KYC regulations.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  progressTrack: {
    height: 3,
    marginHorizontal: 0,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  form: {
    marginBottom: 8,
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 12,
  },
});
