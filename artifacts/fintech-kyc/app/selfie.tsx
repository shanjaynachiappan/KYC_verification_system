import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/contexts/AppContext';
import PrimaryButton from '@/components/PrimaryButton';

type Stage = 'idle' | 'preview' | 'submitting' | 'success';

export default function SelfieScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateUser } = useApp();
  const [stage, setStage] = useState<Stage>('idle');

  const flashAnim = useRef(new Animated.Value(0)).current;
  const captureScale = useRef(new Animated.Value(1)).current;
  const previewOpacity = useRef(new Animated.Value(0)).current;
  const scanLineY = useRef(new Animated.Value(0)).current;

  // Scan line animation for idle state
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Flash
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
    // Button press
    Animated.sequence([
      Animated.timing(captureScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(captureScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();

    setTimeout(() => {
      Animated.timing(previewOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      setStage('preview');
    }, 250);
  };

  const handleRetake = () => {
    Haptics.selectionAsync();
    previewOpacity.setValue(0);
    setStage('idle');
  };

  const handleSubmit = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStage('submitting');
    await new Promise<void>((res) => setTimeout(res, 1600));
    await updateUser({ selfieSubmitted: true });
    setStage('success');
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (stage === 'success') {
    return <SuccessView colors={colors} topPad={topPad} bottomPad={bottomPad} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 3 of 3</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Selfie Verification</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Take a clear selfie to match with your identity documents.
        </Text>

        {/* Camera area */}
        <View style={[styles.cameraContainer, { borderColor: stage === 'preview' ? colors.success : colors.border, backgroundColor: colors.card }]}>
          {/* Flash overlay */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: flashAnim, borderRadius: 20, zIndex: 20 }]}
          />

          {stage === 'preview' ? (
            /* Captured state */
            <Animated.View style={[styles.previewContent, { opacity: previewOpacity }]}>
              <View style={[styles.capturedFace, { backgroundColor: colors.primaryLight, borderColor: colors.success }]}>
                <Ionicons name="person" size={70} color={colors.primary} />
                {/* Scan complete indicator */}
                <View style={[styles.capturedCheck, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              </View>
              <View style={[styles.capturedBadge, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                <Text style={[styles.capturedText, { color: colors.success }]}>Photo captured successfully</Text>
              </View>
            </Animated.View>
          ) : (
            /* Idle: viewfinder */
            <View style={styles.viewfinderContent}>
              {/* Oval face guide */}
              <View style={[styles.faceOval, { borderColor: colors.primary }]}>
                {/* Animated scan line */}
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      backgroundColor: colors.primary,
                      opacity: 0.4,
                      transform: [{ translateY: scanLineY.interpolate({ inputRange: [0, 1], outputRange: [-80, 80] }) }],
                    },
                  ]}
                />
                <Ionicons name="person-outline" size={52} color={colors.mutedForeground} style={{ opacity: 0.3 }} />
              </View>
              <Text style={[styles.viewfinderHint, { color: colors.mutedForeground }]}>
                Centre your face in the oval
              </Text>
              {/* Corner markers using Ionicons, not boxes */}
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Ionicons name="scan-outline" size={220} color={colors.primary} style={{ opacity: 0.12, position: 'absolute', top: '50%', left: '50%', marginLeft: -110, marginTop: -110 }} />
              </View>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tipsTitle, { color: colors.mutedForeground }]}>TIPS</Text>
          <View style={styles.tipsRow}>
            {[
              { icon: 'sunny-outline', text: 'Good lighting' },
              { icon: 'eye-outline', text: 'Eyes open' },
              { icon: 'person-circle-outline', text: 'Face centred' },
            ].map((tip) => (
              <View key={tip.text} style={styles.tipItem}>
                <View style={[styles.tipIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={tip.icon as any} size={16} color={colors.primary} />
                </View>
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        {stage === 'idle' && (
          <Animated.View style={{ transform: [{ scale: captureScale }] }}>
            <TouchableOpacity
              style={[styles.captureBtn, { backgroundColor: colors.primary }]}
              onPress={handleCapture}
              activeOpacity={0.85}
            >
              <Ionicons name="camera" size={22} color="#FFFFFF" />
              <Text style={styles.captureBtnLabel}>Capture Selfie</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {stage === 'preview' && (
          <View style={styles.previewActions}>
            <PrimaryButton label="Retake" onPress={handleRetake} variant="outline" style={{ flex: 1 }} />
            <PrimaryButton label="Submit" onPress={handleSubmit} style={{ flex: 1 }} />
          </View>
        )}

        {stage === 'submitting' && (
          <PrimaryButton label="Submitting..." onPress={() => {}} loading />
        )}
      </ScrollView>
    </View>
  );
}

// ── Success screen ───────────────────────────────────────────────────────────
function SuccessView({ colors, topPad, bottomPad }: {
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
  topPad: number;
  bottomPad: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 14 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.successRoot, { backgroundColor: colors.background, paddingTop: topPad + 40, paddingBottom: bottomPad + 32 }]}>
      <Animated.View style={[styles.successContent, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.successBadge, { backgroundColor: colors.success, transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark" size={44} color="#FFFFFF" />
        </Animated.View>
        <Text style={[styles.successTitle, { color: colors.text }]}>KYC Complete!</Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Your identity has been verified. You can now access all features of VerifyPay.
        </Text>
        <View style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: 'shield-checkmark-outline', label: 'Identity Verified' },
            { icon: 'document-text-outline', label: 'Documents Checked' },
            { icon: 'person-circle-outline', label: 'Selfie Matched' },
          ].map((item) => (
            <View key={item.label} style={styles.successItem}>
              <View style={[styles.successItemIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name={item.icon as any} size={16} color={colors.success} />
              </View>
              <Text style={[styles.successItemLabel, { color: colors.text }]}>{item.label}</Text>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            </View>
          ))}
        </View>
        <PrimaryButton label="View Dashboard" onPress={() => router.replace('/')} style={{ width: '100%' }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  progressTrack: { height: 3 },
  progressFill: { height: 3, borderRadius: 2, width: '100%' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.7, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, marginBottom: 20 },
  cameraContainer: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  viewfinderContent: { alignItems: 'center', gap: 14, flex: 1, justifyContent: 'center', width: '100%' },
  faceOval: {
    width: 160,
    height: 200,
    borderRadius: 80,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanLine: { position: 'absolute', width: '100%', height: 2 },
  viewfinderHint: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  previewContent: { alignItems: 'center', gap: 16, flex: 1, justifyContent: 'center' },
  capturedFace: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  capturedCheck: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  capturedText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  tipsCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 18 },
  tipsTitle: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 10 },
  tipsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  tipItem: { alignItems: 'center', gap: 6 },
  tipIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tipText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  captureBtn: { height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  captureBtnLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', letterSpacing: -0.2 },
  previewActions: { flexDirection: 'row', gap: 12 },
  successRoot: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  successContent: { alignItems: 'center' },
  successBadge: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, marginBottom: 10, textAlign: 'center' },
  successSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 8 },
  successCard: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24, gap: 14 },
  successItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  successItemIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  successItemLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
});
