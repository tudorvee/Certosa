import React, { useState, useEffect, useContext } from 'react';
import { apiCall } from '../utils/apiUtils';
import { AuthContext } from '../context/AuthContext';
import './SuperAdminManagement.css';

function SuperAdminManagement() {
  const { user: currentUser } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [expandedRestaurant, setExpandedRestaurant] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    active: true
  });

  // Check if user is a super admin
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'superadmin') {
      setMessage('Accesso non autorizzato. Solo i super admin possono accedere a questa pagina.');
      setLoading(false);
      return;
    }

    fetchRestaurants();
  }, [currentUser]);

  // Fetch all restaurants
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/restaurants/all');
      setRestaurants(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setMessage('Errore nel caricamento dei ristoranti');
      setLoading(false);
    }
  };

  // Fetch users for a specific restaurant
  const fetchRestaurantUsers = async (restaurantId) => {
    try {
      // Don't fetch if we already have users for this restaurant
      if (users[restaurantId]) return;

      const response = await apiCall(`/api/users?restaurantId=${restaurantId}`);
      setUsers(prev => ({
        ...prev,
        [restaurantId]: response.data
      }));
    } catch (err) {
      console.error(`Error fetching users for restaurant ${restaurantId}:`, err);
      setMessage(`Errore nel caricamento degli utenti per il ristorante selezionato`);
    }
  };

  // Toggle expansion of a restaurant to show its users
  const toggleRestaurantExpansion = (restaurantId) => {
    if (expandedRestaurant === restaurantId) {
      setExpandedRestaurant(null);
    } else {
      setExpandedRestaurant(restaurantId);
      fetchRestaurantUsers(restaurantId);
    }
  };

  // Start editing a user
  const startEditingUser = (user) => {
    setEditingUser(user._id);
    setEditForm({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role,
      active: user.active
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingUser(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save user changes
  const saveUserChanges = async (userId, restaurantId) => {
    try {
      setMessage('');
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        active: editForm.active
      };

      // Only include password if it was changed
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      await apiCall(`/api/users/${userId}`, 'put', updateData);
      
      // Refresh users for this restaurant
      const response = await apiCall(`/api/users?restaurantId=${restaurantId}`);
      setUsers(prev => ({
        ...prev,
        [restaurantId]: response.data
      }));

      setMessage('Utente aggiornato con successo');
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setMessage(err.response?.data?.message || 'Errore durante l\'aggiornamento dell\'utente');
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId, currentStatus, restaurantId) => {
    try {
      setMessage('');
      await apiCall(`/api/users/${userId}`, 'patch', {
        active: !currentStatus
      });
      
      // Refresh users for this restaurant
      const response = await apiCall(`/api/users?restaurantId=${restaurantId}`);
      setUsers(prev => ({
        ...prev,
        [restaurantId]: response.data
      }));

      setMessage('Stato utente aggiornato');
    } catch (err) {
      console.error('Error updating user status:', err);
      setMessage('Errore durante l\'aggiornamento dello stato dell\'utente');
    }
  };

  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }

  // If not a super admin, show access denied message
  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="alert alert-danger">
        <h4>Accesso Negato</h4>
        <p>Solo i super admin possono accedere a questa pagina.</p>
      </div>
    );
  }

  return (
    <div className="super-admin-container">
      <h2 className="mb-4">Gestione Ristoranti e Utenti</h2>

      {message && (
        <div className={`alert ${message.includes('successo') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      {restaurants.length === 0 ? (
        <div className="alert alert-info">Nessun ristorante trovato.</div>
      ) : (
        <div className="restaurant-list">
          {restaurants.map(restaurant => (
            <div key={restaurant._id} className="restaurant-card">
              <div 
                className="restaurant-header" 
                onClick={() => toggleRestaurantExpansion(restaurant._id)}
              >
                <h3>{restaurant.name}</h3>
                <div className="restaurant-info">
                  <span className="restaurant-email">{restaurant.email}</span>
                  <span className={`restaurant-status badge ${restaurant.active ? 'bg-success' : 'bg-danger'}`}>
                    {restaurant.active ? 'Attivo' : 'Disattivato'}
                  </span>
                  <i className={`bi bi-chevron-${expandedRestaurant === restaurant._id ? 'up' : 'down'}`}></i>
                </div>
              </div>

              {expandedRestaurant === restaurant._id && (
                <div className="restaurant-users">
                  <h4 className="mt-3 mb-3">Utenti di {restaurant.name}</h4>
                  
                  {users[restaurant._id] ? (
                    users[restaurant._id].length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-striped user-table">
                          <thead>
                            <tr>
                              <th>Nome</th>
                              <th>Email</th>
                              <th>Ruolo</th>
                              <th>Stato</th>
                              <th>Azioni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users[restaurant._id].map(user => (
                              <tr key={user._id}>
                                {editingUser === user._id ? (
                                  // Edit mode
                                  <>
                                    <td>
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        name="name"
                                        value={editForm.name}
                                        onChange={handleInputChange}
                                        required
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="email"
                                        className="form-control form-control-sm"
                                        name="email"
                                        value={editForm.email}
                                        onChange={handleInputChange}
                                        required
                                      />
                                    </td>
                                    <td>
                                      <select
                                        className="form-select form-select-sm"
                                        name="role"
                                        value={editForm.role}
                                        onChange={handleInputChange}
                                      >
                                        <option value="kitchen">Cucina</option>
                                        <option value="admin">Admin</option>
                                      </select>
                                    </td>
                                    <td>
                                      <div className="form-check">
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          name="active"
                                          checked={editForm.active}
                                          onChange={handleInputChange}
                                          id={`active-${user._id}`}
                                        />
                                        <label className="form-check-label" htmlFor={`active-${user._id}`}>
                                          Attivo
                                        </label>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="password-field mb-2">
                                        <input
                                          type="password"
                                          className="form-control form-control-sm"
                                          name="password"
                                          value={editForm.password}
                                          onChange={handleInputChange}
                                          placeholder="Nuova password (opzionale)"
                                        />
                                      </div>
                                      <div className="d-flex">
                                        <button 
                                          className="btn btn-sm btn-success me-2"
                                          onClick={() => saveUserChanges(user._id, restaurant._id)}
                                        >
                                          Salva
                                        </button>
                                        <button 
                                          className="btn btn-sm btn-outline-secondary"
                                          onClick={cancelEditing}
                                        >
                                          Annulla
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  // View mode
                                  <>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                      {user.role === 'admin' ? 'Amministratore' : 
                                        user.role === 'kitchen' ? 'Cucina' : 'Super Admin'}
                                    </td>
                                    <td>
                                      <span className={`badge ${user.active ? 'bg-success' : 'bg-danger'}`}>
                                        {user.active ? 'Attivo' : 'Disattivato'}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="btn-group" role="group">
                                        <button 
                                          className="btn btn-sm btn-outline-primary me-2"
                                          onClick={() => startEditingUser(user)}
                                        >
                                          <i className="bi bi-pencil"></i> Modifica
                                        </button>
                                        <button 
                                          className={`btn btn-sm ${user.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                          onClick={() => toggleUserStatus(user._id, user.active, restaurant._id)}
                                        >
                                          {user.active ? <><i className="bi bi-x-circle"></i> Disattiva</> : <><i className="bi bi-check-circle"></i> Attiva</>}
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="alert alert-info">Nessun utente trovato per questo ristorante.</div>
                    )
                  ) : (
                    <div className="text-center my-3">
                      <div className="spinner-border spinner-border-sm" role="status"></div>
                      <span className="ms-2">Caricamento utenti...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SuperAdminManagement;
