-- Serviteca Tamburini - Database Schema
-- Created: 2025-01-04
-- Description: Complete database schema with RLS policies and functions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS citas CASCADE;
DROP TABLE IF EXISTS ordenes_trabajo CASCADE;
DROP TABLE IF EXISTS vehiculos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS inventario CASCADE;
DROP TABLE IF EXISTS empleados CASCADE;

-- Create tables
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT,
    rut VARCHAR(12) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE empleados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vehiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    patente VARCHAR(10) UNIQUE NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    año INTEGER NOT NULL CHECK (año >= 1900 AND año <= EXTRACT(YEAR FROM NOW()) + 1),
    color VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    precio_compra DECIMAL(10,2) NOT NULL CHECK (precio_compra >= 0),
    precio_venta DECIMAL(10,2) NOT NULL CHECK (precio_venta >= 0),
    stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INTEGER NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    codigo_barras VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ordenes_trabajo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_orden VARCHAR(20) UNIQUE NOT NULL,
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES empleados(id) ON DELETE SET NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'en_proceso', 'completada', 'facturada')),
    servicios_realizados TEXT[] NOT NULL DEFAULT '{}',
    kilometraje_actual INTEGER NOT NULL CHECK (kilometraje_actual >= 0),
    proximo_cambio INTEGER CHECK (proximo_cambio >= 0),
    total DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    observaciones TEXT,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_completada TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_servicio VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'confirmada', 'completada', 'cancelada')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clientes_rut ON clientes(rut);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_vehiculos_patente ON vehiculos(patente);
CREATE INDEX idx_vehiculos_cliente_id ON vehiculos(cliente_id);
CREATE INDEX idx_ordenes_numero ON ordenes_trabajo(numero_orden);
CREATE INDEX idx_ordenes_estado ON ordenes_trabajo(estado);
CREATE INDEX idx_ordenes_fecha ON ordenes_trabajo(fecha_inicio);
CREATE INDEX idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX idx_citas_cliente ON citas(cliente_id);
CREATE INDEX idx_inventario_categoria ON inventario(categoria);
CREATE INDEX idx_inventario_stock ON inventario(stock_actual);

-- Full text search indexes
CREATE INDEX idx_clientes_search ON clientes USING gin(to_tsvector('spanish', nombre || ' ' || apellido || ' ' || email));
CREATE INDEX idx_vehiculos_search ON vehiculos USING gin(to_tsvector('spanish', patente || ' ' || marca || ' ' || modelo));
CREATE INDEX idx_inventario_search ON inventario USING gin(to_tsvector('spanish', nombre || ' ' || categoria));

-- Enable Row Level Security
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Basic - allow all for authenticated users)
-- In production, implement more granular policies based on user roles

-- Clientes policies
CREATE POLICY "Allow all operations for authenticated users" ON clientes
    FOR ALL USING (auth.role() = 'authenticated');

-- Empleados policies
CREATE POLICY "Allow all operations for authenticated users" ON empleados
    FOR ALL USING (auth.role() = 'authenticated');

-- Vehiculos policies
CREATE POLICY "Allow all operations for authenticated users" ON vehiculos
    FOR ALL USING (auth.role() = 'authenticated');

-- Inventario policies
CREATE POLICY "Allow all operations for authenticated users" ON inventario
    FOR ALL USING (auth.role() = 'authenticated');

-- Ordenes trabajo policies
CREATE POLICY "Allow all operations for authenticated users" ON ordenes_trabajo
    FOR ALL USING (auth.role() = 'authenticated');

-- Citas policies
CREATE POLICY "Allow all operations for authenticated users" ON citas
    FOR ALL USING (auth.role() = 'authenticated');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehiculos_updated_at BEFORE UPDATE ON vehiculos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventario_updated_at BEFORE UPDATE ON inventario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordenes_updated_at BEFORE UPDATE ON ordenes_trabajo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citas_updated_at BEFORE UPDATE ON citas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_orden IS NULL OR NEW.numero_orden = '' THEN
        NEW.numero_orden := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                           LPAD(NEXTVAL('orden_sequence')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS orden_sequence START 1;

CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON ordenes_trabajo
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Create views
CREATE OR REPLACE VIEW alertas_inventario AS
SELECT 
    id,
    nombre,
    categoria,
    stock_actual,
    stock_minimo,
    (stock_minimo - stock_actual) as diferencia
FROM inventario 
WHERE stock_actual <= stock_minimo;

CREATE OR REPLACE VIEW historial_vehiculos AS
SELECT 
    v.id as vehiculo_id,
    v.patente,
    v.marca,
    v.modelo,
    c.nombre || ' ' || c.apellido as cliente_nombre,
    ot.id as orden_id,
    ot.numero_orden,
    ot.fecha_inicio as fecha_servicio,
    ot.servicios_realizados as servicios,
    ot.kilometraje_actual as kilometraje,
    ot.total
FROM vehiculos v
JOIN clientes c ON v.cliente_id = c.id
LEFT JOIN ordenes_trabajo ot ON v.id = ot.vehiculo_id
ORDER BY ot.fecha_inicio DESC;

-- Create RPC functions
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    citas_hoy INTEGER,
    ordenes_abiertas INTEGER,
    clientes_total INTEGER,
    inventario_bajo INTEGER,
    servicios_mes INTEGER,
    ingresos_mes DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM citas 
         WHERE DATE(fecha_hora) = CURRENT_DATE) as citas_hoy,
        
        (SELECT COUNT(*)::INTEGER FROM ordenes_trabajo 
         WHERE estado IN ('abierta', 'en_proceso')) as ordenes_abiertas,
        
        (SELECT COUNT(*)::INTEGER FROM clientes) as clientes_total,
        
        (SELECT COUNT(*)::INTEGER FROM inventario 
         WHERE stock_actual <= stock_minimo) as inventario_bajo,
        
        (SELECT COUNT(*)::INTEGER FROM ordenes_trabajo 
         WHERE estado = 'completada' 
         AND DATE_TRUNC('month', fecha_completada) = DATE_TRUNC('month', CURRENT_DATE)) as servicios_mes,
        
        (SELECT COALESCE(SUM(total), 0) FROM ordenes_trabajo 
         WHERE estado = 'completada' 
         AND DATE_TRUNC('month', fecha_completada) = DATE_TRUNC('month', CURRENT_DATE)) as ingresos_mes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION buscar_vehiculo_por_patente(patente_buscar TEXT)
RETURNS TABLE (
    vehiculo_id UUID,
    patente TEXT,
    marca TEXT,
    modelo TEXT,
    cliente_id UUID,
    cliente_nombre TEXT,
    cliente_telefono TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.patente,
        v.marca,
        v.modelo,
        c.id,
        c.nombre || ' ' || c.apellido,
        c.telefono
    FROM vehiculos v
    JOIN clientes c ON v.cliente_id = c.id
    WHERE UPPER(v.patente) = UPPER(patente_buscar);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;