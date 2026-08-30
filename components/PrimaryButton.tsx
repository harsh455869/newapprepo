import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Theme } from '@/theme';

interface PrimaryButtonProps {
  theme: Theme;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function PrimaryButton({
  theme,
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
  fullWidth = true,
}: PrimaryButtonProps) {
  const getColors = () => {
    switch (variant) {
      case 'secondary':
        return { bg: theme.colors.surfaceSecondary, text: theme.colors.text, border: theme.colors.border };
      case 'ghost':
        return { bg: 'transparent', text: theme.colors.primary, border: 'transparent' };
      case 'danger':
        return { bg: theme.colors.danger, text: '#FFFFFF', border: 'transparent' };
      default:
        return { bg: theme.colors.primary, text: '#FFFFFF', border: 'transparent' };
    }
  };
  const colors = getColors();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.bg, borderColor: colors.border, opacity: disabled || loading ? 0.5 : 1 },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  fullWidth: { width: '100%' },
  label: { fontSize: 16, fontWeight: '600' },
});
