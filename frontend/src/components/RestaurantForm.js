import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api/index';

function RestaurantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    emailConfig: {
      senderName: '',
      senderEmail: '',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      useSsl: false
    },
    active: true
  });
  const [loading, setLoading] = useState(id ? true : false);
  const [message, setMessage] = useState('');
  const isEditing = !!id;
  const [createdUsers, setCreatedUsers] = useState([]);
  
  useEffect(() => {
    if (isEditing) {
      fetchRestaurant();
    }
  }, [id]);
  
  const fetchRestaurant = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/restaurants/${id}`);
      setRestaurant(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching restaurant:', err);
      setMessage('Errore nel caricamento del ristorante');
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('emailConfig.')) {
      const configField = name.replace('emailConfig.', '');
      setRestaurant({
        ...restaurant,
        emailConfig: {
          ...restaurant.emailConfig,
          [configField]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      setRestaurant({
        ...restaurant,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/api/restaurants/${id}`, restaurant);
        setMessage('Ristorante aggiornato con successo!');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/restaurants');
        }, 1500);
      } else {
        // For new restaurants, we'll get back the created users
        const response = await axios.post(`${API_BASE_URL}/api/restaurants`, restaurant);
        
        // Set state for created users
        setCreatedUsers(response.data.users);
        
        setMessage('Ristorante creato con successo! Utenti admin e cucina creati automaticamente.');
        
        // Don't redirect immediately so the user can see the created credentials
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Errore durante il salvataggio');
      console.error('Error saving restaurant:', err);
    }
  };
  
  const handleDoneViewing = () => {
    navigate('/restaurants');
  };
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  // If we have created users, show their credentials
  if (createdUsers.length > 0) {
    return (
      <div className="card">
        <div className="card-header bg-success text-white">
          <h3>Ristorante Creato con Successo</h3>
        </div>
        <div className="card-body">
          <div className="alert alert-success">
            Il ristorante <strong>{restaurant.name}</strong> è stato creato con successo!
          </div>
          
          <div className="mt-4">
            <h4>Credenziali Utenti Creati</h4>
            <p className="text-danger">IMPORTANTE: Copia queste credenziali ora! Non saranno visualizzabili nuovamente.</p>
            
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Password</th>
                    <th>Ruolo</th>
                  </tr>
                </thead>
                <tbody>
                  {createdUsers.map((user, index) => (
                    <tr key={index}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td className="font-monospace">{user.password}</td>
                      <td>{user.role === 'admin' ? 'Amministratore' : 'Cucina'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="d-flex justify-content-end mt-4">
              <button 
                className="btn btn-primary"
                onClick={handleDoneViewing}
              >
                Vai alla Lista Ristoranti
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h3>{isEditing ? 'Modifica Ristorante' : 'Nuovo Ristorante'}</h3>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${message.includes('successo') ? 'alert-success' : 'alert-danger'}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Nome Ristorante</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={restaurant.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Indirizzo</label>
              <input
                type="text"
                className="form-control"
                name="address"
                value={restaurant.address}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Telefono</label>
              <input
                type="text"
                className="form-control"
                name="phone"
                value={restaurant.phone || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email Ristorante</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={restaurant.email || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              name="active"
              checked={restaurant.active}
              onChange={handleInputChange}
              id="active"
            />
            <label className="form-check-label" htmlFor="active">
              Ristorante Attivo
            </label>
          </div>
          
          <h4 className="mt-4 mb-3">Impostazioni Email per Ordini</h4>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Nome Mittente</label>
              <input
                type="text"
                className="form-control"
                name="emailConfig.senderName"
                value={restaurant.emailConfig?.senderName || ''}
                onChange={handleInputChange}
                placeholder="Nome che apparirà come mittente"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email Mittente</label>
              <input
                type="email"
                className="form-control"
                name="emailConfig.senderEmail"
                value={restaurant.emailConfig?.senderEmail || ''}
                onChange={handleInputChange}
                placeholder="indirizzo@esempio.com"
              />
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Server SMTP</label>
              <input
                type="text"
                className="form-control"
                name="emailConfig.smtpHost"
                value={restaurant.emailConfig?.smtpHost || 'smtp.gmail.com'}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Porta SMTP</label>
              <input
                type="number"
                className="form-control"
                name="emailConfig.smtpPort"
                value={restaurant.emailConfig?.smtpPort || 587}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Usa SSL</label>
              <div className="form-check mt-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="emailConfig.useSsl"
                  checked={restaurant.emailConfig?.useSsl || false}
                  onChange={handleInputChange}
                  id="useSsl"
                />
                <label className="form-check-label" htmlFor="useSsl">
                  Attiva SSL
                </label>
              </div>
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Username SMTP</label>
              <input
                type="email"
                className="form-control"
                name="emailConfig.smtpUser"
                value={restaurant.emailConfig?.smtpUser || ''}
                onChange={handleInputChange}
                placeholder="Solitamente l'indirizzo email"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Password SMTP</label>
              <input
                type="password"
                className="form-control"
                name="emailConfig.smtpPassword"
                value={restaurant.emailConfig?.smtpPassword || ''}
                onChange={handleInputChange}
                placeholder="Per Gmail usare una password per le app"
              />
              <small className="text-muted">
                Per Gmail, devi generare una "Password per le app" nelle impostazioni di sicurezza Google.
              </small>
            </div>
          </div>
          
          <div className="mt-4">
            <button type="submit" className="btn btn-primary me-2">
              {isEditing ? 'Aggiorna' : 'Crea'} Ristorante
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary"
              onClick={() => navigate('/restaurants')}
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RestaurantForm; 