import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function MetricasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Métricas Detalladas</Text>
      <Text style={styles.placeholder}>
        Aquí se mostrarán las métricas detalladas con KPIs específicos,
        tendencias y análisis de datos de producción.
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