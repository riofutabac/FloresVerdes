import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ParametrosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parámetros del Sistema</Text>
      <Text style={styles.placeholder}>
        Aquí se configurarán los parámetros generales del sistema, variedades, 
        configuraciones de calidad, etc.
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