import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { RootStackParamList } from '../../types';

interface NavigationProp {
  navigate: (screen: string) => void;
}

interface Props {
  navigation: NavigationProp;
}

export const ReportesScreen: React.FC<Props> = ({ navigation }) => {
  const [search, setSearch] = useState('');

  // 📊 OPCIONES DE REPORTES
  const opcionesReportes = [
    {
      id: '1',
      title: '📊 Reportes Individuales',
      subtitle: 'Ver reportes detallados por operario',
      icon: '👤',
      color: '#4A90E2',
      onPress: () => navigation.navigate('ReportesIndividuales' as never),
    },
    {
      id: '2',
      title: '📈 Reportes Generales',
      subtitle: 'Análisis consolidado de todas las evaluaciones',
      icon: '📋',
      color: '#7ED321',
      onPress: () => navigation.navigate('ReportesGenerales' as never),
    },
    {
      id: '3',
      title: '📄 Exportar Reportes',
      subtitle: 'Generar archivos PDF y Word',
      icon: '💾',
      color: '#F5A623',
      onPress: () => navigation.navigate('ExportarReportes' as never),
    },
    {
      id: '4',
      title: '📊 Dashboard',
      subtitle: 'Vista general con métricas en tiempo real',
      icon: '📱',
      color: '#BD10E0',
      onPress: () => navigation.navigate('DashboardReportes' as never),
    },
  ];

  const filteredOpciones = opcionesReportes.filter(opcion =>
    opcion.title.toLowerCase().includes(search.toLowerCase()) ||
    opcion.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 🔍 BÚSQUEDA */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tipo de reporte..."
            onChangeText={setSearch}
            value={search}
            placeholderTextColor="#999"
          />
        </View>

        {/* 📈 ESTADÍSTICAS RÁPIDAS */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📊 Resumen Rápido</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Evaluaciones Hoy</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>87%</Text>
              <Text style={styles.statLabel}>Promedio General</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Operarios Activos</Text>
            </View>
          </View>
        </View>

        {/* 🎛️ OPCIONES DE REPORTES */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>🗂️ Tipos de Reportes</Text>
          
          {filteredOpciones.map((opcion) => (
            <TouchableOpacity
              key={opcion.id}
              style={[styles.optionCard, { borderLeftColor: opcion.color }]}
              onPress={opcion.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionIcon}>{opcion.icon}</Text>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>{opcion.title}</Text>
                    <Text style={styles.optionSubtitle}>{opcion.subtitle}</Text>
                  </View>
                </View>
                <Text style={[styles.arrow, { color: opcion.color }]}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🔄 ACCIONES RÁPIDAS */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
          
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: '#4A90E2' }]}
              onPress={() => Alert.alert('📊', 'Generando reporte del día...')}
            >
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={styles.quickActionText}>Reporte del Día</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: '#7ED321' }]}
              onPress={() => Alert.alert('📈', 'Generando reporte semanal...')}
            >
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={styles.quickActionText}>Reporte Semanal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: '#F5A623' }]}
              onPress={() => Alert.alert('💾', 'Exportando a PDF...')}
            >
              <Text style={styles.quickActionIcon}>📄</Text>
              <Text style={styles.quickActionText}>Exportar PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: '#BD10E0' }]}
              onPress={() => Alert.alert('📧', 'Enviando por email...')}
            >
              <Text style={styles.quickActionIcon}>📧</Text>
              <Text style={styles.quickActionText}>Enviar Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 45,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#14171A',
  },
  statsContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#657786',
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 16,
    marginTop: 8,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#657786',
  },
  arrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
});