import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  isPassword?: boolean;
}

const InputField = forwardRef<TextInput, InputFieldProps>(
  ({ label, error, hint, isPassword = false, ...rest }, ref) => {
    const colors = useColors();
    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(!isPassword);

    const borderColor = error
      ? colors.destructive
      : focused
      ? colors.primary
      : colors.border;

    return (
      <View style={styles.wrapper}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <View
          style={[
            styles.inputRow,
            {
              borderColor,
              backgroundColor: focused
                ? colors.background
                : colors.card,
            },
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text }]}
            placeholderTextColor={colors.mutedForeground}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            secureTextEntry={isPassword && !visible}
            autoCapitalize="none"
            {...rest}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={() => setVisible((v) => !v)}
              style={styles.eyeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={visible ? 'eye-off-outline' : 'eye-outline'}
                size={19}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          )}
        </View>
        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={13} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : hint ? (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>{hint}</Text>
        ) : null}
      </View>
    );
  }
);

InputField.displayName = 'InputField';
export default InputField;

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 7,
    letterSpacing: -0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  eyeBtn: { paddingLeft: 8 },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 4,
  },
  errorText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 5 },
});
