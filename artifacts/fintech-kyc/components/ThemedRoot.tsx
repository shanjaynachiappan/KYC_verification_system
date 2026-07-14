import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';

export default function ThemedRoot({ children }: { children: React.ReactNode }) {
  const { theme } = useApp();
  const bg = theme === 'dark' ? colors.dark.background : colors.light.background;
  return <View style={[styles.root, { backgroundColor: bg }]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
