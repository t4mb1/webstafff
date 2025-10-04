import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Package, AlertTriangle, Edit, TrendingDown, TrendingUp } from 'lucide-react';

interface InventarioItem {
  id: string;
  nombre: string;
  categoria: string;
  marca: string;
  tipo: string;
  stock_actual: number;
  stock_minimo: number;
  precio_compra: number;
  precio_venta: number;
  unidad: string;
  created_at: string;
}

interface AlertaInventario {
  id: string;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  nivel_alerta: string;
}

export const Inventario: React.FC = () => {
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [alertas, setAlertas] = useState<AlertaInventario[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventarioItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [itemForm, setItemForm] = useState({
    nombre: '',
    categoria: '',
    marca: '',
    tipo: '',
    stock_actual: '',
    stock_minimo: '',
    precio_compra: '',
    precio_venta: '',
    unidad: 'unidad',
    codigo_barras: ''
  });

  useEffect(() => {
    loadInventario();
    loadAlertas();
  }, []);

  const loadInventario = async () => {
    try {
      const { data } = await supabase
        .from('inventario_2025_10_03_22_29')
        .select('*')
        .order('categoria', { ascending: true });

      setInventario(data || []);
    } catch (error) {
      console.error('Error loading inventario:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAlertas = async () => {
    try {
      const { data } = await supabase
        .from('alertas_inventario_view')
        .select('*');

      setAlertas(data || []);
    } catch (error) {
      console.error('Error loading alertas:', error);
    }
  };

  const handleSaveItem = async () => {
    try {
      const itemData = {
        ...itemForm,
        stock_actual: parseInt(itemForm.stock_actual),
        stock_minimo: parseInt(itemForm.stock_minimo),
        precio_compra: parseFloat(itemForm.precio_compra),
        precio_venta: parseFloat(itemForm.precio_venta)
      };

      if (editingItem) {
        const { error } = await supabase
          .from('inventario_2025_10_03_22_29')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: "Producto actualizado",
          description: "El producto se ha actualizado exitosamente",
        });
      } else {
        const { error } = await supabase
          .from('inventario_2025_10_03_22_29')
          .insert([itemData]);

        if (error) throw error;

        toast({
          title: "Producto agregado",
          description: "El producto se ha agregado al inventario",
        });
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      loadInventario();
      loadAlertas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditItem = (item: InventarioItem) => {
    setEditingItem(item);
    setItemForm({
      nombre: item.nombre,
      categoria: item.categoria,
      marca: item.marca,
      tipo: item.tipo,
      stock_actual: item.stock_actual.toString(),
      stock_minimo: item.stock_minimo.toString(),
      precio_compra: item.precio_compra.toString(),
      precio_venta: item.precio_venta.toString(),
      unidad: item.unidad,
      codigo_barras: item.codigo_barras || ''
    });
    setIsDialogOpen(true);
  };

  const handleUpdateStock = async (id: string, nuevoStock: number) => {
    try {
      const { error } = await supabase
        .from('inventario_2025_10_03_22_29')
        .update({ stock_actual: nuevoStock })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Stock actualizado",
        description: "El stock se ha actualizado correctamente",
      });

      loadInventario();
      loadAlertas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setItemForm({
      nombre: '',
      categoria: '',
      marca: '',
      tipo: '',
      stock_actual: '',
      stock_minimo: '',
      precio_compra: '',
      precio_venta: '',
      unidad: 'unidad',
      codigo_barras: ''
    });
  };

  const filteredInventario = inventario.filter(item => 
    filtroCategoria === 'todos' || item.categoria === filtroCategoria
  );

  const categorias = [...new Set(inventario.map(item => item.categoria))];

  if (loading) {
    return <div className="p-6">Cargando inventario...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Inventario</h1>
          <p className="text-gray-600">Gestiona el stock de aceites, filtros y otros productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingItem(null); }} className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Modifica los datos del producto' : 'Ingresa los datos del nuevo producto'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre del Producto</Label>
                  <Input
                    id="nombre"
                    value={itemForm.nombre}
                    onChange={(e) => setItemForm({...itemForm, nombre: e.target.value})}
                    placeholder="Aceite Motor 5W-30"
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select value={itemForm.categoria} onValueChange={(value) => setItemForm({...itemForm, categoria: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aceite">Aceite</SelectItem>
                      <SelectItem value="filtro">Filtro</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    value={itemForm.marca}
                    onChange={(e) => setItemForm({...itemForm, marca: e.target.value})}
                    placeholder="Castrol, Mobil, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo/Especificación</Label>
                  <Input
                    id="tipo"
                    value={itemForm.tipo}
                    onChange={(e) => setItemForm({...itemForm, tipo: e.target.value})}
                    placeholder="5W-30, Original, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="codigo_barras">Código de Barras</Label>
                  <Input
                    id="codigo_barras"
                    value={itemForm.codigo_barras}
                    onChange={(e) => setItemForm({...itemForm, codigo_barras: e.target.value})}
                    placeholder="7891234567890"
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="stock_actual">Stock Actual</Label>
                  <Input
                    id="stock_actual"
                    type="number"
                    value={itemForm.stock_actual}
                    onChange={(e) => setItemForm({...itemForm, stock_actual: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                  <Input
                    id="stock_minimo"
                    type="number"
                    value={itemForm.stock_minimo}
                    onChange={(e) => setItemForm({...itemForm, stock_minimo: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="unidad">Unidad</Label>
                  <Select value={itemForm.unidad} onValueChange={(value) => setItemForm({...itemForm, unidad: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidad">Unidad</SelectItem>
                      <SelectItem value="litro">Litro</SelectItem>
                      <SelectItem value="galón">Galón</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="precio_compra">Precio de Compra</Label>
                  <Input
                    id="precio_compra"
                    type="number"
                    step="0.01"
                    value={itemForm.precio_compra}
                    onChange={(e) => setItemForm({...itemForm, precio_compra: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="precio_venta">Precio de Venta</Label>
                  <Input
                    id="precio_venta"
                    type="number"
                    step="0.01"
                    value={itemForm.precio_venta}
                    onChange={(e) => setItemForm({...itemForm, precio_venta: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={handleSaveItem} className="w-full">
                {editingItem ? 'Actualizar Producto' : 'Agregar Producto'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alertas de inventario */}
      {alertas.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Stock Bajo ({alertas.length})
            </CardTitle>
            <CardDescription>
              Productos que requieren reposición inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alertas.map((alerta) => (
                <Alert key={alerta.id} className="border-orange-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{alerta.nombre}</p>
                        <p className="text-sm text-gray-600">
                          Stock: {alerta.stock_actual} / Mín: {alerta.stock_minimo}
                        </p>
                      </div>
                      <Badge variant={alerta.stock_actual === 0 ? "destructive" : "secondary"}>
                        {alerta.nivel_alerta}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Label htmlFor="filtro-categoria">Filtrar por categoría:</Label>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las categorías</SelectItem>
            {categorias.map((categoria) => (
              <SelectItem key={categoria} value={categoria}>
                {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de inventario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos en Inventario
          </CardTitle>
          <CardDescription>
            Lista completa de productos con información de stock y precios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Precios</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventario.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.nombre}</p>
                      <p className="text-sm text-gray-600">
                        {item.marca} - {item.tipo}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.stock_actual}</span>
                      <span className="text-sm text-gray-500">
                        / {item.stock_minimo} {item.unidad}
                      </span>
                      {item.stock_actual <= item.stock_minimo && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span>Compra: ${item.precio_compra}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span>Venta: ${item.precio_venta}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.stock_actual === 0 ? (
                      <Badge variant="destructive">Sin stock</Badge>
                    ) : item.stock_actual <= item.stock_minimo ? (
                      <Badge variant="secondary">Stock bajo</Badge>
                    ) : (
                      <Badge variant="default">Stock normal</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStock(item.id, item.stock_actual - 1)}
                          disabled={item.stock_actual <= 0}
                        >
                          -
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStock(item.id, item.stock_actual + 1)}
                        >
                          +
                        </Button>
                      </div>
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