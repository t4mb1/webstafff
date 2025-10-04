import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { clienteSchema, type ClienteFormData } from '@/lib/validations'
import { supabase } from '@/integrations/supabase/client'

interface ClienteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente?: ClienteFormData & { id: string }
  onSuccess?: () => void
}

export function ClienteForm({ open, onOpenChange, cliente, onSuccess }: ClienteFormProps) {
  const { toast } = useToast()
  const isEditing = !!cliente

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: cliente || {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      direccion: '',
      rut: ''
    }
  })

  const onSubmit = async (data: ClienteFormData) => {
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('clientes')
          .update(data)
          .eq('id', cliente.id)

        if (error) throw error

        toast({
          title: 'Cliente actualizado',
          description: 'Los datos del cliente se han actualizado correctamente.'
        })
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([data])

        if (error) throw error

        toast({
          title: 'Cliente creado',
          description: 'El cliente se ha registrado correctamente.'
        })
      }

      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al procesar la solicitud.',
        variant: 'destructive'
      })
    }
  }

  React.useEffect(() => {
    if (open && cliente) {
      reset(cliente)
    } else if (open && !cliente) {
      reset({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        rut: ''
      })
    }
  }, [open, cliente, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos del cliente.' 
              : 'Completa los datos para registrar un nuevo cliente.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                {...register('nombre')}
                placeholder="Juan"
                className={errors.nombre ? 'border-red-500' : ''}
              />
              {errors.nombre && (
                <p className="text-sm text-red-500">{errors.nombre.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                {...register('apellido')}
                placeholder="Pérez"
                className={errors.apellido ? 'border-red-500' : ''}
              />
              {errors.apellido && (
                <p className="text-sm text-red-500">{errors.apellido.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rut">RUT *</Label>
            <Input
              id="rut"
              {...register('rut')}
              placeholder="12345678-9"
              className={errors.rut ? 'border-red-500' : ''}
            />
            {errors.rut && (
              <p className="text-sm text-red-500">{errors.rut.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="juan.perez@email.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input
              id="telefono"
              {...register('telefono')}
              placeholder="+56912345678"
              className={errors.telefono ? 'border-red-500' : ''}
            />
            {errors.telefono && (
              <p className="text-sm text-red-500">{errors.telefono.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección *</Label>
            <Textarea
              id="direccion"
              {...register('direccion')}
              placeholder="Av. Italia 1234, Santiago"
              className={errors.direccion ? 'border-red-500' : ''}
            />
            {errors.direccion && (
              <p className="text-sm text-red-500">{errors.direccion.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (isEditing ? 'Actualizando...' : 'Creando...') 
                : (isEditing ? 'Actualizar' : 'Crear')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}