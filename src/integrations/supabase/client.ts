const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export type QueryOperation = 'select' | 'insert' | 'update' | 'rpc';

type OrderConfig = {
  column: string;
  ascending?: boolean;
};

type BaseQueryPayload = {
  operation: QueryOperation;
  single?: boolean;
};

type TableQueryPayload = BaseQueryPayload & {
  table: string;
  operation: 'select' | 'insert' | 'update';
  columns?: string | string[];
  filters?: Record<string, unknown>;
  order?: OrderConfig;
  limit?: number;
  data?: unknown;
};

export type RpcArgs = unknown[] | Record<string, unknown>;

type RpcQueryPayload = BaseQueryPayload & {
  operation: 'rpc';
  functionName: string;
  args?: RpcArgs;
};

export type QueryPayload = TableQueryPayload | RpcQueryPayload;

export type QueryResponse<T = unknown> = {
  data: T;
  error: Error | null;
};

class LocalDatabaseClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  from(table: string) {
    return new LocalTableQueryBuilder(this, table);
  }

  rpc<T = unknown>(functionName: string, args?: RpcArgs, options: { single?: boolean } = {}) {
    const payload: RpcQueryPayload = {
      operation: 'rpc',
      functionName,
      ...(args !== undefined ? { args } : {}),
      ...(options.single !== undefined ? { single: options.single } : {}),
    };

    return this.execute<T>(payload);
  }

  async execute<T = unknown>(payload: QueryPayload): Promise<QueryResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');
      const body = contentType && contentType.includes('application/json') ? await response.json() : {};

      if (!response.ok) {
        const message = body?.error || `Database request failed with status ${response.status}`;
        return { data: null as T, error: new Error(message) };
      }

      if (body?.error) {
        return { data: null as T, error: new Error(body.error) };
      }

      return { data: (body?.data ?? null) as T, error: null };
    } catch (error) {
      if (error instanceof Error) {
        return { data: null as T, error };
      }

      return { data: null as T, error: new Error('Unexpected error executing database request') };
    }
  }
}

class LocalTableQueryBuilder {
  private readonly client: LocalDatabaseClient;
  private readonly table: string;

  constructor(client: LocalDatabaseClient, table: string) {
    this.client = client;
    this.table = table;
  }

  select(columns: string | string[] = '*') {
    const builder = new LocalSelectQueryBuilder(this.client, this.table);
    return builder.select(columns);
  }

  insert<T = unknown>(rows: T | T[]) {
    const payload: TableQueryPayload = {
      table: this.table,
      operation: 'insert',
      data: Array.isArray(rows) ? rows : [rows],
    };

    return this.client.execute(payload);
  }

  update(values: Record<string, unknown>) {
    const builder = new LocalUpdateQueryBuilder(this.client, this.table);
    return builder.update(values);
  }
}

class LocalSelectQueryBuilder implements PromiseLike<QueryResponse<unknown>> {
  private readonly client: LocalDatabaseClient;
  private readonly table: string;
  private columns: string | string[] = '*';
  private filters: Record<string, unknown> = {};
  private orderConfig?: OrderConfig;
  private limitValue?: number;
  private singleResult = false;

  constructor(client: LocalDatabaseClient, table: string) {
    this.client = client;
    this.table = table;
  }

  select(columns: string | string[] = '*') {
    this.columns = columns;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters = {
      ...this.filters,
      [column]: value,
    };
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderConfig = {
      column,
      ascending: options.ascending !== undefined ? options.ascending : true,
    };
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  private buildPayload(): TableQueryPayload {
    return {
      table: this.table,
      operation: 'select',
      columns: this.columns,
      filters: this.filters,
      order: this.orderConfig,
      limit: this.limitValue,
      single: this.singleResult,
    };
  }

  async execute(): Promise<QueryResponse<unknown>> {
    return this.client.execute(this.buildPayload());
  }

  then<TResult1 = QueryResponse<unknown>, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse<unknown>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

class LocalUpdateQueryBuilder implements PromiseLike<QueryResponse<unknown>> {
  private readonly client: LocalDatabaseClient;
  private readonly table: string;
  private data: Record<string, unknown> = {};
  private filters: Record<string, unknown> = {};
  private singleResult = false;

  constructor(client: LocalDatabaseClient, table: string) {
    this.client = client;
    this.table = table;
  }

  update(values: Record<string, unknown>) {
    this.data = values;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters = {
      ...this.filters,
      [column]: value,
    };
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  private buildPayload(): TableQueryPayload {
    return {
      table: this.table,
      operation: 'update',
      data: this.data,
      filters: this.filters,
      single: this.singleResult,
    };
  }

  async execute(): Promise<QueryResponse<unknown>> {
    return this.client.execute(this.buildPayload());
  }

  then<TResult1 = QueryResponse<unknown>, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse<unknown>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const supabase = new LocalDatabaseClient(API_BASE_URL);



export type Database = {

  public: {

    Tables: {

      clientes_2025_10_03_22_29: {

        Row: {

          id: string;

          nombre: string;

          apellido: string;

          email: string;

          telefono: string;

          direccion: string;

          rut: string;

          created_at: string;

          updated_at: string;

        };

      };

      vehiculos_2025_10_03_22_29: {

        Row: {

          id: string;

          cliente_id: string;

          patente: string;

          marca: string;

          modelo: string;

          año: number;

          color: string;

          created_at: string;

          updated_at: string;

        };

      };

      empleados_2025_10_03_22_29: {

        Row: {

          id: string;

          nombre: string;

          apellido: string;

          especialidad: string;

          activo: boolean;

          created_at: string;

          updated_at: string;

        };

      };

      inventario_2025_10_03_22_29: {

        Row: {

          id: string;

          nombre: string;

          categoria: string;

          precio_compra: number;

          precio_venta: number;

          stock_actual: number;

          stock_minimo: number;

          codigo_barras: string;

          created_at: string;

          updated_at: string;

        };

      };

      ordenes_trabajo_2025_10_03_22_29: {

        Row: {

          id: string;

          numero_orden: string;

          vehiculo_id: string;

          empleado_id: string | null;

          estado: 'abierta' | 'en_proceso' | 'completada' | 'facturada';

          servicios_realizados: string[];

          kilometraje_actual: number;

          proximo_cambio: number | null;

          total: number;

          observaciones: string;

          fecha_inicio: string;

          fecha_completada: string | null;

          created_at: string;

          updated_at: string;

        };

      };

      citas_2025_10_03_22_29: {

        Row: {

          id: string;

          cliente_id: string;

          vehiculo_id: string;

          fecha_hora: string;

          tipo_servicio: string;

          estado: 'programada' | 'confirmada' | 'completada' | 'cancelada';

          observaciones: string;

          created_at: string;

          updated_at: string;

        };

      };

      historial_servicios_vehiculo: {

        Row: {

          id: string;

          vehiculo_id: string;

          descripcion: string;

          fecha_servicio: string;

          kilometraje: number;

          costo: number;

          observaciones: string;

          created_at: string;

        };

      };

      clientes: {

        Row: Record<string, unknown>;

      };

      vehiculos: {

        Row: Record<string, unknown>;

      };

      inventario: {

        Row: Record<string, unknown>;

      };

      ordenes_trabajo: {

        Row: Record<string, unknown>;

      };

      citas: {

        Row: Record<string, unknown>;

      };

      alertas_inventario: {

        Row: Record<string, unknown>;

      };

      alertas_inventario_view: {

        Row: Record<string, unknown>;

      };

    };

  };

};
