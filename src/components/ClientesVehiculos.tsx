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
import { database } from '@/integrations/database/client';
import { Plus, Search, Edit, Eye } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  rut: string;
  created_at: string;
}
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  color: string;
  kilometraje: number;
  tipo_aceite: string;
  capacidad_aceite: number;
}

export const ClientesVehiculos: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isClienteDialogOpen, setIsClienteDialogOpen] = useState(false);
  const [isVehiculoDialogOpen, setIsVehiculoDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    rut: ''
  });

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
      const { data: clientesData } = await database
        .from('clientes_2025_10_03_22_29')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: vehiculosData } = await database
        .from('vehiculos_2025_10_03_22_29')
        .select(`
          *,
          clientes_2025_10_03_22_29 (
            nombre,
            apellido
          )
        `)
        .order('created_at', { ascending: false });

      setClientes(clientesData || []);
      setVehiculos(vehiculosData || []);
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

  const handleSaveCliente = async () => {
    try {
      const { error } = await database
        .from('clientes_2025_10_03_22_29')
        .insert([clienteForm]);

      if (error) throw error;

      toast({
        title: "Cliente guardado",
        description: "El cliente se ha registrado exitosamente",
      });

      setIsClienteDialogOpen(false);
      setClienteForm({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        rut: ''
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

      setIsVehiculoDialogOpen(false);
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
            email
          )
        `)
        .eq('patente', patente.toUpperCase())
        .single();

      if (data) {
        toast({
          title: "Vehículo encontrado",
          description: `${data.marca} ${data.modelo} - Propietario: ${data.clientes_2025_10_03_22_29.nombre} ${data.clientes_2025_10_03_22_29.apellido}`,
        });
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

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVehiculos = vehiculos.filter(vehiculo =>
    vehiculo.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes y Vehículos</h1>
          <p className="text-gray-600">Gestiona la información de clientes y sus vehículos</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isClienteDialogOpen} onOpenChange={setIsClienteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
                <DialogDescription>
                  Ingresa los datos del cliente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={clienteForm.nombre}
                      onChange={(e) => setClienteForm({...clienteForm, nombre: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      value={clienteForm.apellido}
                      onChange={(e) => setClienteForm({...clienteForm, apellido: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clienteForm.email}
                    onChange={(e) => setClienteForm({...clienteForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    value={clienteForm.rut}
                    onChange={(e) => setClienteForm({...clienteForm, rut: e.target.value})}
                    placeholder="12345678-9"
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={clienteForm.telefono}
                    onChange={(e) => setClienteForm({...clienteForm, telefono: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="direccion">Dirección</Label>
                  <Textarea
                    id="direccion"
                    value={clienteForm.direccion}
                    onChange={(e) => setClienteForm({...clienteForm, direccion: e.target.value})}
                  />
                </div>
                <Button onClick={handleSaveCliente} className="w-full">
                  Guardar Cliente
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isVehiculoDialogOpen} onOpenChange={setIsVehiculoDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Vehículo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Vehículo</DialogTitle>
                <DialogDescription>
                  Ingresa los datos del vehículo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cliente_select">Cliente</Label>
                  <Select value={vehiculoForm.cliente_id} onValueChange={(value) => setVehiculoForm({...vehiculoForm, cliente_id: value})}>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patente">Patente</Label>
                    <Input
                      id="patente"
                      value={vehiculoForm.patente}
                      onChange={(e) => setVehiculoForm({...vehiculoForm, patente: e.target.value.toUpperCase()})}
                      placeholder="ABC123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marca">Marca</Label>
                    <Input
                      id="marca"
                      value={vehiculoForm.marca}
                      onChange={(e) => setVehiculoForm({...vehiculoForm, marca: e.target.value})}
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="año">Año</Label>
                    <Input
                      id="año"
                      type="number"
                      value={vehiculoForm.año}
                      onChange={(e) => setVehiculoForm({...vehiculoForm, año: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={vehiculoForm.color}
                      onChange={(e) => setVehiculoForm({...vehiculoForm, color: e.target.value})}
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo_aceite">Tipo de Aceite</Label>
                    <Select value={vehiculoForm.tipo_aceite} onValueChange={(value) => setVehiculoForm({...vehiculoForm, tipo_aceite: value})}>
                      <SelectTrigger>
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
                    />
                  </div>
                </div>
                <Button onClick={handleSaveVehiculo} className="w-full">
                  Guardar Vehículo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Búsqueda rápida por patente */}
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda Rápida por Patente</CardTitle>
          <CardDescription>
            Ingresa la patente para encontrar información del vehículo y propietario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Ingresa la patente (ej: ABC123)"
              className="max-w-xs"
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
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtro general */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar clientes o vehículos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabla de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            Lista de todos los clientes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Fecha Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">
                    {cliente.nombre} {cliente.apellido}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{cliente.rut}</Badge>
                  </TableCell>
                  <TableCell>{cliente.email}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell>{cliente.direccion}</TableCell>
                  <TableCell>
                    {new Date(cliente.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabla de Vehículos */}
      <Card>
        <CardHeader>
          <CardTitle>Vehículos</CardTitle>
          <CardDescription>
            Lista de todos los vehículos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patente</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead>Kilometraje</TableHead>
                <TableHead>Tipo Aceite</TableHead>
                <TableHead>Capacidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehiculos.map((vehiculo) => (
                <TableRow key={vehiculo.id}>
                  <TableCell className="font-medium">
                    <Badge variant="outline">{vehiculo.patente}</Badge>
                  </TableCell>
                  <TableCell>
                    {vehiculo.marca} {vehiculo.modelo} ({vehiculo.año})
                    <br />
                    <span className="text-sm text-gray-500">{vehiculo.color}</span>
                  </TableCell>
                  <TableCell>
                    {vehiculo.clientes_2025_10_03_22_29?.nombre} {vehiculo.clientes_2025_10_03_22_29?.apellido}
                  </TableCell>
                  <TableCell>{vehiculo.kilometraje?.toLocaleString()} km</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{vehiculo.tipo_aceite}</Badge>
                  </TableCell>
                  <TableCell>{vehiculo.capacidad_aceite}L</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};