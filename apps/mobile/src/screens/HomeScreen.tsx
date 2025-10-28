import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../hooks';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  userName?: string;
}

export const HomeScreen: React.FC<Props> = ({
  userName,
}) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();

  // ⚡ Obtener nombre del usuario autenticado
  const displayName = useMemo(() => {
    return userName || user?.name?.split(' ')[0] || 'Usuario';
  }, [userName, user?.name]);

  // 🎯 Navegación específica para cada módulo (memoizada)
  const onProfileClick = useCallback(() => navigation.navigate('Profile'), [navigation]);
  const onCosechaClick = useCallback(() => navigation.navigate('EvaluacionCosecha'), [navigation]);
  const onPostcosechaClick = useCallback(() => console.log('Postcosecha - Próximamente'), []);
  const onPruebasClick = useCallback(() => console.log('Pruebas - Próximamente'), []);
  const onDevolucionesClick = useCallback(() => console.log('Devoluciones - Próximamente'), []);
  const onAdminClick = useCallback(() => navigation.navigate('Administracion'), [navigation]);
  const onReportesClick = useCallback(() => navigation.navigate('Reportes'), [navigation]);
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1518709268805-4e9042af2ac0?w=800&q=80' }}
        style={styles.backgroundImage}
        blurRadius={1}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Header con saludo y perfil */}
            <View style={styles.header}>
              <Text style={styles.welcomeText}>
                Listo para trabajar, {displayName}
              </Text>
              <TouchableOpacity onPress={onProfileClick} style={styles.profileButton}>
                <Text style={styles.profileIcon}>👤</Text>
              </TouchableOpacity>
            </View>

            {/* Logo y nombre de la empresa */}
            <View style={styles.logoSection}>
              <Text style={styles.companyName}>Flores Verdes</Text>
            </View>

            {/* Módulos principales */}
            <View style={styles.modulesContainer}>
              <View style={styles.moduleRow}>
                <ModuleCard
                  icon="🌹"
                  label="Cosecha"
                  backgroundColor="#D8EED8"
                  onPress={onCosechaClick}
                />
                <ModuleCard
                  icon="🌱"
                  label="Postcosecha"
                  backgroundColor="#F2EEC0"
                  onPress={onPostcosechaClick}
                />
              </View>

              <View style={styles.moduleRow}>
                <ModuleCard
                  icon="🧪"
                  label="Pruebas"
                  backgroundColor="#D8EED8"
                  onPress={onPruebasClick}
                />
                <ModuleCard
                  icon="📦"
                  label="Devoluciones"
                  backgroundColor="#F2EEC0"
                  onPress={onDevolucionesClick}
                />
              </View>
            </View>

            {/* Separador */}
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Recursos adicionales</Text>

            {/* Recursos adicionales */}
            <View style={styles.moduleRow}>
              <ModuleCard
                icon="👥"
                label="Administración"
                backgroundColor="#D0E8F2"
                onPress={onAdminClick}
              />
              <ModuleCard
                icon="📊"
                label="Reportes/KPIs"
                backgroundColor="#F2EEC0"
                onPress={onReportesClick}
              />
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

interface ModuleCardProps {
  icon: string;
  label: string;
  backgroundColor: string;
  onPress: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = React.memo(({ icon, label, backgroundColor, onPress }) => {
  return (
    <TouchableOpacity style={[styles.moduleCard, { backgroundColor }]} onPress={onPress}>
      <Text style={styles.moduleIcon}>{icon}</Text>
      <Text style={styles.moduleLabel}>{label}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: '4%', // Porcentaje para mejor adaptación
    paddingTop: 40,
    minHeight: '100%',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 20,
    color: '#2E7D32',
    fontWeight: '600',
    flex: 1,
  },
  profileButton: {
    padding: 8,
  },
  profileIcon: {
    fontSize: 28,
    color: '#2E7D32',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    paddingVertical: 8,
  },
  logoIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  modulesContainer: {
    gap: 16,
  },
  moduleRow: {
    flexDirection: 'row',
    gap: 16,
  },
  moduleCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  moduleIcon: {
    fontSize: 50, // Reducido para pantallas pequeñas
    marginBottom: 6,
  },
  moduleLabel: {
    fontSize: 14, // Más pequeño para mejor adaptación
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    flexShrink: 1, // Se reduce si no hay espacio
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
});