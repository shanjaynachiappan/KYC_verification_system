import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VerificationProvider } from './context/VerificationContext';
import AppRouter from './router/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VerificationProvider>
          <AppRouter />
        </VerificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
