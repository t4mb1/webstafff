import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ClientesPage } from '@/pages/ClientesPage'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [
            {
              id: '1',
              nombre: 'Juan',
              apellido: 'Pérez',
              email: 'juan@test.com',
              telefono: '+56912345678',
              direccion: 'Test Address',
              rut: '12345678-9',
              created_at: '2024-01-01T00:00:00Z'
            }
          ],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        data: null,
        error: null
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
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

describe('ClientesPage', () => {
  it('renders clientes page title', async () => {
    renderWithRouter(<ClientesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Clientes')).toBeInTheDocument()
    })
  })

  it('displays new client button', async () => {
    renderWithRouter(<ClientesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Nuevo Cliente')).toBeInTheDocument()
    })
  })

  it('shows search input', async () => {
    renderWithRouter(<ClientesPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/buscar/i)
      expect(searchInput).toBeInTheDocument()
    })
  })

  it('displays client data in table', async () => {
    renderWithRouter(<ClientesPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByText('juan@test.com')).toBeInTheDocument()
    })
  })

  it('opens new client dialog when button clicked', async () => {
    renderWithRouter(<ClientesPage />)
    
    await waitFor(() => {
      const newButton = screen.getByText('Nuevo Cliente')
      fireEvent.click(newButton)
    })

    // Should open dialog - check for dialog content
    await waitFor(() => {
      expect(screen.getByText('Completa los datos para registrar un nuevo cliente.')).toBeInTheDocument()
    })
  })
})