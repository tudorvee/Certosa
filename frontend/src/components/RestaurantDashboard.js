import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL from '../api/index';

function RestaurantDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    fetchRestaurants();
  }, []);
  
  const fetchRestaurants = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/restaurants/all`);
      setRestaurants(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setMessage('Errore nel caricamento dei ristoranti');
      setLoading(false);
    }
  };
  
  const toggleRestaurantStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/restaurants/${id}`, {
        active: !currentStatus
      });
      fetchRestaurants();
    } catch (err) {
      console.error('Error updating restaurant status:', err);
      setMessage('Errore nell\'aggiornamento dello stato');
    }
  };
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  return (
    <div className="card">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h3>Gestione Ristoranti</h3>
        <Link to="/restaurants/new" className="btn btn-light">
          <i className="bi bi-plus-circle me-1"></i> Nuovo Ristorante
        </Link>
      </div>
      <div className="card-body">
        {message && (
          <div className="alert alert-danger">{message}</div>
        )}
        
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Indirizzo</th>
                <th>Contatti</th>
                <th>Email Ordini</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">Nessun ristorante trovato</td>
                </tr>
              ) : (
                restaurants.map(restaurant => (
                  <tr key={restaurant._id}>
                    <td>{restaurant.name}</td>
                    <td>{restaurant.address}</td>
                    <td>
                      <div>{restaurant.phone || '-'}</div>
                      <div className="text-muted small">{restaurant.email || '-'}</div>
                    </td>
                    <td>
                      {restaurant.emailConfig?.smtpUser ? (
                        <span className="text-success">
                          <i className="bi bi-check-circle me-1"></i>
                          {restaurant.emailConfig.smtpUser}
                        </span>
                      ) : (
                        <span className="text-muted">Non configurata</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${restaurant.active ? 'bg-success' : 'bg-danger'}`}>
                        {restaurant.active ? 'Attivo' : 'Disattivato'}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Link to={`/restaurants/edit/${restaurant._id}`} className="btn btn-outline-primary">
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <button 
                          className={`btn btn-outline-${restaurant.active ? 'warning' : 'success'}`}
                          onClick={() => toggleRestaurantStatus(restaurant._id, restaurant.active)}
                        >
                          <i className={`bi bi-${restaurant.active ? 'pause' : 'play'}`}></i>
                        </button>
                      </div>
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

export default RestaurantDashboard; 