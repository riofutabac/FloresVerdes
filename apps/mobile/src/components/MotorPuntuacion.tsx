import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { ParametroConPeso, EvaluacionConPuntuacion, ResultadoPuntuacion } from '../types';

interface MotorPuntuacionProps {
  parametrosEnmallado: ParametroConPeso[];
  parametrosCuadrante: ParametroConPeso[];
  evaluacion: EvaluacionConPuntuacion;
}

export const MotorPuntuacion: React.FC<MotorPuntuacionProps> = ({
  parametrosEnmallado,
  parametrosCuadrante,
  evaluacion,
}) => {
  
  // 🧮 CALCULAR PUNTUACIÓN EN TIEMPO REAL
  const calcularPuntuacion = (): ResultadoPuntuacion => {
    const todosLosParametros = [...parametrosEnmallado, ...parametrosCuadrante];
    
    // Calcular puntaje máximo total
    const puntajeMaximo = todosLosParametros.reduce((total, param) => total + param.peso, 0);
    
    // 🎯 NUEVO SISTEMA: Solo los marcados como "no cumple" restan puntos
    // Por defecto todos cumplen (100%), solo los seleccionados no cumplen
    const parametrosNoCumplidos: string[] = [];
    const parametrosCumplidos: string[] = [];
    
    let descuento = 0;
    
    todosLosParametros.forEach(param => {
      const estado = evaluacion[param.id];
      if (estado && !estado.cumple) {
        // Solo los marcados explícitamente como "no cumple"
        parametrosNoCumplidos.push(param.id);
        descuento += param.peso;
      } else {
        // Todos los demás cumplen por defecto
        parametrosCumplidos.push(param.id);
      }
    });
    
    const puntajeObtenido = Math.max(0, puntajeMaximo - descuento);
    const porcentajeCumplimiento = puntajeMaximo > 0 ? (puntajeObtenido / puntajeMaximo) * 100 : 100;
    
    return {
      puntajeMaximo,
      puntajeObtenido,
      porcentajeCumplimiento,
      parametrosNoCumplidos,
      parametrosCumplidos,
    };
  };

  const resultado = calcularPuntuacion();
  
  // 🎨 DETERMINAR COLOR SEGÚN PORCENTAJE
  const getColorPorcentaje = (porcentaje: number): string => {
    if (porcentaje >= 90) return '#4CAF50'; // Verde excelente
    if (porcentaje >= 75) return '#8BC34A'; // Verde bueno
    if (porcentaje >= 60) return '#FFC107'; // Amarillo regular
    if (porcentaje >= 40) return '#FF9800'; // Naranja malo
    return '#F44336'; // Rojo crítico
  };

  const getTextoDesempeño = (porcentaje: number): string => {
    if (porcentaje >= 90) return 'Excelente';
    if (porcentaje >= 75) return 'Bueno';
    if (porcentaje >= 60) return 'Regular';
    if (porcentaje >= 40) return 'Malo';
    return 'Crítico';
  };

  const colorActual = getColorPorcentaje(resultado.porcentajeCumplimiento);

  return (
    <View style={styles.container}>
      {/* 🎯 TARJETA PRINCIPAL DE PUNTUACIÓN */}
      <View style={[styles.puntuacionCard, { borderLeftColor: colorActual }]}>
        <View style={styles.puntuacionHeader}>
          <Text style={styles.puntuacionTitulo}>🎯 Motor de Puntuación</Text>
        </View>

        {/* 📊 INDICADORES PRINCIPALES */}
        <View style={styles.indicadoresContainer}>
          <View style={styles.indicadorPrincipal}>
            <Text style={[styles.porcentajeTexto, { color: colorActual }]}>
              {resultado.porcentajeCumplimiento.toFixed(1)}%
            </Text>
            <Text style={styles.desempeñoTexto}>
              {getTextoDesempeño(resultado.porcentajeCumplimiento)}
            </Text>
          </View>

          <View style={styles.puntajesContainer}>
            <View style={styles.puntajeItem}>
              <Text style={styles.puntajeValor}>{resultado.puntajeObtenido}</Text>
              <Text style={styles.puntajeLabel}>Obtenido</Text>
            </View>
            <Text style={styles.separador}>/</Text>
            <View style={styles.puntajeItem}>
              <Text style={styles.puntajeValor}>{resultado.puntajeMaximo}</Text>
              <Text style={styles.puntajeLabel}>Máximo</Text>
            </View>
          </View>
        </View>

        {/* 📈 BARRA DE PROGRESO */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${resultado.porcentajeCumplimiento}%`,
                  backgroundColor: colorActual 
                }
              ]} 
            />
          </View>
        </View>

        {/* 📋 ESTADÍSTICAS DETALLADAS */}
        <View style={styles.estadisticasContainer}>
          <View style={styles.estadisticaItem}>
            <Text style={styles.estadisticaValor}>
              {(parametrosEnmallado.length + parametrosCuadrante.length) - resultado.parametrosNoCumplidos.length}
            </Text>
            <Text style={styles.estadisticaLabel}>✅ Cumplidos</Text>
          </View>
          
          <View style={styles.estadisticaItem}>
            <Text style={[styles.estadisticaValor, { color: '#F44336' }]}>
              {resultado.parametrosNoCumplidos.length}
            </Text>
            <Text style={styles.estadisticaLabel}>❌ No Cumplidos</Text>
          </View>
          
          <View style={styles.estadisticaItem}>
            <Text style={styles.estadisticaValor}>
              {parametrosEnmallado.length + parametrosCuadrante.length}
            </Text>
            <Text style={styles.estadisticaLabel}>📊 Total</Text>
          </View>
        </View>

        {/* ⚠️ MENSAJE DE ESTADO */}
        <View style={styles.mensajeContainer}>
          {Object.keys(evaluacion).length === 0 ? (
            <Text style={styles.mensajeInfo}>
              ✅ 100% - Todos los parámetros cumplen por defecto. Marque los que NO cumplen para ver descuentos.
            </Text>
          ) : (
            <Text style={styles.mensajeInfo}>
              🔄 Puntuación actualizada - Solo los marcados como "No Cumple" restan puntos
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  puntuacionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 6,
  },
  puntuacionHeader: {
    marginBottom: 16,
  },
  puntuacionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  indicadoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  indicadorPrincipal: {
    alignItems: 'center',
  },
  porcentajeTexto: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  desempeñoTexto: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  puntajesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  puntajeItem: {
    alignItems: 'center',
  },
  puntajeValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  puntajeLabel: {
    fontSize: 12,
    color: '#666',
  },
  separador: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginHorizontal: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  estadisticasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  estadisticaItem: {
    alignItems: 'center',
  },
  estadisticaValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  estadisticaLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  mensajeContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  mensajeInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});