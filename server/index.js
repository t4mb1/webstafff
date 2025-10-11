import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: process.env.SERVER_ENV_FILE || '.env' });

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : undefined;

app.use(
  cors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  }),
);
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

const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const sanitizeIdentifier = (value, type) => {
  if (typeof value !== 'string') {
    throw new ValidationError(`Invalid ${type} supplied.`);
  }
  const trimmed = value.trim();
  if (!IDENTIFIER_REGEX.test(trimmed)) {
    throw new ValidationError(`Invalid ${type} supplied.`);
  }
  return trimmed;
};

const quoteIdentifier = (value) => `"${value}"`;

const buildWhereClause = (filters = {}, startIndex = 1) => {
  const clauses = [];
  const values = [];
  let index = startIndex;

  Object.entries(filters).forEach(([column, value]) => {
    sanitizeIdentifier(column, 'column name');
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
  }

  const list = Array.isArray(columns)
    ? columns
    : String(columns)
        .split(',')
        .map((column) => column.trim())
        .filter(Boolean);

  if (list.length === 0) {
    return '*';
  }

  list.forEach((column) => sanitizeIdentifier(column, 'column name'));

  return list.map(quoteIdentifier).join(', ');
};

const buildRpcQuery = (functionName, args) => {
  const safeFunctionName = sanitizeIdentifier(functionName, 'function name');
  const quotedFunctionName = quoteIdentifier(safeFunctionName);

  if (args === undefined || args === null) {
    return {
      query: `SELECT * FROM ${quotedFunctionName}()`,
      values: [],
    };
  }

  if (Array.isArray(args)) {
    const placeholders = args.map((_, index) => `$${index + 1}`).join(', ');
    return {
      query: `SELECT * FROM ${quotedFunctionName}(${placeholders})`,
      values: args,
    };
  }

  if (!isPlainObject(args)) {
    throw new ValidationError('RPC arguments must be an array or object.');
  }

  const entries = Object.entries(args).map(([key, value]) => [
    sanitizeIdentifier(key, 'RPC argument name'),
    value,
  ]);

  if (entries.length === 0) {
    return {
      query: `SELECT * FROM ${quotedFunctionName}()`,
      values: [],
    };
  }

  const placeholders = entries
    .map(([key], index) => `${key} => $${index + 1}`)
    .join(', ');

  return {
    query: `SELECT * FROM ${quotedFunctionName}(${placeholders})`,
    values: entries.map(([, value]) => value),
  };
};

const respondWithRows = (res, rows, single) => {
  if (single) {
    return res.json({ data: rows[0] ?? null, error: null });
  }
  return res.json({ data: rows, error: null });
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
    functionName,
    args,
  } = req.body || {};

  if (!operation) {
    return res.status(400).json({ error: 'Operation type is required.' });
  }

  try {
    if (operation === 'rpc') {
      if (!functionName) {
        return res.status(400).json({ error: 'Function name is required for RPC operations.' });
      }

      const { query, values } = buildRpcQuery(functionName, args);
      const result = await pool.query(query, values);
      return respondWithRows(res, result.rows, Boolean(single));
    }

    const safeTable = sanitizeIdentifier(table, 'table name');

    if (operation === 'select') {
      const selectedColumns = parseColumns(columns);
      const { clause, values } = buildWhereClause(filters);

      let query = `SELECT ${selectedColumns} FROM ${quoteIdentifier(safeTable)}`;
      if (clause) {
        query += ` WHERE ${clause}`;
      }

      if (order && order.column) {
        const safeOrderColumn = sanitizeIdentifier(order.column, 'order column');
        const direction = order.ascending === false ? 'DESC' : 'ASC';
        query += ` ORDER BY ${quoteIdentifier(safeOrderColumn)} ${direction}`;
      }

      const limitValue = Number(limit);
      if (!Number.isNaN(limitValue) && limitValue > 0) {
        query += ` LIMIT ${limitValue}`;
      }

      const result = await pool.query(query, values);
      return respondWithRows(res, result.rows, Boolean(single));
    }

    if (operation === 'insert') {
      if (!data) {
        return res.status(400).json({ error: 'Insert operation requires data.' });
      }

      const rows = Array.isArray(data) ? data : [data];
      if (rows.length === 0) {
        return res.status(400).json({ error: 'Insert operation requires at least one row.' });
      }

      const columnsList = Object.keys(rows[0]);
      if (columnsList.length === 0) {
        return res.status(400).json({ error: 'Insert operation requires column values.' });
      }

      columnsList.forEach((column) => sanitizeIdentifier(column, 'column name'));

      const quotedColumns = columnsList.map(quoteIdentifier).join(', ');
      const values = [];
      const placeholders = rows
        .map((row, rowIndex) => {
          return `(${columnsList
            .map((column, columnIndex) => {
              const valueIndex = rowIndex * columnsList.length + columnIndex + 1;
              values.push(row[column]);
              return `$${valueIndex}`;
            })
            .join(', ')})`;
        })
        .join(', ');

      const query = `INSERT INTO ${quoteIdentifier(safeTable)} (${quotedColumns}) VALUES ${placeholders} RETURNING *`;
      const result = await pool.query(query, values);
      return respondWithRows(res, result.rows, false);
    }

    if (operation === 'update') {
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'Update operation requires data to update.' });
      }

      const columnsList = Object.keys(data);
      columnsList.forEach((column) => sanitizeIdentifier(column, 'column name'));

      const setClauses = columnsList.map((column, index) => `${quoteIdentifier(column)} = $${index + 1}`);
      const values = columnsList.map((column) => data[column]);

      const { clause, values: filterValues } = buildWhereClause(filters, columnsList.length + 1);

      let query = `UPDATE ${quoteIdentifier(safeTable)} SET ${setClauses.join(', ')}`;
      if (clause) {
        query += ` WHERE ${clause}`;
      }
      query += ' RETURNING *';

      const result = await pool.query(query, [...values, ...filterValues]);
      return respondWithRows(res, result.rows, Boolean(single));
    }

    return res.status(400).json({ error: `Unsupported operation: ${operation}` });
  } catch (error) {
    console.error('Database operation failed:', error);
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Error) {
      return res.status(500).json({ error: 'Database operation failed. Check server logs for details.' });
    }
    return res.status(500).json({ error: 'Database operation failed. Check server logs for details.' });
  }
});

app.listen(port, () => {
  console.log(`Database API listening on port ${port}`);
});
