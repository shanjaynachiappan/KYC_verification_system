import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const { digilockerRequestId } = useVerification();
  const location = useLocation();

  if (!isAuthenticated && !digilockerRequestId) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}
