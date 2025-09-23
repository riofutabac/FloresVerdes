import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AdminHomeScreen } from '../screens/AdminHomeScreen';
import { UsuariosScreen } from '../screens/UsuariosScreen';
import { ParametrosScreen } from '../screens/ParametrosScreen';

const Stack = createStackNavigator();

export function AdminNavigator() {
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
        name="AdminHome" 
        component={AdminHomeScreen}
        options={{ title: 'Administración' }}
      />
      <Stack.Screen 
        name="Usuarios" 
        component={UsuariosScreen}
        options={{ title: 'Gestión de Usuarios' }}
      />
      <Stack.Screen 
        name="Parametros" 
        component={ParametrosScreen}
        options={{ title: 'Parámetros del Sistema' }}
      />
    </Stack.Navigator>
  );
}