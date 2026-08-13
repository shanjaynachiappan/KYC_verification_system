import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from '../pages/WelcomePage';
import AuthPage from '../pages/AuthPage';
import VerificationWorkflowPage from '../pages/VerificationWorkflowPage';
import VerificationHubPage from '../pages/VerificationHubPage';
import AadhaarVerificationPage from '../pages/AadhaarVerificationPage';
import PanVerificationPage from '../pages/PanVerificationPage';
import LiveSelfiePage from '../pages/LiveSelfiePage';
import FinalReviewPage from '../pages/FinalReviewPage';
import DocumentVerificationPage from '../pages/DocumentVerificationPage';
import DashboardPage from '../pages/DashboardPage';
import ProtectedRoute from './ProtectedRoute';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route 
        path="/verification-workflow" 
        element={
          <ProtectedRoute>
            <VerificationWorkflowPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/verification-hub" 
        element={
          <ProtectedRoute>
            <VerificationHubPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/verify/aadhaar" 
        element={
          <ProtectedRoute>
            <AadhaarVerificationPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/verify/pan" 
        element={
          <ProtectedRoute>
            <PanVerificationPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/verify/selfie" 
        element={
          <ProtectedRoute>
            <LiveSelfiePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/verify/review" 
        element={
          <ProtectedRoute>
            <FinalReviewPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/verify/documents" 
        element={
          <ProtectedRoute>
            <DocumentVerificationPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
