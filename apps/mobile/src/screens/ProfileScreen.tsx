import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Input, Select } from '../components';

const IDIOMAS_OPTIONS = [
  { label: '🇪🇸 Español', value: 'es' },
  { label: '🇺🇸 English', value: 'en' },
];

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // 🎯 ESTADOS
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState('es');
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  // 👤 DATOS MOCK DEL USUARIO
  const usuario = {
    nombre: 'Francisco',
    correo: 'francisco@floresverdes.com',
    fechaIngreso: '2023-01-15',
    rol: 'Operario Senior'
  };

  // 🔐 CERRAR SESIÓN
  const handleCerrarSesion = () => {
    Alert.alert(
      '🚪 Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            // 🎭 Mock - En el futuro conectar con auth real
            console.log('🔐 Cerrando sesión...');
            Alert.alert('✅ Sesión Cerrada', 'Has cerrado sesión exitosamente');
            // navigation.navigate('Login'); // Futuro
          }
        }
      ]
    );
  };

  // 🌍 CAMBIAR IDIOMA
  const handleCambiarIdioma = (opcion: any) => {
    setIdiomaSeleccionado(opcion.value);
    console.log('🌍 Idioma cambiado a:', opcion.label);
    Alert.alert('🌍 Idioma Actualizado', `Idioma cambiado a ${opcion.label}`);
  };

  // 🔑 CAMBIAR CONTRASEÑA
  const handleCambiarPassword = () => {
    if (!passwordActual || !passwordNueva || !confirmarPassword) {
      Alert.alert('❌ Error', 'Completa todos los campos');
      return;
    }

    if (passwordNueva !== confirmarPassword) {
      Alert.alert('❌ Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordNueva.length < 6) {
      Alert.alert('❌ Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // 🎭 Mock - Validación exitosa
    console.log('🔑 Contraseña cambiada exitosamente');
    Alert.alert('✅ Éxito', 'Contraseña actualizada correctamente');
    
    // Limpiar campos
    setPasswordActual('');
    setPasswordNueva('');
    setConfirmarPassword('');
    setMostrarCambioPassword(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        
        {/* 👤 INFORMACIÓN DEL USUARIO */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👨‍🌾</Text>
          </View>
          <Text style={styles.userName}>{usuario.nombre}</Text>
          <Text style={styles.userEmail}>{usuario.correo}</Text>
          <View style={styles.userInfo}>
            <Text style={styles.infoText}>👔 {usuario.rol}</Text>
            <Text style={styles.infoText}>📅 Desde {usuario.fechaIngreso}</Text>
          </View>
        </View>

        {/* 🌍 CAMBIAR IDIOMA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Preferencias</Text>
          <Select
            label="Idioma"
            placeholder="Seleccionar idioma..."
            options={IDIOMAS_OPTIONS}
            value={idiomaSeleccionado}
            onSelect={handleCambiarIdioma}
            icon="🌍"
          />
        </View>

        {/* 🔑 CAMBIAR CONTRASEÑA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Seguridad</Text>
          
          {!mostrarCambioPassword ? (
            <Button
              title="🔑 Cambiar Contraseña"
              variant="outline"
              onPress={() => setMostrarCambioPassword(true)}
              fullWidth
            />
          ) : (
            <View style={styles.passwordSection}>
              <Input
                label="Contraseña Actual"
                value={passwordActual}
                onChangeText={setPasswordActual}
                placeholder="Ingresa tu contraseña actual"
                secureTextEntry
                icon="🔒"
                required
              />
              
              <Input
                label="Nueva Contraseña"
                value={passwordNueva}
                onChangeText={setPasswordNueva}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                icon="🆕"
                required
              />
              
              <Input
                label="Confirmar Nueva Contraseña"
                value={confirmarPassword}
                onChangeText={setConfirmarPassword}
                placeholder="Repite la nueva contraseña"
                secureTextEntry
                icon="✅"
                required
              />

              <View style={styles.passwordButtons}>
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={() => {
                    setMostrarCambioPassword(false);
                    setPasswordActual('');
                    setPasswordNueva('');
                    setConfirmarPassword('');
                  }}
                  style={styles.halfButton}
                />
                <Button
                  title="💾 Actualizar"
                  variant="primary"
                  onPress={handleCambiarPassword}
                  style={styles.halfButton}
                />
              </View>
            </View>
          )}
        </View>

        {/* 🚪 CERRAR SESIÓN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔓 Sesión</Text>
          <Button
            title="🚪 Cerrar Sesión"
            variant="danger"
            onPress={handleCerrarSesion}
            fullWidth
          />
        </View>

        {/* 📱 INFORMACIÓN DE LA APP */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>📱 Flores Verdes v1.0.0</Text>
          <Text style={styles.footerText}>© 2025 Flores Verdes</Text>
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  userInfo: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
  },
  passwordSection: {
    gap: 16,
  },
  passwordButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  halfButton: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});