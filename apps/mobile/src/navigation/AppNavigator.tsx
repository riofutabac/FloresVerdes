import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { EvaluacionSubprocesosScreen } from '../screens/Cosecha';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdministracionScreen, GestionUsuariosScreen } from '../screens/Administracion';
import { RootStackParamList } from '../types';

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
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: '👤 Mi Perfil',
          }}
        />
        <Stack.Screen
          name="Administracion"
          component={AdministracionScreen}
          options={{
            title: '⚙️ Administración',
          }}
        />
        <Stack.Screen
          name="GestionUsuarios"
          component={GestionUsuariosScreen}
          options={{
            title: '👥 Gestión de Usuarios',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};