import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { KPIHomeScreen } from '../screens/KPIHomeScreen';
import { ReportesScreen } from '../screens/ReportesScreen';
import { MetricasScreen } from '../screens/MetricasScreen';

const Stack = createStackNavigator();

export function KPINavigator() {
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
        name="KPIHome" 
        component={KPIHomeScreen}
        options={{ title: 'Indicadores KPI' }}
      />
      <Stack.Screen 
        name="Reportes" 
        component={ReportesScreen}
        options={{ title: 'Reportes' }}
      />
      <Stack.Screen 
        name="Metricas" 
        component={MetricasScreen}
        options={{ title: 'Métricas Detalladas' }}
      />
    </Stack.Navigator>
  );
}