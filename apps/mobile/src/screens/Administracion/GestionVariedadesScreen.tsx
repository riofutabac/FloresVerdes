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
  VARIEDADES_ROSAS,
  TIPOS_ROSA_OPTIONS,
  COLORES_ROSA_OPTIONS 
} from '../../data';
import { useNavigation } from '@react-navigation/native';

type FilterType = 'todos' | 'color' | 'activos' | 'inactivos';

// Extender el tipo para incluir campos adicionales de gestión
interface VariedadExtendida {
  id: string;
  label: string;
  value: string;
  color: string;
  tipo: string;
  activo?: boolean;
  fechaCreacion?: string;
  descripcion?: string;
  demanda?: 'Alta' | 'Media' | 'Baja';
}

export const GestionVariedadesScreen: React.FC = () => {
  // 🎯 ESTADOS
  const [variedades, setVariedades] = useState<VariedadExtendida[]>(
    VARIEDADES_ROSAS.map((v, index) => ({
      id: `var_${index + 1}`,
      label: v.label,
      value: v.value,
      color: v.color,
      tipo: v.tipo,
      activo: true,
      fechaCreacion: '2023-01-15',
      descripcion: `Variedad de rosa ${v.tipo.toLowerCase()} de alta calidad`,
      demanda: index % 3 === 0 ? 'Alta' : index % 3 === 1 ? 'Media' : 'Baja',
    }))
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const [selectedColor, setSelectedColor] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVariedad, setEditingVariedad] = useState<VariedadExtendida | null>(null);
  const [tipoPersonalizado, setTipoPersonalizado] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    value: '',
    color: '#FF0000',
    tipo: 'Roja' as string,
    descripcion: '',
    demanda: 'Media' as 'Alta' | 'Media' | 'Baja',
  });
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

  // 🔍 FILTROS Y BÚSQUEDA
  const filteredVariedades = useMemo(() => {
    let filtered = variedades;

    // Filtro por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(variedad =>
        variedad.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variedad.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (variedad.descripcion && variedad.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filtro por tipo
    switch (filterType) {
      case 'color':
        filtered = selectedColor ? filtered.filter(variedad => variedad.color === selectedColor) : filtered;
        break;
      case 'activos':
        filtered = filtered.filter(variedad => variedad.activo !== false);
        break;
      case 'inactivos':
        filtered = filtered.filter(variedad => variedad.activo === false);
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => a.label.localeCompare(b.label));
  }, [variedades, searchQuery, filterType, selectedColor]);

  // 🔄 REFRESH
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('✅ Actualizado', 'Lista de variedades actualizada');
    }, 1000);
  }, []);

  // ➕ AGREGAR NUEVA VARIEDAD
  const handleAgregarVariedad = () => {
    setEditingVariedad(null);
    setTipoPersonalizado(false);
    setFormData({
      label: '',
      value: '',
      color: '#FF0000',
      tipo: 'Roja',
      descripcion: '',
      demanda: 'Media',
    });
    setModalVisible(true);
  };

  // ✏️ EDITAR VARIEDAD
  const handleEditarVariedad = (variedad: VariedadExtendida) => {
    setEditingVariedad(variedad);
    // Verificar si el tipo es personalizado (no está en la lista de opciones)
    const tipoExiste = TIPOS_ROSA_OPTIONS.some(opt => opt.value === variedad.tipo);
    setTipoPersonalizado(!tipoExiste);
    setFormData({
      label: variedad.label,
      value: variedad.value,
      color: variedad.color,
      tipo: variedad.tipo,
      descripcion: variedad.descripcion || '',
      demanda: variedad.demanda || 'Media',
    });
    setModalVisible(true);
  };

  // 💾 GUARDAR VARIEDAD
  const handleGuardarVariedad = () => {
    // Validaciones
    if (!formData.label.trim()) {
      Alert.alert('❌ Error', 'El nombre de la variedad es obligatorio');
      return;
    }
    if (!formData.value.trim()) {
      Alert.alert('❌ Error', 'El valor de la variedad es obligatorio');
      return;
    }
    if (!formData.color.trim()) {
      Alert.alert('❌ Error', 'El color es obligatorio');
      return;
    }

    // Validar nombre único
    const nombreExiste = variedades.some(variedad => 
      (variedad.label.toLowerCase() === formData.label.toLowerCase() || 
       variedad.value.toLowerCase() === formData.value.toLowerCase()) && 
      variedad.id !== editingVariedad?.id
    );

    if (nombreExiste) {
      Alert.alert('❌ Error', `Ya existe una variedad con ese nombre o valor`);
      return;
    }

    if (editingVariedad) {
      // Editar existente
      const updatedVariedad: VariedadExtendida = {
        ...editingVariedad,
        label: formData.label.trim(),
        value: formData.value.trim(),
        color: formData.color,
        tipo: formData.tipo,
        descripcion: formData.descripcion.trim(),
        demanda: formData.demanda,
      };
      
      setVariedades(prev => prev.map(variedad => 
        variedad.id === editingVariedad.id ? updatedVariedad : variedad
      ));
      Alert.alert('✅ Éxito', 'Variedad actualizada correctamente');
    } else {
      // Agregar nueva
      const newVariedad: VariedadExtendida = {
        id: `var_${Date.now()}`,
        label: formData.label.trim(),
        value: formData.value.trim(),
        color: formData.color,
        tipo: formData.tipo,
        descripcion: formData.descripcion.trim(),
        demanda: formData.demanda,
        activo: true,
        fechaCreacion: new Date().toISOString().split('T')[0],
      };
      setVariedades(prev => [...prev, newVariedad]);
      Alert.alert('✅ Éxito', 'Variedad agregada correctamente');
    }

    setModalVisible(false);
  };

  // 🗑️ ELIMINAR VARIEDAD
  const handleEliminarVariedad = (variedad: VariedadExtendida) => {
    Alert.alert(
      '⚠️ Confirmar eliminación',
      `¿Está seguro de eliminar la variedad "${variedad.label}"?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            setVariedades(prev => prev.filter(v => v.id !== variedad.id));
            Alert.alert('✅ Eliminado', 'Variedad eliminada correctamente');
          }
        }
      ]
    );
  };

  // ⏸️ ACTIVAR/DESACTIVAR VARIEDAD
  const handleToggleActivo = (variedad: VariedadExtendida) => {
    const nuevoEstado = !variedad.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    Alert.alert(
      `⚠️ Confirmar ${accion}`,
      `¿Está seguro de ${accion} la variedad "${variedad.label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: nuevoEstado ? 'Activar' : 'Desactivar',
          onPress: () => {
            setVariedades(prev => prev.map(v => 
              v.id === variedad.id ? { ...v, activo: nuevoEstado } : v
            ));
            Alert.alert('✅ Éxito', `Variedad ${nuevoEstado ? 'activada' : 'desactivada'} correctamente`);
          }
        }
      ]
    );
  };

  // 🎨 RENDERIZAR TARJETA DE VARIEDAD
  const renderVariedadCard = ({ item: variedad }: { item: VariedadExtendida }) => {
    const isInactive = variedad.activo === false;

    return (
      <View style={[styles.variedadCard, isInactive && styles.variedadInactive]}>
        <View style={styles.variedadHeader}>
          <View style={styles.colorIndicator}>
            <View 
              style={[
                styles.colorSwatch, 
                { backgroundColor: variedad.color },
                isInactive && styles.colorSwatchInactive
              ]} 
            />
          </View>
          
          <View style={styles.variedadInfo}>
            <Text style={[styles.variedadNombre, isInactive && styles.textInactive]}>
              {variedad.label} {isInactive && '(Inactiva)'}
            </Text>
            <Text style={[styles.variedadTipo, isInactive && styles.textInactive]}>
              🌹 {variedad.tipo}
            </Text>
            <Text style={[styles.variedadDescripcion, isInactive && styles.textInactive]}>
              {variedad.descripcion || 'Sin descripción'}
            </Text>
            
            <View style={styles.variedadDetalles}>
              <Text style={[styles.variedadDetalle, isInactive && styles.textInactive]}>
                📈 Demanda: {variedad.demanda}
              </Text>
              <Text style={[styles.variedadDetalle, isInactive && styles.textInactive]}>
                 {variedad.fechaCreacion}
              </Text>
            </View>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.variedadActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditarVariedad(variedad)}
          >
            <Text style={styles.actionButtonText}>✏️ Editar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              variedad.activo === false ? styles.activateButton : styles.deactivateButton
            ]}
            onPress={() => handleToggleActivo(variedad)}
          >
            <Text style={styles.actionButtonText}>
              {variedad.activo === false ? '▶️ Activar' : '⏸️ Desactivar'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleEliminarVariedad(variedad)}
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
          <Text style={styles.subtitle}>Administrar variedades de rosas</Text>

          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <SearchBar
              placeholder="Buscar variedad..."
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
                { key: 'todos', label: 'Todas', icon: '🌹' },
                { key: 'color', label: 'Por Color', icon: '🌈' },
                { key: 'activos', label: 'Activas', icon: '✅' },
                { key: 'inactivos', label: 'Inactivas', icon: '⏸️' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    filterType === filter.key && styles.filterChipActive
                  ]}
                  onPress={() => {
                    setFilterType(filter.key as FilterType);
                    if (filter.key !== 'color') setSelectedColor('');
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
          {filterType === 'color' && (
            <View style={styles.additionalFilters}>
              <Select
                label="Filtrar por color"
                placeholder="Seleccionar color..."
                options={COLORES_ROSA_OPTIONS}
                value={selectedColor}
                onSelect={(option) => setSelectedColor(option.value as string)}
              />
            </View>
          )}

          {/* Estadísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{filteredVariedades.length}</Text>
              <Text style={styles.statLabel}>Resultados</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{variedades.filter(v => v.activo !== false).length}</Text>
              <Text style={styles.statLabel}>Activas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{variedades.filter(v => v.activo === false).length}</Text>
              <Text style={styles.statLabel}>Inactivas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {variedades.filter(v => v.demanda === 'Alta').length}
              </Text>
              <Text style={styles.statLabel}>Alta Demanda</Text>
            </View>
          </View>

          {/* Lista de variedades */}
          <FlatList
            data={filteredVariedades}
            renderItem={renderVariedadCard}
            keyExtractor={(item) => item.id}
            style={styles.variedadesList}
            contentContainerStyle={{ paddingTop: 0 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>🌹 No se encontraron variedades</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? 'Intente con otros términos de búsqueda' : 'Agregue la primera variedad'}
                </Text>
              </View>
            }
          />

          {/* Botón flotante para agregar */}
          <TouchableOpacity 
            style={styles.fab}
            onPress={handleAgregarVariedad}
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
                  {editingVariedad ? 'Editar Variedad' : 'Nueva Variedad'}
                </Text>
                <View style={styles.placeholder} />
              </View>

              <ScrollView style={styles.modalContent}>
                <Input
                  label="Nombre de la variedad *"
                  value={formData.label}
                  onChangeText={(text) => setFormData({ ...formData, label: text })}
                  placeholder="Ej: Red Naomi"
                  required
                />

                {/* Tipo de rosa con opción de personalización */}
                <View style={styles.tipoContainer}>
                  {!tipoPersonalizado ? (
                    <>
                      <Select
                        label="Tipo de rosa *"
                        placeholder="Seleccionar tipo..."
                        options={TIPOS_ROSA_OPTIONS}
                        value={formData.tipo}
                        onSelect={(option) => setFormData({ ...formData, tipo: option.value as string })}
                        required
                      />
                      <TouchableOpacity 
                        style={styles.tipoPersonalizadoButton}
                        onPress={() => {
                          setTipoPersonalizado(true);
                          setFormData({ ...formData, tipo: '' });
                        }}
                      >
                        <Text style={styles.tipoPersonalizadoButtonText}>
                          ➕ Agregar tipo personalizado
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Input
                        label="Tipo de rosa personalizado *"
                        value={formData.tipo}
                        onChangeText={(text) => setFormData({ ...formData, tipo: text })}
                        placeholder="Ej: Arcoíris, Especial, etc."
                        required
                      />
                      <TouchableOpacity 
                        style={styles.tipoPersonalizadoButton}
                        onPress={() => {
                          setTipoPersonalizado(false);
                          setFormData({ ...formData, tipo: 'Roja' });
                        }}
                      >
                        <Text style={styles.tipoPersonalizadoButtonText}>
                          ↩️ Usar tipos existentes
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <Select
                  label="Nivel de demanda"
                  placeholder="Seleccionar demanda..."
                  options={[
                    { label: '📈 Alta', value: 'Alta' },
                    { label: '📊 Media', value: 'Media' },
                    { label: '📉 Baja', value: 'Baja' },
                  ]}
                  value={formData.demanda}
                  onSelect={(option) => setFormData({ ...formData, demanda: option.value as 'Alta' | 'Media' | 'Baja' })}
                />



                <Input
                  label="Descripción"
                  value={formData.descripcion}
                  onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                  placeholder="Descripción detallada de la variedad..."
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.modalActions}>
                  <Button
                    title="💾 Guardar"
                    variant="primary"
                    size="large"
                    fullWidth
                    onPress={handleGuardarVariedad}
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  variedadesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    marginTop: 0,
  },
  variedadCard: {
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
  variedadInactive: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  variedadHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  colorIndicator: {
    marginRight: 12,
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DDD',
  },
  colorSwatchInactive: {
    opacity: 0.5,
  },
  variedadInfo: {
    flex: 1,
  },
  variedadNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  variedadTipo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  variedadDescripcion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  variedadDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  variedadDetalle: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  textInactive: {
    color: '#999',
  },
  variedadActions: {
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
  tipoContainer: {
    marginBottom: 16,
  },
  tipoPersonalizadoButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tipoPersonalizadoButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
});