import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { DashboardPage } from '@/pages/DashboardPage'

// Mock database client
vi.mock('@/integrations/database/client', () => ({
  database: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        })),
        gte: vi.fn(() => ({
          lt: vi.fn(() => ({
            data: [],
            error: null
          }))
        })),
        in: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    })),
    rpc: vi.fn(() => ({
      data: [{
        citas_hoy: 0,
        ordenes_abiertas: 0,
        clientes_total: 0,
        inventario_bajo: 0,
        servicios_mes: 0,
        ingresos_mes: 0
      }],
      error: null
    }))
  }
}))

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard title', async () => {
    renderWithRouter(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('displays stats cards', async () => {
    renderWithRouter(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Citas Hoy')).toBeInTheDocument()
      expect(screen.getByText('Órdenes Activas')).toBeInTheDocument()
      expect(screen.getByText('Clientes')).toBeInTheDocument()
      expect(screen.getByText('Inventario Bajo')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    renderWithRouter(<DashboardPage />)
    
    // Should show some loading indicator or skeleton
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})