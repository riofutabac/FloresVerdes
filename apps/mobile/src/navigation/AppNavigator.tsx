import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { EvaluacionSubprocesosScreen } from '../screens/Cosecha';

// 🎯 Definir tipos de navegación
export type RootStackParamList = {
  Home: undefined;
  EvaluacionCosecha: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: '🌹 Flores Verdes',
            headerShown: false, // Ocultamos header en Home
          }}
        />
        <Stack.Screen
          name="EvaluacionCosecha"
          component={EvaluacionSubprocesosScreen}
          options={{
            title: '🌾 Evaluación de Cosecha',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};