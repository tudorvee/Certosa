import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/index';
import { apiCall } from '../utils/apiUtils';
import { AuthContext } from '../context/AuthContext';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'kitchen',
    restaurantId: ''
  });
  const [message, setMessage] = useState('');
  const { user: currentUser } = useContext(AuthContext);
  const isSuperAdmin = currentUser && currentUser.role === 'superadmin';

  useEffect(() => {
    // Check if we have a valid token and user
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No auth token found when attempting to manage users");
    }
    
    // Pre-fetch users to verify API access
    const checkAccess = async () => {
      try {
        await apiCall('/api/users');
        console.log("Successfully verified API access for user management");
      } catch (err) {
        console.error("API access error in user management:", err);
      }
    };
    
    checkAccess();
  }, []);

  useEffect(() => {
    // Load restaurants if user is superadmin
    if (isSuperAdmin) {
      fetchRestaurants();
    }
    fetchUsers();
  }, [isSuperAdmin]);

  const fetchRestaurants = async () => {
    try {
      const res = await apiCall('/api/restaurants/all');
      setRestaurants(res.data);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setMessage('Errore nel caricamento dei ristoranti');
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users as:', isSuperAdmin ? 'superadmin' : 'admin');
      
      let endpoint = '/api/users';
      // For superadmins, add a parameter to get all users across all restaurants
      if (isSuperAdmin) {
        // If no specific restaurant is selected, fetch all users
        const selectedRestaurant = localStorage.getItem('selectedRestaurant');
        if (!selectedRestaurant) {
          endpoint = '/api/users/all'; // Special endpoint for all users
        }
      }
      
      const res = await apiCall(endpoint);
      console.log('Users fetched:', res.data.length);
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setLoading(false);
      setMessage('Errore nel caricamento degli utenti');
    }
  };

  const handleInputChange = (e) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      // Determine which restaurant ID to use
      let restaurantId;
      
      if (isSuperAdmin) {
        // For superadmin, use the selected restaurant from the form
        restaurantId = newUser.restaurantId;
        if (!restaurantId) {
          setMessage('Seleziona un ristorante per questo utente');
          return;
        }
      } else if (currentUser.role === 'admin' && currentUser.restaurantId) {
        // For admin, use their own restaurant ID
        restaurantId = currentUser.restaurantId;
      } else if (currentUser.restaurant && currentUser.restaurant.id) {
        // Alternative format from auth context
        restaurantId = currentUser.restaurant.id;
      } else {
        setMessage('Errore: impossibile determinare l\'ID del ristorante');
        console.error('Missing restaurant ID for user creation', currentUser);
        return;
      }
      
      console.log("Creating user with restaurantId:", restaurantId);
      
      // Add restaurantId to the user data
      const userData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        restaurantId: restaurantId
      };
      
      console.log("Creating user with data:", userData);
      
      await axios.post(`${API_BASE_URL}/api/users`, userData);
      setMessage('Utente aggiunto con successo!');
      
      // Reset the form
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'kitchen',
        restaurantId: isSuperAdmin ? '' : restaurantId
      });
      
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err.response?.data || err);
      setMessage(err.response?.data?.message || 'Errore durante l\'aggiunta dell\'utente');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/users/${userId}`, {
        active: !currentStatus
      });
      fetchUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      setMessage('Errore durante l\'aggiornamento dello stato dell\'utente');
    }
  };

  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h3>Gestione Utenti</h3>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${message.includes('successo') ? 'alert-success' : 'alert-danger'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="row g-3">
            <div className={isSuperAdmin ? "col-md-2" : "col-md-3"}>
              <input
                type="text"
                className="form-control"
                placeholder="Nome"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={isSuperAdmin ? "col-md-2" : "col-md-3"}>
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={isSuperAdmin ? "col-md-2" : "col-md-2"}>
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                name="role"
                value={newUser.role}
                onChange={handleInputChange}
              >
                <option value="kitchen">Cucina</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            {/* Restaurant dropdown for superadmin */}
            {isSuperAdmin && (
              <div className="col-md-2">
                <select
                  className="form-select"
                  name="restaurantId"
                  value={newUser.restaurantId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleziona Ristorante</option>
                  {restaurants.map(restaurant => (
                    <option key={restaurant._id} value={restaurant._id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="col-md-2">
              <button type="submit" className="btn btn-success w-100">Aggiungi Utente</button>
            </div>
          </div>
        </form>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Ruolo</th>
                {isSuperAdmin && <th>Ristorante</th>}
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? "6" : "5"} className="text-center">
                    Nessun utente trovato
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.role === 'admin' ? 'Amministratore' : 
                      user.role === 'kitchen' ? 'Cucina' : 'Super Admin'}
                    </td>
                    {isSuperAdmin && (
                      <td>
                        {restaurants.find(r => r._id === user.restaurantId)?.name || 
                         'N/D'}
                      </td>
                    )}
                    <td>
                      <span className={`badge ${user.active ? 'bg-success' : 'bg-danger'}`}>
                        {user.active ? 'Attivo' : 'Disattivato'}
                      </span>
                    </td>
                    <td>
                      {user._id !== currentUser.id && (
                        <button
                          className={`btn btn-sm ${user.active ? 'btn-warning' : 'btn-info'}`}
                          onClick={() => toggleUserStatus(user._id, user.active)}
                        >
                          {user.active ? 'Disattiva' : 'Attiva'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserManagement; 