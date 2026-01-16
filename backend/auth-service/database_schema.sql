-- ============================================================================
-- AUTH SERVICE - Base de Datos PostgreSQL/Supabase
-- ============================================================================
-- Script SQL para crear la estructura completa de la base de datos
-- del microservicio de autenticación
--
-- Compatible con: PostgreSQL 12+, Supabase
-- Creado: 16 de Enero 2025
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLA: usuario
-- ============================================================================
-- Almacena información de usuarios del sistema
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correo VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'cliente',
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT email_format CHECK (correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT password_not_empty CHECK (password != ''),
    CONSTRAINT rol_valid CHECK (rol IN ('cliente', 'admin', 'staff'))
);

-- Índices para usuario
CREATE INDEX IF NOT EXISTS idx_usuario_correo ON usuario(correo);
CREATE INDEX IF NOT EXISTS idx_usuario_activo ON usuario(activo);
CREATE INDEX IF NOT EXISTS idx_usuario_rol ON usuario(rol);
CREATE INDEX IF NOT EXISTS idx_usuario_fecha_creacion ON usuario(fecha_creacion DESC);

-- Comentarios
COMMENT ON TABLE usuario IS 'Tabla de usuarios del sistema de autenticación';
COMMENT ON COLUMN usuario.id_usuario IS 'Identificador único del usuario (UUID)';
COMMENT ON COLUMN usuario.correo IS 'Email único del usuario para login';
COMMENT ON COLUMN usuario.nombre IS 'Nombre completo del usuario';
COMMENT ON COLUMN usuario.password IS 'Password hasheado con bcrypt';
COMMENT ON COLUMN usuario.rol IS 'Rol del usuario: cliente, admin, staff';
COMMENT ON COLUMN usuario.activo IS 'Indica si la cuenta está activa';
COMMENT ON COLUMN usuario.fecha_creacion IS 'Timestamp de creación de la cuenta';
COMMENT ON COLUMN usuario.ultimo_login IS 'Último timestamp de login exitoso';

-- ============================================================================
-- TABLA: refresh_token
-- ============================================================================
-- Almacena refresh tokens para renovación de access tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS refresh_token (
    id_token UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    
    -- Foreign Keys
    CONSTRAINT fk_refresh_token_usuario 
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- Índices para refresh_token
CREATE INDEX IF NOT EXISTS idx_refresh_token_usuario ON refresh_token(id_usuario);
CREATE INDEX IF NOT EXISTS idx_refresh_token_token ON refresh_token(token);
CREATE INDEX IF NOT EXISTS idx_refresh_token_activo ON refresh_token(activo);
CREATE INDEX IF NOT EXISTS idx_refresh_token_expiracion ON refresh_token(fecha_expiracion);

-- Comentarios
COMMENT ON TABLE refresh_token IS 'Tabla de refresh tokens para renovación de access tokens';
COMMENT ON COLUMN refresh_token.id_token IS 'Identificador único del refresh token (UUID)';
COMMENT ON COLUMN refresh_token.id_usuario IS 'Referencia al usuario propietario del token';
COMMENT ON COLUMN refresh_token.token IS 'Token JWT completo (único y indexado)';
COMMENT ON COLUMN refresh_token.fecha_creacion IS 'Timestamp de creación del token';
COMMENT ON COLUMN refresh_token.fecha_expiracion IS 'Timestamp de expiración del token';
COMMENT ON COLUMN refresh_token.activo IS 'Indica si el token está activo o ha sido revocado';

-- ============================================================================
-- TABLA: revoked_token
-- ============================================================================
-- Blacklist de tokens revocados (logout, cambio de password, etc)
-- ============================================================================

CREATE TABLE IF NOT EXISTS revoked_token (
    id_token_revocado UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    id_usuario UUID NOT NULL,
    tipo_token VARCHAR(50) NOT NULL,
    fecha_revocacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion_original TIMESTAMP WITH TIME ZONE NOT NULL,
    razon VARCHAR(255),
    
    -- Foreign Keys
    CONSTRAINT fk_revoked_token_usuario 
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT tipo_token_valid CHECK (tipo_token IN ('access', 'refresh'))
);

-- Índices para revoked_token
CREATE INDEX IF NOT EXISTS idx_revoked_token_token ON revoked_token(token);
CREATE INDEX IF NOT EXISTS idx_revoked_token_usuario ON revoked_token(id_usuario);
CREATE INDEX IF NOT EXISTS idx_revoked_token_tipo ON revoked_token(tipo_token);
CREATE INDEX IF NOT EXISTS idx_revoked_token_fecha_revocacion ON revoked_token(fecha_revocacion DESC);

-- Comentarios
COMMENT ON TABLE revoked_token IS 'Blacklist de tokens revocados (logout, cambio password, etc)';
COMMENT ON COLUMN revoked_token.id_token_revocado IS 'Identificador único del registro de revocación (UUID)';
COMMENT ON COLUMN revoked_token.token IS 'Token revocado (para búsquedas rápidas)';
COMMENT ON COLUMN revoked_token.id_usuario IS 'Referencia al usuario propietario del token';
COMMENT ON COLUMN revoked_token.tipo_token IS 'Tipo de token: access o refresh';
COMMENT ON COLUMN revoked_token.fecha_revocacion IS 'Timestamp de cuándo se revocó el token';
COMMENT ON COLUMN revoked_token.fecha_expiracion_original IS 'Timestamp original de expiración del token';
COMMENT ON COLUMN revoked_token.razon IS 'Razón de la revocación: logout, password_change, etc';

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de usuarios activos
CREATE OR REPLACE VIEW usuarios_activos AS
SELECT 
    id_usuario,
    correo,
    nombre,
    rol,
    fecha_creacion,
    ultimo_login
FROM usuario
WHERE activo = true
ORDER BY fecha_creacion DESC;

COMMENT ON VIEW usuarios_activos IS 'Vista de todos los usuarios activos en el sistema';

-- Vista de refresh tokens activos
CREATE OR REPLACE VIEW refresh_tokens_activos AS
SELECT 
    rt.id_token,
    rt.id_usuario,
    u.correo,
    u.nombre,
    rt.fecha_creacion,
    rt.fecha_expiracion,
    (rt.fecha_expiracion > CURRENT_TIMESTAMP) AS valido
FROM refresh_token rt
JOIN usuario u ON rt.id_usuario = u.id_usuario
WHERE rt.activo = true
ORDER BY rt.fecha_expiracion DESC;

COMMENT ON VIEW refresh_tokens_activos IS 'Vista de refresh tokens activos y su validez';

-- Vista de tokens recientemente revocados
CREATE OR REPLACE VIEW tokens_revocados_recientes AS
SELECT 
    rt.id_token_revocado,
    u.correo,
    rt.tipo_token,
    rt.fecha_revocacion,
    rt.razon
FROM revoked_token rt
JOIN usuario u ON rt.id_usuario = u.id_usuario
WHERE rt.fecha_revocacion > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY rt.fecha_revocacion DESC;

COMMENT ON VIEW tokens_revocados_recientes IS 'Tokens revocados en las últimas 24 horas';

-- ============================================================================
-- FUNCIONES ÚTILES
-- ============================================================================

-- Función para limpiar tokens expirados
CREATE OR REPLACE FUNCTION limpiar_tokens_expirados()
RETURNS TABLE(eliminados_refresh INT, eliminados_revoked INT) AS $$
DECLARE
    v_refresh_eliminados INT := 0;
    v_revoked_eliminados INT := 0;
BEGIN
    -- Eliminar refresh tokens expirados
    DELETE FROM refresh_token
    WHERE fecha_expiracion < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS v_refresh_eliminados = ROW_COUNT;
    
    -- Eliminar tokens revocados expirados (mantener solo últimos 30 días)
    DELETE FROM revoked_token
    WHERE fecha_expiracion_original < CURRENT_TIMESTAMP - INTERVAL '30 days';
    GET DIAGNOSTICS v_revoked_eliminados = ROW_COUNT;
    
    RETURN QUERY SELECT v_refresh_eliminados, v_revoked_eliminados;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION limpiar_tokens_expirados() IS 'Limpia tokens expirados de la BD para mantener performance';

-- Función para obtener estadísticas de usuarios
CREATE OR REPLACE FUNCTION estadisticas_usuarios()
RETURNS TABLE(
    total_usuarios BIGINT,
    usuarios_activos BIGINT,
    usuarios_inactivos BIGINT,
    login_hoy INT,
    nuevos_ultimos_7_dias INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE activo = true)::BIGINT,
        COUNT(*) FILTER (WHERE activo = false)::BIGINT,
        COUNT(*) FILTER (WHERE DATE(ultimo_login) = CURRENT_DATE)::INT,
        COUNT(*) FILTER (WHERE fecha_creacion > CURRENT_TIMESTAMP - INTERVAL '7 days')::INT
    FROM usuario;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION estadisticas_usuarios() IS 'Retorna estadísticas generales de usuarios';

-- Función para obtener estadísticas de tokens
CREATE OR REPLACE FUNCTION estadisticas_tokens()
RETURNS TABLE(
    refresh_tokens_activos BIGINT,
    refresh_tokens_expirados BIGINT,
    tokens_revocados_total BIGINT,
    tokens_revocados_hoy INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE activo = true)::BIGINT,
        COUNT(*) FILTER (WHERE activo = false)::BIGINT,
        (SELECT COUNT(*)::BIGINT FROM revoked_token),
        (SELECT COUNT(*)::INT FROM revoked_token WHERE DATE(fecha_revocacion) = CURRENT_DATE)
    FROM refresh_token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION estadisticas_tokens() IS 'Retorna estadísticas de tokens del sistema';

-- Función para revocar todos los tokens de un usuario
CREATE OR REPLACE FUNCTION revocar_tokens_usuario(p_id_usuario UUID)
RETURNS TABLE(tokens_revocados INT) AS $$
DECLARE
    v_tokens_revocados INT := 0;
BEGIN
    -- Insertar refresh tokens activos a blacklist
    INSERT INTO revoked_token (token, id_usuario, tipo_token, fecha_expiracion_original, razon)
    SELECT 
        token,
        id_usuario,
        'refresh',
        fecha_expiracion,
        'user_request'
    FROM refresh_token
    WHERE id_usuario = p_id_usuario AND activo = true;
    
    GET DIAGNOSTICS v_tokens_revocados = ROW_COUNT;
    
    -- Desactivar refresh tokens
    UPDATE refresh_token
    SET activo = false
    WHERE id_usuario = p_id_usuario AND activo = true;
    
    RETURN QUERY SELECT v_tokens_revocados;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION revocar_tokens_usuario(UUID) IS 'Revoca todos los tokens activos de un usuario';

-- ============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (opcional para Supabase)
-- ============================================================================
-- Descomenta estas líneas si usas RLS en Supabase

/*
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE revoked_token ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios solo pueden ver su propio perfil
CREATE POLICY "Usuarios ven su perfil"
ON usuario FOR SELECT
USING (auth.uid()::text = id_usuario::text);

-- Policy: Solo admin puede ver todos los usuarios
CREATE POLICY "Admin ve todos los usuarios"
ON usuario FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM usuario
        WHERE id_usuario = auth.uid()::uuid
        AND rol = 'admin'
    )
);
*/

-- ============================================================================
-- DATOS DE EJEMPLO (comentado)
-- ============================================================================
-- Descomenta las líneas siguientes para insertar datos de ejemplo

/*
-- Insertar usuario de prueba
INSERT INTO usuario (correo, nombre, password, rol, activo)
VALUES (
    'admin@example.com',
    'Administrador',
    '$2b$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss8KIUgO2t0jKMm6',  -- password: admin123
    'admin',
    true
);

INSERT INTO usuario (correo, nombre, password, rol, activo)
VALUES (
    'cliente@example.com',
    'Cliente Prueba',
    '$2b$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss8KIUgO2t0jKMm6',  -- password: admin123
    'cliente',
    true
);

-- Insertar refresh token de prueba (expires en 7 días)
INSERT INTO refresh_token (id_usuario, token, fecha_expiracion, activo)
VALUES (
    (SELECT id_usuario FROM usuario WHERE correo = 'admin@example.com' LIMIT 1),
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIiwiY29ycmVvIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2wiOiJhZG1pbiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzA1NDMyMjAwLCJleHAiOjE3MDY2NDM2MDB9.signature',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    true
);
*/

-- ============================================================================
-- TRIGGERS (opcional)
-- ============================================================================

-- Trigger para actualizar ultimo_login automáticamente
CREATE OR REPLACE FUNCTION actualizar_ultimo_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Este trigger se usaría si necesitas actualizar automáticamente
    -- UPDATE usuario SET ultimo_login = CURRENT_TIMESTAMP WHERE id_usuario = NEW.id_usuario;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_ultimo_login() IS 'Trigger para actualizar último login';

-- ============================================================================
-- GRANTS (para Supabase con autenticación)
-- ============================================================================
-- Estos permisos permiten que la aplicación acceda a las tablas

-- Si usas un rol específico de aplicación (ej: app_user)
-- GRANT SELECT, INSERT, UPDATE ON usuario TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON refresh_token TO app_user;
-- GRANT SELECT, INSERT ON revoked_token TO app_user;
-- GRANT EXECUTE ON FUNCTION limpiar_tokens_expirados TO app_user;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Versión: 1.0
-- Última actualización: 16 de Enero 2025
-- Autor: Cinema Project - Auth Service
-- ============================================================================
