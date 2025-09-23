import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

interface Props {
  navigation: any;
}

const mockEvaluaciones = [
  {
    id: '1',
    operario: 'Juan Pérez',
    variedad: 'Rosa Roja',
    lote: 'L001',
    calidad: 8,
    cantidad: 50,
    fecha: '2024-01-15',
  },
  {
    id: '2',
    operario: 'María García',
    variedad: 'Clavel Blanco',
    lote: 'L002',
    calidad: 9,
    cantidad: 75,
    fecha: '2024-01-15',
  },
];

export function ListadoEvaluacionesScreen({ navigation }: Props) {
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.item}>
      <Text style={styles.operario}>{item.operario}</Text>
      <Text style={styles.variedad}>{item.variedad} - Lote: {item.lote}</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>Calidad: {item.calidad}/10</Text>
        <Text style={styles.stat}>Cantidad: {item.cantidad}</Text>
      </View>
      <Text style={styles.fecha}>{item.fecha}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockEvaluaciones}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 15,
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  operario: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  variedad: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stat: {
    fontSize: 14,
    color: '#333',
  },
  fecha: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'right',
  },
});