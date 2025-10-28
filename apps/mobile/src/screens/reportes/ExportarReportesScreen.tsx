import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';

interface NavigationProp {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProp;
}

export const ExportarReportesScreen: React.FC<Props> = ({ navigation }) => {
  const [incluirGraficos, setIncluirGraficos] = useState(true);
  const [incluirDetalles, setIncluirDetalles] = useState(true);
  const [formatoSeleccionado, setFormatoSeleccionado] = useState<'PDF' | 'Word' | 'Excel'>('PDF');

  const exportar = () => {
    Alert.alert(
      '💾 Exportando...',
      `Generando reporte en formato ${formatoSeleccionado}`,
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* FORMATO DE EXPORTACIÓN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Formato de Exportación</Text>
          
          <View style={styles.formatContainer}>
            {(['PDF', 'Word', 'Excel'] as const).map((formato) => (
              <TouchableOpacity
                key={formato}
                style={[
                  styles.formatButton,
                  formatoSeleccionado === formato && styles.formatButtonSelected
                ]}
                onPress={() => setFormatoSeleccionado(formato)}
              >
                <Text style={[
                  styles.formatText,
                  formatoSeleccionado === formato && styles.formatTextSelected
                ]}>
                  {formato === 'PDF' ? '📄' : formato === 'Word' ? '📝' : '📊'} {formato}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* OPCIONES DE CONTENIDO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Opciones de Contenido</Text>
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>📊 Incluir Gráficos</Text>
            <Switch
              value={incluirGraficos}
              onValueChange={setIncluirGraficos}
              trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
              thumbColor={incluirGraficos ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>📋 Incluir Detalles Completos</Text>
            <Switch
              value={incluirDetalles}
              onValueChange={setIncluirDetalles}
              trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
              thumbColor={incluirDetalles ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* VISTA PREVIA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👁️ Vista Previa del Reporte</Text>
          
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>📊 Reporte de Evaluaciones</Text>
            <Text style={styles.previewSubtitle}>Flores Verdes - Sistema de Calidad</Text>
            
            <View style={styles.previewContent}>
              <Text style={styles.previewItem}>✅ Métricas principales</Text>
              <Text style={styles.previewItem}>✅ Operarios evaluados</Text>
              {incluirGraficos && <Text style={styles.previewItem}>✅ Gráficos de rendimiento</Text>}
              {incluirDetalles && <Text style={styles.previewItem}>✅ Detalles por evaluación</Text>}
              <Text style={styles.previewItem}>✅ Análisis de áreas</Text>
            </View>
          </View>
        </View>

        {/* BOTÓN DE EXPORTACIÓN */}
        <TouchableOpacity style={styles.exportButton} onPress={exportar}>
          <Text style={styles.exportButtonText}>
            💾 Exportar a {formatoSeleccionado}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 16,
  },
  formatContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formatButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E1E8ED',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  formatButtonSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#4A90E2',
  },
  formatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#657786',
  },
  formatTextSelected: {
    color: '#FFFFFF',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLabel: {
    fontSize: 16,
    color: '#14171A',
    flex: 1,
  },
  previewContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E1E8ED',
    borderStyle: 'dashed',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14171A',
    textAlign: 'center',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    color: '#657786',
    textAlign: 'center',
    marginBottom: 16,
  },
  previewContent: {
    marginTop: 8,
  },
  previewItem: {
    fontSize: 14,
    color: '#14171A',
    marginVertical: 4,
  },
  exportButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
});