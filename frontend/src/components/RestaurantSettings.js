import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL from '../api/index';

function RestaurantSettings() {
  const { user } = useContext(AuthContext);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState('');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    console.log("RestaurantSettings mounted, user:", user);
    fetchRestaurant();
  }, []);
  
  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching restaurant data, user role:", user?.role);
      
      // Determine the API URL
      let url = `${API_BASE_URL}/api/restaurants/current`;
      
      // If superadmin with selected restaurant
      const selectedRestaurant = localStorage.getItem('selectedRestaurant');
      if (user?.role === 'superadmin' && selectedRestaurant) {
        url += `?restaurantId=${selectedRestaurant}`;
        console.log("Superadmin requesting restaurant:", selectedRestaurant);
      } else {
        console.log("Regular user requesting their restaurant");
      }
      
      console.log("Making API request to:", url);
      const res = await axios.get(url);
      console.log("Restaurant data received:", res.data);
      
      setRestaurant(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching restaurant:", err.response?.data || err.message);
      setError(err.response?.data?.message || 'Errore nel caricamento dei dati');
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (!restaurant) return; // Prevent updates if restaurant is null
    
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
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!restaurant) {
      setMessage('Dati del ristorante non disponibili');
      return;
    }
    
    try {
      await axios.put(`${API_BASE_URL}/api/restaurants/current`, restaurant);
      setMessage('Impostazioni salvate con successo!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Errore durante il salvataggio delle impostazioni');
      console.error('Error updating restaurant:', err);
    }
  };
  
  const handleTestEmail = async () => {
    setTestEmailStatus('sending');
    setMessage('');
    
    try {
      // First save any changes to the email configuration
      await axios.put(`${API_BASE_URL}/api/restaurants/current`, restaurant);
      
      // Now test the email sending
      const response = await axios.post(`${API_BASE_URL}/api/orders/test-email`);
      console.log('Email test response:', response.data);
      
      if (response.data.success) {
        setTestEmailStatus('success');
        setMessage('Email di test inviata con successo! Controlla la tua casella di posta.');
      } else {
        setTestEmailStatus('error');
        setMessage(`Errore nell'invio dell'email di test: ${response.data.error}`);
      }
    } catch (err) {
      setTestEmailStatus('error');
      console.error('Error sending test email:', err);
      setMessage(err.response?.data?.error || 'Errore durante l\'invio dell\'email di test');
    }
  };
  
  // Add this function to check if email configuration is complete
  const hasCompleteEmailConfig = () => {
    if (!restaurant || !restaurant.emailConfig) return false;
    
    return Boolean(
      restaurant.emailConfig.senderName && 
      restaurant.emailConfig.senderEmail && 
      restaurant.emailConfig.smtpUser && 
      restaurant.emailConfig.smtpPassword
    );
  };
  
  const getMissingEmailFields = () => {
    if (!restaurant || !restaurant.emailConfig) return ['tutti i campi'];
    
    const missing = [];
    if (!restaurant.emailConfig.senderName) missing.push('Nome Mittente');
    if (!restaurant.emailConfig.senderEmail) missing.push('Email Mittente');
    if (!restaurant.emailConfig.smtpUser) missing.push('Username SMTP');
    if (!restaurant.emailConfig.smtpPassword) missing.push('Password SMTP');
    
    return missing;
  };
  
  if (loading) {
    return <div className="text-center p-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  if (error || !restaurant) {
    return (
      <div className="alert alert-danger">
        <h4>Errore</h4>
        <p>Impossibile caricare i dati del ristorante. Riprova più tardi.</p>
        <p className="text-muted">{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            console.log("Retry button clicked");
            fetchRestaurant();
          }}
        >
          Riprova
        </button>
      </div>
    );
  }
  
  // Check if email config is incomplete
  const emailConfigIncomplete = !hasCompleteEmailConfig();
  const missingFields = getMissingEmailFields();

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h3>Impostazioni del Ristorante</h3>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${message.includes('successo') ? 'alert-success' : 'alert-danger'}`}>
            {message}
          </div>
        )}
        
        {emailConfigIncomplete && (
          <div className="alert alert-warning">
            <h5><i className="bi bi-exclamation-triangle-fill me-2"></i>Configurazione Email Incompleta</h5>
            <p>La configurazione email per questo ristorante è incompleta. Gli ordini <strong>non potranno essere inviati via email</strong> finché non completi le impostazioni email.</p>
            <p>Campi mancanti: <strong>{missingFields.join(', ')}</strong></p>
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
                value={restaurant.name || ''}
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
                value={restaurant.address || ''}
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
          
          <h4 className="mt-4 mb-3">
            Impostazioni Email per Ordini
            {emailConfigIncomplete && (
              <span className="badge bg-warning text-dark ms-2">Incompleto</span>
            )}
          </h4>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">
                Nome Mittente
                <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${!restaurant.emailConfig?.senderName ? 'is-invalid' : ''}`}
                name="emailConfig.senderName"
                value={restaurant.emailConfig?.senderName || ''}
                onChange={handleInputChange}
                placeholder="Nome che apparirà come mittente"
              />
              {!restaurant.emailConfig?.senderName && (
                <div className="invalid-feedback">
                  Il nome mittente è obbligatorio per l'invio di email
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Email Mittente
                <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className={`form-control ${!restaurant.emailConfig?.senderEmail ? 'is-invalid' : ''}`}
                name="emailConfig.senderEmail"
                value={restaurant.emailConfig?.senderEmail || ''}
                onChange={handleInputChange}
                placeholder="indirizzo@esempio.com"
              />
              {!restaurant.emailConfig?.senderEmail && (
                <div className="invalid-feedback">
                  L'email mittente è obbligatoria per l'invio di email
                </div>
              )}
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
              <label className="form-label">
                Username SMTP
                <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className={`form-control ${!restaurant.emailConfig?.smtpUser ? 'is-invalid' : ''}`}
                name="emailConfig.smtpUser"
                value={restaurant.emailConfig?.smtpUser || ''}
                onChange={handleInputChange}
                placeholder="Solitamente l'indirizzo email"
              />
              {!restaurant.emailConfig?.smtpUser && (
                <div className="invalid-feedback">
                  Lo username SMTP è obbligatorio per l'invio di email
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Password SMTP
                <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className={`form-control ${!restaurant.emailConfig?.smtpPassword ? 'is-invalid' : ''}`}
                name="emailConfig.smtpPassword"
                value={restaurant.emailConfig?.smtpPassword || ''}
                onChange={handleInputChange}
                placeholder="Per Gmail, usa una password per app"
              />
              {!restaurant.emailConfig?.smtpPassword && (
                <div className="invalid-feedback">
                  La password SMTP è obbligatoria per l'invio di email
                </div>
              )}
            </div>
          </div>
          
          {/* Google-specific instructions */}
          <div className="col-12 mt-3">
            <div className="alert alert-info">
              <h5>Importante per utenti Gmail</h5>
              <p>Se utilizzi Gmail, devi generare una "password per app" invece di usare la tua password Google:</p>
              <ol>
                <li>Vai alla <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">pagina della sicurezza del tuo account Google</a></li>
                <li>Attiva la verifica in due passaggi (se non è già attiva)</li>
                <li>Cerca "Password per le app" e selezionala</li>
                <li>Scegli "Altra" e assegna un nome (es. "Certosa")</li>
                <li>Copia la password generata e usala nel campo "Password SMTP" qui sopra</li>
              </ol>
            </div>
          </div>
          
          <div className="card mt-4 mb-4">
            <div className="card-header bg-info text-white">
              <h5>Test Configurazione Email</h5>
            </div>
            <div className="card-body">
              <p>Usa questa funzionalità per verificare che la configurazione email funzioni correttamente.</p>
              <p>Verrà inviata un'email di test all'indirizzo email configurato come mittente.</p>
              
              {testEmailStatus === 'sending' && (
                <div className="alert alert-info">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  Invio email di test in corso...
                </div>
              )}
              
              {testEmailStatus === 'success' && (
                <div className="alert alert-success">
                  Email di test inviata con successo! Controlla la tua casella di posta.
                </div>
              )}
              
              {testEmailStatus === 'error' && (
                <div className="alert alert-danger">
                  Errore nell'invio dell'email di test. Verifica le tue impostazioni.
                </div>
              )}
              
              <button 
                type="button" 
                className="btn btn-info" 
                onClick={handleTestEmail}
                disabled={testEmailStatus === 'sending' || emailConfigIncomplete}
              >
                {emailConfigIncomplete ? 'Completa la configurazione prima di testare' : 'Invia Email di Test'}
              </button>
              
              {emailConfigIncomplete && (
                <div className="text-danger mt-2">
                  <small>Completa tutti i campi obbligatori prima di testare la configurazione email</small>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <button type="submit" className="btn btn-primary">
              Salva Impostazioni
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RestaurantSettings; 