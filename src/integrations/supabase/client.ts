diff --git a/src/integrations/supabase/client.ts b/src/integrations/supabase/client.ts
index ba8065cefb2ca5db463e796a9db35ac8f5459478..f59e014b0747241c46cc5960da3521428ae987bd 100644
--- a/src/integrations/supabase/client.ts
+++ b/src/integrations/supabase/client.ts
@@ -1,61 +1,83 @@
 const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
 
-type QueryOperation = 'select' | 'insert' | 'update';
+type QueryOperation = 'select' | 'insert' | 'update' | 'rpc';
 
 type OrderConfig = {
   column: string;
   ascending?: boolean;
 };
 
-type QueryPayload = {
+type TableQueryPayload = {
   table: string;
-  operation: QueryOperation;
+  operation: 'select' | 'insert' | 'update';
   columns?: string | string[];
   filters?: Record<string, unknown>;
   order?: OrderConfig;
   limit?: number;
   single?: boolean;
   data?: unknown;
 };
 
+type RpcArgs = unknown[] | Record<string, unknown>;
+
+type RpcQueryPayload = {
+  operation: 'rpc';
+  functionName: string;
+  args?: RpcArgs;
+  single?: boolean;
+};
+
+type QueryPayload = TableQueryPayload | RpcQueryPayload;
+
 type QueryResponse<T = unknown> = {
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
 
+  rpc<T = unknown>(functionName: string, args?: RpcArgs, options: { single?: boolean } = {}) {
+    const payload: QueryPayload = {
+      operation: 'rpc',
+      functionName,
+      ...(args !== undefined ? { args } : {}),
+      ...(options.single !== undefined ? { single: options.single } : {}),
+    };
+
+    return this.execute<T>(payload);
+  }
+
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
 
       return { data: body?.data as T, error: null };
     } catch (error) {
       if (error instanceof Error) {
