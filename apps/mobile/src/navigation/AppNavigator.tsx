import React, { useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { EvaluacionSubprocesosScreen } from '../screens/Cosecha';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ChangePasswordScreen } from '../screens/Profile';
import { AdministracionScreen, GestionUsuariosScreen, GestionOperariosScreen, GestionParametrosScreen, GestionVariedadesScreen, AsignacionSupervisoresScreen } from '../screens/Administracion';
import { ReportesScreen, ReportesIndividualesScreen, ReportesGeneralesScreen, ExportarReportesScreen } from '../screens/reportes';
import { LoginScreen } from '../screens/Auth';
import { useAuth } from '../hooks';
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // 🚀 Memoizar opciones de navegación para evitar re-renders
  const screenOptions = useMemo(() => ({
    headerStyle: {
      backgroundColor: '#2E7D32',
    },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: {
      fontWeight: 'bold' as const,
    },
  }), []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "Home" : "Login"}
        screenOptions={screenOptions}
      >
        {!isAuthenticated ? (
          // 🔐 PANTALLAS NO AUTENTICADAS
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              title: '🔐 Iniciar Sesión',
              headerShown: false, // Sin header en login
            }}
          />
        ) : (
          // 🏠 PANTALLAS AUTENTICADAS
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                title: '🌹 Flores Verdes',
                headerShown: false, // Ocultamos header en Home
                headerLeft: () => null, // Prevenir volver atrás
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
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{
                title: '🔐 Cambiar Contraseña',
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
            <Stack.Screen
              name="GestionOperarios"
              component={GestionOperariosScreen}
              options={{
                title: '👷 Gestión de Operarios',
              }}
            />
            <Stack.Screen
              name="GestionParametros"
              component={GestionParametrosScreen}
              options={{
                title: '⚖️ Gestión de Parámetros',
              }}
            />
            <Stack.Screen
              name="GestionVariedades"
              component={GestionVariedadesScreen}
              options={{
                title: '🌹 Gestión de Variedades',
              }}
            />
            <Stack.Screen
              name="AsignacionSupervisores"
              component={AsignacionSupervisoresScreen}
              options={{
                title: '👨‍💼 Asignación de Supervisores',
              }}
            />
            <Stack.Screen
              name="Reportes"
              component={ReportesScreen}
              options={{
                title: '📊 Reportes',
              }}
            />
            <Stack.Screen
              name="ReportesIndividuales"
              component={ReportesIndividualesScreen}
              options={{
                title: '📊 Reportes Individuales',
              }}
            />
            <Stack.Screen
              name="ReportesGenerales"
              component={ReportesGeneralesScreen}
              options={{
                title: '📈 Reportes Generales',
              }}
            />
            <Stack.Screen
              name="ExportarReportes"
              component={ExportarReportesScreen}
              options={{
                title: '💾 Exportar Reportes',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};