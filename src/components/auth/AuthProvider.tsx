import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, userData?: { nombre?: string; apellido?: string }) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedSession = typeof window !== 'undefined' ? localStorage.getItem('serviteca_session') : null;
    if (storedSession) {
      try {
        const parsed: AuthSession = JSON.parse(storedSession);
        setSession(parsed);
        setUser(parsed.user);
      } catch (error) {
        console.warn('Unable to parse stored session', error);
        localStorage.removeItem('serviteca_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (password: string) => {
    try {
      // Verificar contraseña fija para Serviteca Tamburini
      if (password === 'serviteca+1995') {
        // Simular autenticación exitosa
        const mockUser: AuthUser = {
          id: 'serviteca-admin',
          email: 'admin@serviteca.com',
          name: 'Administrador Serviteca',
        };

        // Crear sesión simulada
        const mockSession: AuthSession = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser
        };

        setUser(mockUser);
        setSession(mockSession);

        if (typeof window !== 'undefined') {
          localStorage.setItem('serviteca_session', JSON.stringify(mockSession));
        }

        toast({
          title: "Acceso autorizado",
          description: "Bienvenido a Serviteca Tamburini",
        });

        return { data: { user: mockUser, session: mockSession }, error: null };
      } else {
        throw new Error('Contraseña incorrecta');
      }
    } catch (error: any) {
      toast({
        title: "Error de acceso",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, userData?: { nombre?: string; apellido?: string }) => {
    try {
      console.warn('Registro de usuarios no está habilitado en esta demo local.');
      toast({
        title: "Registro no disponible",
        description: "Contacta al administrador para crear nuevas cuentas.",
        variant: "destructive",
      });

      return { data: null, error: new Error('Registro no disponible en la versión local') };
    } catch (error: any) {
      toast({
        title: "Error de registro",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setSession(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('serviteca_session');
      }

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};