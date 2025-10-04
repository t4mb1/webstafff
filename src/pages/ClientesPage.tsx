import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { ClienteForm } from '@/components/forms/ClienteForm'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Plus, Edit, Trash2, FileText } from 'lucide-react'
import type { ClienteFormData } from '@/lib/validations'

interface Cliente extends ClienteFormData {
  id: string
  created_at: string
}

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>()
  const { toast } = useToast()

  const columns: ColumnDef<Cliente>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre Completo',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.nombre} {row.original.apellido}</p>
        </div>
      )
    },
    {
      accessorKey: 'rut',
      header: 'RUT',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.rut}</Badge>
      )
    },
    {
      accessorKey: 'email',
      header: 'Email'
    },
    {
      accessorKey: 'telefono',
      header: 'Teléfono'
    },
    {
      accessorKey: 'direccion',
      header: 'Dirección'
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
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
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

  const loadClientes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClientes(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsFormOpen(true)
  }

  const handleCreateOrder = (cliente: Cliente) => {
    // Navigate to orders page with pre-selected client
    localStorage.setItem('selectedClienteForOrden', JSON.stringify({
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido
    }))
    
    // Dispatch navigation event
    window.dispatchEvent(new CustomEvent('navigateToOrdenes', { 
      detail: { clienteId: cliente.id } 
    }))
    
    toast({
      title: 'Navegando a Órdenes',
      description: `Creando orden para ${cliente.nombre} ${cliente.apellido}`,
    })
  }

  const handleFormSuccess = () => {
    loadClientes()
    setSelectedCliente(undefined)
  }

  const handleNewCliente = () => {
    setSelectedCliente(undefined)
    setIsFormOpen(true)
  }

  useEffect(() => {
    loadClientes()
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
          <h1 className="text-3xl font-bold text-green-700">Clientes</h1>
          <p className="text-gray-600">Gestiona la base de datos de clientes</p>
        </div>
        <Button
          onClick={handleNewCliente}
          className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={clientes}
        searchKey="nombre"
        searchPlaceholder="Buscar clientes..."
        enableColumnVisibility
        enableRefresh
        onRefresh={loadClientes}
      />

      <ClienteForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        cliente={selectedCliente}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}