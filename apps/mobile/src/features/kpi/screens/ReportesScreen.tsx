import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ReportesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reportes</Text>
      <Text style={styles.placeholder}>
        Aquí se mostrarán los reportes generados con gráficos y estadísticas
        de la producción, calidad y rendimiento.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2e7d32',
  },
  placeholder: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
  },
});