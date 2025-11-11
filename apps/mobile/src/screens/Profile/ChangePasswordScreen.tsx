import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input, Button } from '../../components';
import { authService } from '../../services/auth.service';

type Props = {
  navigation: any;
};

export const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validatePasswords = (): boolean => {
    setErrorMessage('');

    if (!currentPassword.trim()) {
      setErrorMessage('Ingresa tu contraseña actual');
      return false;
    }

    if (!newPassword.trim()) {
      setErrorMessage('Ingresa la nueva contraseña');
      return false;
    }

    if (newPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('La nueva contraseña debe ser diferente a la actual');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return false;
    }

    // Validar complejidad (recomendado)
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setErrorMessage('La contraseña debe contener mayúsculas, minúsculas y números');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { success, error } = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      if (error) {
        setErrorMessage(error);
        return;
      }

      if (success) {
        Alert.alert(
          '✅ Contraseña Actualizada',
          'Tu contraseña ha sido cambiada exitosamente en Supabase.',
          [
            {
              text: 'Aceptar',
              onPress: () => {
                // Limpiar campos
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                // Volver a la pantalla anterior
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Change password error:', error);
      setErrorMessage('Error inesperado. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>🔐 Cambiar Contraseña</Text>
          <Text style={styles.subtitle}>
            Tu contraseña se actualizará en Supabase Authentication
          </Text>
        </View>

        <View style={styles.form}>
          {/* Contraseña Actual */}
          <Input
            label="🔒 Contraseña Actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Ingresa tu contraseña actual"
            secureTextEntry
            style={styles.input}
          />

          {/* Nueva Contraseña */}
          <Input
            label="🔑 Nueva Contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Ingresa tu nueva contraseña"
            secureTextEntry
            style={styles.input}
          />

          {/* Confirmar Contraseña */}
          <Input
            label="✅ Confirmar Nueva Contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirma tu nueva contraseña"
            secureTextEntry
            style={styles.input}
          />

          {/* Mensaje de Error */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Requisitos de Contraseña */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>📋 Requisitos:</Text>
            <Text style={styles.requirementText}>
              • Mínimo 6 caracteres
            </Text>
            <Text style={styles.requirementText}>
              • Al menos una letra mayúscula
            </Text>
            <Text style={styles.requirementText}>
              • Al menos una letra minúscula
            </Text>
            <Text style={styles.requirementText}>
              • Al menos un número
            </Text>
          </View>

          {/* Botones */}
          <Button
            title={isLoading ? 'Cambiando contraseña...' : '🔄 Cambiar Contraseña'}
            onPress={handleChangePassword}
            variant="primary"
            size="large"
            fullWidth
            disabled={isLoading}
            style={styles.button}
          />

          {isLoading && (
            <ActivityIndicator
              size="large"
              color="#2E7D32"
              style={styles.loader}
            />
          )}

          <Button
            title="❌ Cancelar"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="large"
            fullWidth
            disabled={isLoading}
            style={styles.button}
          />
        </View>

        {/* Información de Seguridad */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityTitle}>🛡️ Seguridad</Text>
          <Text style={styles.securityText}>
            • Tu contraseña se actualiza directamente en Supabase Auth
          </Text>
          <Text style={styles.securityText}>
            • La contraseña está cifrada y segura
          </Text>
          <Text style={styles.securityText}>
            • Tu sesión permanecerá activa después del cambio
          </Text>
          <Text style={styles.securityText}>
            • Nunca compartas tu contraseña con nadie
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  form: {
    marginBottom: 30,
  },
  input: {
    marginBottom: 16,
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 235, 238, 0.9)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  requirementsContainer: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 4,
  },
  button: {
    marginBottom: 12,
  },
  loader: {
    marginVertical: 10,
  },
  securityInfo: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#E65100',
    marginBottom: 4,
  },
});
