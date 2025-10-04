import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, FileText, Car, User, Clock } from 'lucide-react';

interface OrdenTrabajo {
  id: string;
  numero_orden: string;
  estado: string;
  servicios_realizados: string[];
  kilometraje_actual: number;
  proximo_cambio: number;
  total: number;
  observaciones: string;
  fecha_inicio: string;
  fecha_completada: string;
  vehiculos_2025_10_03_22_29: {
    patente: string;
    marca: string;
    modelo: string;
    clientes_2025_10_03_22_29: {
      nombre: string;
      apellido: string;
      telefono: string;
    };
  };
  empleados_2025_10_03_22_29?: {
    nombre: string;
    apellido: string;
  };
}

interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  cliente_id: string;
  clientes_2025_10_03_22_29: {
    nombre: string;
    apellido: string;
  };
}

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
}

interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
}

export const OrdenesTrabajo: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [ordenForm, setOrdenForm] = useState({
    cliente_id: '',
    vehiculo_id: '',
    empleado_id: '',
    servicios_realizados: [] as string[],
    kilometraje_actual: '',
    proximo_cambio: '',
    observaciones: ''
  });

  const [servicioActual, setServicioActual] = useState('');

  useEffect(() => {
    loadData();
    
    // Verificar si hay información preseleccionada desde otros componentes
    const selectedCliente = localStorage.getItem('selectedClienteForOrden');
    const selectedVehiculo = localStorage.getItem('selectedVehiculoForOrden');
    
    if (selectedCliente) {
      const clienteData = JSON.parse(selectedCliente);
      setOrdenForm(prev => ({ ...prev, cliente_id: clienteData.id }));
      localStorage.removeItem('selectedClienteForOrden');
      setIsDialogOpen(true);
    }
    
    if (selectedVehiculo) {
      const vehiculoData = JSON.parse(selectedVehiculo);
      setOrdenForm(prev => ({ 
        ...prev, 
        vehiculo_id: vehiculoData.id,
        cliente_id: vehiculoData.cliente_id 
      }));
      localStorage.removeItem('selectedVehiculoForOrden');
      setIsDialogOpen(true);
    }
  }, []);

  const loadData = async () => {
    try {
      // Cargar órdenes de trabajo
      const { data: ordenesData } = await supabase
        .from('ordenes_trabajo_2025_10_03_22_29')
        .select(`
          *,
          vehiculos_2025_10_03_22_29 (
            patente,
            marca,
            modelo,
            clientes_2025_10_03_22_29 (
              nombre,
              apellido,
              telefono
            )
          ),
          empleados_2025_10_03_22_29 (
            nombre,
            apellido
          )
        `)
        .order('fecha_inicio', { ascending: false });

      // Cargar vehículos con información del cliente
      const { data: vehiculosData } = await supabase
        .from('vehiculos_2025_10_03_22_29')
        .select(`
          id,
          patente,
          marca,
          modelo,
          cliente_id,
          clientes_2025_10_03_22_29 (
            nombre,
            apellido
          )
        `)
        .order('patente');

      // Cargar clientes
      const { data: clientesData } = await supabase
        .from('clientes_2025_10_03_22_29')
        .select('id, nombre, apellido')
        .order('nombre');

      // Cargar empleados
      const { data: empleadosData } = await supabase
        .from('empleados_2025_10_03_22_29')
        .select('id, nombre, apellido')
        .eq('activo', true)
        .order('nombre');

      setOrdenes(ordenesData || []);
      setVehiculos(vehiculosData || []);
      setClientes(clientesData || []);
      setEmpleados(empleadosData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrden = async () => {
    try {
      if (!ordenForm.vehiculo_id || !ordenForm.kilometraje_actual) {
        toast({
          title: "Error",
          description: "Por favor completa los campos obligatorios",
          variant: "destructive",
        });
        return;
      }

      const ordenData = {
        vehiculo_id: ordenForm.vehiculo_id,
        empleado_id: ordenForm.empleado_id || null,
        servicios_realizados: ordenForm.servicios_realizados,
        kilometraje_actual: parseInt(ordenForm.kilometraje_actual),
        proximo_cambio: ordenForm.proximo_cambio ? parseInt(ordenForm.proximo_cambio) : null,
        observaciones: ordenForm.observaciones,
        estado: 'abierta'
      };

      const { data, error } = await supabase
        .from('ordenes_trabajo_2025_10_03_22_29')
        .insert([ordenData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Orden creada",
        description: `Orden ${data.numero_orden} creada exitosamente`,
      });

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateEstado = async (ordenId: string, nuevoEstado: string) => {
    try {
      const updateData: any = { estado: nuevoEstado };
      
      if (nuevoEstado === 'completada') {
        updateData.fecha_completada = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ordenes_trabajo_2025_10_03_22_29')
        .update(updateData)
        .eq('id', ordenId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: "El estado de la orden se ha actualizado",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const agregarServicio = () => {
    if (servicioActual.trim()) {
      setOrdenForm({
        ...ordenForm,
        servicios_realizados: [...ordenForm.servicios_realizados, servicioActual.trim()]
      });
      setServicioActual('');
    }
  };

  const removerServicio = (index: number) => {
    const nuevosServicios = ordenForm.servicios_realizados.filter((_, i) => i !== index);
    setOrdenForm({
      ...ordenForm,
      servicios_realizados: nuevosServicios
    });
  };

  const resetForm = () => {
    setOrdenForm({
      cliente_id: '',
      vehiculo_id: '',
      empleado_id: '',
      servicios_realizados: [],
      kilometraje_actual: '',
      proximo_cambio: '',
      observaciones: ''
    });
    setServicioActual('');
  };

  const filteredOrdenes = ordenes.filter(orden => 
    filtroEstado === 'todas' || orden.estado === filtroEstado
  );

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'abierta': return 'secondary';
      case 'en_proceso': return 'default';
      case 'completada': return 'default';
      case 'facturada': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="p-6">Cargando órdenes de trabajo...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Órdenes de Trabajo</h1>
          <p className="text-gray-600">Gestiona las órdenes de trabajo del taller</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-green-700">Crear Nueva Orden de Trabajo</DialogTitle>
              <DialogDescription>
                Completa los datos para crear una nueva orden de trabajo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente_select">Cliente</Label>
                  <Select 
                    value={ordenForm.cliente_id} 
                    onValueChange={(value) => {
                      setOrdenForm({...ordenForm, cliente_id: value, vehiculo_id: ''});
                    }}
                  >
                    <SelectTrigger className="border-green-200 focus:border-green-500">
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nombre} {cliente.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehiculo">Vehículo</Label>
                  <Select 
                    value={ordenForm.vehiculo_id} 
                    onValueChange={(value) => {
                      const vehiculoSeleccionado = vehiculos.find(v => v.id === value);
                      if (vehiculoSeleccionado) {
                        setOrdenForm({
                          ...ordenForm, 
                          vehiculo_id: value,
                          cliente_id: vehiculoSeleccionado.cliente_id
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="border-green-200 focus:border-green-500">
                      <SelectValue placeholder="Selecciona un vehículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehiculos
                        .filter(v => !ordenForm.cliente_id || v.cliente_id === ordenForm.cliente_id)
                        .map((vehiculo) => (
                          <SelectItem key={vehiculo.id} value={vehiculo.id}>
                            {vehiculo.patente} - {vehiculo.marca} {vehiculo.modelo}
                            <br />
                            <span className="text-sm text-gray-500">
                              {vehiculo.clientes_2025_10_03_22_29?.nombre} {vehiculo.clientes_2025_10_03_22_29?.apellido}
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="empleado">Empleado Asignado</Label>
                <Select 
                  value={ordenForm.empleado_id} 
                  onValueChange={(value) => setOrdenForm({...ordenForm, empleado_id: value})}
                >
                  <SelectTrigger className="border-green-200 focus:border-green-500">
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {empleados.map((empleado) => (
                      <SelectItem key={empleado.id} value={empleado.id}>
                        {empleado.nombre} {empleado.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kilometraje">Kilometraje Actual</Label>
                  <Input
                    id="kilometraje"
                    type="number"
                    value={ordenForm.kilometraje_actual}
                    onChange={(e) => setOrdenForm({...ordenForm, kilometraje_actual: e.target.value})}
                    placeholder="45000"
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="proximo_cambio">Próximo Cambio (km)</Label>
                  <Input
                    id="proximo_cambio"
                    type="number"
                    value={ordenForm.proximo_cambio}
                    onChange={(e) => setOrdenForm({...ordenForm, proximo_cambio: e.target.value})}
                    placeholder="50000"
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <Label>Servicios a Realizar</Label>
                <div className="flex gap-2 mb-2">
                  <Select value={servicioActual} onValueChange={setServicioActual}>
                    <SelectTrigger className="flex-1 border-green-200 focus:border-green-500">
                      <SelectValue placeholder="Selecciona un servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cambio de aceite">Cambio de aceite</SelectItem>
                      <SelectItem value="Cambio de filtro de aceite">Cambio de filtro de aceite</SelectItem>
                      <SelectItem value="Cambio de filtro de aire">Cambio de filtro de aire</SelectItem>
                      <SelectItem value="Revisión general">Revisión general</SelectItem>
                      <SelectItem value="Limpieza de motor">Limpieza de motor</SelectItem>
                      <SelectItem value="Cambio de refrigerante">Cambio de refrigerante</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    onClick={agregarServicio}
                    className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700"
                  >
                    Agregar
                  </Button>
                </div>
                <div className="space-y-2">
                  {ordenForm.servicios_realizados.map((servicio, index) => (
                    <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                      <span>{servicio}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removerServicio(index)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={ordenForm.observaciones}
                  onChange={(e) => setOrdenForm({...ordenForm, observaciones: e.target.value})}
                  placeholder="Observaciones adicionales sobre el trabajo..."
                  className="border-green-200 focus:border-green-500"
                />
              </div>

              <Button 
                onClick={handleSaveOrden} 
                className="w-full bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700"
              >
                Crear Orden de Trabajo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Label htmlFor="filtro-estado">Filtrar por estado:</Label>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-48 border-green-200 focus:border-green-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las órdenes</SelectItem>
            <SelectItem value="abierta">Abiertas</SelectItem>
            <SelectItem value="en_proceso">En proceso</SelectItem>
            <SelectItem value="completada">Completadas</SelectItem>
            <SelectItem value="facturada">Facturadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Órdenes abiertas destacadas */}
      {filteredOrdenes.filter(o => o.estado === 'abierta' || o.estado === 'en_proceso').length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Clock className="h-5 w-5" />
              Órdenes Activas ({filteredOrdenes.filter(o => o.estado === 'abierta' || o.estado === 'en_proceso').length})
            </CardTitle>
            <CardDescription>
              Órdenes que requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrdenes
                .filter(orden => orden.estado === 'abierta' || orden.estado === 'en_proceso')
                .map((orden) => (
                  <Card key={orden.id} className="border-green-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {orden.numero_orden}
                        </Badge>
                        <Badge variant={getEstadoBadgeVariant(orden.estado)}>
                          {orden.estado.replace('_', ' ').charAt(0).toUpperCase() + orden.estado.replace('_', ' ').slice(1)}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {orden.vehiculos_2025_10_03_22_29.patente} - {orden.vehiculos_2025_10_03_22_29.marca} {orden.vehiculos_2025_10_03_22_29.modelo}
                        </p>
                        <p className="text-xs text-gray-600">
                          Cliente: {orden.vehiculos_2025_10_03_22_29.clientes_2025_10_03_22_29.nombre} {orden.vehiculos_2025_10_03_22_29.clientes_2025_10_03_22_29.apellido}
                        </p>
                        <p className="text-xs text-gray-600">
                          Km: {orden.kilometraje_actual?.toLocaleString()}
                        </p>
                        {orden.empleados_2025_10_03_22_29 && (
                          <p className="text-xs text-gray-600">
                            Empleado: {orden.empleados_2025_10_03_22_29.nombre} {orden.empleados_2025_10_03_22_29.apellido}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 mt-3">
                        {orden.estado === 'abierta' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateEstado(orden.id, 'en_proceso')}
                            className="border-green-200 text-green-700 hover:bg-green-50"
                          >
                            Iniciar
                          </Button>
                        )}
                        {orden.estado === 'en_proceso' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateEstado(orden.id, 'completada')}
                            className="border-green-200 text-green-700 hover:bg-green-50"
                          >
                            Completar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de órdenes */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <FileText className="h-5 w-5" />
            Órdenes de Trabajo
          </CardTitle>
          <CardDescription>
            Lista completa de órdenes de trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrdenes.map((orden) => (
                <TableRow key={orden.id}>
                  <TableCell>
                    <Badge variant="outline">{orden.numero_orden}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {orden.vehiculos_2025_10_03_22_29.patente}
                        </p>
                        <p className="text-sm text-gray-600">
                          {orden.vehiculos_2025_10_03_22_29.marca} {orden.vehiculos_2025_10_03_22_29.modelo}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {orden.vehiculos_2025_10_03_22_29.clientes_2025_10_03_22_29.nombre} {orden.vehiculos_2025_10_03_22_29.clientes_2025_10_03_22_29.apellido}
                        </p>
                        <p className="text-sm text-gray-600">
                          {orden.vehiculos_2025_10_03_22_29.clientes_2025_10_03_22_29.telefono}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {orden.servicios_realizados?.map((servicio, index) => (
                        <Badge key={index} variant="secondary" className="text-xs mr-1">
                          {servicio}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {orden.empleados_2025_10_03_22_29 ? (
                      <p className="text-sm">
                        {orden.empleados_2025_10_03_22_29.nombre} {orden.empleados_2025_10_03_22_29.apellido}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Sin asignar</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadgeVariant(orden.estado)}>
                      {orden.estado.replace('_', ' ').charAt(0).toUpperCase() + orden.estado.replace('_', ' ').slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">${orden.total?.toFixed(2) || '0.00'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {orden.estado === 'abierta' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateEstado(orden.id, 'en_proceso')}
                          className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                          Iniciar
                        </Button>
                      )}
                      {orden.estado === 'en_proceso' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateEstado(orden.id, 'completada')}
                          className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                          Completar
                        </Button>
                      )}
                      {orden.estado === 'completada' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateEstado(orden.id, 'facturada')}
                          className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                          Facturar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};