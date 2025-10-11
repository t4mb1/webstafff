import process from 'node:process';

const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

const payload = {
  table: 'ordenes_trabajo',
  operation: 'select',
  columns: `
    *,
    vehiculos (
      patente,
      marca,
      modelo,
      clientes (
        nombre,
        apellido
      )
    ),
    empleados (
      nombre,
      apellido
    )
  `,
  order: {
    column: 'fecha_inicio',
    ascending: false,
  },
};

async function main() {
  const response = await fetch(`${baseUrl}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${body?.error || 'Unknown error'}`);
  }

  if (body?.error) {
    throw new Error(`API returned an error: ${body.error}`);
  }

  console.log('Query succeeded. Row count:', Array.isArray(body?.data) ? body.data.length : 0);
}

main().catch((error) => {
  console.error('Failed to verify ordenes select query:', error.message);
  process.exitCode = 1;
});
