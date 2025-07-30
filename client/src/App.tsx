import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Warehouses from './pages/Warehouses';
import StockIn from './pages/StockIn';
import StockOut from './pages/StockOut';
import StockMovements from './pages/StockMovements';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';

// Set axios base URL
axios.defaults.baseURL = 'http://localhost:5000';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                <Route path="categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                <Route path="suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
                <Route path="customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                <Route path="warehouses" element={<ProtectedRoute><Warehouses /></ProtectedRoute>} />
                <Route path="stock-in" element={<ProtectedRoute><StockIn /></ProtectedRoute>} />
                <Route path="stock-out" element={<ProtectedRoute><StockOut /></ProtectedRoute>} />
                <Route path="stock-movements" element={<ProtectedRoute><StockMovements /></ProtectedRoute>} />
                <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
              </Route>
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App; 