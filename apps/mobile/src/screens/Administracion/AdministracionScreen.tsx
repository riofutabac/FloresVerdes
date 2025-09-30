import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';

type AdministracionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Administracion'>;

export const AdministracionScreen: React.FC = () => {
  const navigation = useNavigation<AdministracionScreenNavigationProp>();

  const modulosAdministracion = [
    {
      id: 'usuarios',
      title: 'Gestión de Usuarios',
      subtitle: 'Crear, editar y administrar usuarios del sistema',
      icon: '👥',
      color: '#2196F3',
      screen: 'GestionUsuarios' as keyof RootStackParamList,
    },
    {
      id: 'operarios',
      title: 'Gestión de Operarios',
      subtitle: 'Administrar operarios de cosecha y postcosecha',
      icon: '👷',
      color: '#4CAF50',
      screen: 'GestionOperarios' as keyof RootStackParamList,
    },
    {
      id: 'parametros',
      title: 'Parámetros de Evaluación',
      subtitle: 'Configurar parámetros y pesos de evaluación',
      icon: '⚖️',
      color: '#FF9800',
      screen: 'GestionParametros' as keyof RootStackParamList,
    },
    {
      id: 'variedades',
      title: 'Gestión de Variedades',
      subtitle: 'CRUD de variedades de rosas',
      icon: '🌹',
      color: '#E91E63',
      screen: 'GestionVariedades' as keyof RootStackParamList,
    },
    {
      id: 'subprocesos',
      title: 'Gestión de Subprocesos',
      subtitle: 'Definir y activar/desactivar subprocesos',
      icon: '🔄',
      color: '#9C27B0',
      screen: 'GestionSubprocesos' as keyof RootStackParamList,
    },
    {
      id: 'supervisores',
      title: 'Asignación de Supervisores',
      subtitle: 'Asociar supervisores a áreas',
      icon: '👨‍💼',
      color: '#607D8B',
      screen: 'AsignacionSupervisores' as keyof RootStackParamList,
    },
  ];

  const handleModulePress = (screen: keyof RootStackParamList) => {
    if (screen === 'GestionUsuarios') {
      navigation.navigate('GestionUsuarios');
    } else {
      // Por ahora solo mostramos un alert para los otros módulos
      Alert.alert(
        'Módulo de Administración', 
        `Accediendo a: ${screen}\n\n(Próximamente)`,
        [{ text: 'OK' }]
      );
    }
    console.log(`Navegando a: ${screen}`);
  };

  return (
    <ImageBackground
      source={require('../../../assets/splash-icon.png')}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      <ScrollView style={styles.container}>
        <View style={styles.overlay}>
          <Text style={styles.title}>⚙️ Administración</Text>
          <Text style={styles.subtitle}>Panel de control del sistema</Text>

          {/* 🎛️ MÓDULOS DE ADMINISTRACIÓN */}
          <View style={styles.modulesGrid}>
            {modulosAdministracion.map((modulo) => (
              <TouchableOpacity
                key={modulo.id}
                style={[styles.moduleCard, { borderLeftColor: modulo.color }]}
                onPress={() => handleModulePress(modulo.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.moduleHeader}>
                  <Text style={styles.moduleIcon}>{modulo.icon}</Text>
                  <View style={styles.moduleInfo}>
                    <Text style={styles.moduleTitle}>{modulo.title}</Text>
                    <Text style={styles.moduleSubtitle}>{modulo.subtitle}</Text>
                  </View>
                </View>
                <Text style={styles.moduleArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 🔐 INFORMACIÓN DE ACCESO */}
          <View style={styles.accessInfoCard}>
            <Text style={styles.accessInfoTitle}>🔐 Control de Acceso</Text>
            <Text style={styles.accessInfoText}>
              • Solo usuarios con rol <Text style={styles.highlight}>Administrador</Text> pueden acceder
            </Text>
            <Text style={styles.accessInfoText}>
              • <Text style={styles.highlight}>Jefa de Calidad</Text> tiene acceso limitado
            </Text>
            <Text style={styles.accessInfoText}>
              • <Text style={styles.highlight}>Gerente General</Text> tiene vista de solo lectura
            </Text>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  container: {
    flex: 1,
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 20,
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modulesGrid: {
    gap: 16,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moduleIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  moduleSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  moduleArrow: {
    fontSize: 20,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  accessInfoCard: {
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  accessInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginBottom: 12,
  },
  accessInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#7B1FA2',
  },
});