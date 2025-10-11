import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { database } from '@/integrations/database/client'
import { useToast } from '@/hooks/use-toast'
import { 
  Car, 
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

  const loadDashboardData = async () => {
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

    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del dashboard',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Dashboard</h1>
          <p className="text-gray-600">Resumen general de Serviteca Tamburini</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.citas_hoy}</div>
            <p className="text-xs text-gray-600">
              Citas programadas para hoy
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Órdenes Activas</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.ordenes_abiertas}</div>
            <p className="text-xs text-gray-600">
              Órdenes en proceso
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.clientes_total}</div>
            <p className="text-xs text-gray-600">
              Total de clientes registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Servicios del Mes</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{stats.servicios_mes}</div>
            <p className="text-xs text-gray-600">
              Servicios completados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ingresos del mes */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <TrendingUp className="h-5 w-5" />
            Ingresos del Mes
          </CardTitle>
          <CardDescription>
            Ingresos estimados basados en servicios completados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-700">
            ${stats.ingresos_mes?.toLocaleString('es-CL') || '0'}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Basado en {stats.servicios_mes} servicios completados
          </p>
        </CardContent>
      </Card>

      {/* Alertas de inventario */}
      {stats.inventario_bajo > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
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
                <Alert key={alerta.id} className="border-red-200">
                  <Package className="h-4 w-4" />
                  <AlertDescription className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{alerta.nombre}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {alerta.categoria}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-red-600 font-medium">
                        Stock: {alerta.stock_actual}
                      </span>
                      <p className="text-xs text-gray-500">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Estado del Taller</CardTitle>
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

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Rendimiento del Mes</CardTitle>
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