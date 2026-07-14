import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import PrimaryButton from '@/components/PrimaryButton';

type Stage = 'idle' | 'preview' | 'submitting' | 'success';

export default function SelfieScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [stage, setStage] = useState<Stage>('idle');
  const [captured, setCaptured] = useState(false);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const captureScale = useRef(new Animated.Value(1)).current;
  const previewOpacity = useRef(new Animated.Value(0)).current;

  const handleCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Flash animation
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    // Button scale
    Animated.sequence([
      Animated.timing(captureScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(captureScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();

    setCaptured(true);
    Animated.timing(previewOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    setTimeout(() => setStage('preview'), 300);
  };

  const handleRetake = () => {
    Haptics.selectionAsync();
    setCaptured(false);
    setStage('idle');
    previewOpacity.setValue(0);
  };

  const handleSubmit = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStage('submitting');
    await new Promise<void>((res) => setTimeout(res, 1800));
    setStage('success');
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (stage === 'success') {
    return <SuccessView colors={colors} insets={{ top: topPad, bottom: bottomPad }} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 3 of 3</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '100%' }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Selfie Verification</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Take a clear selfie to match with your identity documents.
        </Text>

        {/* Camera Placeholder */}
        <View style={[styles.cameraWrap, { borderColor: captured ? colors.success : colors.border, backgroundColor: colors.card }]}>
          {/* Flash overlay */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: '#FFFFFF', opacity: flashAnim, borderRadius: 20, zIndex: 10 },
            ]}
          />

          {captured ? (
            /* Preview: simulated face silhouette */
            <Animated.View style={[styles.previewArea, { opacity: previewOpacity }]}>
              <View style={[styles.silhouetteCircle, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
                <Feather name="user" size={60} color={colors.primary} />
              </View>
              <View style={[styles.capturedBadge, { backgroundColor: colors.successLight, borderColor: '#A7F3D0' }]}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={[styles.capturedText, { color: colors.success }]}>Photo captured</Text>
              </View>
            </Animated.View>
          ) : (
            /* Idle: camera viewfinder UI */
            <View style={styles.viewfinder}>
              <View style={[styles.faceGuide, { borderColor: colors.primary }]}>
                {/* Corner markers */}
                {['tl', 'tr', 'bl', 'br'].map((corner) => (
                  <View
                    key={corner}
                    style={[
                      styles.corner,
                      { borderColor: colors.primary },
                      corner === 'tl' && { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
                      corner === 'tr' && { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
                      corner === 'bl' && { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
                      corner === 'br' && { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.cameraIcon}>
                <Feather name="camera" size={32} color={colors.mutedForeground} />
                <Text style={[styles.cameraHint, { color: colors.mutedForeground }]}>
                  Position your face{'\n'}within the frame
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tipsTitle, { color: colors.mutedForeground }]}>TIPS FOR BEST RESULT</Text>
          {[
            { icon: 'sun', text: 'Ensure good lighting on your face' },
            { icon: 'eye', text: 'Look directly at the camera' },
            { icon: 'square', text: 'Keep your face within the frame' },
          ].map((tip) => (
            <View key={tip.text} style={styles.tipRow}>
              <View style={[styles.tipIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name={tip.icon as any} size={13} color={colors.primary} />
              </View>
              <Text style={[styles.tipText, { color: colors.foreground }]}>{tip.text}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        {stage === 'idle' && (
          <Animated.View style={{ transform: [{ scale: captureScale }] }}>
            <TouchableOpacity
              style={[styles.captureBtn, { backgroundColor: colors.primary }]}
              onPress={handleCapture}
              activeOpacity={0.85}
            >
              <View style={styles.captureBtnInner}>
                <Feather name="camera" size={22} color="#FFFFFF" />
                <Text style={styles.captureBtnLabel}>Capture Selfie</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {stage === 'preview' && (
          <View style={styles.previewActions}>
            <PrimaryButton
              label="Retake Photo"
              onPress={handleRetake}
              variant="outline"
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label="Submit"
              onPress={handleSubmit}
              style={{ flex: 1 }}
            />
          </View>
        )}

        {stage === 'submitting' && (
          <PrimaryButton label="Submitting..." onPress={() => {}} loading />
        )}
      </ScrollView>
    </View>
  );
}

function SuccessView({
  colors,
  insets,
}: {
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
  insets: { top: number; bottom: number };
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
    <View
      style={[
        styles.successRoot,
        { backgroundColor: colors.background, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Animated.View
          style={[styles.successBadge, { backgroundColor: colors.success, transform: [{ scale: scaleAnim }] }]}
        >
          <Feather name="check" size={40} color="#FFFFFF" />
        </Animated.View>
        <Text style={[styles.successTitle, { color: colors.text }]}>KYC Complete!</Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Your identity has been successfully verified. You can now access all features of VerifyPay.
        </Text>
        <View style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: 'Identity Verified', icon: 'shield' },
            { label: 'Documents Checked', icon: 'file-text' },
            { label: 'Selfie Matched', icon: 'user-check' },
          ].map((item) => (
            <View key={item.label} style={styles.successItem}>
              <View style={[styles.successItemIcon, { backgroundColor: colors.successLight }]}>
                <Feather name={item.icon as any} size={14} color={colors.success} />
              </View>
              <Text style={[styles.successItemLabel, { color: colors.text }]}>{item.label}</Text>
              <Feather name="check-circle" size={16} color={colors.success} style={{ marginLeft: 'auto' }} />
            </View>
          ))}
        </View>
        <PrimaryButton
          label="Go to Dashboard"
          onPress={() => router.replace('/')}
          style={{ width: '100%', marginTop: 8 }}
        />
      </Animated.View>
    </View>
  );
}

// Add missing useEffect import for SuccessView
import { useEffect } from 'react';

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  progressTrack: { height: 3 },
  progressFill: { height: 3, borderRadius: 2 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.7, marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, marginBottom: 20 },
  cameraWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  viewfinder: { alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%' },
  faceGuide: {
    width: 180,
    height: 220,
    borderRadius: 90,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: { position: 'absolute', width: 20, height: 20, borderWidth: 3 },
  cameraIcon: { alignItems: 'center', gap: 12 },
  cameraHint: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },
  previewArea: { alignItems: 'center', gap: 16, flex: 1, justifyContent: 'center' },
  silhouetteCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  capturedText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  tipsCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  tipsTitle: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  tipIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tipText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  captureBtn: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  captureBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  captureBtnLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', letterSpacing: -0.2 },
  previewActions: { flexDirection: 'row', gap: 12 },
  successRoot: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  successBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, marginBottom: 10, textAlign: 'center' },
  successSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 8 },
  successCard: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24, gap: 12 },
  successItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  successItemIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  successItemLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
});
