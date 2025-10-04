-- Habilitar RLS en todas las tablas
ALTER TABLE public.empleados_2025_10_03_22_29 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_2025_10_03_22_29 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos_2025_10_03_22_29 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_2025_10_03_22_29 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas_2025_10_03_22_29 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_trabajo_2025_10_03_22_29 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_realizados_2025_10_03_22_29 ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empleados autenticados (acceso completo como solicitado)
CREATE POLICY "empleados_policy" ON public.empleados_2025_10_03_22_29 FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "clientes_policy" ON public.clientes_2025_10_03_22_29 FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "vehiculos_policy" ON public.vehiculos_2025_10_03_22_29 FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "inventario_policy" ON public.inventario_2025_10_03_22_29 FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "citas_policy" ON public.citas_2025_10_03_22_29 FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "ordenes_policy" ON public.ordenes_trabajo_2025_10_03_22_29 FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "servicios_policy" ON public.servicios_realizados_2025_10_03_22_29 FOR ALL USING (auth.role() = 'authenticated');

-- Insertar datos iniciales de inventario
INSERT INTO public.inventario_2025_10_03_22_29 (nombre, categoria, marca, tipo, stock_actual, stock_minimo, precio_compra, precio_venta, unidad) VALUES
('Aceite Motor 5W-30', 'aceite', 'Castrol', '5W-30', 20, 5, 8.50, 12.00, 'litro'),
('Aceite Motor 10W-40', 'aceite', 'Mobil', '10W-40', 15, 5, 7.80, 11.50, 'litro'),
('Aceite Motor 15W-40', 'aceite', 'Shell', '15W-40', 25, 8, 7.20, 10.80, 'litro'),
('Filtro de Aceite Toyota', 'filtro', 'Toyota', 'Original', 12, 3, 4.50, 8.00, 'unidad'),
('Filtro de Aceite Honda', 'filtro', 'Honda', 'Original', 10, 3, 4.80, 8.50, 'unidad'),
('Filtro de Aceite Universal', 'filtro', 'Mann', 'Universal', 20, 5, 3.20, 6.50, 'unidad'),
('Filtro de Aire', 'filtro', 'K&N', 'Deportivo', 8, 2, 15.00, 25.00, 'unidad'),
('Aditivo Motor', 'otros', 'Liqui Moly', 'Limpiador', 6, 2, 12.00, 18.00, 'unidad'),
('Aceite Transmisión ATF', 'aceite', 'Valvoline', 'ATF', 10, 3, 9.50, 14.00, 'litro'),
('Refrigerante', 'otros', 'Prestone', 'Universal', 15, 4, 6.00, 10.00, 'litro');

-- Insertar empleados de ejemplo
INSERT INTO public.empleados_2025_10_03_22_29 (nombre, apellido, email, telefono, cargo) VALUES
('Juan', 'Pérez', 'juan.perez@taller.com', '+1234567890', 'administrador'),
('María', 'González', 'maria.gonzalez@taller.com', '+1234567891', 'operario'),
('Carlos', 'Rodríguez', 'carlos.rodriguez@taller.com', '+1234567892', 'operario');

-- Insertar clientes de ejemplo
INSERT INTO public.clientes_2025_10_03_22_29 (nombre, apellido, email, telefono, direccion) VALUES
('Ana', 'Martínez', 'ana.martinez@email.com', '+1234567893', 'Av. Principal 123'),
('Roberto', 'Silva', 'roberto.silva@email.com', '+1234567894', 'Calle Secundaria 456'),
('Laura', 'Fernández', 'laura.fernandez@email.com', '+1234567895', 'Plaza Central 789');

-- Insertar vehículos de ejemplo
INSERT INTO public.vehiculos_2025_10_03_22_29 (cliente_id, patente, marca, modelo, año, color, kilometraje, tipo_aceite, capacidad_aceite) VALUES
((SELECT id FROM public.clientes_2025_10_03_22_29 WHERE email = 'ana.martinez@email.com'), 'ABC123', 'Toyota', 'Corolla', 2020, 'Blanco', 45000, '5W-30', 4.2),
((SELECT id FROM public.clientes_2025_10_03_22_29 WHERE email = 'roberto.silva@email.com'), 'DEF456', 'Honda', 'Civic', 2019, 'Negro', 52000, '5W-30', 3.8),
((SELECT id FROM public.clientes_2025_10_03_22_29 WHERE email = 'laura.fernandez@email.com'), 'GHI789', 'Ford', 'Focus', 2021, 'Azul', 28000, '10W-40', 4.5);

-- Insertar citas de ejemplo
INSERT INTO public.citas_2025_10_03_22_29 (cliente_id, vehiculo_id, empleado_id, fecha_hora, servicio_solicitado, estado) VALUES
((SELECT id FROM public.clientes_2025_10_03_22_29 WHERE email = 'ana.martinez@email.com'), 
 (SELECT id FROM public.vehiculos_2025_10_03_22_29 WHERE patente = 'ABC123'),
 (SELECT id FROM public.empleados_2025_10_03_22_29 WHERE email = 'maria.gonzalez@taller.com'),
 NOW() + INTERVAL '2 hours', 'Cambio de aceite y filtro', 'programada'),
((SELECT id FROM public.clientes_2025_10_03_22_29 WHERE email = 'roberto.silva@email.com'), 
 (SELECT id FROM public.vehiculos_2025_10_03_22_29 WHERE patente = 'DEF456'),
 (SELECT id FROM public.empleados_2025_10_03_22_29 WHERE email = 'carlos.rodriguez@taller.com'),
 NOW() + INTERVAL '1 day', 'Cambio de aceite', 'programada');

-- Insertar órdenes de trabajo de ejemplo
INSERT INTO public.ordenes_trabajo_2025_10_03_22_29 (vehiculo_id, empleado_id, estado, servicios_realizados, kilometraje_actual, total, observaciones) VALUES
((SELECT id FROM public.vehiculos_2025_10_03_22_29 WHERE patente = 'GHI789'),
 (SELECT id FROM public.empleados_2025_10_03_22_29 WHERE email = 'maria.gonzalez@taller.com'),
 'en_proceso', ARRAY['Cambio de aceite', 'Cambio de filtro'], 28500, 18.50, 'Cliente solicita revisión general');

-- Crear vista para órdenes abiertas con información del vehículo
CREATE OR REPLACE VIEW public.ordenes_abiertas_view AS
SELECT 
    ot.id,
    ot.numero_orden,
    ot.estado,
    ot.servicios_realizados,
    ot.kilometraje_actual,
    ot.total,
    ot.observaciones,
    ot.fecha_inicio,
    v.patente,
    v.marca,
    v.modelo,
    v.año,
    v.color,
    c.nombre || ' ' || c.apellido as cliente_nombre,
    c.telefono as cliente_telefono,
    e.nombre || ' ' || e.apellido as empleado_nombre
FROM public.ordenes_trabajo_2025_10_03_22_29 ot
JOIN public.vehiculos_2025_10_03_22_29 v ON ot.vehiculo_id = v.id
JOIN public.clientes_2025_10_03_22_29 c ON v.cliente_id = c.id
LEFT JOIN public.empleados_2025_10_03_22_29 e ON ot.empleado_id = e.id
WHERE ot.estado IN ('abierta', 'en_proceso');

-- Crear vista para alertas de inventario bajo
CREATE OR REPLACE VIEW public.alertas_inventario_view AS
SELECT 
    id,
    nombre,
    categoria,
    marca,
    tipo,
    stock_actual,
    stock_minimo,
    (stock_actual - stock_minimo) as diferencia,
    CASE 
        WHEN stock_actual <= 0 THEN 'Sin stock'
        WHEN stock_actual <= stock_minimo THEN 'Stock bajo'
        ELSE 'Stock normal'
    END as nivel_alerta
FROM public.inventario_2025_10_03_22_29
WHERE stock_actual <= stock_minimo
ORDER BY stock_actual ASC;