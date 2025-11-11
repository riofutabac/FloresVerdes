import { supabaseClient } from '../core/data';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@flores-verdes/shared-types';

export interface LoginCredentials {
  email: string;
  password: string;
  role: 'admin' | 'gerente' | 'jefe_calidad';
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  /**
   * Iniciar sesión con Supabase (solo Auth)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Intentando login con:', credentials.email, 'rol:', credentials.role);

      // 1️⃣ Autenticación básica con Supabase
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        return {
          user: null,
          error: 'Credenciales incorrectas. Verifica tu correo y contraseña.',
        };
      }

      const supaUser = authData.user;
      if (!supaUser) {
        return { user: null, error: 'No se pudo obtener información del usuario.' };
      }

      console.log('✅ Autenticación exitosa');

      // 2️⃣ Validar el rol desde los metadatos del usuario
      const userRole = supaUser.user_metadata?.role;
      const userName = supaUser.user_metadata?.name || 'Usuario';

      if (!userRole) {
        await supabaseClient.auth.signOut();
        return { user: null, error: 'Tu cuenta no tiene rol asignado en Supabase.' };
      }

      if (userRole !== credentials.role) {
        await supabaseClient.auth.signOut();
        return { user: null, error: `El rol seleccionado no coincide (${userRole}).` };
      }

      // 3️⃣ Construir objeto de usuario (solo con datos del Auth)
      const user: User = {
        id: supaUser.id,
        email: supaUser.email!,
        name: userName,
        role: userRole,
        created_at: supaUser.created_at!,
        updated_at: supaUser.updated_at!,
      };

      // 4️⃣ Guardar sesión localmente
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('session', JSON.stringify(authData.session));

      console.log('✅ Login completado exitosamente');
      return { user, error: null };
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        user: null,
        error: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
      };
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 Cerrando sesión...');
      await supabaseClient.auth.signOut();
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('session');
      console.log('✅ Sesión cerrada');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }

  /**
   * Restaurar sesión
   */
  async restoreSession(): Promise<User | null> {
    try {
      console.log('🔄 Restaurando sesión...');
      const userStr = await AsyncStorage.getItem('user');
      const sessionStr = await AsyncStorage.getItem('session');

      if (!userStr || !sessionStr) {
        console.log('ℹ️ No hay sesión guardada');
        return null;
      }

      const user = JSON.parse(userStr);
      const session = JSON.parse(sessionStr);

      const { data, error } = await supabaseClient.auth.setSession(session);

      if (error || !data.session) {
        console.log('⚠️ Sesión expirada');
        await this.logout();
        return null;
      }

      console.log('✅ Sesión restaurada:', user.name);
      return user;
    } catch (error) {
      console.error('❌ Restore session error:', error);
      return null;
    }
  }

  /**
   * Cambiar contraseña en Supabase Auth
   */
  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('🔄 Intentando cambiar contraseña...');

      // 1. Verificar que el usuario esté autenticado
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        return {
          success: false,
          error: 'No hay sesión activa. Por favor inicia sesión nuevamente.',
        };
      }

      const userEmail = sessionData.session.user.email;
      if (!userEmail) {
        return {
          success: false,
          error: 'No se pudo obtener el email del usuario.',
        };
      }

      console.log('✅ Sesión activa para:', userEmail);

      // 2. Verificar la contraseña actual intentando hacer login
      const { error: verifyError } = await supabaseClient.auth.signInWithPassword({
        email: userEmail,
        password: data.currentPassword,
      });

      if (verifyError) {
        console.error('❌ Contraseña actual incorrecta:', verifyError);
        return {
          success: false,
          error: 'La contraseña actual es incorrecta.',
        };
      }

      console.log('✅ Contraseña actual verificada');

      // 3. Validar la nueva contraseña
      if (data.newPassword.length < 6) {
        return {
          success: false,
          error: 'La nueva contraseña debe tener al menos 6 caracteres.',
        };
      }

      if (data.newPassword === data.currentPassword) {
        return {
          success: false,
          error: 'La nueva contraseña debe ser diferente a la actual.',
        };
      }

      // 4. Cambiar la contraseña en Supabase Auth
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        console.error('❌ Error al actualizar contraseña:', updateError);
        return {
          success: false,
          error: 'Error al actualizar la contraseña. Intenta nuevamente.',
        };
      }

      console.log('✅ Contraseña actualizada exitosamente en Supabase Auth');

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error('❌ Change password error:', error);
      return {
        success: false,
        error: 'Error inesperado. Verifica tu conexión e intenta nuevamente.',
      };
    }
  }

  /**
   * Solicitar recuperación de contraseña por email
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('📧 Solicitando recuperación de contraseña para:', email);

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: 'floresverdes://reset-password',
      });

      if (error) {
        console.error('❌ Error al enviar email:', error);
        return {
          success: false,
          error: 'Error al enviar el correo de recuperación. Verifica el email.',
        };
      }

      console.log('✅ Email de recuperación enviado');

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error('❌ Password reset error:', error);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
      };
    }
  }

  /**
   * Verificar conexión con Supabase
   */
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabaseClient.auth.getSession();
      return !error;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
