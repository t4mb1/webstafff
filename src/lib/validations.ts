import { z } from 'zod'

// Cliente schema
export const clienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  rut: z.string().regex(/^\d{7,8}-[\dkK]$/, 'RUT inválido (formato: 12345678-9)')
})

export type ClienteFormData = z.infer<typeof clienteSchema>

// Vehículo schema
export const vehiculoSchema = z.object({
  cliente_id: z.string().uuid('Debe seleccionar un cliente'),
  patente: z.string().min(6, 'La patente debe tener al menos 6 caracteres').max(8, 'La patente no puede tener más de 8 caracteres'),
  marca: z.string().min(2, 'La marca debe tener al menos 2 caracteres'),
  modelo: z.string().min(2, 'El modelo debe tener al menos 2 caracteres'),
  año: z.number().min(1900, 'Año inválido').max(new Date().getFullYear() + 1, 'Año inválido'),
  color: z.string().min(2, 'El color debe tener al menos 2 caracteres')
})

export type VehiculoFormData = z.infer<typeof vehiculoSchema>

// Inventario schema
export const inventarioSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  categoria: z.string().min(2, 'La categoría debe tener al menos 2 caracteres'),
  precio_compra: z.number().min(0, 'El precio de compra debe ser mayor a 0'),
  precio_venta: z.number().min(0, 'El precio de venta debe ser mayor a 0'),
  stock_actual: z.number().min(0, 'El stock actual no puede ser negativo'),
  stock_minimo: z.number().min(0, 'El stock mínimo no puede ser negativo'),
  codigo_barras: z.string().optional()
}).refine(data => data.precio_venta >= data.precio_compra, {
  message: 'El precio de venta debe ser mayor o igual al precio de compra',
  path: ['precio_venta']
})

export type InventarioFormData = z.infer<typeof inventarioSchema>

// Orden de trabajo schema
export const ordenTrabajoSchema = z.object({
  vehiculo_id: z.string().uuid('Debe seleccionar un vehículo'),
  empleado_id: z.string().uuid().optional(),
  servicios_realizados: z.array(z.string()).min(1, 'Debe agregar al menos un servicio'),
  kilometraje_actual: z.number().min(0, 'El kilometraje no puede ser negativo'),
  proximo_cambio: z.number().min(0, 'El próximo cambio no puede ser negativo').optional(),
  observaciones: z.string().optional()
})

export type OrdenTrabajoFormData = z.infer<typeof ordenTrabajoSchema>

// Cita schema
export const citaSchema = z.object({
  cliente_id: z.string().uuid('Debe seleccionar un cliente'),
  vehiculo_id: z.string().uuid('Debe seleccionar un vehículo'),
  fecha_hora: z.string().min(1, 'Debe seleccionar fecha y hora'),
  tipo_servicio: z.string().min(3, 'El tipo de servicio debe tener al menos 3 caracteres'),
  observaciones: z.string().optional()
}).refine(data => {
  const fechaCita = new Date(data.fecha_hora)
  const ahora = new Date()
  return fechaCita > ahora
}, {
  message: 'La fecha de la cita debe ser futura',
  path: ['fecha_hora']
})

export type CitaFormData = z.infer<typeof citaSchema>

// Empleado schema
export const empleadoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  cargo: z.string().min(3, 'El cargo debe tener al menos 3 caracteres'),
  activo: z.boolean().default(true)
})

export type EmpleadoFormData = z.infer<typeof empleadoSchema>

// Login schema
export const loginSchema = z.object({
  password: z.string().min(1, 'La contraseña es requerida')
})

export type LoginFormData = z.infer<typeof loginSchema>

// Utility functions for validation
export const validateRUT = (rut: string): boolean => {
  const cleanRUT = rut.replace(/[.-]/g, '')
  if (cleanRUT.length < 8 || cleanRUT.length > 9) return false
  
  const body = cleanRUT.slice(0, -1)
  const dv = cleanRUT.slice(-1).toLowerCase()
  
  let sum = 0
  let multiplier = 2
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  
  const remainder = sum % 11
  const calculatedDV = remainder < 2 ? remainder.toString() : (11 - remainder === 10 ? 'k' : (11 - remainder).toString())
  
  return dv === calculatedDV
}

export const formatRUT = (rut: string): string => {
  const cleanRUT = rut.replace(/[.-]/g, '')
  if (cleanRUT.length < 8) return rut
  
  const body = cleanRUT.slice(0, -1)
  const dv = cleanRUT.slice(-1)
  
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
}

export const validatePatente = (patente: string): boolean => {
  // Chilean license plate formats
  const oldFormat = /^[A-Z]{2}\d{4}$/ // AA1234
  const newFormat = /^[A-Z]{4}\d{2}$/ // ABCD12
  
  return oldFormat.test(patente) || newFormat.test(patente)
}