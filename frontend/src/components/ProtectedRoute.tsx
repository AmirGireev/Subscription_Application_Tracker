// imports
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// route guard
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to='/login' replace />;
}