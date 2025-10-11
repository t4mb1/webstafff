-- Insert initial data for Serviteca Tamburini
-- Created: 2025-01-04

-- Insert sample employees
INSERT INTO empleados (nombre, apellido, email, telefono, cargo) VALUES
('Mario', 'Rossi', 'mario.rossi@serviteca.com', '+56912345678', 'Mecánico Senior'),
('Giuseppe', 'Verdi', 'giuseppe.verdi@serviteca.com', '+56912345679', 'Mecánico Junior'),
('Antonio', 'Tamburini', 'antonio@serviteca.com', '+56912345680', 'Supervisor'),
('Francesco', 'Bianchi', 'francesco.bianchi@serviteca.com', '+56912345681', 'Recepcionista');

-- Insert sample clients
INSERT INTO clientes (nombre, apellido, email, telefono, direccion, rut) VALUES
('Carlos', 'González', 'carlos.gonzalez@email.com', '+56987654321', 'Av. Italia 1234, Santiago', '12345678-9'),
('María', 'Silva', 'maria.silva@email.com', '+56987654322', 'Calle Roma 567, Providencia', '98765432-1'),
('Pedro', 'Martínez', 'pedro.martinez@email.com', '+56987654323', 'Av. Napoli 890, Las Condes', '11223344-5'),
('Ana', 'López', 'ana.lopez@email.com', '+56987654324', 'Calle Venezia 123, Ñuñoa', '55667788-9'),
('Luis', 'Rodríguez', 'luis.rodriguez@email.com', '+56987654325', 'Av. Milano 456, Vitacura', '99887766-3');

-- Insert sample vehicles
INSERT INTO vehiculos (cliente_id, patente, marca, modelo, año, color) VALUES
((SELECT id FROM clientes WHERE rut = '12345678-9'), 'ABC123', 'Toyota', 'Corolla', 2020, 'Blanco'),
((SELECT id FROM clientes WHERE rut = '98765432-1'), 'DEF456', 'Nissan', 'Sentra', 2019, 'Gris'),
((SELECT id FROM clientes WHERE rut = '11223344-5'), 'GHI789', 'Hyundai', 'Elantra', 2021, 'Negro'),
((SELECT id FROM clientes WHERE rut = '55667788-9'), 'JKL012', 'Chevrolet', 'Cruze', 2018, 'Azul'),
((SELECT id FROM clientes WHERE rut = '99887766-3'), 'MNO345', 'Ford', 'Focus', 2022, 'Rojo'),
((SELECT id FROM clientes WHERE rut = '12345678-9'), 'PQR678', 'Mazda', 'Mazda3', 2020, 'Plata');

-- Insert sample inventory
INSERT INTO inventario (nombre, categoria, precio_compra, precio_venta, stock_actual, stock_minimo, codigo_barras) VALUES
('Aceite Motor 5W-30 Castrol GTX', 'Aceites', 8500, 12000, 25, 10, '7501234567890'),
('Aceite Motor 10W-40 Shell Helix', 'Aceites', 9000, 13000, 18, 10, '7501234567891'),
('Filtro de Aceite Toyota', 'Filtros', 3500, 5500, 30, 15, '7501234567892'),
('Filtro de Aceite Nissan', 'Filtros', 3800, 6000, 22, 15, '7501234567893'),
('Filtro de Aire Universal', 'Filtros', 4500, 7000, 15, 20, '7501234567894'),
('Aceite Transmisión ATF', 'Aceites', 12000, 18000, 8, 5, '7501234567895'),
('Refrigerante Verde', 'Fluidos', 5500, 8500, 12, 10, '7501234567896'),
('Limpiador de Motor', 'Químicos', 3200, 5000, 20, 10, '7501234567897'),
('Aceite Motor 0W-20 Mobil 1', 'Aceites', 15000, 22000, 10, 8, '7501234567898'),
('Filtro Combustible Universal', 'Filtros', 6500, 10000, 14, 12, '7501234567899');

-- Insert sample work orders
INSERT INTO ordenes_trabajo (vehiculo_id, empleado_id, estado, servicios_realizados, kilometraje_actual, proximo_cambio, total, observaciones) VALUES
((SELECT id FROM vehiculos WHERE patente = 'ABC123'), 
 (SELECT id FROM empleados WHERE nombre = 'Mario'), 
 'completada', 
 ARRAY['Cambio de aceite', 'Cambio de filtro de aceite'], 
 45000, 50000, 17500, 'Servicio regular completado'),

((SELECT id FROM vehiculos WHERE patente = 'DEF456'), 
 (SELECT id FROM empleados WHERE nombre = 'Giuseppe'), 
 'en_proceso', 
 ARRAY['Cambio de aceite', 'Cambio de filtro de aire'], 
 32000, 37000, 19500, 'En proceso de cambio'),

((SELECT id FROM vehiculos WHERE patente = 'GHI789'), 
 (SELECT id FROM empleados WHERE nombre = 'Mario'), 
 'abierta', 
 ARRAY['Cambio de aceite'], 
 28000, 33000, 12000, 'Orden recién creada'),

((SELECT id FROM vehiculos WHERE patente = 'JKL012'), 
 (SELECT id FROM empleados WHERE nombre = 'Antonio'), 
 'completada', 
 ARRAY['Cambio de aceite', 'Cambio de filtro de aceite', 'Limpieza de motor'], 
 67000, 72000, 22500, 'Servicio completo realizado'),

((SELECT id FROM vehiculos WHERE patente = 'MNO345'), 
 NULL, 
 'abierta', 
 ARRAY['Cambio de aceite'], 
 15000, 20000, 12000, 'Pendiente asignación de mecánico');

-- Insert sample appointments
INSERT INTO citas (cliente_id, vehiculo_id, fecha_hora, tipo_servicio, estado, observaciones) VALUES
((SELECT id FROM clientes WHERE rut = '12345678-9'), 
 (SELECT id FROM vehiculos WHERE patente = 'PQR678'), 
 NOW() + INTERVAL '2 days', 
 'Cambio de aceite', 
 'programada', 
 'Primera cita para vehículo nuevo'),

((SELECT id FROM clientes WHERE rut = '98765432-1'), 
 (SELECT id FROM vehiculos WHERE patente = 'DEF456'), 
 NOW() + INTERVAL '1 week', 
 'Servicio completo', 
 'confirmada', 
 'Cliente confirmó asistencia'),

((SELECT id FROM clientes WHERE rut = '11223344-5'), 
 (SELECT id FROM vehiculos WHERE patente = 'GHI789'), 
 NOW() + INTERVAL '3 days', 
 'Cambio de aceite y filtros', 
 'programada', 
 'Servicio de mantenimiento regular'),

((SELECT id FROM clientes WHERE rut = '55667788-9'), 
 (SELECT id FROM vehiculos WHERE patente = 'JKL012'), 
 NOW() + INTERVAL '5 days', 
 'Revisión general', 
 'programada', 
 'Revisión post-servicio'),

((SELECT id FROM clientes WHERE rut = '99887766-3'), 
 (SELECT id FROM vehiculos WHERE patente = 'MNO345'), 
 NOW() + INTERVAL '1 day', 
 'Cambio de aceite urgente', 
 'confirmada', 
 'Cliente necesita servicio urgente');

-- Update some orders to have completion dates
UPDATE ordenes_trabajo 
SET fecha_completada = fecha_inicio + INTERVAL '2 hours'
WHERE estado = 'completada';

-- Create some alerts by reducing stock
UPDATE inventario 
SET stock_actual = 3 
WHERE nombre LIKE '%ATF%';

UPDATE inventario 
SET stock_actual = 7 
WHERE nombre LIKE '%0W-20%';

-- Add some more recent orders for current month stats
INSERT INTO ordenes_trabajo (vehiculo_id, empleado_id, estado, servicios_realizados, kilometraje_actual, proximo_cambio, total, observaciones, fecha_completada) VALUES
((SELECT id FROM vehiculos WHERE patente = 'ABC123'), 
 (SELECT id FROM empleados WHERE nombre = 'Mario'), 
 'facturada', 
 ARRAY['Cambio de aceite', 'Cambio de filtro de aceite'], 
 47000, 52000, 17500, 'Servicio facturado', 
 NOW() - INTERVAL '5 days'),

((SELECT id FROM vehiculos WHERE patente = 'PQR678'), 
 (SELECT id FROM empleados WHERE nombre = 'Giuseppe'), 
 'completada', 
 ARRAY['Cambio de aceite'], 
 12000, 17000, 12000, 'Primer servicio del vehículo', 
 NOW() - INTERVAL '2 days');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;