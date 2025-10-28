import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button, Input, Select } from '../../components';

// 🎯 TIPOS PARA GESTIÓN DE USUARIOS
interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: 'Administrador' | 'Jefa de Calidad' | 'Gerente General';
  estado: 'Activo' | 'Inactivo';
  fechaCreacion: string;
}

export const GestionUsuariosScreen: React.FC = () => {
  // 🎯 ESTADOS
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    {
      id: '1',
      nombre: 'Ana García',
      correo: 'ana.garcia@floresverdes.com',
      rol: 'Administrador',
      estado: 'Activo',
      fechaCreacion: '2023-01-15',
    },
    {
      id: '2',
      nombre: 'Carlos Mendoza',
      correo: 'carlos.mendoza@floresverdes.com',
      rol: 'Jefa de Calidad',
      estado: 'Activo',
      fechaCreacion: '2023-02-20',
    },
    {
      id: '3',
      nombre: 'María Rodríguez',
      correo: 'maria.rodriguez@floresverdes.com',
      rol: 'Gerente General',
      estado: 'Inactivo',
      fechaCreacion: '2023-03-10',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRol, setSelectedRol] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  // 📝 FORMULARIO DE NUEVO USUARIO
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contraseña: '',
    rol: '' as Usuario['rol'] | '',
  });

  // 🎛️ OPCIONES DE ROLES (ADM-02)
  const ROLES_OPTIONS = [
    { label: 'Administrador', value: 'Administrador' },
    { label: 'Jefa de Calidad', value: 'Jefa de Calidad' },
    { label: 'Gerente General', value: 'Gerente General' },
  ];

  // 🔍 FILTROS Y BÚSQUEDA (ADM-03)
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         usuario.correo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRol = selectedRol === '' || usuario.rol === selectedRol;
    return matchesSearch && matchesRol;
  });

  // ✅ CREAR USUARIO (ADM-01)
  const handleCreateUser = () => {
    // 🔍 VALIDAR EMAIL ÚNICO (ADM-14)
    if (usuarios.some(u => u.correo === formData.correo)) {
      Alert.alert('Error', 'Ya existe un usuario con este correo electrónico');
      return;
    }

    if (!formData.nombre || !formData.correo || !formData.contraseña || !formData.rol) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    const nuevoUsuario: Usuario = {
      id: (usuarios.length + 1).toString(),
      nombre: formData.nombre,
      correo: formData.correo,
      rol: formData.rol as Usuario['rol'],
      estado: 'Activo',
      fechaCreacion: new Date().toISOString().split('T')[0],
    };

    setUsuarios([...usuarios, nuevoUsuario]);
    setFormData({ nombre: '', correo: '', contraseña: '', rol: '' });
    setShowCreateForm(false);
    
    Alert.alert('✅ Éxito', 'Usuario creado correctamente');
  };

  // ✏️ EDITAR USUARIO (ADM-04)
  const handleEditUser = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      nombre: usuario.nombre,
      correo: usuario.correo,
      contraseña: '',
      rol: usuario.rol,
    });
    setShowCreateForm(true);
  };

  // 🗑️ ELIMINAR USUARIO (ADM-05)
  const handleDeleteUser = (usuario: Usuario) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar al usuario "${usuario.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setUsuarios(usuarios.filter(u => u.id !== usuario.id));
            Alert.alert('✅ Eliminado', 'Usuario eliminado correctamente');
          },
        },
      ]
    );
  };

  // 💾 ACTUALIZAR USUARIO
  const handleUpdateUser = () => {
    if (!editingUser) return;

    const updatedUsuarios = usuarios.map(u =>
      u.id === editingUser.id
        ? {
            ...u,
            nombre: formData.nombre,
            correo: formData.correo,
            rol: formData.rol as Usuario['rol'],
          }
        : u
    );

    setUsuarios(updatedUsuarios);
    setEditingUser(null);
    setFormData({ nombre: '', correo: '', contraseña: '', rol: '' });
    setShowCreateForm(false);
    
    Alert.alert('✅ Actualizado', 'Usuario actualizado correctamente');
  };

  // 🚫 CANCELAR FORMULARIO
  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingUser(null);
    setFormData({ nombre: '', correo: '', contraseña: '', rol: '' });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 🔍 BÚSQUEDA Y FILTROS */}
        <View style={styles.filtersContainer}>
          <Input
            label="Buscar usuarios"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar usuario..."
            icon="🔍"
          />
          
          <Select
            label="Filtrar por rol"
            placeholder="Todos los roles"
            options={[{ label: 'Todos los roles', value: '' }, ...ROLES_OPTIONS]}
            value={selectedRol}
            onSelect={(option) => setSelectedRol(option.value as string)}
          />
        </View>

        {/* ➕ BOTÓN CREAR USUARIO */}
        <View style={styles.actionContainer}>
          <Button
            title="➕ Crear Nuevo Usuario"
            variant="primary"
            onPress={() => setShowCreateForm(true)}
            fullWidth
          />
        </View>

        {/* 📝 FORMULARIO DE CREACIÓN/EDICIÓN */}
        {showCreateForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {editingUser ? '✏️ Editar Usuario' : '➕ Crear Nuevo Usuario'}
            </Text>

            <Input
              label="Nombre completo"
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              placeholder="Ingrese el nombre completo"
              required
            />

            <Input
              label="Correo electrónico"
              value={formData.correo}
              onChangeText={(text) => setFormData({ ...formData, correo: text })}
              placeholder="usuario@floresverdes.com"
              keyboardType="email-address"
              required
            />

            {!editingUser && (
              <Input
                label="Contraseña"
                value={formData.contraseña}
                onChangeText={(text) => setFormData({ ...formData, contraseña: text })}
                placeholder="Contraseña temporal"
                secureTextEntry
                required
              />
            )}

            <Select
              label="Rol del usuario"
              placeholder="Seleccionar rol..."
              options={ROLES_OPTIONS}
              value={formData.rol}
              onSelect={(option) => setFormData({ ...formData, rol: option.value as Usuario['rol'] })}
              required
            />

            <View style={styles.formButtons}>
              <Button
                title="Cancelar"
                variant="outline"
                onPress={handleCancel}
                style={styles.cancelButton}
              />
              <Button
                title={editingUser ? "Actualizar" : "Crear Usuario"}
                variant="primary"
                onPress={editingUser ? handleUpdateUser : handleCreateUser}
                style={styles.saveButton}
              />
            </View>
          </View>
        )}

        {/* 📋 LISTADO DE USUARIOS */}
        <View style={styles.usersList}>
          <Text style={styles.listTitle}>
            📋 Usuarios ({filteredUsuarios.length})
          </Text>

          {filteredUsuarios.map((usuario) => (
            <View key={usuario.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{usuario.nombre}</Text>
                <Text style={styles.userEmail}>{usuario.correo}</Text>
                <View style={styles.userMeta}>
                  <Text style={[styles.userRol, { color: getRolColor(usuario.rol) }]}>
                    {usuario.rol}
                  </Text>
                  <Text style={[styles.userEstado, { color: usuario.estado === 'Activo' ? '#4CAF50' : '#F44336' }]}>
                    {usuario.estado}
                  </Text>
                </View>
                <Text style={styles.userFecha}>Creado: {usuario.fechaCreacion}</Text>
              </View>

              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditUser(usuario)}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteUser(usuario)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {filteredUsuarios.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No se encontraron usuarios</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// 🎨 FUNCIÓN AUXILIAR PARA COLORES DE ROL
const getRolColor = (rol: Usuario['rol']): string => {
  switch (rol) {
    case 'Administrador': return '#2196F3';
    case 'Jefa de Calidad': return '#4CAF50';
    case 'Gerente General': return '#FF9800';
    default: return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  actionContainer: {
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  usersList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  userRol: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  userEstado: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  userFecha: {
    fontSize: 12,
    color: '#999',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});