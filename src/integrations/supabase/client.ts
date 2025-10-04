import { createClient } from '@supabase/supabase-js'

// Use environment variables first, fallback to hardcoded values for demo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bwiqvceluyltmwhhokgz.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3aXF2Y2VsdXlsdG13aGhva2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjY3MzIsImV4cCI6MjA3NTEwMjczMn0.RWYzW087VwWbLhbnsJhmLyDIHNdusdm5PUd9Zp6ZBaM'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found, using demo configuration')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'serviteca-system@1.0.0'
    }
  }
})

// Types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          nombre: string
          apellido: string
          email: string
          telefono: string
          direccion: string
          rut: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          apellido: string
          email: string
          telefono: string
          direccion: string
          rut: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          apellido?: string
          email?: string
          telefono?: string
          direccion?: string
          rut?: string
          updated_at?: string
        }
      }
      vehiculos: {
        Row: {
          id: string
          cliente_id: string
          patente: string
          marca: string
          modelo: string
          año: number
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          patente: string
          marca: string
          modelo: string
          año: number
          color: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          patente?: string
          marca?: string
          modelo?: string
          año?: number
          color?: string
          updated_at?: string
        }
      }
      inventario: {
        Row: {
          id: string
          nombre: string
          categoria: string
          precio_compra: number
          precio_venta: number
          stock_actual: number
          stock_minimo: number
          codigo_barras: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          categoria: string
          precio_compra: number
          precio_venta: number
          stock_actual: number
          stock_minimo: number
          codigo_barras?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          categoria?: string
          precio_compra?: number
          precio_venta?: number
          stock_actual?: number
          stock_minimo?: number
          codigo_barras?: string
          updated_at?: string
        }
      }
      ordenes_trabajo: {
        Row: {
          id: string
          numero_orden: string
          vehiculo_id: string
          empleado_id: string | null
          estado: 'abierta' | 'en_proceso' | 'completada' | 'facturada'
          servicios_realizados: string[]
          kilometraje_actual: number
          proximo_cambio: number | null
          total: number
          observaciones: string
          fecha_inicio: string
          fecha_completada: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero_orden?: string
          vehiculo_id: string
          empleado_id?: string | null
          estado?: 'abierta' | 'en_proceso' | 'completada' | 'facturada'
          servicios_realizados: string[]
          kilometraje_actual: number
          proximo_cambio?: number | null
          total?: number
          observaciones?: string
          fecha_inicio?: string
          fecha_completada?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero_orden?: string
          vehiculo_id?: string
          empleado_id?: string | null
          estado?: 'abierta' | 'en_proceso' | 'completada' | 'facturada'
          servicios_realizados?: string[]
          kilometraje_actual?: number
          proximo_cambio?: number | null
          total?: number
          observaciones?: string
          fecha_inicio?: string
          fecha_completada?: string | null
          updated_at?: string
        }
      }
      citas: {
        Row: {
          id: string
          cliente_id: string
          vehiculo_id: string
          fecha_hora: string
          tipo_servicio: string
          estado: 'programada' | 'confirmada' | 'completada' | 'cancelada'
          observaciones: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          vehiculo_id: string
          fecha_hora: string
          tipo_servicio: string
          estado?: 'programada' | 'confirmada' | 'completada' | 'cancelada'
          observaciones?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          vehiculo_id?: string
          fecha_hora?: string
          tipo_servicio?: string
          estado?: 'programada' | 'confirmada' | 'completada' | 'cancelada'
          observaciones?: string
          updated_at?: string
        }
      }
      empleados: {
        Row: {
          id: string
          nombre: string
          apellido: string
          email: string
          telefono: string
          cargo: string
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          apellido: string
          email: string
          telefono: string
          cargo: string
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          apellido?: string
          email?: string
          telefono?: string
          cargo?: string
          activo?: boolean
          updated_at?: string
        }
      }
    }
    Views: {
      alertas_inventario: {
        Row: {
          id: string
          nombre: string
          categoria: string
          stock_actual: number
          stock_minimo: number
          diferencia: number
        }
      }
      historial_vehiculos: {
        Row: {
          vehiculo_id: string
          patente: string
          marca: string
          modelo: string
          cliente_nombre: string
          orden_id: string
          numero_orden: string
          fecha_servicio: string
          servicios: string[]
          kilometraje: number
          total: number
        }
      }
    }
    Functions: {
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          citas_hoy: number
          ordenes_abiertas: number
          clientes_total: number
          inventario_bajo: number
          servicios_mes: number
          ingresos_mes: number
        }[]
      }
      buscar_vehiculo_por_patente: {
        Args: { patente_buscar: string }
        Returns: {
          vehiculo_id: string
          patente: string
          marca: string
          modelo: string
          cliente_id: string
          cliente_nombre: string
          cliente_telefono: string
        }[]
      }
    }
  }
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";