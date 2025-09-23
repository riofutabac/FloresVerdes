-- Habilitar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE variedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros_calidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil" ON usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los usuarios" ON usuarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'ADMIN'
    )
  );

CREATE POLICY "Admins pueden insertar usuarios" ON usuarios
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'ADMIN'
    )
  );

CREATE POLICY "Admins pueden actualizar usuarios" ON usuarios
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Políticas para variedades (lectura para todos los autenticados)
CREATE POLICY "Usuarios autenticados pueden ver variedades" ON variedades
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden gestionar variedades" ON variedades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Políticas para parámetros de calidad
CREATE POLICY "Usuarios autenticados pueden ver parámetros de calidad" ON parametros_calidad
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden gestionar parámetros de calidad" ON parametros_calidad
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Políticas para evaluaciones
CREATE POLICY "Operarios pueden crear evaluaciones" ON evaluaciones
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND activo = true
    )
  );

CREATE POLICY "Operarios pueden ver sus propias evaluaciones" ON evaluaciones
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol IN ('ADMIN', 'SUPERVISOR')
    )
  );

CREATE POLICY "Supervisores y admins pueden ver todas las evaluaciones" ON evaluaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol IN ('ADMIN', 'SUPERVISOR')
    )
  );

CREATE POLICY "Operarios pueden actualizar sus evaluaciones recientes" ON evaluaciones
  FOR UPDATE USING (
    created_by = auth.uid() AND
    fecha_creacion >= NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (
    created_by = auth.uid() AND
    fecha_creacion >= NOW() - INTERVAL '24 hours'
  );

CREATE POLICY "Supervisores y admins pueden actualizar evaluaciones" ON evaluaciones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol IN ('ADMIN', 'SUPERVISOR')
    )
  );

-- Políticas para parámetros del sistema
CREATE POLICY "Usuarios autenticados pueden ver parámetros públicos" ON parametros_sistema
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    categoria NOT IN ('secret', 'internal')
  );

CREATE POLICY "Solo admins pueden gestionar parámetros del sistema" ON parametros_sistema
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Función para insertar usuario después del registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'OPERARIO')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear usuario automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();