# Serviteca Tamburini - Sistema de Gestión de Taller

Sistema completo de gestión para talleres de cambio de aceite construido con React, TypeScript, Tailwind CSS y un backend ligero en Node.js/Express que se conecta a una base de datos PostgreSQL dedicada desplegada en tu propio VPS (sin depender de Supabase).

## 🚀 Características

- ✅ **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- ✅ **UI Components**: shadcn/ui + Radix UI
- ✅ **Routing**: React Router v6
- ✅ **Backend**: API Node.js + Express + pg
- ✅ **Base de datos**: PostgreSQL 16 autogestionada (VPS / contenedor propio)
- ✅ **Forms**: React Hook Form + Zod validation
- ✅ **State Management**: React Context + Hooks
- ✅ **Testing**: Vitest + React Testing Library
- ✅ **Docker**: Desarrollo local containerizado
- ✅ **Security**: CSP headers, validación de entrada y CORS configurables

## 📋 Funcionalidades

### Gestión de Clientes
- Registro y edición de clientes con RUT
- Búsqueda y filtrado avanzado
- Historial de servicios por cliente

### Gestión de Vehículos
- Registro de vehículos por cliente
- Historial de mantenimientos
- Seguimiento de kilometraje

### Inventario
- Control de stock de aceites y filtros
- Alertas de stock bajo
- Códigos de barras para productos

### Órdenes de Trabajo
- Creación y seguimiento de órdenes
- Estados: Abierta → En Proceso → Completada → Facturada
- Asignación de empleados

### Citas
- Programación de servicios
- Calendario integrado
- Notificaciones automáticas

### Dashboard
- Métricas en tiempo real
- Alertas de inventario
- Resumen de operaciones

## 🚀 Quick Start

### Prerrequisitos
- Node.js 18+ y npm
- Docker (para la base de datos)

### 1. Crear la base de datos en Docker

```bash
./scripts/create-postgres-container.sh
```

El script crea (si es necesario) una red Docker dedicada y levanta un contenedor PostgreSQL 16 listo para ser utilizado por el backend. Puedes personalizar usuario, contraseña, puerto o ruta de datos usando variables de entorno antes de ejecutar el script.

### 2. Configurar el backend API

```bash
cd server
cp .env.example .env
npm install
```

Edita el archivo `.env` con las credenciales utilizadas al crear el contenedor PostgreSQL o con la información de tu servidor en el VPS. Valores por defecto:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=serviteca_user
DB_PASSWORD=serviteca_password
DB_NAME=serviteca
```

Aplica las migraciones a tu base de datos (ver paso siguiente) y luego inicia la API:

```bash
npm run dev
```

El backend queda disponible en `http://localhost:4000`.

### 3. Aplicar migraciones de la base de datos

Las migraciones SQL viven en `server/migrations`. Puedes aplicarlas automáticamente con el script incluido:

```bash
./scripts/apply-migrations.sh
```

El script carga las variables de conexión desde `server/.env` por defecto (puedes definir `ENV_FILE=/ruta/a/.env` para usar otro archivo). Si prefieres correrlas manualmente, ejecuta cada archivo con `psql` en orden alfabético:

```bash
psql postgresql://serviteca_user:serviteca_password@localhost:5432/serviteca -f server/migrations/20250104000001_create_serviteca_schema.sql
psql postgresql://serviteca_user:serviteca_password@localhost:5432/serviteca -f server/migrations/20250104000002_insert_initial_data.sql
# ...continúa con el resto
```

### 4. Configurar el frontend

```bash
cd ..
cp .env.example .env   # si aún no existe
npm install
```

Añade la URL del backend en el archivo `.env` del frontend:

```
VITE_API_BASE_URL=http://localhost:4000
```

### 5. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación quedará disponible en `http://localhost:5173` (credenciales demo: `serviteca+1995`).

## 🐳 Docker

### Desarrollo completo con Docker Compose

```bash
docker-compose up -d
```

### Build de producción (frontend)

```bash
docker build -t serviteca-system .
docker run -p 3000:3000 serviteca-system
```

## 🧪 Testing

```bash
npm run test            # Ejecutar todos los tests
npm run test:watch      # Tests en modo watch
npm run test:coverage   # Reporte de cobertura
```

## 📁 Estructura del Proyecto

```
serviteca_system/
├── src/                     # Frontend (React)
│   ├── components/          # Componentes reutilizables
│   ├── pages/               # Páginas/Rutas principales
│   ├── hooks/               # Hooks personalizados
│   ├── lib/                 # Utilidades
│   └── integrations/        # Clientes para APIs externas
├── server/                  # API Express + PG
│   ├── index.js             # Servidor principal
│   ├── migrations/          # Migraciones SQL listas para aplicar
│   └── .env.example         # Variables de entorno
└── scripts/                 # Scripts auxiliares (Docker, etc.)
```

## 📊 Variables de Entorno

### Frontend (`.env`)
| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_API_BASE_URL` | URL base de la API interna | ✅ |
| `VITE_APP_NAME` | Nombre de la aplicación | ❌ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe (si aplica) | ❌ |

### Backend (`server/.env`)
| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `PORT` | Puerto de la API (por defecto 4000) | ❌ |
| `ALLOWED_ORIGINS` | Lista de orígenes permitidos para CORS | ❌ |
| `DATABASE_URL` | Cadena de conexión completa (opcional) | ❌ |
| `DB_HOST` | Host de PostgreSQL | ✅* |
| `DB_PORT` | Puerto de PostgreSQL | ✅* |
| `DB_USER` | Usuario de PostgreSQL | ✅* |
| `DB_PASSWORD` | Contraseña de PostgreSQL | ✅* |
| `DB_NAME` | Base de datos de PostgreSQL | ✅* |
| `DB_SSL` | Habilitar SSL (`true`/`false`) | ❌ |

\*Si `DATABASE_URL` está definido, los parámetros individuales pueden omitirse.

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📝 Comandos Útiles

```bash
npm run dev              # Servidor de desarrollo frontend
npm run build            # Build para producción
npm run preview          # Preview del build
npm run lint             # ESLint
npm run test             # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Reporte de cobertura
```

## 🐛 Troubleshooting

### Error de conexión a la API
- Verifica que el backend esté corriendo en `http://localhost:4000`
- Confirma las credenciales en `server/.env`
- Asegúrate de que el contenedor PostgreSQL está levantado (`docker ps`)

### Problemas de CORS
- Ajusta la variable `ALLOWED_ORIGINS` en `server/.env`
- Revisa los encabezados CSP definidos en `nginx.conf`

### Tests fallando
- Limpia la cache de Vitest: `npm run test -- --clearCache`
- Revisa los mocks de datos utilizados en los componentes

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Frontend**: React + TypeScript + Tailwind
- **Backend**: Node.js + Express + PostgreSQL
- **DevOps**: Docker + Nginx
- **Testing**: Vitest + RTL

---

**Serviteca Tamburini** - Sistema de gestión integral para talleres 🇮🇹
