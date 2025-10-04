import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Plus, Edit, Clock, CheckCircle } from 'lucide-react'

interface OrdenTrabajo {
  id: string
  numero_orden: string
  estado: 'abierta' | 'en_proceso' | 'completada' | 'facturada'
  servicios_realizados: string[]
  kilometraje_actual: number
  total: number
  fecha_inicio: string
  vehiculos: {
    patente: string
    marca: string
    modelo: string
    clientes: {
      nombre: string
      apellido: string
    }
  }
  empleados?: {
    nombre: string
    apellido: string
  }
}

export function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const columns: ColumnDef<OrdenTrabajo>[] = [
    {
      accessorKey: 'numero_orden',
      header: 'Número',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.numero_orden}</Badge>
      )
    },
    {
      accessorKey: 'vehiculos.patente',
      header: 'Vehículo',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.vehiculos.patente}</p>
          <p className="text-sm text-gray-500">
            {row.original.vehiculos.marca} {row.original.vehiculos.modelo}
          </p>
        </div>
      )
    },
    {
      accessorKey: 'vehiculos.clientes.nombre',
      header: 'Cliente',
      cell: ({ row }) => (
        <p className="font-medium">
          {row.original.vehiculos.clientes.nombre} {row.original.vehiculos.clientes.apellido}
        </p>
      )
    },
    {
      accessorKey: 'servicios_realizados',
      header: 'Servicios',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.servicios_realizados.slice(0, 2).map((servicio, index) => (
            <Badge key={index} variant="secondary" className="text-xs mr-1">
              {servicio}
            </Badge>
          ))}
          {row.original.servicios_realizados.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.servicios_realizados.length - 2} más
            </Badge>
          )}
        </div>
      )
    },
    {
      accessorKey: 'empleados.nombre',
      header: 'Empleado',
      cell: ({ row }) => (
        row.original.empleados ? (
          <p className="text-sm">
            {row.original.empleados.nombre} {row.original.empleados.apellido}
          </p>
        ) : (
          <span className="text-sm text-gray-500">Sin asignar</span>
        )
      )
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.original.estado
        const variants = {
          abierta: 'secondary',
          en_proceso: 'default',
          completada: 'default',
          facturada: 'outline'
        } as const
        
        return (
          <Badge variant={variants[estado]}>
            {estado.replace('_', ' ').charAt(0).toUpperCase() + estado.replace('_', ' ').slice(1)}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-medium">${row.original.total.toLocaleString()}</span>
      )
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.estado === 'abierta' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateEstado(row.original.id, 'en_proceso')}
            >
              <Clock className="h-4 w-4" />
            </Button>
          )}
          {row.original.estado === 'en_proceso' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateEstado(row.original.id, 'completada')}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  const loadOrdenes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select(`
          *,
          vehiculos (
            patente,
            marca,
            modelo,
            clientes (
              nombre,
              apellido
            )
          ),
          empleados (
            nombre,
            apellido
          )
        `)
        .order('fecha_inicio', { ascending: false })

      if (error) throw error
      setOrdenes(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las órdenes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEstado = async (ordenId: string, nuevoEstado: string) => {
    try {
      const updateData: any = { estado: nuevoEstado }
      
      if (nuevoEstado === 'completada') {
        updateData.fecha_completada = new Date().toISOString()
      }

      const { error } = await supabase
        .from('ordenes_trabajo')
        .update(updateData)
        .eq('id', ordenId)

      if (error) throw error

      toast({
        title: 'Estado actualizado',
        description: 'El estado de la orden se ha actualizado',
      })

      loadOrdenes()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadOrdenes()
    
    // Listen for navigation events from other components
    const handleNavigateToOrdenes = () => {
      // TODO: Open new order dialog with pre-selected data
      toast({
        title: 'Nueva Orden',
        description: 'Abriendo formulario de nueva orden',
      })
    }

    window.addEventListener('navigateToOrdenes', handleNavigateToOrdenes)
    
    return () => {
      window.removeEventListener('navigateToOrdenes', handleNavigateToOrdenes)
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  const ordenesActivas = ordenes.filter(o => o.estado === 'abierta' || o.estado === 'en_proceso')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Órdenes de Trabajo</h1>
          <p className="text-gray-600">Gestiona las órdenes de trabajo del taller</p>
        </div>
        <Button
          className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Órdenes activas destacadas */}
      {ordenesActivas.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-green-800">
              Órdenes Activas ({ordenesActivas.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ordenesActivas.slice(0, 6).map(orden => (
              <div key={orden.id} className="bg-white p-3 rounded border">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-xs">
                    {orden.numero_orden}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {orden.estado.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="font-medium text-sm">
                  {orden.vehiculos.patente} - {orden.vehiculos.marca}
                </p>
                <p className="text-xs text-gray-600">
                  {orden.vehiculos.clientes.nombre} {orden.vehiculos.clientes.apellido}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={ordenes}
        searchKey="numero_orden"
        searchPlaceholder="Buscar órdenes..."
        enableColumnVisibility
        enableRefresh
        onRefresh={loadOrdenes}
      />
    </div>
  )
}