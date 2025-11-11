# 🔐 Cambio de Contraseña con Supabase Auth

## ✅ Implementación Completa

Se ha implementado exitosamente el cambio de contraseña usando **Supabase Authentication** únicamente, sin necesidad de tablas adicionales en la base de datos.

## 📁 Archivos Modificados/Creados

### 1. **`apps/mobile/src/services/auth.service.ts`**
- ✅ Agregado método `changePassword()`
- ✅ Agregado método `requestPasswordReset()`
- ✅ Valida la contraseña actual
- ✅ Actualiza la contraseña en Supabase Auth
- ✅ Manejo completo de errores

### 2. **`apps/mobile/src/screens/Profile/ChangePasswordScreen.tsx`** (NUEVO)
- ✅ Pantalla dedicada para cambio de contraseña
- ✅ Validaciones de seguridad
- ✅ Requisitos de contraseña mostrados
- ✅ UI intuitiva con feedback visual
- ✅ Loading states

### 3. **`apps/mobile/src/screens/ProfileScreen.tsx`**
- ✅ Botón "Cambiar Contraseña" navega a la nueva pantalla
- ✅ Eliminado formulario inline (más limpio)

### 4. **`apps/mobile/src/navigation/AppNavigator.tsx`**
- ✅ Agregada ruta `ChangePassword`
- ✅ Configuración de navegación completa

### 5. **`apps/mobile/src/types/index.ts`**
- ✅ Agregado tipo `ChangePassword` a `RootStackParamList`

## 🔄 Flujo de Cambio de Contraseña

```
1. Usuario → Perfil → "Cambiar Contraseña"
2. Navega a ChangePasswordScreen
3. Ingresa:
   - Contraseña actual
   - Nueva contraseña
   - Confirmación
4. Validaciones:
   - Campos completos
   - Mínimo 6 caracteres
   - Mayúsculas, minúsculas y números
   - Las contraseñas coinciden
   - Diferente de la actual
5. AuthService:
   - Verifica contraseña actual con Supabase Auth
   - Actualiza contraseña en Supabase Auth
6. Usuario recibe confirmación
7. Regresa a Perfil
```

## 🔐 Validaciones de Seguridad

### Requisitos de Contraseña:
- ✅ Mínimo 6 caracteres
- ✅ Al menos una letra mayúscula
- ✅ Al menos una letra minúscula
- ✅ Al menos un número
- ✅ Diferente de la contraseña actual

### Verificaciones:
- ✅ Sesión activa válida
- ✅ Contraseña actual correcta
- ✅ Contraseñas coinciden

## 🎯 Uso

### Desde el Código:

```typescript
import { authService } from '../services/auth.service';

// Cambiar contraseña
const { success, error } = await authService.changePassword({
  currentPassword: 'Password123!',
  newPassword: 'NewPassword456!',
});

if (success) {
  console.log('✅ Contraseña actualizada');
} else {
  console.error('❌ Error:', error);
}

// Solicitar recuperación por email
const result = await authService.requestPasswordReset('user@example.com');
```

### Desde la App:

1. **Iniciar sesión**
2. **Ir a Perfil** (👤 en la barra superior)
3. **Presionar "🔑 Cambiar Contraseña"**
4. **Completar el formulario**
5. **Presionar "🔄 Cambiar Contraseña"**
6. **✅ Listo! La contraseña se actualiza en Supabase**

## 🛡️ Seguridad

- ✅ **Contraseña cifrada**: Supabase Auth maneja el cifrado automáticamente
- ✅ **Verificación previa**: Se valida la contraseña actual antes del cambio
- ✅ **Sesión persistente**: La sesión permanece activa después del cambio
- ✅ **Sin almacenamiento local**: No se guardan contraseñas en el dispositivo
- ✅ **Conexión segura**: Todas las comunicaciones son sobre HTTPS

## 📊 Métodos del AuthService

### `changePassword(data: ChangePasswordData)`

Cambia la contraseña del usuario actual.

**Parámetros:**
```typescript
{
  currentPassword: string;  // Contraseña actual
  newPassword: string;      // Nueva contraseña
}
```

**Retorna:**
```typescript
{
  success: boolean;
  error: string | null;
}
```

### `requestPasswordReset(email: string)`

Envía un email de recuperación de contraseña.

**Parámetros:**
- `email`: Email del usuario

**Retorna:**
```typescript
{
  success: boolean;
  error: string | null;
}
```

## 🧪 Testing

Para probar la funcionalidad:

```bash
# 1. Crear usuario en Supabase Auth
# Dashboard → Authentication → Users → Add User

# 2. Iniciar la app
pnpm start

# 3. Login con credenciales
Email: tu-usuario@floresverdes.com
Password: TuPassword123!

# 4. Ir a Perfil → Cambiar Contraseña

# 5. Cambiar contraseña y verificar en Supabase
```

## ✨ Características

- ✅ **Sin base de datos adicional**: Solo usa Supabase Auth
- ✅ **Validación robusta**: Múltiples niveles de validación
- ✅ **UX excelente**: Feedback visual claro
- ✅ **Seguro**: Cumple estándares de seguridad
- ✅ **Manejo de errores**: Mensajes claros y descriptivos
- ✅ **TypeScript**: Totalmente tipado
- ✅ **Responsive**: Se adapta a diferentes tamaños de pantalla

## 🔗 Relacionado

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Password Reset Flow](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Update User](https://supabase.com/docs/reference/javascript/auth-updateuser)

## 📝 Notas

- La contraseña se actualiza **directamente en Supabase Auth**
- **No se requiere tabla `usuarios`** en la base de datos
- El usuario **no necesita volver a iniciar sesión** después del cambio
- Todos los datos del usuario están en **`user_metadata`** de Supabase Auth

---

**✅ Implementación completa y funcional!**
