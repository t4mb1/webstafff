# Serviteca Tamburini - Sistema de Gestión de Taller

Sistema completo de gestión para talleres de cambio de aceite con React, TypeScript, Tailwind CSS y Supabase.

## 🚀 Características

- ✅ **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- ✅ **UI Components**: shadcn/ui + Radix UI
- ✅ **Routing**: React Router v6
- ✅ **Backend**: Supabase (PostgreSQL + Auth + RLS)
- ✅ **Forms**: React Hook Form + Zod validation
- ✅ **State Management**: React Context + Hooks
- ✅ **Testing**: Vitest + React Testing Library
- ✅ **Docker**: Desarrollo local containerizado
- ✅ **Security**: CSP headers, RLS policies, input validation

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

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (optional)
- Supabase account (optional - demo works without it)

### Environment Setup

1. **Copy environment variables:**
```bash
cp .env.example .env
```

2. **Configure Supabase (Optional):**
   - The project includes demo Supabase credentials that work out of the box
   - For production, replace with your own Supabase project credentials in `.env`:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access the application
# URL: http://localhost:5173
# Password: serviteca+1995
```

### Database Setup (Optional)

If you want to use your own Supabase project:
```bash
# Execute SQL migrations in your Supabase project
# Files are located in /supabase/migrations/
```

5. **Desarrollo local**
```bash
# Opción 1: Desarrollo directo
npm run dev

# Opción 2: Con Docker
docker-compose up -d
```

## 🐳 Docker

### Desarrollo
```bash
docker-compose up -d
```

### Producción
```bash
docker build -t serviteca-system .
docker run -p 3000:3000 serviteca-system
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests en modo watch
npm run test:watch

# Coverage
npm run test:coverage

# Tests específicos
npm run test -- --grep "Dashboard"
```

## 📁 Estructura del Proyecto

```
serviteca_system/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/             # shadcn/ui components
│   │   ├── forms/          # Formularios con validación
│   │   └── tables/         # DataTables reutilizables
│   ├── pages/              # Páginas/Rutas principales
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilidades y configuración
│   ├── types/              # Definiciones TypeScript
│   └── integrations/       # Integraciones externas
├── supabase/
│   ├── migrations/         # Migraciones SQL
│   └── edge_functions/     # Funciones serverless
├── tests/                  # Tests unitarios e integración
├── docker/                 # Configuración Docker
└── docs/                   # Documentación
```

## 🔒 Seguridad

### Content Security Policy (CSP)
- Sin scripts inline
- Fuentes permitidas configuradas
- Nonce para scripts dinámicos

### Row Level Security (RLS)
- Políticas por tabla
- Acceso basado en roles
- Validación de permisos

### Validación de Datos
- Esquemas Zod en frontend
- Validación en base de datos
- Sanitización de inputs

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build
npm run build

# Deploy carpeta dist/
```

### Docker
```bash
# Build imagen
docker build -t serviteca-system .

# Run container
docker run -p 3000:3000 serviteca-system
```

## 📊 Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase | ✅ |
| `VITE_APP_NAME` | Nombre de la aplicación | ❌ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe | ❌ |

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build para producción
npm run preview         # Preview del build

# Testing
npm run test            # Ejecutar tests
npm run test:watch      # Tests en modo watch
npm run test:coverage   # Reporte de cobertura

# Linting
npm run lint            # ESLint
npm run lint:fix        # Fix automático
npm run type-check      # Verificación TypeScript

# Docker
docker-compose up -d    # Desarrollo con Docker
docker-compose down     # Detener containers
docker-compose logs -f  # Ver logs
```

## 🐛 Troubleshooting

### Error de conexión a Supabase
- Verificar variables de entorno
- Confirmar URL y keys correctas
- Revisar políticas RLS

### Problemas de CORS
- Configurar dominios permitidos en Supabase
- Verificar headers de seguridad

### Tests fallando
- Limpiar cache: `npm run test -- --clearCache`
- Verificar mocks de Supabase

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Frontend**: React + TypeScript + Tailwind
- **Backend**: Supabase + PostgreSQL
- **DevOps**: Docker + Vercel
- **Testing**: Vitest + RTL

---

**Serviteca Tamburini** - Sistema de gestión integral para talleres 🇮🇹