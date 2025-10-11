diff --git a/server/index.js b/server/index.js
index 4edf2b96f03f18c94b943935bc4fc77377f9916c..f3919d129c9e828398fa3d962ef8d39fcac16dd0 100644
--- a/server/index.js
+++ b/server/index.js
@@ -7,50 +7,51 @@ dotenv.config({ path: process.env.SERVER_ENV_FILE || '.env' });
 
 const app = express();
 const port = Number(process.env.PORT || 4000);
 const allowedOrigins = process.env.ALLOWED_ORIGINS
   ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
   : undefined;
 
 app.use(cors({
   origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
   credentials: true,
 }));
 app.use(express.json());
 
 const pool = new Pool({
   connectionString: process.env.DATABASE_URL,
   host: process.env.DB_HOST,
   port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   database: process.env.DB_NAME,
   ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
 });
 
 const sanitizeIdentifier = (value) => typeof value === 'string' && /^[a-zA-Z0-9_]+$/.test(value);
 const quoteIdentifier = (value) => `"${value}"`;
+const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
 
 const buildWhereClause = (filters = {}, startIndex = 1) => {
   const clauses = [];
   const values = [];
   let index = startIndex;
 
   Object.entries(filters).forEach(([column, value]) => {
     if (!sanitizeIdentifier(column)) {
       throw new Error(`Invalid column name: ${column}`);
     }
     clauses.push(`${quoteIdentifier(column)} = $${index}`);
     values.push(value);
     index += 1;
   });
 
   return {
     clause: clauses.length > 0 ? clauses.join(' AND ') : '',
     values,
     nextIndex: index,
   };
 };
 
 const parseColumns = (columns) => {
   if (!columns || columns === '*' || columns === '*,') {
     return '*';
@@ -68,61 +69,103 @@ const parseColumns = (columns) => {
   }
 
   list.forEach((column) => {
     if (!sanitizeIdentifier(column)) {
       throw new Error(`Invalid column name: ${column}`);
     }
   });
 
   return list.map(quoteIdentifier).join(', ');
 };
 
 app.get('/health', (_req, res) => {
   res.json({ status: 'ok' });
 });
 
 app.post('/api/query', async (req, res) => {
   const {
     table,
     operation,
     columns = '*',
     filters = {},
     order,
     limit,
     single = false,
     data,
+    functionName,
+    args,
   } = req.body;
 
-  if (!sanitizeIdentifier(table)) {
-    return res.status(400).json({ error: 'Invalid table name supplied.' });
-  }
-
   if (!operation) {
     return res.status(400).json({ error: 'Operation type is required.' });
   }
 
+  if (operation !== 'rpc' && !sanitizeIdentifier(table)) {
+    return res.status(400).json({ error: 'Invalid table name supplied.' });
+  }
+
   try {
+    if (operation === 'rpc') {
+      if (!functionName || !sanitizeIdentifier(functionName)) {
+        return res.status(400).json({ error: 'Invalid function name supplied.' });
+      }
+
+      if (args !== undefined && args !== null && !Array.isArray(args) && !isPlainObject(args)) {
+        return res.status(400).json({ error: 'RPC arguments must be an array or object.' });
+      }
+
+      const rpcArgs = args === undefined || args === null ? [] : args;
+
+      let rpcQuery = `SELECT * FROM ${quoteIdentifier(functionName)}()`;
+      let rpcValues = [];
+
+      if (Array.isArray(rpcArgs) && rpcArgs.length > 0) {
+        const placeholders = rpcArgs.map((_, index) => `$${index + 1}`).join(', ');
+        rpcQuery = `SELECT * FROM ${quoteIdentifier(functionName)}(${placeholders})`;
+        rpcValues = [...rpcArgs];
+      } else if (isPlainObject(rpcArgs)) {
+        const entries = Object.entries(rpcArgs);
+
+        entries.forEach(([key]) => {
+          if (!sanitizeIdentifier(key)) {
+            throw new Error(`Invalid RPC argument name: ${key}`);
+          }
+        });
+
+        if (entries.length > 0) {
+          const placeholders = entries
+            .map(([key], index) => `${key} => $${index + 1}`)
+            .join(', ');
+          rpcQuery = `SELECT * FROM ${quoteIdentifier(functionName)}(${placeholders})`;
+          rpcValues = entries.map(([, value]) => value);
+        }
+      }
+
+      const result = await pool.query(rpcQuery, rpcValues);
+      return res.json({ data: single ? result.rows[0] ?? null : result.rows, error: null });
+    }
+
     if (operation === 'select') {
       const selectedColumns = parseColumns(columns);
       const { clause, values } = buildWhereClause(filters);
 
       let query = `SELECT ${selectedColumns} FROM ${quoteIdentifier(table)}`;
       if (clause) {
         query += ` WHERE ${clause}`;
       }
 
       if (order && order.column) {
         if (!sanitizeIdentifier(order.column)) {
           throw new Error(`Invalid order column: ${order.column}`);
         }
         const direction = order.ascending === false ? 'DESC' : 'ASC';
         query += ` ORDER BY ${quoteIdentifier(order.column)} ${direction}`;
       }
 
       const limitValue = Number(limit);
       if (!Number.isNaN(limitValue) && limitValue > 0) {
         query += ` LIMIT ${limitValue}`;
       }
 
       const result = await pool.query(query, values);
       return res.json({ data: single ? result.rows[0] ?? null : result.rows, error: null });
     }
