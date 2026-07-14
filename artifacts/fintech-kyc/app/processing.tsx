import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { VerificationStep } from '@/types';

const STEPS: VerificationStep[] = [
  { id: '1', label: 'Connecting to servers', status: 'pending' },
  { id: '2', label: 'Verifying credentials', status: 'pending' },
  { id: '3', label: 'Checking identity records', status: 'pending' },
  { id: '4', label: 'Fetching government data', status: 'pending' },
];

const STEP_DURATIONS = [1800, 2400, 2800, 2200];

export default function ProcessingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [steps, setSteps] = useState<VerificationStep[]>(STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const doneScale = useRef(new Animated.Value(0)).current;

  // Spinner
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Step progression
  useEffect(() => {
    let totalDelay = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEP_DURATIONS.forEach((dur, idx) => {
      // Activate step
      const t1 = setTimeout(() => {
        setCurrentStep(idx);
        setSteps((prev) =>
          prev.map((s, i) =>
            i === idx ? { ...s, status: 'active' } : i < idx ? { ...s, status: 'done' } : s
          )
        );
        Animated.timing(progressAnim, {
          toValue: (idx + 1) / STEP_DURATIONS.length,
          duration: dur,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }, totalDelay);
      timers.push(t1);
      totalDelay += dur;
    });

    // All done
    const tDone = setTimeout(() => {
      setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
      setDone(true);
      Animated.spring(doneScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 12,
      }).start();
      setTimeout(() => router.push('/selfie'), 1200);
    }, totalDelay);
    timers.push(tDone);

    return () => timers.forEach(clearTimeout);
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: topPad + 24,
          paddingBottom: bottomPad + 24,
        },
      ]}
    >
      {/* Top status */}
      <View style={styles.topSection}>
        {/* Spinner / Done badge */}
        {done ? (
          <Animated.View
            style={[
              styles.doneBadge,
              { backgroundColor: colors.success, transform: [{ scale: doneScale }] },
            ]}
          >
            <Feather name="check" size={32} color="#FFFFFF" />
          </Animated.View>
        ) : (
          <View style={styles.spinnerWrap}>
            <Animated.View style={[styles.pulseRing, { borderColor: colors.primaryLight, transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.pulseRing2, { borderColor: colors.primaryLight, transform: [{ scale: pulseAnim }] }]} />
            <View style={[styles.spinnerOuter, { borderColor: colors.primaryLight }]}>
              <Animated.View
                style={[
                  styles.spinnerArc,
                  { borderTopColor: colors.primary, transform: [{ rotate: spin }] },
                ]}
              />
            </View>
            <View style={[styles.spinnerCenter, { backgroundColor: colors.primaryLight }]}>
              <Feather name="shield" size={22} color={colors.primary} />
            </View>
          </View>
        )}

        <Text style={[styles.statusTitle, { color: colors.text }]}>
          {done ? 'Verification Complete' : 'Processing Verification'}
        </Text>
        <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
          {done
            ? 'Your identity has been successfully verified.'
            : 'Please keep the app open. This usually takes a few seconds.'}
        </Text>

        {/* Progress bar */}
        {!done && (
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.primary }]}
            />
          </View>
        )}
      </View>

      {/* Timeline */}
      <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.timelineTitle, { color: colors.mutedForeground }]}>VERIFICATION STEPS</Text>
        {steps.map((step, idx) => (
          <StepRow key={step.id} step={step} index={idx} isLast={idx === steps.length - 1} colors={colors} />
        ))}
      </View>

      {/* Wait text */}
      {!done && (
        <Text style={[styles.waitText, { color: colors.mutedForeground }]}>
          Please wait...
        </Text>
      )}
    </View>
  );
}

function StepRow({
  step,
  index,
  isLast,
  colors,
}: {
  step: VerificationStep;
  index: number;
  isLast: boolean;
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step.status === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })
      ).start();
    }
  }, [step.status]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const isDone = step.status === 'done';
  const isActive = step.status === 'active';
  const isPending = step.status === 'pending';

  const dotBg = isDone ? colors.success : isActive ? colors.primary : colors.muted;
  const labelColor = isPending ? colors.mutedForeground : colors.text;

  return (
    <View style={styles.stepRow}>
      {/* Connector */}
      <View style={styles.stepLeft}>
        <Animated.View
          style={[
            styles.stepDot,
            { backgroundColor: dotBg, transform: isActive ? [{ scale: pulseAnim }] : [] },
          ]}
        >
          {isDone ? (
            <Feather name="check" size={10} color="#FFFFFF" />
          ) : isActive ? (
            <Animated.View style={[styles.dotInner, { borderTopColor: '#FFFFFF', transform: [{ rotate: spin }] }]} />
          ) : (
            <View style={[styles.dotInnerStatic, { backgroundColor: colors.mutedForeground }]} />
          )}
        </Animated.View>
        {!isLast && (
          <View style={[styles.stepLine, { backgroundColor: isDone ? colors.success : colors.border }]} />
        )}
      </View>

      {/* Label */}
      <View style={styles.stepContent}>
        <Text style={[styles.stepLabel, { color: labelColor }]}>{step.label}</Text>
        {isActive && <Text style={[styles.stepSub, { color: colors.primary }]}>In progress...</Text>}
        {isDone && <Text style={[styles.stepSub, { color: colors.success }]}>Completed</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  spinnerWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  pulseRing2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
  },
  spinnerOuter: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
  },
  spinnerArc: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  spinnerCenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  statusSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  timelineCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  timelineTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
  },
  stepLeft: {
    alignItems: 'center',
    width: 20,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dotInnerStatic: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.4,
  },
  stepLine: {
    width: 1.5,
    flex: 1,
    marginVertical: 3,
    minHeight: 24,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    lineHeight: 20,
  },
  stepSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  waitText: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
});
