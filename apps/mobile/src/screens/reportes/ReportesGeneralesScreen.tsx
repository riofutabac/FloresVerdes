import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { MOCK_OPERARIOS, MOCK_EVALUACIONES_GUARDADAS } from '../../data/mockData';
import { ReporteGeneral } from '../../types';

interface NavigationProp {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface Props {
  navigation: NavigationProp;
}

const { width } = Dimensions.get('window');

export const ReportesGeneralesScreen: React.FC<Props> = ({ navigation }) => {
  const [reporteGeneral, setReporteGeneral] = useState<ReporteGeneral | null>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState<'dia' | 'semana' | 'mes'>('mes');

  useEffect(() => {
    generarReporteGeneral();
  }, [selectedPeriodo]);

  // 📊 GENERAR REPORTE GENERAL
  const generarReporteGeneral = () => {
    const todasEvaluaciones = MOCK_EVALUACIONES_GUARDADAS;
    const operariosUnicos = [...new Set(todasEvaluaciones.map(e => e.operarioId))];
    
    const promedioGeneral = todasEvaluaciones.length > 0 
      ? Math.round(todasEvaluaciones.reduce((sum, e) => sum + e.resultado.porcentajeCumplimiento, 0) / todasEvaluaciones.length)
      : 0;

    // Operarios por área
    const operariosPorArea: { [area: string]: { cantidad: number; promedio: number } } = {};
    
    MOCK_OPERARIOS.forEach(operario => {
      const area = operario.area || 'Sin Área';
      const evaluacionesOperario = todasEvaluaciones.filter(e => e.operarioId === operario.id);
      
      if (!operariosPorArea[area]) {
        operariosPorArea[area] = { cantidad: 0, promedio: 0 };
      }
      
      operariosPorArea[area].cantidad += 1;
      
      if (evaluacionesOperario.length > 0) {
        const promedioOperario = evaluacionesOperario.reduce((sum, e) => sum + e.resultado.porcentajeCumplimiento, 0) / evaluacionesOperario.length;
        operariosPorArea[area].promedio = (operariosPorArea[area].promedio + promedioOperario) / 2;
      }
    });

    // Tendencia mensual (simulada)
    const tendenciaMensual = [
      { mes: 'Ene 2024', promedio: 78 },
      { mes: 'Feb 2024', promedio: 82 },
      { mes: 'Mar 2024', promedio: 85 },
      { mes: 'Abr 2024', promedio: 87 },
      { mes: 'May 2024', promedio: promedioGeneral },
    ];

    // Mejores operarios
    const promediosPorOperario: { [operarioId: string]: number } = {};
    operariosUnicos.forEach(operarioId => {
      const evaluacionesOperario = todasEvaluaciones.filter(e => e.operarioId === operarioId);
      if (evaluacionesOperario.length > 0) {
        promediosPorOperario[operarioId] = Math.round(
          evaluacionesOperario.reduce((sum, e) => sum + e.resultado.porcentajeCumplimiento, 0) / evaluacionesOperario.length
        );
      }
    });

    const mejoresOperarios = Object.entries(promediosPorOperario)
      .map(([operarioId, promedio]) => ({
        operarioId,
        nombre: MOCK_OPERARIOS.find(o => o.id === operarioId)?.nombre || 'Desconocido',
        promedio,
      }))
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, 5);

    // Áreas de riesgo (promedio < 80%)
    const areasDeRiesgo = Object.entries(operariosPorArea)
      .filter(([area, data]) => data.promedio < 80)
      .map(([area, data]) => ({
        area,
        promedio: Math.round(data.promedio),
      }))
      .sort((a, b) => a.promedio - b.promedio);

    const reporte: ReporteGeneral = {
      fechaGeneracion: new Date().toISOString(),
      fechaInicio: '2024-01-01T00:00:00Z',
      fechaFin: new Date().toISOString(),
      totalOperarios: operariosUnicos.length,
      totalEvaluaciones: todasEvaluaciones.length,
      promedioGeneral,
      objetivo: 100,
      operariosPorArea,
      tendenciaMensual,
      mejoresOperarios,
      areasDeRiesgo,
    };

    setReporteGeneral(reporte);
  };

  const getColorForScore = (score: number) => {
    if (score >= 90) return '#7ED321'; // Verde
    if (score >= 70) return '#F5A623'; // Amarillo
    return '#D0021B'; // Rojo
  };

  // 📈 RENDERIZAR GRÁFICO DE BARRAS
  const renderBarChart = (data: { label: string; value: number }[], maxValue: number = 100) => {
    return (
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const barWidth = (item.value / maxValue) * (width - 120);
          return (
            <View key={index} style={styles.chartRow}>
              <Text style={styles.chartLabel}>{item.label}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { 
                  width: barWidth, 
                  backgroundColor: getColorForScore(item.value) 
                }]} />
                <Text style={styles.barValue}>{item.value}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // 📊 RENDERIZAR TENDENCIA
  const renderTrendChart = (tendencia: { mes: string; promedio: number }[]) => {
    const maxPromedio = Math.max(...tendencia.map(t => t.promedio));
    
    return (
      <View style={styles.trendContainer}>
        <Text style={styles.chartTitle}>📈 Tendencia de Rendimiento</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.trendChart}>
            {tendencia.map((item, index) => {
              const barHeight = (item.promedio / maxPromedio) * 100;
              return (
                <View key={index} style={styles.trendColumn}>
                  <View style={styles.trendBarContainer}>
                    <View style={[styles.trendBar, { 
                      height: barHeight,
                      backgroundColor: getColorForScore(item.promedio)
                    }]} />
                  </View>
                  <Text style={styles.trendValue}>{item.promedio}%</Text>
                  <Text style={styles.trendLabel}>{item.mes}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const exportarReporteGeneral = () => {
    Alert.alert(
      '💾 Exportar Reporte General',
      '¿Qué formato desea utilizar?',
      [
        { text: 'PDF 📄', onPress: () => Alert.alert('📄', 'Generando PDF del reporte general...') },
        { text: 'Word 📝', onPress: () => Alert.alert('📝', 'Generando documento Word...') },
        { text: 'Excel 📊', onPress: () => Alert.alert('📊', 'Generando hoja de Excel...') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  if (!reporteGeneral) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>📊 Generando reporte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 📊 MÉTRICAS PRINCIPALES */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>📈 Métricas Principales</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricNumber}>{reporteGeneral.totalOperarios}</Text>
              <Text style={styles.metricLabel}>Operarios</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricNumber}>{reporteGeneral.totalEvaluaciones}</Text>
              <Text style={styles.metricLabel}>Evaluaciones</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricNumber, { color: getColorForScore(reporteGeneral.promedioGeneral) }]}>
                {reporteGeneral.promedioGeneral}%
              </Text>
              <Text style={styles.metricLabel}>Promedio</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricNumber}>{reporteGeneral.objetivo}%</Text>
              <Text style={styles.metricLabel}>Objetivo</Text>
            </View>
          </View>
        </View>

        {/* 📊 RENDIMIENTO POR ÁREA */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🏢 Rendimiento por Área</Text>
          {renderBarChart(
            Object.entries(reporteGeneral.operariosPorArea).map(([area, data]) => ({
              label: area,
              value: Math.round(data.promedio),
            }))
          )}
        </View>

        {/* 📈 TENDENCIA MENSUAL */}
        <View style={styles.sectionContainer}>
          {renderTrendChart(reporteGeneral.tendenciaMensual)}
        </View>

        {/* 🏆 MEJORES OPERARIOS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🏆 Mejores Operarios</Text>
          {reporteGeneral.mejoresOperarios.map((operario, index) => (
            <View key={operario.operarioId} style={styles.rankingCard}>
              <View style={styles.rankingPosition}>
                <Text style={styles.rankingNumber}>#{index + 1}</Text>
              </View>
              <View style={styles.rankingInfo}>
                <Text style={styles.rankingName}>{operario.nombre}</Text>
              </View>
              <View style={[styles.rankingScore, { backgroundColor: getColorForScore(operario.promedio) }]}>
                <Text style={styles.rankingScoreText}>{operario.promedio}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ⚠️ ÁREAS DE RIESGO */}
        {reporteGeneral.areasDeRiesgo.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>⚠️ Áreas de Riesgo</Text>
            {reporteGeneral.areasDeRiesgo.map((area, index) => (
              <View key={index} style={styles.riskCard}>
                <Text style={styles.riskArea}>🏢 {area.area}</Text>
                <Text style={styles.riskScore}>{area.promedio}% (&lt; 80%)</Text>
              </View>
            ))}
          </View>
        )}

        {/* 💾 EXPORTAR */}
        <View style={styles.exportContainer}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={exportarReporteGeneral}
          >
            <Text style={styles.exportButtonText}>💾 Exportar Reporte Completo</Text>
          </TouchableOpacity>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#657786',
  },
  metricsContainer: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#657786',
  },
  sectionContainer: {
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
  chartContainer: {
    marginTop: 8,
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
  trendContainer: {
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171A',
    marginBottom: 16,
    textAlign: 'center',
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 16,
  },
  trendColumn: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 50,
  },
  trendBarContainer: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  trendBar: {
    width: 20,
    borderRadius: 2,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#14171A',
    marginTop: 4,
  },
  trendLabel: {
    fontSize: 10,
    color: '#657786',
    marginTop: 2,
    textAlign: 'center',
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  rankingPosition: {
    width: 40,
    alignItems: 'center',
  },
  rankingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  rankingInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#14171A',
  },
  rankingScore: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rankingScoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  riskCard: {
    backgroundColor: '#FFF5F5',
    borderLeftColor: '#D0021B',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskArea: {
    fontSize: 16,
    fontWeight: '500',
    color: '#14171A',
  },
  riskScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D0021B',
  },
  exportContainer: {
    padding: 16,
  },
  exportButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
});