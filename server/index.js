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
  } = req.body;

  if (!sanitizeIdentifier(table)) {
    return res.status(400).json({ error: 'Invalid table name supplied.' });
  }

  if (!operation) {
    return res.status(400).json({ error: 'Operation type is required.' });
  }

  try {
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

      columnsList.forEach((column) => {
        if (!sanitizeIdentifier(column)) {
          throw new Error(`Invalid column name: ${column}`);
        }
      });

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

      const query = `INSERT INTO ${quoteIdentifier(table)} (${quotedColumns}) VALUES ${placeholders} RETURNING *`;
      const result = await pool.query(query, values);
      return res.json({ data: result.rows, error: null });
    }

    if (operation === 'update') {
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'Update operation requires data to update.' });
      }

      const columnsList = Object.keys(data);
      columnsList.forEach((column) => {
        if (!sanitizeIdentifier(column)) {
          throw new Error(`Invalid column name: ${column}`);
        }
      });

      const setClauses = columnsList.map((column, index) => `${quoteIdentifier(column)} = $${index + 1}`);
      const values = columnsList.map((column) => data[column]);

      const { clause, values: filterValues } = buildWhereClause(filters, columnsList.length + 1);

      let query = `UPDATE ${quoteIdentifier(table)} SET ${setClauses.join(', ')}`;
      if (clause) {
        query += ` WHERE ${clause}`;
      }
      query += ' RETURNING *';

      const result = await pool.query(query, [...values, ...filterValues]);
      return res.json({ data: single ? result.rows[0] ?? null : result.rows, error: null });
    }

    return res.status(400).json({ error: `Unsupported operation: ${operation}` });
  } catch (error) {
    console.error('Database operation failed:', error);
    return res.status(500).json({ error: 'Database operation failed. Check server logs for details.' });
  }
});

app.listen(port, () => {
  console.log(`Database API listening on port ${port}`);
});
