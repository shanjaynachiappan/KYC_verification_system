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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/contexts/AppContext';
import PrimaryButton from '@/components/PrimaryButton';

type DocType = {
  id: string;
  label: string;
  icon: string;
  hint: string;
};

const DOC_TYPES: DocType[] = [
  { id: 'payslip', label: 'Payslip', icon: 'document-text-outline', hint: 'Last 3 months salary slip' },
  { id: 'bank_statement', label: 'Bank Statement', icon: 'bar-chart-outline', hint: '3-6 months statement' },
  { id: 'itr', label: 'ITR / Form 16', icon: 'newspaper-outline', hint: 'Income Tax Return' },
  { id: 'utility', label: 'Utility Bill', icon: 'flash-outline', hint: 'Electricity / Water / Gas' },
  { id: 'rent', label: 'Rent Agreement', icon: 'home-outline', hint: 'Registered rent deed' },
];

interface UploadedDoc {
  docTypeId: string;
  uri: string;
  fileName: string;
}

export default function DocumentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateUser } = useApp();

  const [selectedType, setSelectedType] = useState<string>('payslip');
  const [uploaded, setUploaded] = useState<UploadedDoc | null>(null);
  const [loading, setLoading] = useState(false);

  const uploadScale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handlePickDoc = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(uploadScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(uploadScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();

    // On device: use ImagePicker to pick from gallery or take photo
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      // For web/demo: simulate upload
      simulateUpload();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.uri.split('/').pop() ?? 'document.jpg';
      setUploaded({ docTypeId: selectedType, uri: asset.uri, fileName: name });
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 14 }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    const label = DOC_TYPES.find((d) => d.id === selectedType)?.label ?? 'Document';
    setUploaded({ docTypeId: selectedType, uri: '', fileName: `${label.toLowerCase().replace(' ', '_')}_scan.pdf` });
    checkScale.setValue(0);
    Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 14 }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemove = () => {
    setUploaded(null);
    checkScale.setValue(0);
    Haptics.selectionAsync();
  };

  const handleContinue = async () => {
    if (!uploaded) return;
    setLoading(true);
    await updateUser({ documentUploaded: true, documentType: uploaded.docTypeId });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(false);
    router.push('/selfie');
  };

  const selectedDocType = DOC_TYPES.find((d) => d.id === selectedType)!;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Nav */}
      <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 3 of 4</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '75%' }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Document Upload</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Upload a supporting financial document. Our OCR system will extract the relevant details automatically.
        </Text>

        {/* Info banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight, borderColor: colors.accent }]}>
          <Ionicons name="scan-outline" size={15} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            OCR-powered extraction — no manual data entry required
          </Text>
        </View>

        {/* Doc type selector */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SELECT DOCUMENT TYPE</Text>
        <View style={styles.docTypeGrid}>
          {DOC_TYPES.map((doc) => {
            const active = selectedType === doc.id;
            return (
              <TouchableOpacity
                key={doc.id}
                onPress={() => { setSelectedType(doc.id); setUploaded(null); checkScale.setValue(0); Haptics.selectionAsync(); }}
                style={[
                  styles.docTypeCard,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name={doc.icon as any} size={20} color={active ? '#FFFFFF' : colors.mutedForeground} />
                <Text style={[styles.docTypeLabel, { color: active ? '#FFFFFF' : colors.text }]}>{doc.label}</Text>
                <Text style={[styles.docTypeHint, { color: active ? 'rgba(255,255,255,0.7)' : colors.mutedForeground }]} numberOfLines={2}>{doc.hint}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Upload area */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>UPLOAD DOCUMENT</Text>

        {!uploaded ? (
          <Animated.View style={{ transform: [{ scale: uploadScale }] }}>
            <TouchableOpacity
              onPress={handlePickDoc}
              activeOpacity={0.85}
              style={[styles.uploadArea, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
            >
              <View style={[styles.uploadIconCircle, { backgroundColor: colors.primary }]}>
                <Ionicons name="cloud-upload" size={26} color="#FFFFFF" />
              </View>
              <Text style={[styles.uploadTitle, { color: colors.text }]}>
                Tap to upload {selectedDocType.label}
              </Text>
              <Text style={[styles.uploadHint, { color: colors.mutedForeground }]}>
                JPG, PNG or PDF · Max 10MB
              </Text>
              <View style={styles.uploadBadgeRow}>
                <UploadBadge label="Gallery" icon="images-outline" colors={colors} />
                <UploadBadge label="Camera" icon="camera-outline" colors={colors} />
                <UploadBadge label="Files" icon="folder-outline" colors={colors} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={[styles.uploadedCard, { backgroundColor: colors.card, borderColor: colors.success }]}>
            <View style={[styles.uploadedLeft, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
              <Ionicons name="document-text" size={28} color={colors.success} />
              <Animated.View style={[styles.uploadedCheck, { backgroundColor: colors.success, transform: [{ scale: checkScale }] }]}>
                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
              </Animated.View>
            </View>
            <View style={styles.uploadedInfo}>
              <Text style={[styles.uploadedName, { color: colors.text }]} numberOfLines={1}>{uploaded.fileName}</Text>
              <Text style={[styles.uploadedType, { color: colors.success }]}>
                {DOC_TYPES.find((d) => d.id === uploaded.docTypeId)?.label} · Upload successful
              </Text>
              <View style={styles.ocrRow}>
                <Ionicons name="scan-circle-outline" size={13} color={colors.primary} />
                <Text style={[styles.ocrLabel, { color: colors.primary }]}>OCR extraction ready</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        )}

        {/* OCR preview mock */}
        {uploaded && (
          <View style={[styles.ocrPreviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.ocrPreviewHeader}>
              <Ionicons name="scan-outline" size={14} color={colors.primary} />
              <Text style={[styles.ocrPreviewTitle, { color: colors.primary }]}>OCR EXTRACTED DATA</Text>
            </View>
            <OcrRow label="Document Type" value={DOC_TYPES.find((d) => d.id === uploaded.docTypeId)?.label ?? ''} colors={colors} />
            <OcrRow label="Name" value="As per document" colors={colors} masked />
            <OcrRow label="Amount / Income" value="Extracted successfully" colors={colors} />
            <OcrRow label="Date" value={new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} colors={colors} />
            <View style={[styles.ocrFooter, { borderTopColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.success} />
              <Text style={[styles.ocrFooterText, { color: colors.success }]}>Data verified against Aadhaar records</Text>
            </View>
          </View>
        )}

        {/* Instruction cards */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>GUIDELINES</Text>
        <View style={[styles.guidelinesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: 'checkmark-circle-outline', text: 'Document should be recent (within 3 months)', ok: true },
            { icon: 'checkmark-circle-outline', text: 'All text must be clearly legible', ok: true },
            { icon: 'checkmark-circle-outline', text: 'Name should match your Aadhaar details', ok: true },
            { icon: 'close-circle-outline', text: 'Do not upload expired or altered documents', ok: false },
            { icon: 'close-circle-outline', text: 'Screenshots or photocopies not accepted', ok: false },
          ].map((item, i) => (
            <View key={i} style={styles.guidelineRow}>
              <Ionicons name={item.icon as any} size={16} color={item.ok ? colors.success : colors.destructive} />
              <Text style={[styles.guidelineText, { color: colors.text }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton
          label={uploaded ? 'Continue to Selfie Verification' : 'Upload Document to Continue'}
          onPress={uploaded ? handleContinue : handlePickDoc}
          loading={loading}
          disabled={false}
        />
      </ScrollView>
    </View>
  );
}

function UploadBadge({ label, icon, colors }: { label: string; icon: string; colors: any }) {
  return (
    <View style={[styles.uploadBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Ionicons name={icon as any} size={12} color={colors.primary} />
      <Text style={[styles.uploadBadgeText, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function OcrRow({ label, value, colors, masked }: { label: string; value: string; colors: any; masked?: boolean }) {
  return (
    <View style={styles.ocrDataRow}>
      <Text style={[styles.ocrDataLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.ocrDataValue, { color: masked ? colors.mutedForeground : colors.text }]}>
        {masked ? '● ● ● ● ●' : value}
      </Text>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  iconCircle: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.7, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, marginBottom: 14 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 11, marginBottom: 22 },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 10, marginTop: 2 },
  docTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  docTypeCard: { width: '47%', borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 6 },
  docTypeLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  docTypeHint: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  uploadArea: { borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', padding: 28, alignItems: 'center', gap: 10, marginBottom: 16 },
  uploadIconCircle: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  uploadTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  uploadHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  uploadBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  uploadBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  uploadBadgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  uploadedCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 16 },
  uploadedLeft: { width: 56, height: 56, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  uploadedCheck: { position: 'absolute', bottom: -5, right: -5, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  uploadedInfo: { flex: 1 },
  uploadedName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  uploadedType: { fontSize: 11, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  ocrRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ocrLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  ocrPreviewCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 },
  ocrPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  ocrPreviewTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.6 },
  ocrDataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  ocrDataLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  ocrDataValue: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  ocrFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  ocrFooterText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  guidelinesCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20, gap: 10 },
  guidelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  guidelineText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
});
