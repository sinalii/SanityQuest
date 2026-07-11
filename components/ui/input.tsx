import React from 'react';
import { StyleSheet, TextInput, TextStyle, ViewStyle } from 'react-native';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'password';
  min?: number;
  max?: number;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  id?: string;
}

export function Input({ 
  value, 
  onChangeText, 
  placeholder, 
  type = 'text', 
  min, 
  max, 
  className, 
  style, 
  textStyle,
  id 
}: InputProps) {
  const keyboardType = type === 'number' ? 'numeric' : 
                      type === 'email' ? 'email-address' : 
                      type === 'password' ? 'default' : 'default';

  return (
    <TextInput
      id={id}
      style={[styles.input, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      secureTextEntry={type === 'password'}
      placeholderTextColor="#999999"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
});