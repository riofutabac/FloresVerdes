import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button, Input, Select } from '../../components';
import { useAppStore } from '../../store';
import { authService } from '../../services/auth.service';

type Props = {
  navigation?: any;
};

const ROLES_OPTIONS = [
  { label: '👨‍🔬 Jefe de Calidad', value: 'jefe_calidad' },
  { label: '🏢 Gerente', value: 'gerente' },
  { label: '⚙️ Administrador', value: 'admin' },
];

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  // 🎯 ESTADOS
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 🏪 STORE
  const { login } = useAppStore();

  // 📲 MANEJO DE LOGIN CON SUPABASE
  const handleLogin = async () => {
    // 🔍 VALIDACIONES
    if (!email.trim()) {
      setErrorMessage('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Por favor ingresa tu contraseña');
      return;
    }

    if (!selectedRole) {
      setErrorMessage('Por favor selecciona tu rol');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 🔐 AUTENTICACIÓN CON SUPABASE
      const { user, error } = await authService.login({
        email: email.trim().toLowerCase(),
        password: password,
        role: selectedRole as 'admin' | 'gerente' | 'jefe_calidad',
      });

      if (error) {
        // ❌ ERROR EN LOGIN
        setErrorMessage(error);
        setIsLoading(false);
        return;
      }

      if (user) {
        // ✅ LOGIN EXITOSO
        login(user);
        
        Alert.alert(
          '✅ Bienvenido',
          `Hola ${user.name}!\nInicio de sesión exitoso.`,
          [
            {
              text: 'Continuar',
              onPress: () => {
                if (navigation) {
                  navigation.replace('Home');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Error inesperado. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground
        source={require('../../../assets/rose_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              
              {/* 🌹 LOGO */}
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.subtitle}>Sistema de Gestión de Calidad</Text>
              </View>

              {/* 📧 CAMPO DE CORREO */}
              <Input
                label="📧 Correo Electrónico"
                value={email}
                onChangeText={setEmail}
                placeholder="ejemplo@floresverdes.com"
                keyboardType="email-address"
                style={styles.input}
              />

              {/* 🔒 CAMPO DE CONTRASEÑA */}
              <Input
                label="🔒 Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu contraseña"
                secureTextEntry
                style={styles.input}
              />

              {/* 👤 SELECTOR DE ROL */}
              <Select
                label="👤 Seleccionar Rol"
                value={selectedRole}
                onSelect={(option) => setSelectedRole(String(option.value))}
                options={ROLES_OPTIONS}
                placeholder="Selecciona tu rol"
                disabled={isLoading}
                style={styles.input}
              />

              {/* ⚠️ MENSAJE DE ERROR */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* 🚀 BOTÓN DE LOGIN */}
              <Button
                title={isLoading ? 'Verificando credenciales...' : '🚀 Iniciar Sesión'}
                onPress={handleLogin}
                variant="primary"
                size="large"
                fullWidth
                disabled={isLoading}
                style={styles.loginButton}
              />

              {isLoading && (
                <ActivityIndicator 
                  size="large" 
                  color="#2E7D32" 
                  style={styles.loader}
                />
              )}

              {/* 💡 INFORMACIÓN */}
              <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>ℹ️ Información</Text>
                <Text style={styles.infoText}>
                  • Usa las credenciales proporcionadas por el administrador
                </Text>
                <Text style={styles.infoText}>
                  • Asegúrate de seleccionar el rol correcto
                </Text>
                <Text style={styles.infoText}>
                  • Si olvidaste tu contraseña, contacta al administrador
                </Text>
              </View>

            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 20,
    width: '100%',
  },
  errorContainer: {
    width: '100%',
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
  loginButton: {
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
  },
  loader: {
    marginVertical: 10,
  },
  infoContainer: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
    width: '100%',
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 4,
    paddingLeft: 8,
  },
  testInfo: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.3)',
    width: '100%',
  },
  testInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  testInfoText: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 4,
  },
});