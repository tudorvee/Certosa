import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './components/Login';
import OrderForm from './components/OrderForm';
import OrderHistory from './components/OrderHistory';
import SupplierManagement from './components/SupplierManagement';
import ItemManagement from './components/ItemManagement';
import CategoryManagement from './components/CategoryManagement';
import UserManagement from './components/UserManagement';
import RestaurantSettings from './components/RestaurantSettings';
import RestaurantDashboard from './components/RestaurantDashboard';
import RestaurantForm from './components/RestaurantForm';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import SuperAdminManagement from './components/SuperAdminManagement';
import { RestaurantProvider } from './context/RestaurantContext';

function App() {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <Router>
          <div className="App">
            <Navbar />
            <div className="container-fluid mt-4">
              <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Kitchen and Admin can access */}
                <Route path="/" element={
                  <ProtectedRoute requiredRoles={['kitchen', 'admin']}>
                    <OrderForm />
                  </ProtectedRoute>
                } />
                
                {/* Kitchen and Admin can access Order History */}
                <Route path="/history" element={
                  <ProtectedRoute requiredRoles={['kitchen', 'admin']}>
                    <OrderHistory />
                  </ProtectedRoute>
                } />
                
                <Route path="/suppliers" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <SupplierManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/items" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <ItemManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/categories" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <CategoryManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/users" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <RestaurantSettings />
                  </ProtectedRoute>
                } />
                
                <Route path="/restaurants" element={
                  <ProtectedRoute requiredRoles={['superadmin']}>
                    <RestaurantDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/restaurants/new" element={
                  <ProtectedRoute requiredRoles={['superadmin']}>
                    <RestaurantForm />
                  </ProtectedRoute>
                } />
                
                <Route path="/restaurants/edit/:id" element={
                  <ProtectedRoute requiredRoles={['superadmin']}>
                    <RestaurantForm />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute requiredRoles={['superadmin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/users" element={
                  <ProtectedRoute requiredRoles={['superadmin']}>
                    <SuperAdminManagement />
                  </ProtectedRoute>
                } />
                
                {/* Redirect to login if no match */}
                <Route path="*" element={<Navigate to="/login" />} />
              </Routes>
            </div>
          </div>
        </Router>
      </RestaurantProvider>
    </AuthProvider>
  );
}

export default App; 