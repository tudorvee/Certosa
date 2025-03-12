import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, user, isLoading } = useContext(AuthContext);
  const location = useLocation();
  
  // Debug logs
  console.log("Protected route check:", { 
    path: location.pathname,
    isAuthenticated, 
    userRole: user?.role,
    requiredRoles
  });
  
  // Show loading while checking auth
  if (isLoading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  // If not authenticated, redirect to login with return path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} />;
  }
  
  // If roles are specified, check if user has required role
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      console.log("Role mismatch:", user.role, "not in", requiredRoles);
      // Redirect based on role but preserve superadmin privileges
      if (user.role === 'superadmin') {
        // Superadmin can access everything
        return children;
      } else if (user.role === 'admin') {
        return <Navigate to="/nuovo-ordine" />;
      } else { // kitchen
        return <Navigate to="/nuovo-ordine" />;
      }
    }
  }
  
  // If children is a function, pass user to it
  if (typeof children === 'function') {
    return children({ user });
  }
  
  // User is authenticated and has required role
  return children;
}

export default ProtectedRoute; 