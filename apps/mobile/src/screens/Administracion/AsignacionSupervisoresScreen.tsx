import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Modal,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Supervisor } from '../../types';
import { MOCK_SUPERVISORES, AREAS_OPTIONS } from '../../data/mockData';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { SearchBar } from '../../components/SearchBar';

type Props = StackScreenProps<RootStackParamList, 'AsignacionSupervisores'>;

const AsignacionSupervisoresScreen = ({ navigation }: Props) => {
  // 📋 ESTADO DE DATOS
  const [supervisores, setSupervisores] = useState<Supervisor[]>(MOCK_SUPERVISORES);
  const [busqueda, setBusqueda] = useState('');
  const [filtroArea, setFiltroArea] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);

  // 🆕 ESTADO DEL FORMULARIO
  const [modoEdicion, setModoEdicion] = useState(false);
  const [supervisorEditando, setSupervisorEditando] = useState<Supervisor | null>(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    area: '',
    fechaAsignacion: new Date().toISOString().split('T')[0],
  });

  // 🔍 FILTRADO DE SUPERVISORES
  const supervisoresFiltrados = useMemo(() => {
    return supervisores.filter((supervisor) => {
      const coincideBusqueda =
        supervisor.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        supervisor.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
        supervisor.area.toLowerCase().includes(busqueda.toLowerCase());
      
      const coincideArea = !filtroArea || supervisor.area === filtroArea;

      return coincideBusqueda && coincideArea;
    });
  }, [supervisores, busqueda, filtroArea]);

  // 📊 ESTADÍSTICAS
  const estadisticas = useMemo(() => {
    const areasSinSupervisor = AREAS_OPTIONS.filter(
      (area) => !supervisores.some((sup) => sup.area === area.value)
    ).length;

    return {
      total: supervisores.length,
      areasSinSupervisor,
    };
  }, [supervisores]);

  // 📝 ABRIR MODAL PARA AGREGAR
  const handleAgregarSupervisor = () => {
    limpiarFormulario();
    setModalVisible(true);
  };

  // 🆕 CREAR NUEVO SUPERVISOR
  const handleCrear = () => {
    if (!formulario.nombre.trim() || !formulario.correo.trim() || !formulario.area) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar si el área ya tiene supervisor asignado
    const areaOcupada = supervisores.find((s) => s.area === formulario.area && s.id !== supervisorEditando?.id);
    if (areaOcupada) {
      Alert.alert(
        'Área ocupada',
        `El área ${formulario.area} ya tiene asignado al supervisor ${areaOcupada.nombre}. ¿Deseas reasignar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reasignar', onPress: () => confirmarCreacion() },
        ]
      );
      return;
    }

    confirmarCreacion();
  };

  const confirmarCreacion = () => {
    const nuevoSupervisor: Supervisor = {
      id: `SUP${String(supervisores.length + 1).padStart(3, '0')}`,
      ...formulario,
    };

    setSupervisores([...supervisores, nuevoSupervisor]);
    limpiarFormulario();
    setModalVisible(false);
    Alert.alert('Éxito', 'Supervisor asignado correctamente');
  };

  // ✏️ EDITAR SUPERVISOR
  const handleEditar = (supervisor: Supervisor) => {
    setSupervisorEditando(supervisor);
    setFormulario({
      nombre: supervisor.nombre,
      correo: supervisor.correo,
      telefono: supervisor.telefono,
      area: supervisor.area,
      fechaAsignacion: supervisor.fechaAsignacion,
    });
    setModoEdicion(true);
    setModalVisible(true);
  };

  const handleActualizar = () => {
    if (!formulario.nombre.trim() || !formulario.correo.trim() || !formulario.area) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar si el área ya tiene supervisor asignado (excluyendo el actual)
    const areaOcupada = supervisores.find(
      (s) => s.area === formulario.area && s.id !== supervisorEditando?.id
    );
    if (areaOcupada) {
      Alert.alert(
        'Área ocupada',
        `El área ${formulario.area} ya tiene asignado al supervisor ${areaOcupada.nombre}.`
      );
      return;
    }

    setSupervisores(
      supervisores.map((sup) =>
        sup.id === supervisorEditando?.id ? { ...sup, ...formulario } : sup
      )
    );
    limpiarFormulario();
    setModalVisible(false);
    Alert.alert('Éxito', 'Supervisor actualizado correctamente');
  };

  // 🗑️ ELIMINAR SUPERVISOR
  const handleEliminar = (supervisor: Supervisor) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar la asignación del supervisor ${supervisor.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setSupervisores(supervisores.filter((sup) => sup.id !== supervisor.id));
            Alert.alert('Éxito', 'Supervisor eliminado correctamente');
          },
        },
      ]
    );
  };

  // 🧹 LIMPIAR FORMULARIO
  const limpiarFormulario = () => {
    setFormulario({
      nombre: '',
      correo: '',
      telefono: '',
      area: '',
      fechaAsignacion: new Date().toISOString().split('T')[0],
    });
    setModoEdicion(false);
    setSupervisorEditando(null);
    setModalVisible(false);
  };

  return (
    <ImageBackground
      source={require('../../../assets/splash-icon.png')}
      style={styles.background}
      imageStyle={styles.backgroundImageStyle}
    >
      <ScrollView style={styles.container}>
        <View style={styles.overlay}>
          {/* 📊 ESTADÍSTICAS */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{estadisticas.total}</Text>
              <Text style={styles.statLabel}>Total Supervisores</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{estadisticas.areasSinSupervisor}</Text>
              <Text style={styles.statLabel}>Áreas Sin Supervisor</Text>
            </View>
          </View>

          {/* 🔍 BÚSQUEDA Y FILTROS */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔍 Búsqueda y Filtros</Text>
            
            <SearchBar
              placeholder="Buscar supervisor..."
              value={busqueda}
              onChangeText={setBusqueda}
            />

            <Select
              label="Filtrar por área"
              placeholder="Todas las áreas"
              options={AREAS_OPTIONS}
              value={filtroArea}
              onSelect={(option) => setFiltroArea(option.value as string)}
            />
          </View>

          {/* 📋 LISTA DE SUPERVISORES */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              📋 Supervisores Asignados ({supervisoresFiltrados.length})
            </Text>

            {supervisoresFiltrados.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {busqueda || filtroArea
                    ? '🔍 No se encontraron supervisores'
                    : '📝 No hay supervisores asignados'}
                </Text>
              </View>
            ) : (
              supervisoresFiltrados.map((supervisor) => (
                <View key={supervisor.id} style={styles.supervisorCard}>
                  <View style={styles.supervisorHeader}>
                    <Text style={styles.supervisorNombre}>👨‍💼 {supervisor.nombre}</Text>
                    <View style={styles.supervisorBadge}>
                      <Text style={styles.supervisorBadgeText}>{supervisor.area}</Text>
                    </View>
                  </View>

                  <View style={styles.supervisorInfo}>
                    <Text style={styles.infoLabel}>📧 Correo:</Text>
                    <Text style={styles.infoValue}>{supervisor.correo}</Text>
                  </View>

                  {supervisor.telefono && (
                    <View style={styles.supervisorInfo}>
                      <Text style={styles.infoLabel}>📱 Teléfono:</Text>
                      <Text style={styles.infoValue}>{supervisor.telefono}</Text>
                    </View>
                  )}

                  <View style={styles.supervisorInfo}>
                    <Text style={styles.infoLabel}>📅 Fecha de asignación:</Text>
                    <Text style={styles.infoValue}>{supervisor.fechaAsignacion}</Text>
                  </View>

                  <View style={styles.supervisorActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditar(supervisor)}
                    >
                      <Text style={styles.actionButtonText}>✏️ Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleEliminar(supervisor)}
                    >
                      <Text style={styles.actionButtonText}>🗑️ Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* ➕ BOTÓN FLOTANTE PARA AGREGAR */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAgregarSupervisor}
      >
        <Text style={styles.fabText}>➕</Text>
      </TouchableOpacity>

      {/* 📝 MODAL DE FORMULARIO */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { limpiarFormulario(); }}>
              <Text style={styles.modalCancelButton}>✕ Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {modoEdicion ? 'Editar Supervisor' : 'Nuevo Supervisor'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Nombre completo *"
              placeholder="Ej: Roberto Hernández"
              value={formulario.nombre}
              onChangeText={(text: string) => setFormulario({ ...formulario, nombre: text })}
            />

            <Input
              label="Correo electrónico *"
              placeholder="Ej: roberto.hernandez@floresverdes.com"
              value={formulario.correo}
              onChangeText={(text: string) => setFormulario({ ...formulario, correo: text })}
              keyboardType="email-address"
            />

            <Input
              label="Teléfono"
              placeholder="Ej: +57 310 123 4567"
              value={formulario.telefono}
              onChangeText={(text: string) => setFormulario({ ...formulario, telefono: text })}
              keyboardType="phone-pad"
            />

            <Select
              label="Área de supervisión *"
              placeholder="Seleccionar área..."
              options={AREAS_OPTIONS}
              value={formulario.area}
              onSelect={(option) => setFormulario({ ...formulario, area: option.value as string })}
            />

            <Input
              label="Fecha de asignación"
              placeholder="YYYY-MM-DD"
              value={formulario.fechaAsignacion}
              onChangeText={(text: string) => setFormulario({ ...formulario, fechaAsignacion: text })}
            />

            <View style={styles.buttonRow}>
              {modoEdicion ? (
                <>
                  <Button
                    title="💾 Actualizar"
                    onPress={handleActualizar}
                    variant="primary"
                    style={styles.buttonHalf}
                  />
                  <Button
                    title="❌ Cancelar"
                    onPress={limpiarFormulario}
                    variant="secondary"
                    style={styles.buttonHalf}
                  />
                </>
              ) : (
                <Button title="➕ Asignar Supervisor" onPress={handleCrear} variant="primary" />
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.15,
  },
  container: {
    flex: 1,
  },
  overlay: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  buttonHalf: {
    flex: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  supervisorCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  supervisorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  supervisorNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
    flex: 1,
  },
  supervisorBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  supervisorBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  supervisorInfo: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#558B2F',
    fontWeight: '600',
    width: 140,
  },
  infoValue: {
    fontSize: 14,
    color: '#33691E',
    flex: 1,
  },
  supervisorActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // FAB (Botón Flotante)
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  placeholder: {
    width: 70,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
});

export default AsignacionSupervisoresScreen;
