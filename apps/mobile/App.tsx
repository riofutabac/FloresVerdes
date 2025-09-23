import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importar pantallas principales
import { CosechaNavigator } from './src/features/cosecha/navigation/CosechaNavigator';
import { AdminNavigator } from './src/features/admin/navigation/AdminNavigator';
import { KPINavigator } from './src/features/kpi/navigation/KPINavigator';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Cosecha') {
              iconName = focused ? 'leaf' : 'leaf-outline';
            } else if (route.name === 'Admin') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else if (route.name === 'KPI') {
              iconName = focused ? 'analytics' : 'analytics-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2e7d32',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Cosecha" component={CosechaNavigator} />
        <Tab.Screen name="KPI" component={KPINavigator} />
        <Tab.Screen name="Admin" component={AdminNavigator} />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}