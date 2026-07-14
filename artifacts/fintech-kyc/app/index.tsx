import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import PrimaryButton from '@/components/PrimaryButton';

export default function LandingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 10,
        bounciness: 4,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 6,
      }),
    ]).start();
  }, []);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: topPad + 12, paddingBottom: bottomPad + 16 },
      ]}
    >
      {/* Logo + Name */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoText}>VP</Text>
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>VerifyPay</Text>
        <View style={[styles.tagBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.tagText, { color: colors.primary }]}>Secure Identity Platform</Text>
        </View>
      </Animated.View>

      {/* Hero Illustration */}
      <Animated.View style={[styles.illustrationWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('@/assets/images/hero-illustration.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Description */}
      <Animated.View style={[styles.descWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={[styles.headline, { color: colors.text }]}>
          Verify your identity{'\n'}in minutes
        </Text>
        <Text style={[styles.subline, { color: colors.mutedForeground }]}>
          A seamless, secure KYC experience.{'\n'}Your data is encrypted end-to-end.
        </Text>

        {/* Trust indicators */}
        <View style={styles.trustRow}>
          {['256-bit SSL', 'RBI Compliant', 'Instant Verification'].map((item) => (
            <View key={item} style={[styles.trustBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.trustLabel, { color: colors.mutedForeground }]}>{item}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <PrimaryButton
          label="Begin Verification"
          onPress={() => router.push('/auth')}
        />
        <Text style={[styles.legalText, { color: colors.mutedForeground }]}>
          By continuing, you agree to our{' '}
          <Text style={{ color: colors.primary }}>Terms</Text> &{' '}
          <Text style={{ color: colors.primary }}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  tagBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.1,
  },
  illustrationWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  illustration: {
    width: '100%',
    height: 260,
  },
  descWrap: {
    marginBottom: 24,
  },
  headline: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: 10,
  },
  subline: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    marginBottom: 16,
  },
  trustRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  trustBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  trustLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  footer: {
    gap: 12,
  },
  legalText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
