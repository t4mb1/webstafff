import React from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Package, 
  FileText, 
  Calendar 
} from 'lucide-react'

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/'
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: Users,
    path: '/clientes'
  },
  {
    id: 'vehiculos',
    label: 'Vehículos',
    icon: Car,
    path: '/vehiculos'
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: Package,
    path: '/inventario'
  },
  {
    id: 'ordenes',
    label: 'Órdenes',
    icon: FileText,
    path: '/ordenes'
  },
  {
    id: 'citas',
    label: 'Citas',
    icon: Calendar,
    path: '/citas'
  }
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-green-100 to-red-100 text-green-700 border border-green-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}