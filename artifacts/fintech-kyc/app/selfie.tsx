import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/contexts/AppContext';
import PrimaryButton from '@/components/PrimaryButton';

type Stage = 'idle' | 'preview' | 'matching' | 'matched' | 'failed' | 'success';

// Mock DigiLocker face score — in production, replace with real API response
function mockFaceMatch(): Promise<{ score: number; passed: boolean }> {
  return new Promise((res) => setTimeout(() => res({ score: 0.94, passed: true }), 2800));
}

export default function SelfieScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateUser } = useApp();

  const [stage, setStage] = useState<Stage>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number>(0);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const captureScale = useRef(new Animated.Value(1)).current;
  const scanLineY = useRef(new Animated.Value(0)).current;
  const matchSpinAnim = useRef(new Animated.Value(0)).current;
  const matchPulse = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Scan line loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Matching spinner
  useEffect(() => {
    if (stage === 'matching') {
      Animated.loop(Animated.timing(matchSpinAnim, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })).start();
      Animated.loop(Animated.sequence([
        Animated.timing(matchPulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(matchPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])).start();
    }
  }, [stage]);

  const handleCapture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Flash effect
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(captureScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(captureScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();

    // Try real camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === 'granted') {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        cameraType: ImagePicker.CameraType.front,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setTimeout(() => setStage('preview'), 250);
        return;
      }
    }
    // Fallback: simulate capture
    setTimeout(() => setStage('preview'), 250);
  };

  const handleRetake = () => {
    Haptics.selectionAsync();
    setPhotoUri(null);
    setStage('idle');
  };

  const handleVerify = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStage('matching');

    // Animate score counter up
    const result = await mockFaceMatch();
    setMatchScore(result.score);

    Animated.timing(scoreAnim, {
      toValue: result.score,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (result.passed) {
      setStage('matched');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(resultScale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 14 }).start();
    } else {
      setStage('failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSubmit = async () => {
    setStage('success');
    await updateUser({ selfieSubmitted: true, selfieMatchScore: matchScore });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const spin = matchSpinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ── Success screen ─────────────────────────────────────────────────
  if (stage === 'success') {
    return <SuccessView colors={colors} topPad={topPad} bottomPad={bottomPad} score={matchScore} />;
  }

  // ── DigiLocker face match result ────────────────────────────────────
  if (stage === 'matched' || stage === 'failed') {
    const passed = stage === 'matched';
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={handleRetake} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 4 of 4</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { backgroundColor: passed ? colors.success : colors.destructive }]} />
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 32 }]} showsVerticalScrollIndicator={false}>
          {/* Result badge */}
          <Animated.View style={[styles.resultBadge, { backgroundColor: passed ? colors.success : colors.destructive, transform: [{ scale: resultScale }] }]}>
            <Ionicons name={passed ? 'shield-checkmark' : 'shield-outline'} size={36} color="#FFFFFF" />
          </Animated.View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {passed ? 'Face Matched!' : 'Match Failed'}
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.mutedForeground }]}>
            {passed
              ? 'Your selfie matches the photo in your DigiLocker records.'
              : 'We could not match your selfie. Please retake in good lighting.'}
          </Text>

          {/* Side-by-side comparison */}
          <View style={[styles.comparisonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.comparisonTitle, { color: colors.mutedForeground }]}>FACE COMPARISON</Text>
            <View style={styles.comparisonRow}>
              {/* Captured selfie */}
              <View style={styles.faceBox}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={[styles.faceImage, { borderColor: passed ? colors.success : colors.destructive }]} />
                ) : (
                  <View style={[styles.faceImage, { backgroundColor: colors.primaryLight, borderColor: passed ? colors.success : colors.destructive, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="person" size={40} color={colors.primary} />
                  </View>
                )}
                <Text style={[styles.faceLabel, { color: colors.mutedForeground }]}>Your Selfie</Text>
              </View>

              {/* VS badge */}
              <View style={styles.vsWrap}>
                <View style={[styles.vsBadge, { backgroundColor: passed ? colors.success : colors.muted }]}>
                  <Ionicons name={passed ? 'link-outline' : 'close-outline'} size={18} color={passed ? '#FFFFFF' : colors.mutedForeground} />
                </View>
                <Text style={[styles.vsText, { color: colors.mutedForeground }]}>vs</Text>
              </View>

              {/* DigiLocker photo */}
              <View style={styles.faceBox}>
                <View style={[styles.faceImage, { backgroundColor: colors.muted, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} style={{ marginBottom: 4 }} />
                  <Ionicons name="person" size={30} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.faceLabel, { color: colors.mutedForeground }]}>DigiLocker</Text>
              </View>
            </View>

            {/* Match score bar */}
            <View style={[styles.scoreSection, { borderTopColor: colors.border }]}>
              <View style={styles.scoreHeader}>
                <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Match Confidence</Text>
                <Text style={[styles.scoreValue, { color: passed ? colors.success : colors.destructive }]}>
                  {Math.round(matchScore * 100)}%
                </Text>
              </View>
              <View style={[styles.scoreTrack, { backgroundColor: colors.muted }]}>
                <Animated.View
                  style={[styles.scoreFill, { backgroundColor: passed ? colors.success : colors.destructive, width: `${Math.round(matchScore * 100)}%` }]}
                />
              </View>
              <Text style={[styles.scoreThreshold, { color: colors.mutedForeground }]}>
                Threshold: 85% · {passed ? `Your score ${Math.round(matchScore * 100)}% exceeds threshold` : 'Score below threshold'}
              </Text>
            </View>
          </View>

          {/* Checks */}
          <View style={[styles.checksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.checksTitle, { color: colors.mutedForeground }]}>VERIFICATION CHECKS</Text>
            {[
              { label: 'Face detected in selfie', pass: true },
              { label: 'DigiLocker record retrieved', pass: true },
              { label: 'Liveness detection', pass: true },
              { label: `Face match ≥ 85%`, pass: passed },
            ].map((c, i) => (
              <View key={i} style={styles.checkRow}>
                <View style={[styles.checkDot, { backgroundColor: c.pass ? colors.success : colors.destructive }]}>
                  <Ionicons name={c.pass ? 'checkmark' : 'close'} size={10} color="#FFFFFF" />
                </View>
                <Text style={[styles.checkText, { color: colors.text }]}>{c.label}</Text>
              </View>
            ))}
          </View>

          {passed ? (
            <PrimaryButton label="Complete KYC" onPress={handleSubmit} />
          ) : (
            <PrimaryButton label="Retake Selfie" onPress={handleRetake} />
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Matching animation ──────────────────────────────────────────────
  if (stage === 'matching') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
        <Animated.View style={[styles.matchingRing, { borderColor: colors.primaryLight, transform: [{ scale: matchPulse }] }]} />
        <View style={[styles.matchingTrack, { borderColor: colors.primaryLight }]}>
          <Animated.View style={[styles.matchingArc, { borderTopColor: colors.primary, transform: [{ rotate: spin }] }]} />
        </View>
        <View style={[styles.matchingCenter, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="person-outline" size={22} color={colors.primary} />
        </View>
        <Text style={[styles.matchingTitle, { color: colors.text, marginTop: 32 }]}>Comparing with DigiLocker</Text>
        <Text style={[styles.matchingSub, { color: colors.mutedForeground }]}>
          Retrieving your photo from DigiLocker records and comparing facial biometrics...
        </Text>
        <View style={[styles.matchingSteps, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {['Retrieving DigiLocker record', 'Running facial biometric scan', 'Calculating confidence score'].map((s, i) => (
            <View key={i} style={styles.matchingStep}>
              <Animated.View style={[styles.matchingDot, { backgroundColor: colors.primary, transform: [{ rotate: spin }] }]} />
              <Text style={[styles.matchingStepText, { color: colors.mutedForeground }]}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ── Camera / Preview ────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 4 of 4</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary }]} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Selfie Verification</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your selfie will be matched against the photo in your{' '}
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>DigiLocker</Text> records.
        </Text>

        {/* DigiLocker badge */}
        <View style={[styles.digilockerBadge, { backgroundColor: colors.primaryLight, borderColor: colors.accent }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.digilockerLabel, { color: colors.primary }]}>DigiLocker Connected</Text>
            <Text style={[styles.digilockerSub, { color: colors.mutedForeground }]}>
              Photo will be retrieved from your Aadhaar-linked DigiLocker account
            </Text>
          </View>
        </View>

        {/* Camera area */}
        <View style={[styles.cameraContainer, { borderColor: stage === 'preview' ? colors.success : colors.border, backgroundColor: colors.card }]}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: flashAnim, borderRadius: 20, zIndex: 20 }]} />

          {stage === 'preview' ? (
            <View style={styles.previewContent}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={[styles.capturedPhoto, { borderColor: colors.success }]} />
              ) : (
                <View style={[styles.capturedFace, { backgroundColor: colors.primaryLight, borderColor: colors.success }]}>
                  <Ionicons name="person" size={70} color={colors.primary} />
                  <View style={[styles.capturedCheck, { backgroundColor: colors.success }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                </View>
              )}
              <View style={[styles.capturedBadge, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                <Text style={[styles.capturedText, { color: colors.success }]}>Photo captured — ready to verify</Text>
              </View>
            </View>
          ) : (
            <View style={styles.viewfinderContent}>
              <View style={[styles.faceOval, { borderColor: colors.primary }]}>
                <Animated.View style={[styles.scanLine, { backgroundColor: colors.primary, opacity: 0.4, transform: [{ translateY: scanLineY.interpolate({ inputRange: [0, 1], outputRange: [-80, 80] }) }] }]} />
                <Ionicons name="person-outline" size={52} color={colors.mutedForeground} style={{ opacity: 0.3 }} />
              </View>
              <Text style={[styles.viewfinderHint, { color: colors.mutedForeground }]}>
                Centre your face in the oval
              </Text>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tipsTitle, { color: colors.mutedForeground }]}>TIPS FOR BEST MATCH</Text>
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

        {stage === 'idle' && (
          <Animated.View style={{ transform: [{ scale: captureScale }] }}>
            <TouchableOpacity style={[styles.captureBtn, { backgroundColor: colors.primary }]} onPress={handleCapture} activeOpacity={0.85}>
              <Ionicons name="camera" size={22} color="#FFFFFF" />
              <Text style={styles.captureBtnLabel}>Capture Selfie</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {stage === 'preview' && (
          <View style={styles.previewActions}>
            <PrimaryButton label="Retake" onPress={handleRetake} variant="outline" style={{ flex: 1 }} />
            <PrimaryButton label="Verify with DigiLocker" onPress={handleVerify} style={{ flex: 1 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Success screen ─────────────────────────────────────────────────────
function SuccessView({ colors, topPad, bottomPad, score }: {
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
  topPad: number; bottomPad: number; score: number;
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
          Your identity has been fully verified. Face match confidence: {Math.round(score * 100)}%
        </Text>
        <View style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: 'shield-checkmark-outline', label: 'Aadhaar & PAN Verified' },
            { icon: 'document-text-outline', label: 'Document Uploaded & OCR Scanned' },
            { icon: 'person-circle-outline', label: `Selfie Matched via DigiLocker (${Math.round(score * 100)}%)` },
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
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, marginBottom: 14 },
  digilockerBadge: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 18 },
  digilockerLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  digilockerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  cameraContainer: { width: '100%', aspectRatio: 0.85, borderRadius: 20, borderWidth: 1.5, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  viewfinderContent: { alignItems: 'center', gap: 14, flex: 1, justifyContent: 'center', width: '100%' },
  faceOval: { width: 160, height: 200, borderRadius: 80, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scanLine: { position: 'absolute', width: '100%', height: 2 },
  viewfinderHint: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  previewContent: { alignItems: 'center', gap: 16, flex: 1, justifyContent: 'center' },
  capturedPhoto: { width: 160, height: 160, borderRadius: 80, borderWidth: 3 },
  capturedFace: { width: 160, height: 160, borderRadius: 80, borderWidth: 3, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  capturedCheck: { position: 'absolute', bottom: 6, right: 6, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
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
  // Matching
  matchingRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1.5 },
  matchingTrack: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  matchingArc: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'transparent' },
  matchingCenter: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  matchingTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.4, textAlign: 'center' },
  matchingSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 28, paddingHorizontal: 8 },
  matchingSteps: { borderRadius: 14, borderWidth: 1, padding: 16, width: '100%', gap: 12 },
  matchingStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  matchingDot: { width: 8, height: 8, borderRadius: 4 },
  matchingStepText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  // Result
  resultBadge: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  resultTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.6, textAlign: 'center', marginBottom: 8 },
  resultSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  comparisonCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  comparisonTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 16 },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  faceBox: { alignItems: 'center', gap: 8 },
  faceImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2.5 },
  faceLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  vsWrap: { alignItems: 'center', gap: 4 },
  vsBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  vsText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  scoreSection: { borderTopWidth: 1, paddingTop: 14 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scoreLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  scoreValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  scoreTrack: { height: 8, borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  scoreFill: { height: 8, borderRadius: 4 },
  scoreThreshold: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  checksCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20, gap: 10 },
  checksTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  // Success
  successRoot: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  successContent: { alignItems: 'center' },
  successBadge: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, marginBottom: 10, textAlign: 'center' },
  successSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 8 },
  successCard: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24, gap: 14 },
  successItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  successItemIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  successItemLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
});
