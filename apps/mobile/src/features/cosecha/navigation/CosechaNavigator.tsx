import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CosechaHomeScreen } from '../screens/CosechaHomeScreen';
import { EvaluacionScreen } from '../screens/EvaluacionScreen';
import { ListadoEvaluacionesScreen } from '../screens/ListadoEvaluacionesScreen';

const Stack = createStackNavigator();

export function CosechaNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2e7d32',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="CosechaHome" 
        component={CosechaHomeScreen}
        options={{ title: 'Cosecha' }}
      />
      <Stack.Screen 
        name="Evaluacion" 
        component={EvaluacionScreen}
        options={{ title: 'Nueva Evaluación' }}
      />
      <Stack.Screen 
        name="ListadoEvaluaciones" 
        component={ListadoEvaluacionesScreen}
        options={{ title: 'Evaluaciones' }}
      />
    </Stack.Navigator>
  );
}