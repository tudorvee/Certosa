import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import API_BASE_URL from '../api/index';

// CSS for active nav item
const activeNavStyle = {
  fontWeight: 'bold',
  borderBottom: '3px solid #0d6efd',
  paddingBottom: '2px'
};

function Navbar() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // Get current location/path
  
  // On component mount, check if a restaurant is selected in localStorage
  useEffect(() => {
    const storedRestaurantId = localStorage.getItem('selectedRestaurant');
    if (storedRestaurantId) {
      setSelectedRestaurant(storedRestaurantId);
      console.log('Loaded selected restaurant from localStorage:', storedRestaurantId);
    }
  }, []);
  
  // Only fetch restaurants if user is superadmin
  useEffect(() => {
    if (user && user.role === 'superadmin') {
      fetchRestaurants();
    }
  }, [user]);
  
  const fetchRestaurants = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/restaurants/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setRestaurants(res.data);
      console.log('Fetched restaurants:', res.data);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleRestaurantChange = (e) => {
    const restaurantId = e.target.value;
    console.log('Restaurant selected:', restaurantId);
    
    if (restaurantId) {
      // Store selected restaurant in localStorage
      localStorage.setItem('selectedRestaurant', restaurantId);
      console.log('Saved restaurant ID to localStorage:', restaurantId);
      
      // Find the selected restaurant name for display
      const selectedRestaurantObj = restaurants.find(r => r._id === restaurantId);
      if (selectedRestaurantObj) {
        console.log('Selected restaurant:', selectedRestaurantObj.name);
      }
    } else {
      // Remove restaurant selection
      localStorage.removeItem('selectedRestaurant');
      console.log('Removed restaurant ID from localStorage');
    }
    
    setSelectedRestaurant(restaurantId);
    
    // Refresh the page to apply the restaurant filter
    window.location.reload();
  };
  
  // Helper function to check if a path is active
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    
    // Special case for root path
    if (path === '/' && location.pathname !== '/') {
      return false;
    }
    
    return location.pathname.startsWith(path);
  };
  
  // If not authenticated, show minimal navbar
  if (!isAuthenticated) {
    return (
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/">Certosa</Link>
        </div>
      </nav>
    );
  }
  
  // Find the name of the currently selected restaurant
  const currentRestaurantName = selectedRestaurant 
    ? restaurants.find(r => r._id === selectedRestaurant)?.name || 'Ristorante Selezionato'
    : null;
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Certosa
          {user?.restaurant?.name && !selectedRestaurant && <span className="ms-2 badge bg-secondary">{user.restaurant.name}</span>}
          {selectedRestaurant && currentRestaurantName && (
            <span className="ms-2 badge bg-primary">{currentRestaurantName}</span>
          )}
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            {/* Navigation links based on role */}
            {/* Regular kitchen staff and admin links */}
            {(user.role === 'kitchen' || user.role === 'admin' || 
              (user.role === 'superadmin' && selectedRestaurant)) && (
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/"
                  style={isActive('/') ? activeNavStyle : null}
                >
                  Nuovo Ordine
                </Link>
              </li>
            )}
            
            {/* Admin only navigation items OR superadmin with restaurant selected */}
            {(user.role === 'admin' || 
               (user.role === 'superadmin' && selectedRestaurant)) && (
              <>
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    to="/history"
                    style={isActive('/history') ? activeNavStyle : null}
                  >
                    Storico Ordini
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    to="/suppliers"
                    style={isActive('/suppliers') ? activeNavStyle : null}
                  >
                    Fornitori
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    to="/items"
                    style={isActive('/items') ? activeNavStyle : null}
                  >
                    Articoli
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    to="/categories"
                    style={isActive('/categories') ? activeNavStyle : null}
                  >
                    Categorie
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    to="/users"
                    style={isActive('/users') ? activeNavStyle : null}
                  >
                    Utenti
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    to="/settings"
                    style={isActive('/settings') ? activeNavStyle : null}
                  >
                    Impostazioni
                  </Link>
                </li>
              </>
            )}
            
            {/* Kitchen can access Order History */}
            {user && user.role === 'kitchen' && (
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/history"
                  style={isActive('/history') ? activeNavStyle : null}
                >
                  Storico Ordini
                </Link>
              </li>
            )}
            
            {/* Super Admin only navigation items */}
            {user && user.role === 'superadmin' && (
              <>
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    to="/dashboard"
                    style={isActive('/dashboard') ? activeNavStyle : null}
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    to="/restaurants"
                    style={isActive('/restaurants') ? activeNavStyle : null}
                  >
                    Ristoranti
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    to="/admin/users"
                    style={isActive('/admin/users') ? activeNavStyle : null}
                  >
                    <i className="bi bi-people me-1"></i>
                    Gestione Utenti
                  </Link>
                </li>
              </>
            )}
          </ul>
          
          {/* Restaurant selector for superadmin */}
          {user && user.role === 'superadmin' && (
            <div className="ms-auto me-3">
              <select 
                className="form-select form-select-sm bg-dark text-light border-secondary" 
                value={selectedRestaurant || ''}
                onChange={handleRestaurantChange}
                style={{width: 'auto', display: 'inline-block'}}
              >
                <option value="">Visualizza come Super Admin</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant._id} value={restaurant._id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* User and logout button */}
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <span className="nav-link me-3">
                <i className="bi bi-person-circle me-1"></i>
                {user?.name || 'Utente'}
              </span>
            </li>
            <li className="nav-item">
              <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
                <i className="bi bi-box-arrow-right me-1"></i>
                Esci
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 