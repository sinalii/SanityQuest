import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
  style?: TextStyle;
}

export function Label({ children, htmlFor, className, style }: LabelProps) {
  return (
    <Text style={[styles.label, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
});