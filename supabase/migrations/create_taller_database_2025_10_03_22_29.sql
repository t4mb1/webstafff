-- Crear tablas para el sistema de administración del taller de cambio de aceite

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS public.empleados_2025_10_03_22_29 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    cargo VARCHAR(50) DEFAULT 'operario',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS public.clientes_2025_10_03_22_29 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de vehículos
CREATE TABLE IF NOT EXISTS public.vehiculos_2025_10_03_22_29 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes_2025_10_03_22_29(id) ON DELETE CASCADE,
    patente VARCHAR(10) UNIQUE NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    año INTEGER,
    color VARCHAR(30),
    kilometraje INTEGER DEFAULT 0,
    tipo_aceite VARCHAR(50),
    capacidad_aceite DECIMAL(4,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de inventario
CREATE TABLE IF NOT EXISTS public.inventario_2025_10_03_22_29 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'aceite', 'filtro', 'otros'
    marca VARCHAR(50),
    tipo VARCHAR(50), -- para aceites: '5W-30', '10W-40', etc.
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    precio_compra DECIMAL(10,2),
    precio_venta DECIMAL(10,2),
    unidad VARCHAR(20) DEFAULT 'unidad', -- 'litro', 'unidad', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS public.citas_2025_10_03_22_29 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes_2025_10_03_22_29(id) ON DELETE CASCADE,
    vehiculo_id UUID REFERENCES public.vehiculos_2025_10_03_22_29(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES public.empleados_2025_10_03_22_29(id),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    servicio_solicitado TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'programada', -- 'programada', 'en_proceso', 'completada', 'cancelada'
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de órdenes de trabajo
CREATE TABLE IF NOT EXISTS public.ordenes_trabajo_2025_10_03_22_29 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cita_id UUID REFERENCES public.citas_2025_10_03_22_29(id),
    vehiculo_id UUID REFERENCES public.vehiculos_2025_10_03_22_29(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES public.empleados_2025_10_03_22_29(id),
    numero_orden VARCHAR(20) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'abierta', -- 'abierta', 'en_proceso', 'completada', 'facturada'
    servicios_realizados TEXT[],
    kilometraje_actual INTEGER,
    proximo_cambio INTEGER,
    total DECIMAL(10,2) DEFAULT 0,
    observaciones TEXT,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_completada TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de servicios realizados (historial)
CREATE TABLE IF NOT EXISTS public.servicios_realizados_2025_10_03_22_29 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    orden_trabajo_id UUID REFERENCES public.ordenes_trabajo_2025_10_03_22_29(id) ON DELETE CASCADE,
    inventario_id UUID REFERENCES public.inventario_2025_10_03_22_29(id),
    cantidad DECIMAL(8,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON public.vehiculos_2025_10_03_22_29(patente);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON public.citas_2025_10_03_22_29(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON public.ordenes_trabajo_2025_10_03_22_29(estado);
CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON public.inventario_2025_10_03_22_29(categoria);

-- Función para generar número de orden automático
CREATE OR REPLACE FUNCTION generate_orden_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    orden_num TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_orden FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.ordenes_trabajo_2025_10_03_22_29
    WHERE numero_orden LIKE 'ORD-%';
    
    orden_num := 'ORD-' || LPAD(next_num::TEXT, 6, '0');
    RETURN orden_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número de orden automáticamente
CREATE OR REPLACE FUNCTION set_orden_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_orden IS NULL OR NEW.numero_orden = '' THEN
        NEW.numero_orden := generate_orden_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_orden_number
    BEFORE INSERT ON public.ordenes_trabajo_2025_10_03_22_29
    FOR EACH ROW
    EXECUTE FUNCTION set_orden_number();

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON public.empleados_2025_10_03_22_29 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes_2025_10_03_22_29 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehiculos_updated_at BEFORE UPDATE ON public.vehiculos_2025_10_03_22_29 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventario_updated_at BEFORE UPDATE ON public.inventario_2025_10_03_22_29 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_citas_updated_at BEFORE UPDATE ON public.citas_2025_10_03_22_29 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ordenes_updated_at BEFORE UPDATE ON public.ordenes_trabajo_2025_10_03_22_29 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();