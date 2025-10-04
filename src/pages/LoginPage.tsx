import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/components/auth/AuthProvider'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { Flag, Lock } from 'lucide-react'

export function LoginPage() {
  const { user, signIn } = useAuth()
  const location = useLocation()
  const [error, setError] = useState<string>('')

  const from = location.state?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  // Redirect if already authenticated
  if (user) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('')
      const { error } = await signIn(data.password)
      
      if (error) {
        setError(error.message)
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-green-600 to-red-600 rounded-full">
              <Flag className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">
            Serviteca Tamburini
          </CardTitle>
          <CardDescription className="text-gray-600">
            🇮🇹 Sistema de Administración del Taller
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña de Acceso</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa la contraseña del taller"
                {...register('password')}
                className={errors.password ? 'border-red-500' : 'border-green-200 focus:border-green-500'}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verificando...' : 'Acceder al Sistema'}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Contraseña de demostración: <code className="bg-gray-100 px-2 py-1 rounded">serviteca+1995</code></p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}