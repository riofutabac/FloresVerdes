import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Button, Input, Select, MotorPuntuacion } from '../../components';
import { 
  MOCK_OPERARIOS, 
  AREAS_OPTIONS, 
  PARAMETROS_ENMALLADO, 
  PARAMETROS_CUADRANTE,
  VARIEDADES_ROSAS,
  MOCK_SUPERVISORES
} from '../../data';
import { Operario, Calificaciones, EvaluacionConPuntuacion, ParametroConPeso, Supervisor } from '../../types';

export const EvaluacionSubprocesosScreen: React.FC = () => {
  // 🎯 ESTADOS
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [codigoCuadrante, setCodigoCuadrante] = useState<string>('');
  const [operario, setOperario] = useState<Operario | null>(null);
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [observaciones, setObservaciones] = useState<string>('');
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [calificaciones, setCalificaciones] = useState<Calificaciones>({});
  const [evaluacionPuntuacion, setEvaluacionPuntuacion] = useState<EvaluacionConPuntuacion>({});

  // 🔍 BUSCAR OPERARIO (MOCK)
  const buscarOperario = () => {
    if (!codigoCuadrante.trim()) {
      setMensajeError('Complete el código de cuadrante');
      return;
    }

    // ✅ Validar que el código empiece con "C"
    const codigo = codigoCuadrante.trim().toUpperCase();
    if (!codigo.startsWith('C')) {
      setMensajeError('El código de cuadrante debe empezar con "C" (Ej: C1, C2, C3...)');
      return;
    }

    // 🎭 Simulación de búsqueda en datos mock
    const operarioEncontrado = MOCK_OPERARIOS.find(
      op => op.area === selectedArea && 
      op.cuadrante && // ✅ Verificar que cuadrante existe
      op.cuadrante.toLowerCase() === codigo.toLowerCase() &&
      op.proceso === 'Cosecha' // ✅ Solo buscar operarios de cosecha
    );

    if (operarioEncontrado) {
      setOperario(operarioEncontrado);
      
      // 👨‍💼 BUSCAR SUPERVISOR DEL ÁREA
      const supervisorAsignado = MOCK_SUPERVISORES.find(sup => sup.area === selectedArea);
      setSupervisor(supervisorAsignado || null);
      
      setMensajeError(null);
      Alert.alert('✅ Éxito', 'Operario verificado correctamente');
    } else {
      setOperario(null);
      setSupervisor(null);
      setMensajeError('No se encontró operario de COSECHA para ese cuadrante en esta área.');
    }
  };

  // 💾 GUARDAR EVALUACIÓN (MOCK)
  const guardarEvaluacion = () => {
    const totalParametros = PARAMETROS_ENMALLADO.length + PARAMETROS_CUADRANTE.length;
    const parametrosCalificados = Object.keys(calificaciones).length;
    
    // ✅ Validación más flexible - permite guardar con parámetros no calificados
    if (parametrosCalificados === 0) {
      setMensajeError('Debe calificar al menos un parámetro antes de guardar');
      return;
    }

    // 🎭 Simulación de guardado
    const evaluacionMock = {
      area: selectedArea,
      cuadrante: codigoCuadrante.toUpperCase(),
      operario: operario?.nombre,
      correo: operario?.correo,
      variedad: operario?.variedad,
      supervisor: supervisor?.nombre,
      supervisorCorreo: supervisor?.correo,
      observaciones,
      calificaciones,
      fechaRegistro: new Date().toISOString(),
    };

    console.log('📊 Evaluación guardada (MOCK):', evaluacionMock);
    
    // Limpiar formulario
    setObservaciones('');
    setCalificaciones({});
    setMensajeError(null);
    
    Alert.alert('💾 Guardado', 'Evaluación guardada exitosamente');
  };

  return (
    <ImageBackground
      source={require('../../../assets/splash-icon.png')} // Usando imagen existente
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      <ScrollView style={styles.container}>
        <View style={styles.overlay}>
          {/* 📋 SELECCIÓN DE ÁREA Y CUADRANTE */}
          <View style={styles.card}>
            <Select
              label="Selecciona el área"
              placeholder="Seleccionar área..."
              options={AREAS_OPTIONS}
              value={selectedArea}
              onSelect={(option) => setSelectedArea(option.value as string)}
              icon="🏢"
              required
            />

            <Input
              label="Código de Cuadrante"
              value={codigoCuadrante}
              onChangeText={setCodigoCuadrante}
              placeholder="Ej: C1, C2, C3..."
              icon="📍"
              required
              error={mensajeError || undefined}
            />

            <View style={styles.buttonContainer}>
              <Button
                title="🔍 Buscar Operario"
                variant="primary"
                onPress={buscarOperario}
                disabled={!selectedArea || !codigoCuadrante.trim()}
              />
            </View>
          </View>

          {/* 👤 INFORMACIÓN DEL OPERARIO */}
          {operario && (
            <View style={styles.operarioCard}>
              <Text style={styles.operarioTitle}>👤 Información del Operario</Text>
              <Text style={styles.operarioInfo}>Nombre: {operario.nombre}</Text>
              <Text style={styles.operarioInfo}>📧 Correo: {operario.correo}</Text>
              <Text style={styles.operarioInfo}>📅 Fecha de ingreso: {operario.fechaIngreso}</Text>
              <Text style={styles.operarioInfo}>♿ Discapacidad: {operario.discapacidad}</Text>
              
              {/* 🌹 VARIEDAD DE ROSA ASIGNADA */}
              <View style={styles.variedadContainer}>
                <Text style={styles.variedadTitle}>🌹 Variedad Asignada</Text>
                <View style={styles.variedadInfo}>
                  <View 
                    style={[
                      styles.colorIndicator, 
                      { backgroundColor: VARIEDADES_ROSAS.find(v => v.value === operario.variedad)?.color || '#CCCCCC' }
                    ]} 
                  />
                  <Text style={styles.variedadNombre}>{operario.variedad}</Text>
                  <Text style={styles.variedadTipo}>
                    ({VARIEDADES_ROSAS.find(v => v.value === operario.variedad)?.tipo || 'Sin tipo'})
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* �‍💼 INFORMACIÓN DEL SUPERVISOR */}
          {supervisor && (
            <View style={styles.supervisorCard}>
              <Text style={styles.supervisorTitle}>👨‍💼 Supervisor Asignado</Text>
              <Text style={styles.supervisorInfo}>Nombre: {supervisor.nombre}</Text>
              <Text style={styles.supervisorInfo}>📧 Correo: {supervisor.correo}</Text>
              <Text style={styles.supervisorInfo}>📱 Teléfono: {supervisor.telefono}</Text>
              <Text style={styles.supervisorInfo}>📅 Asignado desde: {supervisor.fechaAsignacion}</Text>
            </View>
          )}

          {/* �📊 EVALUACIONES */}
          {operario && (
            <>
              {/* ⚖️ MOTOR DE PUNTUACIÓN */}
              <MotorPuntuacion
                parametrosEnmallado={PARAMETROS_ENMALLADO}
                parametrosCuadrante={PARAMETROS_CUADRANTE}
                evaluacion={evaluacionPuntuacion}
              />

              <ExpandableEvaluation
                title="Enmallado"
                parametros={PARAMETROS_ENMALLADO}
                calificaciones={calificaciones}
                setCalificaciones={setCalificaciones}
                evaluacionPuntuacion={evaluacionPuntuacion}
                setEvaluacionPuntuacion={setEvaluacionPuntuacion}
              />

              <ExpandableEvaluation
                title="Cuadrante"
                parametros={PARAMETROS_CUADRANTE}
                calificaciones={calificaciones}
                setCalificaciones={setCalificaciones}
                evaluacionPuntuacion={evaluacionPuntuacion}
                setEvaluacionPuntuacion={setEvaluacionPuntuacion}
              />

              <Input
                label="Observaciones Generales"
                value={observaciones}
                onChangeText={setObservaciones}
                placeholder="Ingrese observaciones adicionales..."
                multiline
                numberOfLines={4}
                icon="📝"
              />

              <View style={styles.actionButtons}>
                <Button
                  title="💾 Guardar Evaluación"
                  variant="primary"
                  size="large"
                  fullWidth
                  onPress={guardarEvaluacion}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

// 📊 COMPONENTE DE EVALUACIÓN EXPANDIBLE
interface ExpandableEvaluationProps {
  title: string;
  parametros: ParametroConPeso[];
  calificaciones: Calificaciones;
  setCalificaciones: (calificaciones: Calificaciones) => void;
  evaluacionPuntuacion: EvaluacionConPuntuacion;
  setEvaluacionPuntuacion: (evaluacion: EvaluacionConPuntuacion) => void;
}

const ExpandableEvaluation: React.FC<ExpandableEvaluationProps> = ({
  title,
  parametros,
  calificaciones,
  setCalificaciones,
  evaluacionPuntuacion,
  setEvaluacionPuntuacion,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParams = parametros.filter(param =>
    param.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCalificacion = (parametro: ParametroConPeso) => {
    const key = `${title} - ${parametro.nombre}`;
    
    // 🎯 TOGGLE: Si ya está marcado como "No Cumple", lo deselecciona (vuelve a cumplir)
    const yaEstaSeleccionado = evaluacionPuntuacion[parametro.id];
    
    if (yaEstaSeleccionado) {
      // Deseleccionar - vuelve a cumplir (estado por defecto)
      const nuevasCalificaciones = { ...calificaciones };
      delete nuevasCalificaciones[key];
      setCalificaciones(nuevasCalificaciones);
      
      const nuevaEvaluacion = { ...evaluacionPuntuacion };
      delete nuevaEvaluacion[parametro.id];
      setEvaluacionPuntuacion(nuevaEvaluacion);
    } else {
      // Seleccionar como "No Cumple"
      setCalificaciones({
        ...calificaciones,
        [key]: 'No Cumple',
      });
      
      // 🎯 ACTUALIZAR PUNTUACIÓN - Marcado como no cumplido
      setEvaluacionPuntuacion({
        ...evaluacionPuntuacion,
        [parametro.id]: {
          cumple: false,
          observacion: 'Parámetro no cumplido',
        },
      });
    }
  };

  return (
    <View style={styles.evaluationCard}>
      <TouchableOpacity
        style={styles.evaluationHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.evaluationTitle}>{title}</Text>
        <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.evaluationContent}>
          <Input
            label="Buscar parámetro"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar..."
            icon="🔍"
          />

          <Text style={styles.paramCount}>
            Mostrando {filteredParams.length} de {parametros.length} parámetros
            {Object.keys(calificaciones).filter(key => key.startsWith(title)).length > 0 && 
              ` | ✅ ${Object.keys(calificaciones).filter(key => key.startsWith(title)).length} calificados`
            }
          </Text>

          {filteredParams.length === 0 ? (
            <Text style={styles.noResults}>Sin coincidencias</Text>
          ) : (
            filteredParams.map((parametro, index) => {
              const key = `${title} - ${parametro.nombre}`;
              const yaNoFcumple = evaluacionPuntuacion[parametro.id];
              const estaSeleccionado = !!yaNoFcumple;

              return (
                <View key={parametro.id} style={styles.parametroRow}>
                  <View style={styles.parametroHeader}>
                    <Text style={styles.parametroText}>{parametro.nombre}</Text>
                    <Text style={styles.pesoText}>Peso: {parametro.peso}</Text>
                  </View>
                  
                  <View style={styles.calificacionButtons}>
                    <Button
                      title={estaSeleccionado ? "❌ No Cumple (Seleccionado)" : "❌ Marcar como No Cumple"}
                      variant={estaSeleccionado ? 'primary' : 'outline'}
                      size="small"
                      onPress={() => handleCalificacion(parametro)}
                      style={styles.calificacionButton}
                    />
                  </View>
                  
                  {/* 📊 INDICADOR DE IMPACTO EN PUNTAJE */}
                  {estaSeleccionado && (
                    <View style={styles.estadoContainer}>
                      <Text style={[styles.estadoTexto, { color: '#F44336' }]}>
                        ❌ -{parametro.peso} puntos (No cumple)
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContainer: {
    alignItems: 'flex-end',
    marginTop: 16,
  },
  operarioCard: {
    backgroundColor: '#F1F1F1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  operarioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  operarioInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  variedadContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  variedadTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  variedadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  variedadNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  variedadTipo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  supervisorCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  supervisorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  supervisorInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  evaluationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  evaluationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  evaluationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
  },
  evaluationContent: {
    padding: 16,
    paddingTop: 0,
  },
  paramCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  noResults: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  parametroRow: {
    marginBottom: 16,
  },
  parametroHeader: {
    marginBottom: 8,
  },
  parametroText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  pesoText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  calificacionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calificacionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  estadoContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    marginTop: 24,
    gap: 16,
  },
});