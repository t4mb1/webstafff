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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/integrations/database/client';
import { Plus, Calendar as CalendarIcon, Clock, User, Car } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Cita {
  id: string;
  fecha_hora: string;
  servicio_solicitado: string;
  estado: string;
  observaciones: string;
  clientes_2025_10_03_22_29: {
    nombre: string;
    apellido: string;
    telefono: string;
  };
  vehiculos_2025_10_03_22_29: {
    patente: string;
    marca: string;
    modelo: string;
  };
  empleados_2025_10_03_22_29?: {
    nombre: string;
    apellido: string;
  };
}

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
}

interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  cliente_id: string;
}

interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
}

export const Citas: React.FC = () => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [citaForm, setCitaForm] = useState({
    cliente_id: '',
    vehiculo_id: '',
    empleado_id: '',
    fecha: '',
    hora: '',
    servicio_solicitado: '',
    observaciones: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar citas con información relacionada
      const { data: citasData } = await database
        .from('citas_2025_10_03_22_29')
        .select(`
          *,
          clientes_2025_10_03_22_29 (
            nombre,
            apellido,
            telefono
          ),
          vehiculos_2025_10_03_22_29 (
            patente,
            marca,
            modelo
          ),
          empleados_2025_10_03_22_29 (
            nombre,
            apellido
          )
        `)
        .order('fecha_hora', { ascending: true });

      // Cargar clientes
      const { data: clientesData } = await database
        .from('clientes_2025_10_03_22_29')
        .select('id, nombre, apellido')
        .order('nombre');

      // Cargar vehículos
      const { data: vehiculosData } = await database
        .from('vehiculos_2025_10_03_22_29')
        .select('id, patente, marca, modelo, cliente_id')
        .order('patente');

      // Cargar empleados
      const { data: empleadosData } = await database
        .from('empleados_2025_10_03_22_29')
        .select('id, nombre, apellido')
        .eq('activo', true)
        .order('nombre');

      setCitas(citasData || []);
      setClientes(clientesData || []);
      setVehiculos(vehiculosData || []);
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

  const handleSaveCita = async () => {
    try {
      if (!citaForm.cliente_id || !citaForm.vehiculo_id || !citaForm.fecha || !citaForm.hora) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos obligatorios",
          variant: "destructive",
        });
        return;
      }

      const fechaHora = new Date(`${citaForm.fecha}T${citaForm.hora}`);

      const citaData = {
        cliente_id: citaForm.cliente_id,
        vehiculo_id: citaForm.vehiculo_id,
        empleado_id: citaForm.empleado_id || null,
        fecha_hora: fechaHora.toISOString(),
        servicio_solicitado: citaForm.servicio_solicitado,
        observaciones: citaForm.observaciones,
        estado: 'programada'
      };

      const { error } = await database
        .from('citas_2025_10_03_22_29')
        .insert([citaData]);

      if (error) throw error;

      toast({
        title: "Cita programada",
        description: "La cita se ha programado exitosamente",
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

  const handleUpdateEstado = async (citaId: string, nuevoEstado: string) => {
    try {
      const { error } = await database
        .from('citas_2025_10_03_22_29')
        .update({ estado: nuevoEstado })
        .eq('id', citaId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: "El estado de la cita se ha actualizado",
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

  const resetForm = () => {
    setCitaForm({
      cliente_id: '',
      vehiculo_id: '',
      empleado_id: '',
      fecha: '',
      hora: '',
      servicio_solicitado: '',
      observaciones: ''
    });
  };

  const getVehiculosDelCliente = (clienteId: string) => {
    return vehiculos.filter(v => v.cliente_id === clienteId);
  };

  const filteredCitas = citas.filter(cita => 
    filtroEstado === 'todas' || cita.estado === filtroEstado
  );

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'programada': return 'default';
      case 'en_proceso': return 'secondary';
      case 'completada': return 'default';
      case 'cancelada': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="p-6">Cargando citas...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Gestión de Citas</h1>
          <p className="text-gray-600">Programa y gestiona las citas del taller</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Programar Nueva Cita</DialogTitle>
              <DialogDescription>
                Completa los datos para programar una nueva cita
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cliente">Cliente</Label>
                <Select 
                  value={citaForm.cliente_id} 
                  onValueChange={(value) => {
                    setCitaForm({...citaForm, cliente_id: value, vehiculo_id: ''});
                  }}
                >
                  <SelectTrigger>
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
                  value={citaForm.vehiculo_id} 
                  onValueChange={(value) => setCitaForm({...citaForm, vehiculo_id: value})}
                  disabled={!citaForm.cliente_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {getVehiculosDelCliente(citaForm.cliente_id).map((vehiculo) => (
                      <SelectItem key={vehiculo.id} value={vehiculo.id}>
                        {vehiculo.patente} - {vehiculo.marca} {vehiculo.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="empleado">Empleado Asignado (Opcional)</Label>
                <Select 
                  value={citaForm.empleado_id} 
                  onValueChange={(value) => setCitaForm({...citaForm, empleado_id: value})}
                >
                  <SelectTrigger>
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
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={citaForm.fecha}
                    onChange={(e) => setCitaForm({...citaForm, fecha: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="hora">Hora</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={citaForm.hora}
                    onChange={(e) => setCitaForm({...citaForm, hora: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="servicio">Servicio Solicitado</Label>
                <Select 
                  value={citaForm.servicio_solicitado} 
                  onValueChange={(value) => setCitaForm({...citaForm, servicio_solicitado: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cambio de aceite">Cambio de aceite</SelectItem>
                    <SelectItem value="Cambio de aceite y filtro">Cambio de aceite y filtro</SelectItem>
                    <SelectItem value="Cambio de filtro de aire">Cambio de filtro de aire</SelectItem>
                    <SelectItem value="Revisión general">Revisión general</SelectItem>
                    <SelectItem value="Mantenimiento preventivo">Mantenimiento preventivo</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={citaForm.observaciones}
                  onChange={(e) => setCitaForm({...citaForm, observaciones: e.target.value})}
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <Button onClick={handleSaveCita} className="w-full">
                Programar Cita
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Label htmlFor="filtro-estado">Filtrar por estado:</Label>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las citas</SelectItem>
            <SelectItem value="programada">Programadas</SelectItem>
            <SelectItem value="en_proceso">En proceso</SelectItem>
            <SelectItem value="completada">Completadas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de citas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Citas Programadas
          </CardTitle>
          <CardDescription>
            Lista de todas las citas con información del cliente y vehículo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCitas.map((cita) => (
                <TableRow key={cita.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {format(new Date(cita.fecha_hora), 'dd/MM/yyyy', { locale: es })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(cita.fecha_hora), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {cita.clientes_2025_10_03_22_29.nombre} {cita.clientes_2025_10_03_22_29.apellido}
                        </p>
                        <p className="text-sm text-gray-600">
                          {cita.clientes_2025_10_03_22_29.telefono}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {cita.vehiculos_2025_10_03_22_29.patente}
                        </p>
                        <p className="text-sm text-gray-600">
                          {cita.vehiculos_2025_10_03_22_29.marca} {cita.vehiculos_2025_10_03_22_29.modelo}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{cita.servicio_solicitado}</p>
                    {cita.observaciones && (
                      <p className="text-sm text-gray-600 mt-1">{cita.observaciones}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {cita.empleados_2025_10_03_22_29 ? (
                      <p className="text-sm">
                        {cita.empleados_2025_10_03_22_29.nombre} {cita.empleados_2025_10_03_22_29.apellido}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Sin asignar</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadgeVariant(cita.estado)}>
                      {cita.estado.replace('_', ' ').charAt(0).toUpperCase() + cita.estado.replace('_', ' ').slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {cita.estado === 'programada' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateEstado(cita.id, 'en_proceso')}
                        >
                          Iniciar
                        </Button>
                      )}
                      {cita.estado === 'en_proceso' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateEstado(cita.id, 'completada')}
                        >
                          Completar
                        </Button>
                      )}
                      {(cita.estado === 'programada' || cita.estado === 'en_proceso') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUpdateEstado(cita.id, 'cancelada')}
                        >
                          Cancelar
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