import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  icon?: string;
  maxLength?: number;
  style?: ViewStyle;
}

export const Input: React.FC<InputProps> = React.memo(({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  required = false,
  error,
  disabled = false,
  icon,
  maxLength,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {icon && `${icon} `}{label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
        disabled && styles.inputDisabled,
      ]}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !showPassword}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={!disabled}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={togglePasswordVisibility}
          >
            <Text style={styles.eyeIcon}>
              {showPassword ? '👁️' : '🙈'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {maxLength && (
        <Text style={styles.charCount}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  required: {
    color: '#F44336',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    minHeight: 50,
  },
  inputFocused: {
    borderColor: '#2E7D32',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#F44336',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  eyeButton: {
    padding: 5,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
});