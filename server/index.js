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

const buildWhereClause = (filters = {}, startIndex = 1, tableAlias) => {
  const clauses = [];
  const values = [];
  let index = startIndex;

  Object.entries(filters).forEach(([column, value]) => {
    sanitizeIdentifier(column, 'column name');
    const columnReference = tableAlias
      ? `${tableAlias}.${quoteIdentifier(column)}`
      : `${quoteIdentifier(column)}`;
    clauses.push(`${columnReference} = $${index}`);
    values.push(value);
    index += 1;
  });

  return {
    clause: clauses.length > 0 ? clauses.join(' AND ') : '',
    values,
    nextIndex: index,
  };
};

const createAliasFactory = () => {
  let counter = 1;
  return (prefix) => `${prefix}${counter++}`;
};

const findMatchingParenthesis = (input, startIndex) => {
  let depth = 0;
  for (let i = startIndex; i < input.length; i += 1) {
    const char = input[i];
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  throw new ValidationError('Unmatched parentheses in column selection.');
};

const parseSelectionList = (input) => {
  const selections = [];
  let index = 0;
  const length = input.length;

  const skipWhitespaceAndCommas = () => {
    while (index < length) {
      const char = input[index];
      if (char === ',' || char === '\n' || char === '\r') {
        index += 1;
        continue;
      }
      if (char.trim() === '') {
        index += 1;
        continue;
      }
      break;
    }
  };

  while (index < length) {
    skipWhitespaceAndCommas();
    if (index >= length) {
      break;
    }

    let tokenStart = index;
    while (index < length) {
      const char = input[index];
      if (char === '(' || char === ')' || char === ',') {
        break;
      }
      index += 1;
    }

    const token = input.slice(tokenStart, index).trim();
    if (!token && input[index] === '(') {
      throw new ValidationError('Relation name missing before parentheses.');
    }

    if (index < length && input[index] === '(') {
      const endIndex = findMatchingParenthesis(input, index);
      const inner = input.slice(index + 1, endIndex);
      selections.push({
        type: 'relation',
        name: token,
        selections: parseSelectionList(inner),
      });
      index = endIndex + 1;
      continue;
    }

    if (token) {
      selections.push({ type: 'column', name: token });
    }

    if (index < length && input[index] === ',') {
      index += 1;
    }
  }

  return selections;
};

const buildSelectionTree = (nodes) => {
  const baseColumns = [];
  const relations = [];

  nodes.forEach((node) => {
    if (node.type === 'column') {
      if (node.name === '*') {
        baseColumns.push('*');
      } else {
        baseColumns.push(sanitizeIdentifier(node.name, 'column name'));
      }
      return;
    }

    if (!node.name || node.name === '*') {
      throw new ValidationError('Relation name is required.');
    }

    const relationName = sanitizeIdentifier(node.name, 'relation name');
    relations.push({
      name: relationName,
      selection: buildSelectionTree(node.selections || []),
    });
  });

  return { baseColumns, relations };
};

const parseColumns = (columns) => {
  if (!columns || columns === '*' || columns === '*,') {
    return { baseColumns: ['*'], relations: [] };
  }

  const raw = Array.isArray(columns) ? columns.join(',') : String(columns);
  const trimmed = raw.trim();
  if (!trimmed) {
    return { baseColumns: ['*'], relations: [] };
  }

  const nodes = parseSelectionList(trimmed);
  return buildSelectionTree(nodes);
};

const singularizeRelationName = (name) => {
  if (name.endsWith('es')) {
    return name.slice(0, -2);
  }
  if (name.endsWith('s')) {
    return name.slice(0, -1);
  }
  return name;
};

const buildSelectComponents = (tableName, tableAlias, selection, aliasFactory) => {
  const selectExpressions = [];
  const joinClauses = [];

  selection.baseColumns.forEach((column) => {
    if (column === '*') {
      selectExpressions.push(`${tableAlias}.*`);
    } else {
      selectExpressions.push(`${tableAlias}.${quoteIdentifier(column)} AS ${quoteIdentifier(column)}`);
    }
  });

  selection.relations.forEach((relation) => {
    const relationTable = relation.name;
    const relationTableAlias = aliasFactory('t');
    const relationSelection = buildSelectComponents(relationTable, relationTableAlias, relation.selection, aliasFactory);

    const relationSelectList = relationSelection.selectExpressions.length > 0
      ? relationSelection.selectExpressions.join(', ')
      : `${relationTableAlias}.*`;

    let relationQuery = `SELECT ${relationSelectList} FROM ${quoteIdentifier(relationTable)} ${relationTableAlias}`;
    if (relationSelection.joinClauses.length > 0) {
      relationQuery += ` ${relationSelection.joinClauses.join(' ')}`;
    }

    const joinColumnName = sanitizeIdentifier(`${singularizeRelationName(relationTable)}_id`, 'column name');
    relationQuery += ` WHERE ${relationTableAlias}.${quoteIdentifier('id')} = ${tableAlias}.${quoteIdentifier(joinColumnName)}`;
    relationQuery += ' LIMIT 1';

    const subqueryAlias = aliasFactory('s');
    const joinAlias = aliasFactory('l');
    const joinClause = `LEFT JOIN LATERAL (SELECT row_to_json(${subqueryAlias}) AS data FROM (${relationQuery}) AS ${subqueryAlias}) AS ${joinAlias} ON true`;

    joinClauses.push(joinClause);
    selectExpressions.push(`${joinAlias}.data AS ${quoteIdentifier(relationTable)}`);
  });

  return { selectExpressions, joinClauses };
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
      const selection = parseColumns(columns);
      const aliasFactory = createAliasFactory();
      const tableAlias = 't0';
      const selectComponents = buildSelectComponents(safeTable, tableAlias, selection, aliasFactory);
      const selectList = selectComponents.selectExpressions.length > 0
        ? selectComponents.selectExpressions.join(', ')
        : `${tableAlias}.*`;
      const { clause, values } = buildWhereClause(filters, 1, tableAlias);

      let query = `SELECT ${selectList} FROM ${quoteIdentifier(safeTable)} ${tableAlias}`;
      if (selectComponents.joinClauses.length > 0) {
        query += ` ${selectComponents.joinClauses.join(' ')}`;
      }
      if (clause) {
        query += ` WHERE ${clause}`;
      }

      if (order && order.column) {
        const safeOrderColumn = sanitizeIdentifier(order.column, 'order column');
        const direction = order.ascending === false ? 'DESC' : 'ASC';
        query += ` ORDER BY ${tableAlias}.${quoteIdentifier(safeOrderColumn)} ${direction}`;
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
