import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Plus, Edit, AlertTriangle, Package } from 'lucide-react'

interface InventarioItem {
  id: string
  nombre: string
  categoria: string
  precio_compra: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  codigo_barras: string
  created_at: string
}

export function InventarioPage() {
  const [inventario, setInventario] = useState<InventarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const columns: ColumnDef<InventarioItem>[] = [
    {
      accessorKey: 'nombre',
      header: 'Producto',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.nombre}</p>
          <Badge variant="secondary" className="text-xs">
            {row.original.categoria}
          </Badge>
        </div>
      )
    },
    {
      accessorKey: 'codigo_barras',
      header: 'Código',
      cell: ({ row }) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
          {row.original.codigo_barras}
        </code>
      )
    },
    {
      accessorKey: 'stock_actual',
      header: 'Stock',
      cell: ({ row }) => {
        const isLow = row.original.stock_actual <= row.original.stock_minimo
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isLow ? "destructive" : "outline"}>
              {row.original.stock_actual}
            </Badge>
            {isLow && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
        )
      }
    },
    {
      accessorKey: 'stock_minimo',
      header: 'Mín.',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{row.original.stock_minimo}</span>
      )
    },
    {
      accessorKey: 'precio_compra',
      header: 'P. Compra',
      cell: ({ row }) => (
        <span className="text-sm">${row.original.precio_compra.toLocaleString()}</span>
      )
    },
    {
      accessorKey: 'precio_venta',
      header: 'P. Venta',
      cell: ({ row }) => (
        <span className="font-medium">${row.original.precio_venta.toLocaleString()}</span>
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
        </div>
      )
    }
  ]

  const loadInventario = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('nombre')

      if (error) throw error
      setInventario(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el inventario',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: InventarioItem) => {
    toast({
      title: 'Editar Producto',
      description: `Editando ${item.nombre}`,
    })
  }

  useEffect(() => {
    loadInventario()
  }, [])

  const stockBajo = inventario.filter(item => item.stock_actual <= item.stock_minimo)

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
          <h1 className="text-3xl font-bold text-green-700">Inventario</h1>
          <p className="text-gray-600">Control de stock y productos</p>
        </div>
        <Button
          className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Alertas de stock bajo */}
      {stockBajo.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-800">
              Productos con Stock Bajo ({stockBajo.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {stockBajo.map(item => (
              <Badge key={item.id} variant="destructive" className="text-xs">
                {item.nombre}: {item.stock_actual}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={inventario}
        searchKey="nombre"
        searchPlaceholder="Buscar productos..."
        enableColumnVisibility
        enableRefresh
        onRefresh={loadInventario}
      />
    </div>
  )
}