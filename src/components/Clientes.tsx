import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, User, Phone, Mail, MapPin, FileText } from 'lucide-react';

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
}

export const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculosCliente, setVehiculosCliente] = useState<Vehiculo[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOrdenDialogOpen, setIsOrdenDialogOpen] = useState(false);
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

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const { data: clientesData } = await supabase
        .from('clientes_2025_10_03_22_29')
        .select('*')
        .order('created_at', { ascending: false });

      setClientes(clientesData || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVehiculosCliente = async (clienteId: string) => {
    try {
      const { data: vehiculosData } = await supabase
        .from('vehiculos_2025_10_03_22_29')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      setVehiculosCliente(vehiculosData || []);
    } catch (error) {
      console.error('Error loading vehiculos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los vehículos",
        variant: "destructive",
      });
    }
  };

  const handleSaveCliente = async () => {
    try {
      const { error } = await supabase
        .from('clientes_2025_10_03_22_29')
        .insert([clienteForm]);

      if (error) throw error;

      toast({
        title: "Cliente guardado",
        description: "El cliente se ha registrado exitosamente",
      });

      setIsDialogOpen(false);
      setClienteForm({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        rut: ''
      });
      loadClientes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    loadVehiculosCliente(cliente.id);
  };

  const handleCreateOrdenForCliente = async () => {
    if (!selectedCliente) return;
    
    // Guardar información del cliente seleccionado en localStorage para usar en órdenes
    localStorage.setItem('selectedClienteForOrden', JSON.stringify({
      id: selectedCliente.id,
      nombre: selectedCliente.nombre,
      apellido: selectedCliente.apellido
    }));
    
    // Disparar evento personalizado para cambiar a la pestaña de órdenes
    window.dispatchEvent(new CustomEvent('navigateToOrdenes', { 
      detail: { clienteId: selectedCliente.id } 
    }));
    
    toast({
      title: "Navegando a Órdenes",
      description: `Creando orden para ${selectedCliente.nombre} ${selectedCliente.apellido}`,
    });
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Cargando clientes...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Clientes</h1>
          <p className="text-gray-600">Gestiona la información de los clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-700">Registrar Nuevo Cliente</DialogTitle>
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
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={clienteForm.apellido}
                    onChange={(e) => setClienteForm({...clienteForm, apellido: e.target.value})}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  value={clienteForm.rut}
                  onChange={(e) => setClienteForm({...clienteForm, rut: e.target.value})}
                  placeholder="12345678-9"
                  className="border-green-200 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={clienteForm.email}
                  onChange={(e) => setClienteForm({...clienteForm, email: e.target.value})}
                  className="border-green-200 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={clienteForm.telefono}
                  onChange={(e) => setClienteForm({...clienteForm, telefono: e.target.value})}
                  className="border-green-200 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea
                  id="direccion"
                  value={clienteForm.direccion}
                  onChange={(e) => setClienteForm({...clienteForm, direccion: e.target.value})}
                  className="border-green-200 focus:border-green-500"
                />
              </div>
              <Button onClick={handleSaveCliente} className="w-full bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700">
                Guardar Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Clientes */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <User className="h-5 w-5" />
              Lista de Clientes
            </CardTitle>
            <CardDescription>
              Selecciona un cliente para ver sus vehículos
            </CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-green-200 focus:border-green-500"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() => handleSelectCliente(cliente)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCliente?.id === cliente.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-green-700">
                        {cliente.nombre} {cliente.apellido}
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {cliente.rut}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {cliente.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {cliente.telefono}
                        </div>
                        {cliente.direccion && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cliente.direccion}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehículos del Cliente Seleccionado */}
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-red-700">
                  {selectedCliente 
                    ? `Vehículos de ${selectedCliente.nombre} ${selectedCliente.apellido}`
                    : 'Selecciona un cliente'
                  }
                </CardTitle>
                <CardDescription>
                  {selectedCliente 
                    ? 'Lista de vehículos registrados para este cliente'
                    : 'Selecciona un cliente de la lista para ver sus vehículos'
                  }
                </CardDescription>
              </div>
              {selectedCliente && (
                <Button 
                  onClick={handleCreateOrdenForCliente}
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
            {selectedCliente ? (
              vehiculosCliente.length > 0 ? (
                <div className="space-y-3">
                  {vehiculosCliente.map((vehiculo) => (
                    <div key={vehiculo.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono">
                              {vehiculo.patente}
                            </Badge>
                            <Badge variant="secondary">
                              {vehiculo.año}
                            </Badge>
                          </div>
                          <p className="font-medium text-red-700">
                            {vehiculo.marca} {vehiculo.modelo}
                          </p>
                          <div className="text-sm text-gray-600 mt-1">
                            <p>Color: {vehiculo.color}</p>
                            <p>Kilometraje: {vehiculo.kilometraje?.toLocaleString()} km</p>
                            <p>Aceite: {vehiculo.tipo_aceite} ({vehiculo.capacidad_aceite}L)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Este cliente no tiene vehículos registrados</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona un cliente para ver sus vehículos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};