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
import * as WebBrowser from 'expo-web-browser';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/contexts/AppContext';
import PrimaryButton from '@/components/PrimaryButton';
import InputField from '@/components/InputField';
import {
  verifyPan,
  initDigilocker,
  waitForDigilockerConsent,
  fetchAadhaar,
} from '@/services/apiClient';

type Stage = 'form' | 'awaiting_consent' | 'verifying';

export default function IdentityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useApp();

  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaarErr, setAadhaarErr] = useState('');
  const [panErr, setPanErr] = useState('');
  const [globalErr, setGlobalErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>('form');

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
    setGlobalErr('');
    const rawAadhaar = aadhaar.replace(/\s/g, '');
    if (!/^\d{12}$/.test(rawAadhaar)) { setAadhaarErr('Enter a valid 12-digit Aadhaar number.'); valid = false; }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) { setPanErr('Enter a valid PAN (e.g. ABCDE1234F).'); valid = false; }
    return valid;
  };

  const handleContinue = async () => {
    if (!validate()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }

    if (!user?.userId) {
      setGlobalErr('No verification session found. Please sign out and sign up again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      // Step 1: PAN -- this one DOES accept a typed number, verified for real
      // against Setu/NSDL sandbox.
      const panResult = await verifyPan(user.userId, pan.toUpperCase());
      if (!panResult.valid) {
        setPanErr(panResult.message || 'PAN verification failed.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      await updateUser({ pan: pan.toUpperCase(), panName: panResult.full_name ?? undefined });

      // Step 2: Aadhaar -- CANNOT be verified from a typed number. The only
      // real path is DigiLocker consent (see backend app/ekyc.py). The
      // 12-digit field above is kept for format validation / familiar UX,
      // but the actual proof of identity comes from this consent flow, not
      // from the digits themselves.
      setStage('awaiting_consent');
      const { request_id, redirect_url } = await initDigilocker(user.userId);

      await WebBrowser.openBrowserAsync(redirect_url);
      // openBrowserAsync resolves once the user closes/returns from the
      // in-app browser -- at that point we check whether consent actually
      // went through.

      setStage('verifying');
      await waitForDigilockerConsent(request_id, { maxAttempts: 5, intervalMs: 2000 });
      const aadhaarData = await fetchAadhaar(request_id);

      await updateUser({
        aadhaar: aadhaarData.id_number_masked ?? aadhaar,
        aadhaarName: aadhaarData.name ?? undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/processing');
    } catch (e) {
      setGlobalErr(e instanceof Error ? e.message : 'Verification failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStage('form');
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 2 of 3</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '66%' }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Identity Verification</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {stage === 'form'
            ? 'Your Aadhaar and PAN details are used solely for KYC verification and stored securely.'
            : stage === 'awaiting_consent'
            ? 'Complete the DigiLocker consent in the browser, then return to the app.'
            : 'Confirming your DigiLocker consent and fetching your Aadhaar record...'}
        </Text>

        <View style={[styles.infoCard, { backgroundColor: colors.primaryLight, borderColor: colors.accent }]}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            PAN is verified instantly. Aadhaar is verified via a secure DigiLocker
            consent -- your Aadhaar number itself is never transmitted or stored in plaintext.
          </Text>
        </View>

        {stage === 'form' && (
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
              hint="12-digit number on your Aadhaar card -- used for format validation only; verification itself happens via DigiLocker consent in the next step"
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
        )}

        {globalErr ? (
          <View style={[styles.errBox, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.destructive} />
            <Text style={[styles.errText, { color: colors.destructive }]}>{globalErr}</Text>
          </View>
        ) : null}

        {stage === 'form' && (
          <PrimaryButton label="Continue to Verification" onPress={handleContinue} loading={loading} />
        )}
        {stage !== 'form' && (
          <PrimaryButton label="Waiting for DigiLocker..." onPress={() => {}} loading disabled />
        )}
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          By proceeding, you consent to verification as per applicable KYC regulations.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  progressTrack: { height: 3 },
  progressFill: { height: 3, borderRadius: 2 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24 },
  iconCircle: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.7, marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, marginBottom: 16 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 24 },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  form: { marginBottom: 8 },
  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16 },
  errText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  disclaimer: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 17, marginTop: 12 },
});
