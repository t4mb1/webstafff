import React from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/AuthProvider'
import { Flag, LogOut, User } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-600 to-red-600 rounded-lg">
            <Flag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-green-700">Serviteca Tamburini</h1>
            <p className="text-sm text-gray-600">🇮🇹 Sistema de Administración</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Administrador</span>
          </div>
          
          <Button 
            variant="outline" 
            onClick={signOut}
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </header>
  )
}