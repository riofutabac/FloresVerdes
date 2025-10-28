import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { MOCK_OPERARIOS, MOCK_EVALUACIONES_GUARDADAS } from '../../data/mockData';
import { ReporteIndividual, EvaluacionGuardada } from '../../types';

interface NavigationProp {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProp;
}

const { width } = Dimensions.get('window');

export const ReportesIndividualesScreen: React.FC<Props> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [reportes, setReportes] = useState<ReporteIndividual[]>([]);
  const [selectedReporte, setSelectedReporte] = useState<ReporteIndividual | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    generarReportesIndividuales();
  }, []);

  // 📊 GENERAR REPORTES INDIVIDUALES A PARTIR DE EVALUACIONES
  const generarReportesIndividuales = () => {
    const operariosCosecha = MOCK_OPERARIOS.filter(op => op.proceso === 'Cosecha');
    const reportesGenerados: ReporteIndividual[] = [];

    // Calcular promedio general de todos los operarios
    const todasEvaluaciones = MOCK_EVALUACIONES_GUARDADAS;
    const promedioGeneral = todasEvaluaciones.length > 0 
      ? todasEvaluaciones.reduce((sum, evaluacion) => sum + evaluacion.resultado.porcentajeCumplimiento, 0) / todasEvaluaciones.length
      : 0;

    operariosCosecha.forEach(operario => {
      const evaluacionesOperario = MOCK_EVALUACIONES_GUARDADAS.filter(
        evaluacion => evaluacion.operarioId === operario.id
      );

      if (evaluacionesOperario.length > 0) {
        const promedioOperario = evaluacionesOperario.reduce(
          (sum, evaluacion) => sum + evaluacion.resultado.porcentajeCumplimiento, 0
        ) / evaluacionesOperario.length;

        const fechas = evaluacionesOperario.map(evaluacion => new Date(evaluacion.fechaRegistro));
        const fechaInicio = new Date(Math.min(...fechas.map(f => f.getTime()))).toISOString();
        const fechaFin = new Date(Math.max(...fechas.map(f => f.getTime()))).toISOString();

        const reporte: ReporteIndividual = {
          operarioId: operario.id,
          operarioNombre: operario.nombre,
          cuadrante: operario.cuadrante || 'N/A',
          variedad: operario.variedad,
          area: operario.area || 'N/A',
          evaluaciones: evaluacionesOperario,
          promedioOperario: Math.round(promedioOperario),
          objetivo: 100,
          promedioGeneral: Math.round(promedioGeneral),
          totalEvaluaciones: evaluacionesOperario.length,
          fechaInicio,
          fechaFin,
        };

        reportesGenerados.push(reporte);
      }
    });

    setReportes(reportesGenerados);
  };

  const filteredReportes = reportes.filter(reporte =>
    reporte.operarioNombre.toLowerCase().includes(search.toLowerCase()) ||
    reporte.cuadrante.toLowerCase().includes(search.toLowerCase()) ||
    reporte.area.toLowerCase().includes(search.toLowerCase())
  );

  // 📈 GENERAR GRÁFICO SIMPLE (representación visual con barras)
  const renderBarChart = (reporte: ReporteIndividual) => {
    const maxValue = 100;
    const promedioWidth = (reporte.promedioOperario / maxValue) * (width - 120);
    const objetivoWidth = (reporte.objetivo / maxValue) * (width - 120);
    const generalWidth = (reporte.promedioGeneral / maxValue) * (width - 120);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>📊 Rendimiento vs Objetivo</Text>
        
        {/* Promedio del Operario */}
        <View style={styles.chartRow}>
          <Text style={styles.chartLabel}>Promedio Operario</Text>
          <View style={styles.barContainer}>
            <View style={[styles.bar, { width: promedioWidth, backgroundColor: getColorForScore(reporte.promedioOperario) }]} />
            <Text style={styles.barValue}>{reporte.promedioOperario}%</Text>
          </View>
        </View>

        {/* Objetivo */}
        <View style={styles.chartRow}>
          <Text style={styles.chartLabel}>Objetivo</Text>
          <View style={styles.barContainer}>
            <View style={[styles.bar, { width: objetivoWidth, backgroundColor: '#4A90E2' }]} />
            <Text style={styles.barValue}>{reporte.objetivo}%</Text>
          </View>
        </View>

        {/* Promedio General */}
        <View style={styles.chartRow}>
          <Text style={styles.chartLabel}>Promedio General</Text>
          <View style={styles.barContainer}>
            <View style={[styles.bar, { width: generalWidth, backgroundColor: '#7ED321' }]} />
            <Text style={styles.barValue}>{reporte.promedioGeneral}%</Text>
          </View>
        </View>
      </View>
    );
  };

  const getColorForScore = (score: number) => {
    if (score >= 90) return '#7ED321'; // Verde
    if (score >= 70) return '#F5A623'; // Amarillo
    return '#D0021B'; // Rojo
  };

  const exportarReporte = (reporte: ReporteIndividual) => {
    Alert.alert(
      '💾 Exportar Reporte',
      `¿Desea exportar el reporte de ${reporte.operarioNombre}?`,
      [
        { text: 'PDF 📄', onPress: () => exportarPDF(reporte) },
        { text: 'Word 📝', onPress: () => exportarWord(reporte) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const exportarPDF = (reporte: ReporteIndividual) => {
    // En una implementación real, aquí se generaría el PDF
    Alert.alert('📄 PDF', `Generando PDF para ${reporte.operarioNombre}...`);
  };

  const exportarWord = (reporte: ReporteIndividual) => {
    // En una implementación real, aquí se generaría el Word
    Alert.alert('📝 Word', `Generando documento Word para ${reporte.operarioNombre}...`);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 🔍 BÚSQUEDA */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            onChangeText={setSearch}
            value={search}
            placeholderTextColor="#999"
          />
        </View>

        {/* 📊 ESTADÍSTICAS */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📈 Resumen de Reportes Individuales</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{reportes.length}</Text>
              <Text style={styles.statLabel}>Operarios con Reportes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {reportes.length > 0 
                  ? Math.round(reportes.reduce((sum, r) => sum + r.promedioOperario, 0) / reportes.length)
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>Promedio General</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {reportes.reduce((sum, r) => sum + r.totalEvaluaciones, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Evaluaciones</Text>
            </View>
          </View>
        </View>

        {/* 📋 LISTA DE REPORTES */}
        <View style={styles.reportesContainer}>
          <Text style={styles.sectionTitle}>👥 Reportes por Operario</Text>
          
          {filteredReportes.map((reporte) => (
            <TouchableOpacity
              key={reporte.operarioId}
              style={styles.reporteCard}
              onPress={() => {
                setSelectedReporte(reporte);
                setModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.reporteHeader}>
                <View style={styles.reporteInfo}>
                  <Text style={styles.reporteNombre}>{reporte.operarioNombre}</Text>
                  <Text style={styles.reporteDetalles}>
                    🏢 {reporte.area} • 📍 {reporte.cuadrante} • 🌹 {reporte.variedad}
                  </Text>
                </View>
                <View style={[styles.scoreContainer, { backgroundColor: getColorForScore(reporte.promedioOperario) }]}>
                  <Text style={styles.scoreText}>{reporte.promedioOperario}%</Text>
                </View>
              </View>
              
              <View style={styles.reporteStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statItemLabel}>Evaluaciones:</Text>
                  <Text style={styles.statItemValue}>{reporte.totalEvaluaciones}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statItemLabel}>vs Objetivo:</Text>
                  <Text style={[styles.statItemValue, { 
                    color: reporte.promedioOperario >= reporte.objetivo ? '#7ED321' : '#D0021B' 
                  }]}>
                    {reporte.promedioOperario >= reporte.objetivo ? '✅' : '❌'} {reporte.objetivo}%
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.exportButton}
                onPress={() => exportarReporte(reporte)}
              >
                <Text style={styles.exportButtonText}>💾 Exportar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 📱 MODAL DE DETALLE */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedReporte && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>📊 Reporte Detallado</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalOperarioName}>{selectedReporte.operarioNombre}</Text>
                  <Text style={styles.modalOperarioDetails}>
                    🏢 {selectedReporte.area} • 📍 {selectedReporte.cuadrante} • 🌹 {selectedReporte.variedad}
                  </Text>
                </View>

                {renderBarChart(selectedReporte)}

                <View style={styles.evaluacionesSection}>
                  <Text style={styles.evaluacionesTitle}>📋 Historial de Evaluaciones</Text>
                  {selectedReporte.evaluaciones.map((evaluacion, index) => (
                    <View key={evaluacion.id} style={styles.evaluacionCard}>
                      <Text style={styles.evaluacionFecha}>
                        📅 {new Date(evaluacion.fechaRegistro).toLocaleDateString()}
                      </Text>
                      <Text style={styles.evaluacionSubproceso}>
                        🔧 {evaluacion.subproceso}
                      </Text>
                      <View style={styles.evaluacionScore}>
                        <Text style={[styles.evaluacionPorcentaje, {
                          color: getColorForScore(evaluacion.resultado.porcentajeCumplimiento)
                        }]}>
                          {evaluacion.resultado.porcentajeCumplimiento}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  reportesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 16,
  },
  reporteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reporteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reporteInfo: {
    flex: 1,
  },
  reporteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 4,
  },
  reporteDetalles: {
    fontSize: 14,
    color: '#657786',
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reporteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: 14,
    color: '#657786',
    marginRight: 4,
  },
  statItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14171A',
  },
  exportButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartRow: {
    marginBottom: 12,
  },
  chartLabel: {
    fontSize: 14,
    color: '#657786',
    marginBottom: 4,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 24,
    borderRadius: 4,
    marginRight: 8,
  },
  barValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14171A',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#14171A',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#657786',
  },
  modalInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalOperarioName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 4,
  },
  modalOperarioDetails: {
    fontSize: 14,
    color: '#657786',
  },
  evaluacionesSection: {
    marginTop: 16,
  },
  evaluacionesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 12,
  },
  evaluacionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evaluacionFecha: {
    fontSize: 12,
    color: '#657786',
  },
  evaluacionSubproceso: {
    fontSize: 14,
    color: '#14171A',
    flex: 1,
    marginHorizontal: 8,
  },
  evaluacionScore: {
    alignItems: 'flex-end',
  },
  evaluacionPorcentaje: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
});