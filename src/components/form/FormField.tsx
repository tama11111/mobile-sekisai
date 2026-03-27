import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export default function FormField({ label, error, required, ...inputProps }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={COLORS.gray}
        {...inputProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: LAYOUT.spacing.md,
  },
  label: {
    fontSize: LAYOUT.fontSize.sm,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: LAYOUT.spacing.xs,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.sm,
    fontSize: LAYOUT.fontSize.md,
    color: COLORS.darkGray,
    backgroundColor: COLORS.white,
    minHeight: 44,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: LAYOUT.fontSize.xs,
    color: COLORS.error,
    marginTop: 4,
  },
});
