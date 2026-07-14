import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';

export function useColors() {
  const { theme } = useApp();
  const palette =
    theme === 'dark' && 'dark' in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
