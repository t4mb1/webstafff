import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Plus, Edit, FileText, History } from 'lucide-react'

interface Vehiculo {
  id: string
  patente: string
  marca: string
  modelo: string
  año: number
  color: string
  created_at: string
  clientes: {
    nombre: string
    apellido: string
    telefono: string
  }
}

export function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const columns: ColumnDef<Vehiculo>[] = [
    {
      accessorKey: 'patente',
      header: 'Patente',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.patente}
        </Badge>
      )
    },
    {
      accessorKey: 'marca',
      header: 'Marca/Modelo',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.marca} {row.original.modelo}</p>
          <p className="text-sm text-gray-500">{row.original.año} • {row.original.color}</p>
        </div>
      )
    },
    {
      accessorKey: 'clientes.nombre',
      header: 'Propietario',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {row.original.clientes?.nombre} {row.original.clientes?.apellido}
          </p>
          <p className="text-sm text-gray-500">{row.original.clientes?.telefono}</p>
        </div>
      )
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha Registro',
      cell: ({ row }) => (
        new Date(row.original.created_at).toLocaleDateString('es-CL')
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
            onClick={() => handleViewHistory(row.original)}
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCreateOrder(row.original)}
            className="text-green-600 hover:text-green-700"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const loadVehiculos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('vehiculos')
        .select(`
          *,
          clientes (
            nombre,
            apellido,
            telefono
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehiculos(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los vehículos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewHistory = (vehiculo: Vehiculo) => {
    toast({
      title: 'Historial de Servicios',
      description: `Mostrando historial para ${vehiculo.patente}`,
    })
  }

  const handleCreateOrder = (vehiculo: Vehiculo) => {
    // Navigate to orders page with pre-selected vehicle
    localStorage.setItem('selectedVehiculoForOrden', JSON.stringify({
      id: vehiculo.id,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo
    }))
    
    toast({
      title: 'Navegando a Órdenes',
      description: `Creando orden para vehículo ${vehiculo.patente}`,
    })
  }

  useEffect(() => {
    loadVehiculos()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Vehículos</h1>
          <p className="text-gray-600">Gestiona el registro de vehículos</p>
        </div>
        <Button
          className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Vehículo
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={vehiculos}
        searchKey="patente"
        searchPlaceholder="Buscar por patente..."
        enableColumnVisibility
        enableRefresh
        onRefresh={loadVehiculos}
      />
    </div>
  )
}