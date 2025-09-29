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
import { Button, Input, Select, SelectOption } from '../../components';

// 🎭 DATOS MOCK - Frontend only
const MOCK_OPERARIOS = [
  { id: '1', nombre: 'Juan Pérez', correo: 'juan@floresverdes.com', area: 'Área 1', cuadrante: 'C1', discapacidad: 'Ninguna', fechaIngreso: '2023-01-15' },
  { id: '2', nombre: 'María González', correo: 'maria@floresverdes.com', area: 'Área 1', cuadrante: 'C2', discapacidad: 'Ninguna', fechaIngreso: '2023-02-20' },
  { id: '3', nombre: 'Carlos Rodríguez', correo: 'carlos@floresverdes.com', area: 'Área 2', cuadrante: 'C3', discapacidad: 'Visual leve', fechaIngreso: '2023-03-10' },
  { id: '4', nombre: 'Ana Martínez', correo: 'ana@floresverdes.com', area: 'Área 3', cuadrante: 'C4', discapacidad: 'Ninguna', fechaIngreso: '2023-04-05' },
  { id: '5', nombre: 'Luis García', correo: 'luis@floresverdes.com', area: 'Área 1', cuadrante: 'C5', discapacidad: 'Ninguna', fechaIngreso: '2023-05-12' },
  { id: '6', nombre: 'Carmen López', correo: 'carmen@floresverdes.com', area: 'Área 2', cuadrante: 'C6', discapacidad: 'Auditiva leve', fechaIngreso: '2023-06-18' },
  { id: '7', nombre: 'Pedro Herrera', correo: 'pedro@floresverdes.com', area: 'Área 4', cuadrante: 'C7', discapacidad: 'Ninguna', fechaIngreso: '2023-07-22' },
  { id: '8', nombre: 'Sofia Torres', correo: 'sofia@floresverdes.com', area: 'Área 3', cuadrante: 'C8', discapacidad: 'Ninguna', fechaIngreso: '2023-08-30' },
];

const AREAS_OPTIONS: SelectOption[] = [
  { label: 'Área 1', value: 'Área 1' },
  { label: 'Área 2', value: 'Área 2' },
  { label: 'Área 3', value: 'Área 3' },
  { label: 'Área 4', value: 'Área 4' },
];

// 🎭 PARÁMETROS MOCK
const PARAMETROS_ENMALLADO = [
  "Nivel de agua (mínimo 40 cm)",
  "Limpieza adecuada de tinas y tachos (turbidez)",
  "Aseo del coche",
  "Uso de E.P.P. (guantes, botas y envase de desinfectante)",
  "Correcto uso de coche de corte",
  "Desinfección frecuente de tijeras",
  "Flor en coches (50 tallos máx. por cuna con separadores)",
  "Manipulación correcta de flor en corte o enmallado",
  "Ajuste de la malla",
  "Inconsistencia en punto de corte",
  "Flor abierta en camas (cuadrante)",
  "No mezcla de largos de tallos",
  "Flor sin hidratación (excepto pedidos especiales)",
  "Flor sin maltrato por enmallado",
  "Flor sin tocones/yemas",
  "Ticket de corte (operador/bloque)",
  "Tallas menores de 40 cm",
  "25 botones por malla (según variedad)",
  "Niveles (ubicación de botones) y a 10 cm",
  "Tallos descabezados o follaje maltratado",
  "Número adecuado de mallas en fina o tacho",
  "No desperdicio",
  "Orden y aseo del área",
  "Flor sin enfermedades",
  "Flor manchada con químicos",
  "Estado de coches, mesas (ruedas, estructura, canaste)",
  "Estado de aviones",
  "Estado de tijeras",
  "Ubicación/tinas en paraderos (bajo sombra)",
  "Número de mallas por espina de pescado",
  "Manipulación correcta de mallas",
  "Tiempo adecuado de ejecución de labores",
  "Uso de E.P.P.",
  "Entrega de desinfectante",
  "Mallas sueltas en el piso",
  "Estado adecuado de mallas"
];

const PARAMETROS_CUADRANTE = [
  "¿Eliminación correcta de brotes?",
  "¿Limpieza de hojas adecuada?",
  "¿Sin daño a tallos principales?",
  "¿Cobertura uniforme de tratamientos?",
  "¿Cumplimiento del calendario?"
];

interface Operario {
  id: string;
  nombre: string;
  correo: string;
  area: string;
  cuadrante: string;
  discapacidad: string;
  fechaIngreso: string;
}

interface Calificaciones {
  [key: string]: 'Alto' | 'Medio' | 'Bajo';
}

export const EvaluacionSubprocesosScreen: React.FC = () => {
  // 🎯 ESTADOS
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [codigoCuadrante, setCodigoCuadrante] = useState<string>('');
  const [operario, setOperario] = useState<Operario | null>(null);
  const [observaciones, setObservaciones] = useState<string>('');
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [calificaciones, setCalificaciones] = useState<Calificaciones>({});

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
      op.cuadrante.toLowerCase() === codigo.toLowerCase()
    );

    if (operarioEncontrado) {
      setOperario(operarioEncontrado);
      setMensajeError(null);
      Alert.alert('✅ Éxito', 'Operario verificado correctamente');
    } else {
      setOperario(null);
      setMensajeError('No se encontró operario para ese cuadrante.');
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
          <Text style={styles.title}>Evaluación de Cosecha</Text>

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
            </View>
          )}

          {/* 📊 EVALUACIONES */}
          {operario && (
            <>
              <ExpandableEvaluation
                title="Enmallado"
                parametros={PARAMETROS_ENMALLADO}
                calificaciones={calificaciones}
                setCalificaciones={setCalificaciones}
              />

              <ExpandableEvaluation
                title="Cuadrante"
                parametros={PARAMETROS_CUADRANTE}
                calificaciones={calificaciones}
                setCalificaciones={setCalificaciones}
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
                
                <Button
                  title="📊 Revisar Reportes"
                  variant="secondary"
                  size="large"
                  fullWidth
                  onPress={() => Alert.alert('📊 Reportes', 'Navegando a reportes...')}
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
  parametros: string[];
  calificaciones: Calificaciones;
  setCalificaciones: (calificaciones: Calificaciones) => void;
}

const ExpandableEvaluation: React.FC<ExpandableEvaluationProps> = ({
  title,
  parametros,
  calificaciones,
  setCalificaciones,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParams = parametros.filter(param =>
    param.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCalificacion = (parametro: string, calificacion: 'Alto' | 'Medio' | 'Bajo') => {
    const key = `${title} - ${parametro}`;
    const calificacionActual = calificaciones[key];
    
    // 🎯 TOGGLE: Si ya está seleccionado el mismo nivel, lo deselecciona
    if (calificacionActual === calificacion) {
      const nuevasCalificaciones = { ...calificaciones };
      delete nuevasCalificaciones[key]; // Quitar la calificación
      setCalificaciones(nuevasCalificaciones);
    } else {
      // Seleccionar nueva calificación
      setCalificaciones({
        ...calificaciones,
        [key]: calificacion,
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
              const key = `${title} - ${parametro}`;
              const calificacionSeleccionada = calificaciones[key];

              return (
                <View key={index} style={styles.parametroRow}>
                  <Text style={styles.parametroText}>{parametro}</Text>
                  
                  <View style={styles.calificacionButtons}>
                    {(['Alto', 'Medio', 'Bajo'] as const).map((nivel) => (
                      <Button
                        key={nivel}
                        title={nivel}
                        variant={calificacionSeleccionada === nivel ? 'primary' : 'outline'}
                        size="small"
                        onPress={() => handleCalificacion(parametro, nivel)}
                        style={styles.calificacionButton}
                      />
                    ))}
                  </View>
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
  parametroText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  calificacionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calificacionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtons: {
    marginTop: 24,
    gap: 16,
  },
});