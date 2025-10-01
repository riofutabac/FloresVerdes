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
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Input, Select } from '../../components';
import { useAppStore } from '../../store';
import { MOCK_USUARIOS } from '../../data/mockData';

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

  // 📲 MANEJO DE LOGIN
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

    setIsLoading(true);
    setErrorMessage('');

    // 🎭 SIMULACIÓN DE AUTENTICACIÓN (Solo frontend)
    setTimeout(() => {
      // Buscar usuario en mock data
      const authenticatedUser = MOCK_USUARIOS.find(
        user => user.email.toLowerCase() === email.toLowerCase() && 
                user.contraseña === password &&
                user.role === selectedRole
      );

      if (authenticatedUser) {
        // ✅ USUARIO ENCONTRADO
        const user = {
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          name: authenticatedUser.name,
          role: selectedRole as 'admin' | 'gerente' | 'jefe_calidad',
          created_at: authenticatedUser.created_at,
          updated_at: authenticatedUser.updated_at,
        };

        login(user);
        
        Alert.alert(
          '✅ Éxito',
          'Inicio de sesión exitoso',
          [
            {
              text: 'OK',
              onPress: () => {
                if (navigation) {
                  navigation.replace('Home');
                }
              }
            }
          ]
        );
      } else {
        setErrorMessage('❌ Credenciales incorrectas. Verifica tu correo, contraseña y rol.');
      }
      
      setIsLoading(false);
    }, 1500);
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
                placeholder="Ingresa tu correo"
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
                style={styles.input}
              />

              {/* ⚠️ MENSAJE DE ERROR */}
              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              {/* 🚀 BOTÓN DE LOGIN */}
              <Button
                title={isLoading ? 'Iniciando sesión...' : '🚀 Iniciar Sesión'}
                onPress={handleLogin}
                variant="primary"
                size="large"
                fullWidth
                disabled={isLoading}
                style={styles.loginButton}
              />

              {/* 💡 INFORMACIÓN DE PRUEBA */}
              <View style={styles.testInfo}>
                <Text style={styles.testInfoTitle}>🧪 Usuarios de Prueba:</Text>
                <Text style={styles.testInfoText}>
                  📧 admin@floresverdes.com | 🔒 admin123 | 👤 Administrador
                </Text>
                <Text style={styles.testInfoText}>
                  📧 gerente@floresverdes.com | 🔒 gerente123 | 👤 Gerente
                </Text>
                <Text style={styles.testInfoText}>
                  📧 jefe.calidad@floresverdes.com | 🔒 calidad123 | 👤 Jefe de Calidad
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
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 235, 238, 0.9)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
    width: '100%',
  },
  loginButton: {
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
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