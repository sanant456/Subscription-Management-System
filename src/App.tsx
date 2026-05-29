import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { ErrorBoundary } from './components/ErrorBoundary';

// A component to protect private dashboard routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050515] flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-purple-400 font-bold uppercase tracking-wider">
            A
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SubscriptionProvider>
          <div className="min-h-screen text-gray-300">
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                <Routes>
                  {/* Public Landing Route */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Authentication Routes */}
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/signup" element={<Signup />} />
                  <Route path="/auth/forgot" element={<ForgotPassword />} />
                  <Route path="/auth/reset" element={<ResetPassword />} />

                  {/* Protected Dashboard Route */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback redirect to Landing */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </ErrorBoundary>
          </div>
        </SubscriptionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
