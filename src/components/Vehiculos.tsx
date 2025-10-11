import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/integrations/database/client';
import { Plus, Search, Car, User, History, FileText } from 'lucide-react';

interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  color: string;
  kilometraje: number;
  tipo_aceite: string;
  capacidad_aceite: number;
  clientes_2025_10_03_22_29: {
    nombre: string;
    apellido: string;
    rut: string;
  };
}

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
}

interface HistorialServicio {
  numero_orden: string;
  fecha_inicio: string;
  fecha_completada: string;
  servicios_realizados: string[];
  kilometraje_actual: number;
  total: number;
  estado: string;
  observaciones: string;
  empleado_nombre: string;
}

export const Vehiculos: React.FC = () => {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [historialServicios, setHistorialServicios] = useState<HistorialServicio[]>([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOrdenDialogOpen, setIsOrdenDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [vehiculoForm, setVehiculoForm] = useState({
    cliente_id: '',
    patente: '',
    marca: '',
    modelo: '',
    año: '',
    color: '',
    kilometraje: '',
    tipo_aceite: '',
    capacidad_aceite: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar vehículos con información del cliente
      const { data: vehiculosData } = await database
        .from('vehiculos_2025_10_03_22_29')
        .select(`
          *,
          clientes_2025_10_03_22_29 (
            nombre,
            apellido,
            rut
          )
        `)
        .order('created_at', { ascending: false });

      // Cargar clientes
      const { data: clientesData } = await database
        .from('clientes_2025_10_03_22_29')
        .select('id, nombre, apellido')
        .order('nombre');

      setVehiculos(vehiculosData || []);
      setClientes(clientesData || []);
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

  const loadHistorialVehiculo = async (vehiculoId: string) => {
    try {
      const { data: historialData } = await database
        .from('historial_servicios_vehiculo')
        .select('*')
        .eq('vehiculo_id', vehiculoId)
        .order('fecha_inicio', { ascending: false });

      setHistorialServicios(historialData || []);
    } catch (error) {
      console.error('Error loading historial:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de servicios",
        variant: "destructive",
      });
    }
  };

  const handleSaveVehiculo = async () => {
    try {
      const vehiculoData = {
        ...vehiculoForm,
        año: parseInt(vehiculoForm.año),
        kilometraje: parseInt(vehiculoForm.kilometraje),
        capacidad_aceite: parseFloat(vehiculoForm.capacidad_aceite)
      };

      const { error } = await database
        .from('vehiculos_2025_10_03_22_29')
        .insert([vehiculoData]);

      if (error) throw error;

      toast({
        title: "Vehículo guardado",
        description: "El vehículo se ha registrado exitosamente",
      });

      setIsDialogOpen(false);
      setVehiculoForm({
        cliente_id: '',
        patente: '',
        marca: '',
        modelo: '',
        año: '',
        color: '',
        kilometraje: '',
        tipo_aceite: '',
        capacidad_aceite: ''
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

  const handleSelectVehiculo = (vehiculo: Vehiculo) => {
    setSelectedVehiculo(vehiculo);
    loadHistorialVehiculo(vehiculo.id);
  };

  const handleCreateOrdenForVehiculo = async () => {
    if (!selectedVehiculo) return;
    
    // Guardar información del vehículo seleccionado en localStorage para usar en órdenes
    localStorage.setItem('selectedVehiculoForOrden', JSON.stringify({
      id: selectedVehiculo.id,
      patente: selectedVehiculo.patente,
      marca: selectedVehiculo.marca,
      modelo: selectedVehiculo.modelo,
      cliente_id: selectedVehiculo.cliente_id
    }));
    
    // Disparar evento personalizado para cambiar a la pestaña de órdenes
    window.dispatchEvent(new CustomEvent('navigateToOrdenes', { 
      detail: { vehiculoId: selectedVehiculo.id } 
    }));
    
    toast({
      title: "Navegando a Órdenes",
      description: `Creando orden para vehículo ${selectedVehiculo.patente}`,
    });
  };

  const buscarVehiculoPorPatente = async (patente: string) => {
    if (!patente.trim()) return;

    try {
      const { data } = await database
        .from('vehiculos_2025_10_03_22_29')
        .select(`
          *,
          clientes_2025_10_03_22_29 (
            nombre,
            apellido,
            telefono,
            email,
            rut
          )
        `)
        .eq('patente', patente.toUpperCase())
        .single();

      if (data) {
        toast({
          title: "Vehículo encontrado",
          description: `${data.marca} ${data.modelo} - Propietario: ${data.clientes_2025_10_03_22_29.nombre} ${data.clientes_2025_10_03_22_29.apellido} (${data.clientes_2025_10_03_22_29.rut})`,
        });
        handleSelectVehiculo(data);
      } else {
        toast({
          title: "Vehículo no encontrado",
          description: "No se encontró ningún vehículo con esa patente",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al buscar el vehículo",
        variant: "destructive",
      });
    }
  };

  const filteredVehiculos = vehiculos.filter(vehiculo =>
    vehiculo.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.clientes_2025_10_03_22_29.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.clientes_2025_10_03_22_29.apellido.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Cargando vehículos...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Vehículos</h1>
          <p className="text-gray-600">Gestiona los vehículos y su historial de servicios</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Vehículo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-green-700">Registrar Nuevo Vehículo</DialogTitle>
              <DialogDescription>
                Ingresa los datos del vehículo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cliente_select">Cliente</Label>
                <Select value={vehiculoForm.cliente_id} onValueChange={(value) => setVehiculoForm({...vehiculoForm, cliente_id: value})}>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patente">Patente</Label>
                  <Input
                    id="patente"
                    value={vehiculoForm.patente}
                    onChange={(e) => setVehiculoForm({...vehiculoForm, patente: e.target.value.toUpperCase()})}
                    placeholder="ABC123"
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    value={vehiculoForm.marca}
                    onChange={(e) => setVehiculoForm({...vehiculoForm, marca: e.target.value})}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    value={vehiculoForm.modelo}
                    onChange={(e) => setVehiculoForm({...vehiculoForm, modelo: e.target.value})}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="año">Año</Label>
                  <Input
                    id="año"
                    type="number"
                    value={vehiculoForm.año}
                    onChange={(e) => setVehiculoForm({...vehiculoForm, año: e.target.value})}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={vehiculoForm.color}
                    onChange={(e) => setVehiculoForm({...vehiculoForm, color: e.target.value})}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="kilometraje">Kilometraje</Label>
                  <Input
                    id="kilometraje"
                    type="number"
                    value={vehiculoForm.kilometraje}
                    onChange={(e) => setVehiculoForm({...vehiculoForm, kilometraje: e.target.value})}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo_aceite">Tipo de Aceite</Label>
                  <Select value={vehiculoForm.tipo_aceite} onValueChange={(value) => setVehiculoForm({...vehiculoForm, tipo_aceite: value})}>
                    <SelectTrigger className="border-green-200 focus:border-green-500">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5W-30">5W-30</SelectItem>
                      <SelectItem value="10W-40">10W-40</SelectItem>
                      <SelectItem value="15W-40">15W-40</SelectItem>
                      <SelectItem value="20W-50">20W-50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="capacidad_aceite">Capacidad (L)</Label>
                  <Input
                    id="capacidad_aceite"
                    type="number"
                    step="0.1"
                    value={vehiculoForm.capacidad_aceite}
                    onChange={(e) => setVehiculoForm({...vehiculoForm, capacidad_aceite: e.target.value})}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>
              <Button onClick={handleSaveVehiculo} className="w-full bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700">
                Guardar Vehículo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Búsqueda rápida por patente */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700">Búsqueda Rápida por Patente</CardTitle>
          <CardDescription>
            Ingresa la patente para encontrar información del vehículo y propietario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Ingresa la patente (ej: ABC123)"
              className="max-w-xs border-green-200 focus:border-green-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  buscarVehiculoPorPatente((e.target as HTMLInputElement).value);
                }
              }}
            />
            <Button 
              onClick={() => {
                const input = document.querySelector('input[placeholder*="patente"]') as HTMLInputElement;
                buscarVehiculoPorPatente(input?.value || '');
              }}
              className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Vehículos */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Car className="h-5 w-5" />
              Lista de Vehículos
            </CardTitle>
            <CardDescription>
              Selecciona un vehículo para ver su historial de servicios
            </CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar vehículos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-green-200 focus:border-green-500"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredVehiculos.map((vehiculo) => (
                <div
                  key={vehiculo.id}
                  onClick={() => handleSelectVehiculo(vehiculo)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedVehiculo?.id === vehiculo.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono">
                          {vehiculo.patente}
                        </Badge>
                        <Badge variant="secondary">
                          {vehiculo.año}
                        </Badge>
                      </div>
                      <p className="font-medium text-green-700">
                        {vehiculo.marca} {vehiculo.modelo}
                      </p>
                      <div className="text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {vehiculo.clientes_2025_10_03_22_29.nombre} {vehiculo.clientes_2025_10_03_22_29.apellido}
                        </div>
                        <p>RUT: {vehiculo.clientes_2025_10_03_22_29.rut}</p>
                        <p>Km: {vehiculo.kilometraje?.toLocaleString()}</p>
                        <p>Aceite: {vehiculo.tipo_aceite}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Historial de Servicios */}
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <History className="h-5 w-5" />
                  {selectedVehiculo 
                    ? `Historial de ${selectedVehiculo.patente}`
                    : 'Selecciona un vehículo'
                  }
                </CardTitle>
                <CardDescription>
                  {selectedVehiculo 
                    ? 'Historial completo de servicios realizados'
                    : 'Selecciona un vehículo para ver su historial de servicios'
                  }
                </CardDescription>
              </div>
              {selectedVehiculo && (
                <Button 
                  onClick={handleCreateOrdenForVehiculo}
                  className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Nueva Orden
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedVehiculo ? (
              historialServicios.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {historialServicios.map((servicio, index) => (
                    <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-red-600" />
                          <Badge variant="outline" className="font-mono">
                            {servicio.numero_orden}
                          </Badge>
                          <Badge variant={servicio.estado === 'completada' ? 'default' : 'secondary'}>
                            {servicio.estado}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium text-red-700">
                          ${servicio.total?.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <p><strong>Fecha:</strong> {new Date(servicio.fecha_inicio).toLocaleDateString()}</p>
                        <p><strong>Kilometraje:</strong> {servicio.kilometraje_actual?.toLocaleString()} km</p>
                        {servicio.empleado_nombre && (
                          <p><strong>Empleado:</strong> {servicio.empleado_nombre}</p>
                        )}
                        
                        <div>
                          <strong>Servicios:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {servicio.servicios_realizados?.map((srv, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {srv}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {servicio.observaciones && (
                          <p><strong>Observaciones:</strong> {servicio.observaciones}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Este vehículo no tiene servicios registrados</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona un vehículo para ver su historial</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};