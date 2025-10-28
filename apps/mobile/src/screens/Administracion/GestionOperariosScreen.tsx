import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Button, Input, Select, SearchBar } from '../../components';
import { MOCK_OPERARIOS, AREAS_OPTIONS, VARIEDADES_ROSAS, PROCESOS_OPTIONS, MESAS_OPTIONS, ROLES_POSTCOSECHA_OPTIONS } from '../../data';
import { Operario } from '../../types';
import { useNavigation } from '@react-navigation/native';

type FilterType = 'todos' | 'proceso' | 'activos' | 'inactivos';

export const GestionOperariosScreen: React.FC = () => {
  // 🎯 ESTADOS
  const [operarios, setOperarios] = useState<(Operario & { activo?: boolean })[]>(
    MOCK_OPERARIOS.map(op => ({ ...op, activo: true }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const [selectedProceso, setSelectedProceso] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOperario, setEditingOperario] = useState<(Operario & { activo?: boolean }) | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    discapacidad: 'Ninguna',
    fechaIngreso: '',
    variedad: '',
    proceso: 'Cosecha' as 'Cosecha' | 'Postcosecha',
    // Campos de Cosecha
    area: '',
    cuadrante: '',
    // Campos de Postcosecha
    mesa: '',
    rol: 'Clasificador' as 'Clasificador' | 'Bonchador',
  });
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

  // 🔍 FILTROS Y BÚSQUEDA
  const filteredOperarios = useMemo(() => {
    let filtered = operarios;

    // Filtro por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(op =>
        op.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (op.cuadrante && op.cuadrante.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (op.mesa && op.mesa.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filtro por tipo
    switch (filterType) {
      case 'proceso':
        // Si hay un proceso específico seleccionado, filtrar por ese proceso
        // Si no, mostrar todos (el chip "Por Proceso" no filtra por sí solo)
        filtered = selectedProceso ? filtered.filter(op => op.proceso === selectedProceso) : filtered;
        break;
      case 'activos':
        filtered = filtered.filter(op => op.activo !== false);
        break;
      case 'inactivos':
        filtered = filtered.filter(op => op.activo === false);
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [operarios, searchQuery, filterType, selectedProceso]);

  // 🔄 REFRESH
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('✅ Actualizado', 'Lista de operarios actualizada');
    }, 1000);
  }, []);

  // ➕ AGREGAR NUEVO OPERARIO
  const handleAgregarOperario = () => {
    setEditingOperario(null);
    setFormData({
      nombre: '',
      correo: '',
      discapacidad: 'Ninguna',
      fechaIngreso: new Date().toISOString().split('T')[0],
      variedad: '',
      proceso: 'Cosecha',
      // Campos de Cosecha
      area: '',
      cuadrante: '',
      // Campos de Postcosecha
      mesa: '',
      rol: 'Clasificador',
    });
    setModalVisible(true);
  };

  // ✏️ EDITAR OPERARIO
  const handleEditarOperario = (operario: Operario & { activo?: boolean }) => {
    setEditingOperario(operario);
    setFormData({
      nombre: operario.nombre,
      correo: operario.correo,
      discapacidad: operario.discapacidad,
      fechaIngreso: operario.fechaIngreso,
      variedad: operario.variedad,
      proceso: operario.proceso,
      // Campos de Cosecha
      area: operario.area || '',
      cuadrante: operario.cuadrante || '',
      // Campos de Postcosecha
      mesa: operario.mesa || '',
      rol: operario.rol || 'Clasificador',
    });
    setModalVisible(true);
  };

  // 💾 GUARDAR OPERARIO
  const handleGuardarOperario = () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      Alert.alert('❌ Error', 'El nombre es obligatorio');
      return;
    }
    if (!formData.correo.trim()) {
      Alert.alert('❌ Error', 'El correo es obligatorio');
      return;
    }
    if (!formData.proceso) {
      Alert.alert('❌ Error', 'Seleccione un proceso');
      return;
    }
    
    // Validaciones específicas por proceso
    if (formData.proceso === 'Cosecha') {
      if (!formData.area) {
        Alert.alert('❌ Error', 'Seleccione un área para cosecha');
        return;
      }
      if (!formData.cuadrante.trim()) {
        Alert.alert('❌ Error', 'El cuadrante es obligatorio para cosecha');
        return;
      }
      // Validar formato de cuadrante
      if (!formData.cuadrante.toUpperCase().startsWith('C')) {
        Alert.alert('❌ Error', 'El cuadrante debe empezar con "C" (ej: C1, C2, C3...)');
        return;
      }
    } else if (formData.proceso === 'Postcosecha') {
      if (!formData.mesa) {
        Alert.alert('❌ Error', 'Seleccione una mesa para postcosecha');
        return;
      }
      if (!formData.rol) {
        Alert.alert('❌ Error', 'Seleccione un rol para postcosecha');
        return;
      }
    }
    if (!formData.variedad) {
      Alert.alert('❌ Error', 'Seleccione una variedad');
      return;
    }

    // Validar cuadrante único (solo para cosecha)
    if (formData.proceso === 'Cosecha') {
      const cuadranteExiste = operarios.some(op => 
        op.cuadrante && 
        op.cuadrante.toLowerCase() === formData.cuadrante.toLowerCase() && 
        op.area === formData.area &&
        op.id !== editingOperario?.id
      );

      if (cuadranteExiste) {
        Alert.alert('❌ Error', `El cuadrante ${formData.cuadrante.toUpperCase()} ya está asignado en ${formData.area}`);
        return;
      }
    }

    if (editingOperario) {
      // Editar existente
      const updatedOperario = {
        ...editingOperario,
        nombre: formData.nombre,
        correo: formData.correo,
        discapacidad: formData.discapacidad,
        fechaIngreso: formData.fechaIngreso,
        variedad: formData.variedad,
        proceso: formData.proceso,
        // Campos opcionales según el proceso
        ...(formData.proceso === 'Cosecha' ? {
          area: formData.area,
          cuadrante: formData.cuadrante.toUpperCase(),
          mesa: undefined,
          rol: undefined
        } : {
          mesa: formData.mesa,
          rol: formData.rol,
          area: undefined,
          cuadrante: undefined
        })
      };
      
      setOperarios(prev => prev.map(op => 
        op.id === editingOperario.id ? updatedOperario : op
      ));
      Alert.alert('✅ Éxito', 'Operario actualizado correctamente');
    } else {
      // Agregar nuevo
      const newOperario: Operario & { activo: boolean } = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        correo: formData.correo,
        discapacidad: formData.discapacidad,
        fechaIngreso: formData.fechaIngreso,
        variedad: formData.variedad,
        proceso: formData.proceso,
        activo: true,
        // Campos opcionales según el proceso
        ...(formData.proceso === 'Cosecha' ? {
          area: formData.area,
          cuadrante: formData.cuadrante.toUpperCase(),
        } : {
          mesa: formData.mesa,
          rol: formData.rol,
        })
      };
      setOperarios(prev => [...prev, newOperario]);
      Alert.alert('✅ Éxito', 'Operario agregado correctamente');
    }

    setModalVisible(false);
  };

  // 🗑️ ELIMINAR OPERARIO
  const handleEliminarOperario = (operario: Operario) => {
    Alert.alert(
      '⚠️ Confirmar eliminación',
      `¿Está seguro de eliminar a ${operario.nombre}?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            setOperarios(prev => prev.filter(op => op.id !== operario.id));
            Alert.alert('✅ Eliminado', 'Operario eliminado correctamente');
          }
        }
      ]
    );
  };

  // ⏸️ ACTIVAR/DESACTIVAR OPERARIO
  const handleToggleActivo = (operario: Operario & { activo?: boolean }) => {
    const nuevoEstado = !operario.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    Alert.alert(
      `⚠️ Confirmar ${accion}`,
      `¿Está seguro de ${accion} a ${operario.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: nuevoEstado ? 'Activar' : 'Desactivar',
          onPress: () => {
            setOperarios(prev => prev.map(op => 
              op.id === operario.id ? { ...op, activo: nuevoEstado } : op
            ));
            Alert.alert('✅ Éxito', `Operario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
          }
        }
      ]
    );
  };

  // 🎨 RENDERIZAR TARJETA DE OPERARIO
  const renderOperarioCard = ({ item: operario }: { item: Operario & { activo?: boolean } }) => {
    const variedad = VARIEDADES_ROSAS.find(v => v.value === operario.variedad);
    const isInactive = operario.activo === false;

    return (
      <View style={[styles.operarioCard, isInactive && styles.operarioInactive]}>
        <View style={styles.operarioHeader}>
          <View style={styles.operarioInfo}>
            <Text style={[styles.operarioNombre, isInactive && styles.textInactive]}>
              {operario.nombre} {isInactive && '(Inactivo)'}
            </Text>
            <Text style={[styles.operarioCorreo, isInactive && styles.textInactive]}>
              📧 {operario.correo}
            </Text>
            <View style={styles.operarioDetalles}>
              <Text style={[styles.operarioDetalle, isInactive && styles.textInactive]}>
                � {operario.proceso}
              </Text>
              <Text style={[styles.operarioDetalle, isInactive && styles.textInactive]}>
                📅 {operario.fechaIngreso}
              </Text>
            </View>
            
            {/* Campos específicos de Cosecha */}
            {operario.proceso === 'Cosecha' && (
              <View style={styles.operarioDetalles}>
                <Text style={[styles.operarioDetalle, isInactive && styles.textInactive]}>
                  �🏢 {operario.area}
                </Text>
                <Text style={[styles.operarioDetalle, isInactive && styles.textInactive]}>
                  📍 {operario.cuadrante}
                </Text>
              </View>
            )}
            
            {/* Campos específicos de Postcosecha */}
            {operario.proceso === 'Postcosecha' && (
              <View style={styles.operarioDetalles}>
                <Text style={[styles.operarioDetalle, isInactive && styles.textInactive]}>
                  � {operario.mesa}
                </Text>
                <Text style={[styles.operarioDetalle, isInactive && styles.textInactive]}>
                  {operario.rol === 'Clasificador' ? '🔍' : '💐'} {operario.rol}
                </Text>
              </View>
            )}
            
            <View style={styles.operarioDetalles}>
              <Text style={[styles.operarioDetalle, isInactive && styles.textInactive]}>
                ♿ {operario.discapacidad}
              </Text>
            </View>
            
            {/* Variedad asignada */}
            <View style={styles.variedadContainer}>
              <Text style={[styles.variedadLabel, isInactive && styles.textInactive]}>🌹 Variedad:</Text>
              <View style={styles.variedadInfo}>
                <View 
                  style={[
                    styles.colorIndicator, 
                    { backgroundColor: variedad?.color || '#CCCCCC' },
                    isInactive && styles.colorIndicatorInactive
                  ]} 
                />
                <Text style={[styles.variedadNombre, isInactive && styles.textInactive]}>
                  {operario.variedad}
                </Text>
                <Text style={[styles.variedadTipo, isInactive && styles.textInactive]}>
                  ({variedad?.tipo || 'Sin tipo'})
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.operarioActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditarOperario(operario)}
          >
            <Text style={styles.actionButtonText}>✏️ Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              operario.activo === false ? styles.activateButton : styles.deactivateButton
            ]}
            onPress={() => handleToggleActivo(operario)}
          >
            <Text style={styles.actionButtonText}>
              {operario.activo === false ? '▶️ Activar' : '⏸️ Desactivar'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleEliminarOperario(operario)}
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Buscar operario..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filtersScrollView}
          contentContainerStyle={styles.filtersContentContainer}
        >
          {[
            { key: 'todos', label: 'Todos', icon: '👥' },
            { key: 'proceso', label: 'Por Proceso', icon: '🏭' },
            { key: 'activos', label: 'Activos', icon: '✅' },
            { key: 'inactivos', label: 'Inactivos', icon: '⏸️' },
          ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              filterType === filter.key && styles.filterChipActive
            ]}
            onPress={() => {
              setFilterType(filter.key as FilterType);
              if (filter.key !== 'proceso') setSelectedProceso('');
            }}
          >
            <Text style={[
              styles.filterChipText,
              filterType === filter.key && styles.filterChipTextActive
            ]}>
              {filter.icon} {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* Selectores adicionales para filtros */}
      {filterType === 'proceso' && (
        <View style={styles.additionalFilters}>
          <Select
            label="Filtrar por proceso"
            placeholder="Seleccionar proceso..."
            options={PROCESOS_OPTIONS}
            value={selectedProceso}
            onSelect={(option) => setSelectedProceso(option.value as string)}
          />
        </View>
      )}

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredOperarios.length}</Text>
          <Text style={styles.statLabel}>Resultados</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{operarios.filter(op => op.activo !== false).length}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{operarios.filter(op => op.activo === false).length}</Text>
          <Text style={styles.statLabel}>Inactivos</Text>
        </View>
      </View>

      {/* Lista de operarios */}
      <FlatList
        data={filteredOperarios}
        renderItem={renderOperarioCard}
        keyExtractor={(item) => item.id}
        style={styles.operariosList}
        contentContainerStyle={{ paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>👤 No se encontraron operarios</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Intente con otros términos de búsqueda' : 'Agregue el primer operario'}
            </Text>
          </View>
        }
      />

      {/* Botón flotante para agregar */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAgregarOperario}
      >
        <Text style={styles.fabText}>➕</Text>
      </TouchableOpacity>

      {/* Modal de formulario */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelButton}>✕ Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingOperario ? 'Editar Operario' : 'Nuevo Operario'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Nombre completo *"
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              placeholder="Ej: Juan Pérez"
              required
            />

            <Input
              label="Correo electrónico *"
              value={formData.correo}
              onChangeText={(text) => setFormData({ ...formData, correo: text })}
              placeholder="Ej: juan@floresverdes.com"
              keyboardType="email-address"
              required
            />

            <Select
              label="Proceso *"
              placeholder="Seleccionar proceso..."
              options={PROCESOS_OPTIONS}
              value={formData.proceso}
              onSelect={(option) => setFormData({ 
                ...formData, 
                proceso: option.value as 'Cosecha' | 'Postcosecha',
                // Limpiar campos del otro proceso
                ...(option.value === 'Cosecha' ? { mesa: '', rol: 'Clasificador' } : { area: '', cuadrante: '' })
              })}
              required
            />

            {/* Campos específicos de COSECHA */}
            {formData.proceso === 'Cosecha' && (
              <>
                <Select
                  label="Área de trabajo *"
                  placeholder="Seleccionar área..."
                  options={AREAS_OPTIONS}
                  value={formData.area}
                  onSelect={(option) => setFormData({ ...formData, area: option.value as string })}
                  required
                />

                <Input
                  label="Cuadrante *"
                  value={formData.cuadrante}
                  onChangeText={(text) => setFormData({ ...formData, cuadrante: text.toUpperCase() })}
                  placeholder="Ej: C1, C2, C3..."
                  required
                />
              </>
            )}

            {/* Campos específicos de POSTCOSECHA */}
            {formData.proceso === 'Postcosecha' && (
              <>
                <Select
                  label="Mesa de trabajo *"
                  placeholder="Seleccionar mesa..."
                  options={MESAS_OPTIONS}
                  value={formData.mesa}
                  onSelect={(option) => setFormData({ ...formData, mesa: option.value as string })}
                  required
                />

                <Select
                  label="Rol en postcosecha *"
                  placeholder="Seleccionar rol..."
                  options={ROLES_POSTCOSECHA_OPTIONS}
                  value={formData.rol}
                  onSelect={(option) => setFormData({ ...formData, rol: option.value as 'Clasificador' | 'Bonchador' })}
                  required
                />
              </>
            )}



            <Input
              label="Discapacidad"
              value={formData.discapacidad}
              onChangeText={(text) => setFormData({ ...formData, discapacidad: text })}
              placeholder="Ej: Ninguna, Visual leve, Auditiva..."
            />

            <Input
              label="Fecha de ingreso *"
              value={formData.fechaIngreso}
              onChangeText={(text) => setFormData({ ...formData, fechaIngreso: text })}
              placeholder="YYYY-MM-DD"
              required
            />

            <Select
              label="Variedad de rosa asignada *"
              placeholder="Seleccionar variedad..."
              options={VARIEDADES_ROSAS.map(v => ({
                label: `🌹 ${v.label} (${v.tipo})`,
                value: v.value
              }))}
              value={formData.variedad}
              onSelect={(option) => setFormData({ ...formData, variedad: option.value as string })}
              required
            />

            <View style={styles.modalActions}>
              <Button
                title="💾 Guardar"
                variant="primary"
                size="large"
                fullWidth
                onPress={handleGuardarOperario}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    marginBottom: 0,
  },
  searchBar: {
    marginBottom: 0,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    height: 38,
  },
  filtersScrollView: {
    flex: 1,
  },
  filtersContentContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  filterChipActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  filterChipTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  additionalFilters: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
    marginTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  operariosList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    marginTop: 0,
  },
  operarioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  operarioInactive: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  operarioHeader: {
    marginBottom: 12,
  },
  operarioInfo: {
    flex: 1,
  },
  operarioNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  operarioCorreo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  operarioDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  operarioDetalle: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  variedadContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
  },
  variedadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  variedadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  colorIndicatorInactive: {
    opacity: 0.5,
  },
  variedadNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  variedadTipo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  textInactive: {
    color: '#999',
  },
  operarioActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deactivateButton: {
    backgroundColor: '#FF9800',
  },
  activateButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    flex: 0.3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
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
  // Modal styles
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
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalActions: {
    marginTop: 24,
    marginBottom: 40,
  },
});