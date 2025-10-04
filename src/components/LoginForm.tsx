diff --git a/src/components/LoginForm.tsx b/src/components/LoginForm.tsx
index 35c39ae142e6b3c012945fe1ceb0e8eae4f6374c..efa00ee58ed2aeb331b024315ecc4d9299c322db 100644
--- a/src/components/LoginForm.tsx
+++ b/src/components/LoginForm.tsx
@@ -1,58 +1,50 @@
 import React, { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { useAuth } from './AuthProvider';
 import { Flag } from 'lucide-react';
 
 export const LoginForm: React.FC = () => {
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const { signIn } = useAuth();
 
   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     setError('');
 
-    // Verificar contraseña fija
-    if (password === 'serviteca+1995') {
-      // Crear usuario temporal para la sesión
-      const dummyEmail = 'admin@serviteca.com';
-      const { error } = await signIn(dummyEmail, password);
-      
-      if (error) {
-        // Si no existe el usuario, intentar crearlo
-        setError('');
-      }
-    } else {
-      setError('Contraseña incorrecta');
+    const { error } = await signIn(password);
+
+    if (error) {
+      setError(error.message || 'Contraseña incorrecta');
     }
-    
+
     setLoading(false);
   };
 
   return (
     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-red-50 p-4">
       <Card className="w-full max-w-md border-2 border-green-200">
         <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
             <div className="p-3 bg-gradient-to-r from-green-600 to-red-600 rounded-full">
               <Flag className="h-8 w-8 text-white" />
             </div>
           </div>
           <CardTitle className="text-2xl font-bold text-green-700">Serviteca Tamburini</CardTitle>
           <CardDescription className="text-gray-600">
             Sistema de Administración
           </CardDescription>
         </CardHeader>
         <CardContent>
           <form onSubmit={handleLogin} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="password" className="text-green-700 font-medium">Contraseña de Acceso</Label>
               <Input
                 id="password"
                 type="password"
                 placeholder="Ingresa la contraseña"
