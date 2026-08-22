import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/contexts/AppContext';
import PrimaryButton from '@/components/PrimaryButton';

export default function LandingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme, toggleTheme, isSignedIn, isSignedUp, user, signOut } = useApp();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 4 }),
    ]).start();
  }, []);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // ── Authenticated dashboard ──────────────────────────────────────────
  if (isSignedIn && user) {
    const initials = user.username.slice(0, 2).toUpperCase();
    const kycDone = !!user.verifiedAt;
    const selfie = !!user.selfieSubmitted;

    return (
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.dashScroll, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
            <Text style={[styles.greetingName, { color: colors.text }]}>{user.username}</Text>
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={signOut} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar card */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={[styles.avatarCard, { backgroundColor: colors.primary }]}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.avatarInfo}>
                <Text style={styles.avatarName}>{user.username}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name={kycDone ? 'shield-checkmark' : 'shield-outline'} size={13} color={kycDone ? '#34D399' : 'rgba(255,255,255,0.6)'} />
                  <Text style={[styles.verifiedLabel, { color: kycDone ? '#34D399' : 'rgba(255,255,255,0.6)' }]}>
                    {kycDone ? 'KYC Verified' : 'Verification Pending'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardStats}>
              <StatItem label="Member Since" value="July 2026" light />
              <StatItem label="Account Type" value="Individual" light />
              <StatItem label="Status" value={kycDone ? 'Active' : 'Pending'} light />
            </View>
          </View>
        </Animated.View>

        {/* Identity info */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>IDENTITY DETAILS</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow
            icon="card-outline"
            label="Aadhaar Number"
            value={user.aadhaar ? maskAadhaar(user.aadhaar) : 'Not submitted'}
            colors={colors}
          />
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
          <InfoRow
            icon="document-text-outline"
            label="PAN Number"
            value={user.pan ? maskPan(user.pan) : 'Not submitted'}
            colors={colors}
          />
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
          <InfoRow
            icon="camera-outline"
            label="Selfie"
            value={selfie ? 'Submitted' : 'Not submitted'}
            valueColor={selfie ? colors.success : colors.mutedForeground}
            colors={colors}
          />
        </View>

        {/* Verification timeline */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>VERIFICATION STATUS</Text>
        <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TimelineStep icon="person-outline" label="Account Created" done colors={colors} />
          <TimelineStep icon="shield-outline" label="Identity Verified" done={kycDone} colors={colors} />
          <TimelineStep icon="camera-outline" label="Selfie Submitted" done={selfie} isLast colors={colors} />
        </View>

        {/* Actions */}
        {!kycDone && (
          <PrimaryButton label="Complete Verification" onPress={() => router.push('/identity')} />
        )}
        {kycDone && !selfie && (
          <PrimaryButton label="Submit Selfie" onPress={() => router.push('/selfie')} />
        )}
        {kycDone && selfie && (
          <View style={[styles.successBanner, { backgroundColor: colors.successLight, borderColor: '#34D399' }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.successBannerText, { color: colors.success }]}>
              KYC fully complete. Your account is active.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // ── Landing page (not signed in) ─────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad + 8, paddingBottom: bottomPad + 16 }]}>
      {/* Theme toggle */}
      <View style={[styles.landingTopBar, { paddingHorizontal: 24 }]}>
        <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoText}>VP</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.landingContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Illustration */}
        <View style={styles.illustrationWrap}>
          <Image
            source={require('@/assets/images/hero-illustration.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Headline */}
        <Text style={[styles.headline, { color: colors.text }]}>Verify your identity{'\n'}in minutes</Text>
        <Text style={[styles.subline, { color: colors.mutedForeground }]}>
          A seamless, secure KYC experience.{'\n'}Your data is encrypted end-to-end.
        </Text>

        <View style={styles.trustRow}>
          {['256-bit SSL', 'RBI Compliant', 'Instant KYC'].map((item) => (
            <View key={item} style={[styles.trustBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.trustLabel, { color: colors.mutedForeground }]}>{item}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.landingFooter, { opacity: fadeAnim, paddingHorizontal: 24 }]}>
        <PrimaryButton label="Get Started" onPress={() => router.push('/auth')} />
        <TouchableOpacity onPress={() => router.push('/auth')} style={styles.signInLink}>
          <Text style={[styles.signInText, { color: colors.mutedForeground }]}>
            Already have an account?{' '}
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function maskAadhaar(v: string) {
  const c = v.replace(/\s/g, '');
  return `XXXX XXXX ${c.slice(-4)}`;
}
function maskPan(v: string) {
  return v.slice(0, 2) + 'XXXXXXX' + v.slice(-1);
}

function StatItem({ label, value, light }: { label: string; value: string; light?: boolean }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 11, color: light ? 'rgba(255,255,255,0.55)' : '#6B7280', fontFamily: 'Inter_400Regular' }}>{label}</Text>
      <Text style={{ fontSize: 13, color: light ? '#FFFFFF' : '#0A0A14', fontFamily: 'Inter_600SemiBold', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, valueColor, colors }: {
  icon: string; label: string; value: string; valueColor?: string;
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>{label}</Text>
        <Text style={{ fontSize: 14, color: valueColor ?? colors.text, fontFamily: 'Inter_500Medium', marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

function TimelineStep({ icon, label, done, isLast = false, colors }: {
  icon: string; label: string; done: boolean; isLast?: boolean;
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
}) {
  return (
    <View style={styles.tlRow}>
      <View style={styles.tlLeft}>
        <View style={[styles.tlDot, { backgroundColor: done ? colors.success : colors.muted }]}>
          <Ionicons name={done ? 'checkmark' : (icon as any)} size={12} color={done ? '#FFFFFF' : colors.mutedForeground} />
        </View>
        {!isLast && <View style={[styles.tlLine, { backgroundColor: done ? colors.success : colors.border }]} />}
      </View>
      <Text style={[styles.tlLabel, { color: done ? colors.text : colors.mutedForeground }, !isLast && { paddingBottom: 20 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  dashScroll: { paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  topBarRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  greetingName: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  avatarCard: { borderRadius: 20, padding: 20, marginBottom: 24 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  avatarInfo: { flex: 1 },
  avatarName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFFFFF', letterSpacing: -0.4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  cardStats: { flexDirection: 'row' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoDivider: { height: 1, marginVertical: 12 },
  timelineCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  tlRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tlLeft: { alignItems: 'center', width: 24 },
  tlDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tlLine: { width: 1.5, flex: 1, minHeight: 20, marginVertical: 3 },
  tlLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', paddingTop: 3 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  successBannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  // Landing styles
  landingTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  logoBadge: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_700Bold' },
  landingContent: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  illustrationWrap: { alignItems: 'center', marginBottom: 24 },
  illustration: { width: '100%', height: 220 },
  headline: { fontSize: 34, fontFamily: 'Inter_700Bold', letterSpacing: -1, lineHeight: 42, marginBottom: 10 },
  subline: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22, marginBottom: 20 },
  trustRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  trustBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  trustLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  landingFooter: { gap: 12 },
  signInLink: { alignItems: 'center', paddingVertical: 4 },
  signInText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
