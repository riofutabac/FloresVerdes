import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Button, Select } from '../components';
import { useAppStore } from '../store';
import type { RootStackParamList } from '../types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const IDIOMAS_OPTIONS = [
  { label: '🇪🇸 Español', value: 'es' },
  { label: '🇺🇸 English', value: 'en' },
];

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAppStore();
  
  // 🎯 ESTADOS
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState('es');

  // 👤 DATOS DEL USUARIO AUTENTICADO
  const usuario = {
    nombre: user?.name || 'Usuario',
    correo: user?.email || 'usuario@floresverdes.com',
    fechaIngreso: user?.created_at ? new Date(user.created_at).toLocaleDateString() : '2023-01-15',
    rol: user?.role === 'admin' ? 'Administrador' : 
         user?.role === 'gerente' ? 'Gerente' : 
         user?.role === 'jefe_calidad' ? 'Jefe de Calidad' : 'Usuario'
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
            logout();
            Alert.alert('✅ Sesión Cerrada', 'Has cerrado sesión exitosamente');
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

  // 🔑 NAVEGAR A CAMBIAR CONTRASEÑA
  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
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
          
          <Button
            title="🔑 Cambiar Contraseña"
            variant="outline"
            onPress={handleChangePassword}
            fullWidth
          />
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