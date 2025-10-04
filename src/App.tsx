import React from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

// Pages
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { VehiculosPage } from '@/pages/VehiculosPage'
import { InventarioPage } from '@/pages/InventarioPage'
import { OrdenesPage } from '@/pages/OrdenesPage'
import { CitasPage } from '@/pages/CitasPage'
import NotFoundPage from '@/pages/NotFound'

// Layout component
const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Router configuration
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'clientes',
        element: <ClientesPage />
      },
      {
        path: 'vehiculos',
        element: <VehiculosPage />
      },
      {
        path: 'inventario',
        element: <InventarioPage />
      },
      {
        path: 'ordenes',
        element: <OrdenesPage />
      },
      {
        path: 'citas',
        element: <CitasPage />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  )
}

export default App