-- Agregar columna RUT a la tabla de clientes
ALTER TABLE public.clientes_2025_10_03_22_29 
ADD COLUMN IF NOT EXISTS rut VARCHAR(12) UNIQUE;

-- Agregar columna código de barras a inventario
ALTER TABLE public.inventario_2025_10_03_22_29 
ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(50) UNIQUE;

-- Actualizar clientes existentes con RUTs de ejemplo
UPDATE public.clientes_2025_10_03_22_29 
SET rut = CASE 
    WHEN email = 'ana.martinez@email.com' THEN '12345678-9'
    WHEN email = 'roberto.silva@email.com' THEN '98765432-1'
    WHEN email = 'laura.fernandez@email.com' THEN '11223344-5'
    ELSE NULL
END
WHERE rut IS NULL;

-- Actualizar inventario existente con códigos de barras de ejemplo
UPDATE public.inventario_2025_10_03_22_29 
SET codigo_barras = CASE 
    WHEN nombre = 'Aceite Motor 5W-30' THEN '7891234567890'
    WHEN nombre = 'Aceite Motor 10W-40' THEN '7891234567891'
    WHEN nombre = 'Aceite Motor 15W-40' THEN '7891234567892'
    WHEN nombre = 'Filtro de Aceite Toyota' THEN '7891234567893'
    WHEN nombre = 'Filtro de Aceite Honda' THEN '7891234567894'
    WHEN nombre = 'Filtro de Aceite Universal' THEN '7891234567895'
    WHEN nombre = 'Filtro de Aire' THEN '7891234567896'
    WHEN nombre = 'Aditivo Motor' THEN '7891234567897'
    WHEN nombre = 'Aceite Transmisión ATF' THEN '7891234567898'
    WHEN nombre = 'Refrigerante' THEN '7891234567899'
    ELSE NULL
END
WHERE codigo_barras IS NULL;

-- Crear vista para historial de servicios por vehículo
CREATE OR REPLACE VIEW public.historial_servicios_vehiculo AS
SELECT 
    v.id as vehiculo_id,
    v.patente,
    v.marca,
    v.modelo,
    ot.numero_orden,
    ot.fecha_inicio,
    ot.fecha_completada,
    ot.servicios_realizados,
    ot.kilometraje_actual,
    ot.total,
    ot.estado,
    ot.observaciones,
    e.nombre || ' ' || e.apellido as empleado_nombre
FROM public.vehiculos_2025_10_03_22_29 v
LEFT JOIN public.ordenes_trabajo_2025_10_03_22_29 ot ON v.id = ot.vehiculo_id
LEFT JOIN public.empleados_2025_10_03_22_29 e ON ot.empleado_id = e.id
WHERE ot.id IS NOT NULL
ORDER BY ot.fecha_inicio DESC;