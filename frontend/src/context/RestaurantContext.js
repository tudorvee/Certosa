import React, { createContext, useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const RestaurantContext = createContext();

export const RestaurantProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  
  useEffect(() => {
    // Check if there's a stored restaurant selection for superadmin
    if (user && user.role === 'superadmin') {
      const storedRestaurantId = sessionStorage.getItem('selectedRestaurant');
      if (storedRestaurantId) {
        setSelectedRestaurantId(storedRestaurantId);
      } else {
        setSelectedRestaurantId(null);
      }
    } else if (user) {
      // For normal users, use their assigned restaurant
      setSelectedRestaurantId(user.restaurant?.id);
    }
  }, [user]);
  
  return (
    <RestaurantContext.Provider
      value={{
        selectedRestaurantId,
        isSuperAdminWithRestaurantSelected: !!(user?.role === 'superadmin' && selectedRestaurantId)
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}; 