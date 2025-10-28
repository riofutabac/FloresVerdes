import { User, AuthResponse, LoginDto } from '@flores-verdes/shared-types';

// 🧪 USUARIOS MOCK PARA DESARROLLO Y TESTING
export const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@floresverdes.com',
    name: 'Administrador Sistema',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2', 
    email: 'gerente@floresverdes.com',
    name: 'María González - Gerente',
    role: 'gerente',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'jefe.calidad@floresverdes.com', 
    name: 'Carlos Rodríguez - Jefe Calidad',
    role: 'jefe_calidad',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// 🔐 CREDENCIALES MOCK
export const MOCK_CREDENTIALS = [
  { email: 'admin@floresverdes.com', password: 'admin123', role: 'admin' },
  { email: 'gerente@floresverdes.com', password: 'gerente123', role: 'gerente' },
  { email: 'jefe.calidad@floresverdes.com', password: 'calidad123', role: 'jefe_calidad' }
];

// 🎭 SERVICIO DE AUTENTICACIÓN MOCK
export class MockAuthService {
  private static readonly STORAGE_KEY = 'mock_auth_token';

  /**
   * 🔐 Login mock
   */
  static async login(credentials: LoginDto): Promise<AuthResponse> {
    // Simular delay de red
    await this.delay(800);

    // Buscar credenciales válidas
    const validCredential = MOCK_CREDENTIALS.find(
      cred => 
        cred.email.toLowerCase() === credentials.email.toLowerCase() &&
        cred.password === credentials.password
    );

    if (!validCredential) {
      throw new Error('❌ Credenciales incorrectas');
    }

    // Buscar usuario correspondiente
    const user = MOCK_USERS.find(u => u.email === validCredential.email);
    
    if (!user) {
      throw new Error('❌ Usuario no encontrado');
    }

    // Generar token mock
    const mockToken = this.generateMockToken(user.id);
    
    // Guardar token en storage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, mockToken);
    }

    const authResponse: AuthResponse = {
      user,
      token: mockToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };

    console.log('✅ Mock login successful:', { email: user.email, role: user.role });
    return authResponse;
  }

  /**
   * 🚪 Logout mock
   */
  static async logout(): Promise<void> {
    await this.delay(200);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    
    console.log('👋 Mock logout successful');
  }

  /**
   * 👤 Obtener perfil del usuario mock
   */
  static async getProfile(): Promise<User> {
    await this.delay(300);
    
    const token = this.getStoredToken();
    if (!token) {
      throw new Error('❌ Token no encontrado');
    }

    const userId = this.getUserIdFromToken(token);
    const user = MOCK_USERS.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('❌ Usuario no encontrado');
    }

    return user;
  }

  /**
   * 🔄 Verificar si hay una sesión activa
   */
  static isAuthenticated(): boolean {
    const token = this.getStoredToken();
    return !!token && this.isTokenValid(token);
  }

  /**
   * 🎯 Obtener usuario actual de la sesión
   */
  static getCurrentUser(): User | null {
    if (!this.isAuthenticated()) {
      return null;
    }

    const token = this.getStoredToken();
    if (!token) return null;

    const userId = this.getUserIdFromToken(token);
    return MOCK_USERS.find(u => u.id === userId) || null;
  }

  // 🔧 MÉTODOS PRIVADOS AUXILIARES

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static generateMockToken(userId: string): string {
    const payload = {
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    };
    
    // Token simple base64 para mock (NO usar en producción)
    return `mock.${btoa(JSON.stringify(payload))}.signature`;
  }

  private static getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.STORAGE_KEY);
  }

  private static getUserIdFromToken(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts[0] !== 'mock') return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.userId || null;
    } catch {
      return null;
    }
  }

  private static isTokenValid(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts[0] !== 'mock') return false;
      
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }
}

// 🎯 EXPORT PRINCIPAL
export const mockAuthService = MockAuthService;
export default mockAuthService;