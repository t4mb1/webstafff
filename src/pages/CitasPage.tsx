import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { useToast } from '@/hooks/use-toast'
import { database } from '@/integrations/database/client'
import { Plus, Edit, Calendar as CalendarIcon, Clock } from 'lucide-react'

interface Cita {
  id: string
  fecha_hora: string
  tipo_servicio: string
  estado: 'programada' | 'confirmada' | 'completada' | 'cancelada'
  observaciones: string
  clientes: {
    nombre: string
    apellido: string
    telefono: string
  }
  vehiculos: {
    patente: string
    marca: string
    modelo: string
  }
}

export function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const columns: ColumnDef<Cita>[] = [
    {
      accessorKey: 'fecha_hora',
      header: 'Fecha y Hora',
      cell: ({ row }) => {
        const fecha = new Date(row.original.fecha_hora)
        return (
          <div>
            <p className="font-medium">{fecha.toLocaleDateString('es-CL')}</p>
            <p className="text-sm text-gray-500">{fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        )
      }
    },
    {
      accessorKey: 'clientes.nombre',
      header: 'Cliente',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {row.original.clientes.nombre} {row.original.clientes.apellido}
          </p>
          <p className="text-sm text-gray-500">{row.original.clientes.telefono}</p>
        </div>
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
      accessorKey: 'tipo_servicio',
      header: 'Servicio',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.tipo_servicio}</Badge>
      )
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.original.estado
        const variants = {
          programada: 'outline',
          confirmada: 'default',
          completada: 'default',
          cancelada: 'destructive'
        } as const
        
        return (
          <Badge variant={variants[estado]}>
            {estado.charAt(0).toUpperCase() + estado.slice(1)}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'observaciones',
      header: 'Observaciones',
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 max-w-xs truncate">
          {row.original.observaciones || '-'}
        </p>
      )
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {row.original.estado === 'programada' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConfirm(row.original.id)}
              className="text-green-600 hover:text-green-700"
            >
              <Clock className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  const loadCitas = async () => {
    try {
      setLoading(true)
      const { data, error } = await database
        .from('citas')
        .select(`
          *,
          clientes (
            nombre,
            apellido,
            telefono
          ),
          vehiculos (
            patente,
            marca,
            modelo
          )
        `)
        .order('fecha_hora', { ascending: true })

      if (error) throw error
      setCitas(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las citas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (cita: Cita) => {
    toast({
      title: 'Editar Cita',
      description: `Editando cita del ${new Date(cita.fecha_hora).toLocaleDateString()}`,
    })
  }

  const handleConfirm = async (citaId: string) => {
    try {
      const { error } = await database
        .from('citas')
        .update({ estado: 'confirmada' })
        .eq('id', citaId)

      if (error) throw error

      toast({
        title: 'Cita confirmada',
        description: 'La cita ha sido confirmada exitosamente',
      })

      loadCitas()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadCitas()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  const citasHoy = citas.filter(cita => {
    const fechaCita = new Date(cita.fecha_hora).toDateString()
    const hoy = new Date().toDateString()
    return fechaCita === hoy
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Citas</h1>
          <p className="text-gray-600">Gestiona las citas programadas</p>
        </div>
        <Button
          className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Citas de hoy */}
      {citasHoy.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">
              Citas de Hoy ({citasHoy.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {citasHoy.map(cita => (
              <div key={cita.id} className="bg-white p-3 rounded border">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">
                    {new Date(cita.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {cita.estado}
                  </Badge>
                </div>
                <p className="font-medium text-sm">
                  {cita.clientes.nombre} {cita.clientes.apellido}
                </p>
                <p className="text-xs text-gray-600">
                  {cita.vehiculos.patente} - {cita.tipo_servicio}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={citas}
        searchKey="clientes.nombre"
        searchPlaceholder="Buscar citas..."
        enableColumnVisibility
        enableRefresh
        onRefresh={loadCitas}
      />
    </div>
  )
}