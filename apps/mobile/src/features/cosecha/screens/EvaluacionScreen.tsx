import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Switch } from 'react-native';

interface Props {
  navigation: any;
}

export function EvaluacionScreen({ navigation }: Props) {
  const [evaluacion, setEvaluacion] = useState({
    operario: '',
    variedad: '',
    lote: '',
    calidad: 0,
    cantidad: 0,
    observaciones: '',
    tieneDefectos: false,
  });

  const handleSave = () => {
    // TODO: Implementar guardado con controlador
    Alert.alert('Éxito', 'Evaluación guardada correctamente', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Operario</Text>
        <TextInput
          style={styles.input}
          value={evaluacion.operario}
          onChangeText={(text) => setEvaluacion({...evaluacion, operario: text})}
          placeholder="Nombre del operario"
        />

        <Text style={styles.label}>Variedad</Text>
        <TextInput
          style={styles.input}
          value={evaluacion.variedad}
          onChangeText={(text) => setEvaluacion({...evaluacion, variedad: text})}
          placeholder="Variedad de flor"
        />

        <Text style={styles.label}>Lote</Text>
        <TextInput
          style={styles.input}
          value={evaluacion.lote}
          onChangeText={(text) => setEvaluacion({...evaluacion, lote: text})}
          placeholder="Número de lote"
        />

        <Text style={styles.label}>Calidad (1-10)</Text>
        <TextInput
          style={styles.input}
          value={evaluacion.calidad.toString()}
          onChangeText={(text) => setEvaluacion({...evaluacion, calidad: parseInt(text) || 0})}
          placeholder="Calidad"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Cantidad</Text>
        <TextInput
          style={styles.input}
          value={evaluacion.cantidad.toString()}
          onChangeText={(text) => setEvaluacion({...evaluacion, cantidad: parseInt(text) || 0})}
          placeholder="Cantidad"
          keyboardType="numeric"
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Tiene defectos</Text>
          <Switch
            value={evaluacion.tieneDefectos}
            onValueChange={(value) => setEvaluacion({...evaluacion, tieneDefectos: value})}
          />
        </View>

        <Text style={styles.label}>Observaciones</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={evaluacion.observaciones}
          onChangeText={(text) => setEvaluacion({...evaluacion, observaciones: text})}
          placeholder="Observaciones adicionales"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar Evaluación</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});