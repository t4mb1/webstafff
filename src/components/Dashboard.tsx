import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Car, 
  Calendar, 
  Package, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

interface DashboardStats {
  citasHoy: number;
  ordenesAbiertas: number;
  clientesTotal: number;
  inventarioBajo: number;
  serviciosCompletados: number;
  ingresosMes: number;
}

interface AlertaInventario {
  id: string;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    citasHoy: 0,
    ordenesAbiertas: 0,
    clientesTotal: 0,
    inventarioBajo: 0,
    serviciosCompletados: 0,
    ingresosMes: 0
  });
  const [alertasInventario, setAlertasInventario] = useState<AlertaInventario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Citas de hoy
      const today = new Date().toISOString().split('T')[0];
      const { data: citasHoy } = await supabase
        .from('citas_2025_10_03_22_29')
        .select('*')
        .gte('fecha_hora', `${today}T00:00:00`)
        .lt('fecha_hora', `${today}T23:59:59`);

      // Órdenes abiertas
      const { data: ordenesAbiertas } = await supabase
        .from('ordenes_trabajo_2025_10_03_22_29')
        .select('*')
        .in('estado', ['abierta', 'en_proceso']);

      // Total de clientes
      const { data: clientes } = await supabase
        .from('clientes_2025_10_03_22_29')
        .select('id');

      // Inventario con stock bajo
      const { data: inventarioBajo } = await supabase
        .from('inventario_2025_10_03_22_29')
        .select('*')
        .lt('stock_actual', 10); // Consideramos stock bajo cuando es menor a 10

      // Servicios completados este mes
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: serviciosCompletados } = await supabase
        .from('ordenes_trabajo_2025_10_03_22_29')
        .select('*')
        .eq('estado', 'completada')
        .gte('fecha_completada', firstDayOfMonth);

      // Calcular ingresos del mes (simulado)
      const ingresosMes = (serviciosCompletados?.length || 0) * 45000; // Promedio $45,000 por servicio

      setStats({
        citasHoy: citasHoy?.length || 0,
        ordenesAbiertas: ordenesAbiertas?.length || 0,
        clientesTotal: clientes?.length || 0,
        inventarioBajo: inventarioBajo?.length || 0,
        serviciosCompletados: serviciosCompletados?.length || 0,
        ingresosMes
      });

      // Configurar alertas de inventario
      if (inventarioBajo && inventarioBajo.length > 0) {
        const alertas = inventarioBajo.slice(0, 5).map(item => ({
          id: item.id,
          nombre: item.nombre,
          categoria: item.categoria || 'General',
          stock_actual: item.stock_actual,
          stock_minimo: 10
        }));
        setAlertasInventario(alertas);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-700">Dashboard</h1>
        <p className="text-gray-600">Resumen general de Serviteca Tamburini</p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.citasHoy}</div>
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
            <div className="text-2xl font-bold text-red-700">{stats.ordenesAbiertas}</div>
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
            <div className="text-2xl font-bold text-blue-700">{stats.clientesTotal}</div>
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
            <div className="text-2xl font-bold text-orange-700">{stats.serviciosCompletados}</div>
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
            ${stats.ingresosMes.toLocaleString('es-CL')}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Basado en {stats.serviciosCompletados} servicios completados
          </p>
        </CardContent>
      </Card>

      {/* Alertas de inventario */}
      {stats.inventarioBajo > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Inventario ({stats.inventarioBajo})
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
              <Badge variant={stats.ordenesAbiertas > 5 ? "destructive" : "secondary"}>
                {stats.ordenesAbiertas}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Citas programadas hoy:</span>
              <Badge variant="outline">{stats.citasHoy}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Alertas de inventario:</span>
              <Badge variant={stats.inventarioBajo > 0 ? "destructive" : "secondary"}>
                {stats.inventarioBajo}
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
              <Badge variant="outline">{stats.serviciosCompletados}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Promedio por servicio:</span>
              <Badge variant="secondary">$45.000</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total clientes activos:</span>
              <Badge variant="outline">{stats.clientesTotal}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};