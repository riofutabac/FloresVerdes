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
  ImageBackground,
} from 'react-native';
import { Button, Input, Select, SearchBar } from '../../components';
import { 
  PARAMETROS_ENMALLADO, 
  PARAMETROS_CUADRANTE,
  CATEGORIAS_PARAMETROS_OPTIONS,
  TIPO_EVALUACION_OPTIONS 
} from '../../data';
import { ParametroConPeso } from '../../types';
import { useNavigation } from '@react-navigation/native';

type FilterType = 'todos' | 'categoria' | 'tipo' | 'activos' | 'inactivos';

// Extender el tipo para incluir campos adicionales de gestión
interface ParametroExtendido extends ParametroConPeso {
  categoria: 'Enmallado' | 'Cuadrante' | 'Postcosecha';
  tipoEvaluacion: 'Cosecha' | 'Postcosecha' | 'Ambos';
  activo?: boolean;
  fechaCreacion?: string;
  descripcion?: string;
}

export const GestionParametrosScreen: React.FC = () => {
  // 🎯 ESTADOS
  const [parametros, setParametros] = useState<ParametroExtendido[]>([
    // Convertir datos existentes al formato extendido
    ...PARAMETROS_ENMALLADO.map(p => ({
      ...p,
      categoria: 'Enmallado' as const,
      tipoEvaluacion: 'Cosecha' as const,
      activo: true,
      fechaCreacion: '2023-01-15',
      descripcion: `Parámetro de evaluación para ${p.nombre}`,
    })),
    ...PARAMETROS_CUADRANTE.map(p => ({
      ...p,
      categoria: 'Cuadrante' as const,
      tipoEvaluacion: 'Cosecha' as const,
      activo: true,
      fechaCreacion: '2023-01-15',
      descripcion: `Parámetro de evaluación para ${p.nombre}`,
    })),
  ]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParametro, setEditingParametro] = useState<ParametroExtendido | null>(null);
  const [categoriaPersonalizada, setCategoriaPersonalizada] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    peso: '',
    categoria: 'Enmallado' as 'Enmallado' | 'Cuadrante' | 'Postcosecha',
    tipoEvaluacion: 'Cosecha' as 'Cosecha' | 'Postcosecha' | 'Ambos',
    descripcion: '',
  });
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

  // 🔍 FILTROS Y BÚSQUEDA
  const filteredParametros = useMemo(() => {
    let filtered = parametros;

    // Filtro por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(param =>
        param.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        param.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (param.descripcion && param.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filtro por tipo
    switch (filterType) {
      case 'categoria':
        filtered = selectedCategoria ? filtered.filter(param => param.categoria === selectedCategoria) : filtered;
        break;
      case 'tipo':
        filtered = selectedTipo ? filtered.filter(param => param.tipoEvaluacion === selectedTipo) : filtered;
        break;
      case 'activos':
        filtered = filtered.filter(param => param.activo !== false);
        break;
      case 'inactivos':
        filtered = filtered.filter(param => param.activo === false);
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [parametros, searchQuery, filterType, selectedCategoria, selectedTipo]);

  // 🔄 REFRESH
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('✅ Actualizado', 'Lista de parámetros actualizada');
    }, 1000);
  }, []);

  // ➕ AGREGAR NUEVO PARÁMETRO
  const handleAgregarParametro = () => {
    setEditingParametro(null);
    setCategoriaPersonalizada(false);
    setFormData({
      nombre: '',
      peso: '',
      categoria: 'Enmallado',
      tipoEvaluacion: 'Cosecha',
      descripcion: '',
    });
    setModalVisible(true);
  };

  // ✏️ EDITAR PARÁMETRO
  const handleEditarParametro = (parametro: ParametroExtendido) => {
    setEditingParametro(parametro);
    // Verificar si la categoría es personalizada (no está en la lista de opciones)
    const categoriaExiste = CATEGORIAS_PARAMETROS_OPTIONS.some(opt => opt.value === parametro.categoria);
    setCategoriaPersonalizada(!categoriaExiste);
    setFormData({
      nombre: parametro.nombre,
      peso: parametro.peso.toString(),
      categoria: parametro.categoria,
      tipoEvaluacion: parametro.tipoEvaluacion,
      descripcion: parametro.descripcion || '',
    });
    setModalVisible(true);
  };

  // 💾 GUARDAR PARÁMETRO
  const handleGuardarParametro = () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      Alert.alert('❌ Error', 'El nombre del parámetro es obligatorio');
      return;
    }
    if (!formData.peso.trim() || isNaN(parseFloat(formData.peso))) {
      Alert.alert('❌ Error', 'El peso debe ser un número válido');
      return;
    }
    
    const peso = parseFloat(formData.peso);
    if (peso < 0 || peso > 100) {
      Alert.alert('❌ Error', 'El peso debe estar entre 0 y 100');
      return;
    }

    // Validar nombre único
    const nombreExiste = parametros.some(param => 
      param.nombre.toLowerCase() === formData.nombre.toLowerCase() && 
      param.id !== editingParametro?.id
    );

    if (nombreExiste) {
      Alert.alert('❌ Error', `Ya existe un parámetro con el nombre "${formData.nombre}"`);
      return;
    }

    if (editingParametro) {
      // Editar existente
      const updatedParametro: ParametroExtendido = {
        ...editingParametro,
        nombre: formData.nombre.trim(),
        peso: peso,
        categoria: formData.categoria,
        tipoEvaluacion: formData.tipoEvaluacion,
        descripcion: formData.descripcion.trim(),
      };
      
      setParametros(prev => prev.map(param => 
        param.id === editingParametro.id ? updatedParametro : param
      ));
      Alert.alert('✅ Éxito', 'Parámetro actualizado correctamente');
    } else {
      // Agregar nuevo
      const newParametro: ParametroExtendido = {
        id: `param_${Date.now()}`,
        nombre: formData.nombre.trim(),
        peso: peso,
        categoria: formData.categoria,
        tipoEvaluacion: formData.tipoEvaluacion,
        descripcion: formData.descripcion.trim(),
        activo: true,
        fechaCreacion: new Date().toISOString().split('T')[0],
      };
      setParametros(prev => [...prev, newParametro]);
      Alert.alert('✅ Éxito', 'Parámetro agregado correctamente');
    }

    setModalVisible(false);
  };

  // 🗑️ ELIMINAR PARÁMETRO
  const handleEliminarParametro = (parametro: ParametroExtendido) => {
    Alert.alert(
      '⚠️ Confirmar eliminación',
      `¿Está seguro de eliminar el parámetro "${parametro.nombre}"?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            setParametros(prev => prev.filter(param => param.id !== parametro.id));
            Alert.alert('✅ Eliminado', 'Parámetro eliminado correctamente');
          }
        }
      ]
    );
  };

  // ⏸️ ACTIVAR/DESACTIVAR PARÁMETRO
  const handleToggleActivo = (parametro: ParametroExtendido) => {
    const nuevoEstado = !parametro.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    Alert.alert(
      `⚠️ Confirmar ${accion}`,
      `¿Está seguro de ${accion} el parámetro "${parametro.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: nuevoEstado ? 'Activar' : 'Desactivar',
          onPress: () => {
            setParametros(prev => prev.map(param => 
              param.id === parametro.id ? { ...param, activo: nuevoEstado } : param
            ));
            Alert.alert('✅ Éxito', `Parámetro ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
          }
        }
      ]
    );
  };

  // 🎨 RENDERIZAR TARJETA DE PARÁMETRO
  const renderParametroCard = ({ item: parametro }: { item: ParametroExtendido }) => {
    const isInactive = parametro.activo === false;

    return (
      <View style={[styles.parametroCard, isInactive && styles.parametroInactive]}>
        <View style={styles.parametroHeader}>
          <View style={styles.parametroInfo}>
            <Text style={[styles.parametroNombre, isInactive && styles.textInactive]}>
              {parametro.nombre} {isInactive && '(Inactivo)'}
            </Text>
            <Text style={[styles.parametroDescripcion, isInactive && styles.textInactive]}>
              {parametro.descripcion || 'Sin descripción'}
            </Text>
            
            <View style={styles.parametroDetalles}>
              <Text style={[styles.parametroDetalle, isInactive && styles.textInactive]}>
                ⚖️ Peso: {parametro.peso}
              </Text>
              <Text style={[styles.parametroDetalle, isInactive && styles.textInactive]}>
                📂 {parametro.categoria}
              </Text>
            </View>
            
            <View style={styles.parametroDetalles}>
              <Text style={[styles.parametroDetalle, isInactive && styles.textInactive]}>
                🎯 {parametro.tipoEvaluacion}
              </Text>
              <Text style={[styles.parametroDetalle, isInactive && styles.textInactive]}>
                📅 {parametro.fechaCreacion}
              </Text>
            </View>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.parametroActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditarParametro(parametro)}
          >
            <Text style={styles.actionButtonText}>✏️ Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              parametro.activo === false ? styles.activateButton : styles.deactivateButton
            ]}
            onPress={() => handleToggleActivo(parametro)}
          >
            <Text style={styles.actionButtonText}>
              {parametro.activo === false ? '▶️ Activar' : '⏸️ Desactivar'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleEliminarParametro(parametro)}
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../../../assets/splash-icon.png')}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      <View style={styles.container}>
        <View style={styles.overlay}>
          <Text style={styles.subtitle}>Administrar parámetros de evaluación</Text>

          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <SearchBar
              placeholder="Buscar parámetro..."
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
                { key: 'todos', label: 'Todos', icon: '📋' },
                { key: 'categoria', label: 'Por Categoría', icon: '📂' },
                { key: 'tipo', label: 'Por Tipo', icon: '🎯' },
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
                    if (filter.key !== 'categoria') setSelectedCategoria('');
                    if (filter.key !== 'tipo') setSelectedTipo('');
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
          {filterType === 'categoria' && (
            <View style={styles.additionalFilters}>
              <Select
                label="Filtrar por categoría"
                placeholder="Seleccionar categoría..."
                options={CATEGORIAS_PARAMETROS_OPTIONS}
                value={selectedCategoria}
                onSelect={(option) => setSelectedCategoria(option.value as string)}
              />
            </View>
          )}

          {filterType === 'tipo' && (
            <View style={styles.additionalFilters}>
              <Select
                label="Filtrar por tipo de evaluación"
                placeholder="Seleccionar tipo..."
                options={TIPO_EVALUACION_OPTIONS}
                value={selectedTipo}
                onSelect={(option) => setSelectedTipo(option.value as string)}
              />
            </View>
          )}

          {/* Estadísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{filteredParametros.length}</Text>
              <Text style={styles.statLabel}>Resultados</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{parametros.filter(p => p.activo !== false).length}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{parametros.filter(p => p.activo === false).length}</Text>
              <Text style={styles.statLabel}>Inactivos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {parametros.reduce((sum, p) => sum + (p.activo !== false ? p.peso : 0), 0).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Peso Total</Text>
            </View>
          </View>

          {/* Lista de parámetros */}
          <FlatList
            data={filteredParametros}
            renderItem={renderParametroCard}
            keyExtractor={(item) => item.id}
            style={styles.parametrosList}
            contentContainerStyle={{ paddingTop: 0 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>📋 No se encontraron parámetros</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? 'Intente con otros términos de búsqueda' : 'Agregue el primer parámetro'}
                </Text>
              </View>
            }
          />

          {/* Botón flotante para agregar */}
          <TouchableOpacity 
            style={styles.fab}
            onPress={handleAgregarParametro}
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
                  {editingParametro ? 'Editar Parámetro' : 'Nuevo Parámetro'}
                </Text>
                <View style={styles.placeholder} />
              </View>

              <ScrollView style={styles.modalContent}>
                <Input
                  label="Nombre del parámetro *"
                  value={formData.nombre}
                  onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                  placeholder="Ej: Tallos bien cortados"
                  required
                />

                <Input
                  label="Peso (0-100) *"
                  value={formData.peso}
                  onChangeText={(text) => setFormData({ ...formData, peso: text })}
                  placeholder="Ej: 15"
                  keyboardType="numeric"
                  required
                />

                {/* Categoría con opción de personalización */}
                <View style={styles.categoriaContainer}>
                  {!categoriaPersonalizada ? (
                    <>
                      <Select
                        label="Categoría *"
                        placeholder="Seleccionar categoría..."
                        options={CATEGORIAS_PARAMETROS_OPTIONS}
                        value={formData.categoria}
                        onSelect={(option) => setFormData({ ...formData, categoria: option.value as any })}
                        required
                      />
                      <TouchableOpacity 
                        style={styles.categoriaPersonalizadaButton}
                        onPress={() => {
                          setCategoriaPersonalizada(true);
                          setFormData({ ...formData, categoria: '' as any });
                        }}
                      >
                        <Text style={styles.categoriaPersonalizadaButtonText}>
                          ➕ Agregar categoría/subproceso personalizado
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Input
                        label="Categoría/Subproceso personalizado *"
                        value={formData.categoria}
                        onChangeText={(text) => setFormData({ ...formData, categoria: text as any })}
                        placeholder="Ej: No Enmallado, Corte de Tallo, etc."
                        required
                      />
                      <TouchableOpacity 
                        style={styles.categoriaPersonalizadaButton}
                        onPress={() => {
                          setCategoriaPersonalizada(false);
                          setFormData({ ...formData, categoria: 'Enmallado' });
                        }}
                      >
                        <Text style={styles.categoriaPersonalizadaButtonText}>
                          ↩️ Usar categorías existentes
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <Select
                  label="Tipo de evaluación *"
                  placeholder="Seleccionar tipo..."
                  options={TIPO_EVALUACION_OPTIONS}
                  value={formData.tipoEvaluacion}
                  onSelect={(option) => setFormData({ ...formData, tipoEvaluacion: option.value as 'Cosecha' | 'Postcosecha' | 'Ambos' })}
                  required
                />

                <Input
                  label="Descripción"
                  value={formData.descripcion}
                  onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                  placeholder="Descripción detallada del parámetro..."
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.modalActions}>
                  <Button
                    title="💾 Guardar"
                    variant="primary"
                    size="large"
                    fullWidth
                    onPress={handleGuardarParametro}
                  />
                </View>
              </ScrollView>
            </View>
          </Modal>
        </View>
      </View>
    </ImageBackground>
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
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  parametrosList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    marginTop: 0,
  },
  parametroCard: {
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
  parametroInactive: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  parametroHeader: {
    marginBottom: 12,
  },
  parametroInfo: {
    flex: 1,
  },
  parametroNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  parametroDescripcion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  parametroDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  parametroDetalle: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  textInactive: {
    color: '#999',
  },
  parametroActions: {
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
  categoriaContainer: {
    marginBottom: 16,
  },
  categoriaPersonalizadaButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  categoriaPersonalizadaButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
});