import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { database } from '@/integrations/database/client'
import { useToast } from '@/hooks/use-toast'
import {
  Calendar,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

interface DashboardStats {
  citas_hoy: number
  ordenes_abiertas: number
  clientes_total: number
  inventario_bajo: number
  servicios_mes: number
  ingresos_mes: number
}

interface AlertaInventario {
  id: string
  nombre: string
  categoria: string
  stock_actual: number
  stock_minimo: number
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    citas_hoy: 0,
    ordenes_abiertas: 0,
    clientes_total: 0,
    inventario_bajo: 0,
    servicios_mes: 0,
    ingresos_mes: 0
  })
  const [alertasInventario, setAlertasInventario] = useState<AlertaInventario[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get dashboard stats using RPC function
      const { data: statsData, error: statsError } = await database
        .rpc('get_dashboard_stats')

      if (statsError) throw statsError

      if (statsData && statsData.length > 0) {
        setStats(statsData[0])
      }

      // Get inventory alerts
      const { data: alertasData, error: alertasError } = await database
        .from('alertas_inventario')
        .select('*')
        .limit(5)

      if (alertasError) throw alertasError

      setAlertasInventario(alertasData || [])

    } catch (error: unknown) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del dashboard',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadDashboardData()
  }, [loadDashboardData])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-36 rounded-lg bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-lg text-slate-600">
            Resumen general de Serviteca Tamburini
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadDashboardData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-indigo-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold text-indigo-700">Citas Hoy</CardTitle>
            <Calendar className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.citas_hoy}</div>
            <p className="text-sm text-slate-600">
              Citas programadas para hoy
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold text-rose-700">Órdenes Activas</CardTitle>
            <Clock className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.ordenes_abiertas}</div>
            <p className="text-sm text-slate-600">
              Órdenes en proceso
            </p>
          </CardContent>
        </Card>

        <Card className="border-sky-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold text-sky-700">Clientes</CardTitle>
            <Users className="h-5 w-5 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.clientes_total}</div>
            <p className="text-sm text-slate-600">
              Total de clientes registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold text-amber-700">Servicios del Mes</CardTitle>
            <CheckCircle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.servicios_mes}</div>
            <p className="text-sm text-slate-600">
              Servicios completados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ingresos del mes */}
      <Card className="border-indigo-200 bg-indigo-50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-indigo-800">
            <TrendingUp className="h-5 w-5" />
            Ingresos del Mes
          </CardTitle>
          <CardDescription>
            Ingresos estimados basados en servicios completados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-extrabold text-slate-900">
            ${stats.ingresos_mes?.toLocaleString('es-CL') || '0'}
          </div>
          <p className="mt-3 text-base text-slate-600">
            Basado en {stats.servicios_mes} servicios completados
          </p>
        </CardContent>
      </Card>

      {/* Alertas de inventario */}
      {stats.inventario_bajo > 0 && (
        <Card className="border-rose-200 bg-rose-50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-rose-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Inventario ({stats.inventario_bajo})
            </CardTitle>
            <CardDescription>
              Productos con stock bajo que requieren reposición
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertasInventario.map((alerta) => (
                <Alert key={alerta.id} className="border-rose-200">
                  <Package className="h-4 w-4" />
                  <AlertDescription className="flex justify-between items-center">
                    <div>
                      <span className="text-base font-semibold text-slate-900">{alerta.nombre}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {alerta.categoria}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-rose-700">
                        Stock: {alerta.stock_actual}
                      </span>
                      <p className="text-xs text-slate-500">
                        Mínimo: {alerta.stock_minimo}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">Estado del Taller</CardTitle>
            <CardDescription>
              Resumen del estado actual de operaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Órdenes pendientes:</span>
              <Badge variant={stats.ordenes_abiertas > 5 ? "destructive" : "secondary"}>
                {stats.ordenes_abiertas}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Citas programadas hoy:</span>
              <Badge variant="outline">{stats.citas_hoy}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Alertas de inventario:</span>
              <Badge variant={stats.inventario_bajo > 0 ? "destructive" : "secondary"}>
                {stats.inventario_bajo}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">Rendimiento del Mes</CardTitle>
            <CardDescription>
              Métricas de productividad mensual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Servicios completados:</span>
              <Badge variant="outline">{stats.servicios_mes}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Promedio por servicio:</span>
              <Badge variant="secondary">$45.000</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total clientes activos:</span>
              <Badge variant="outline">{stats.clientes_total}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}