import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/index';

function OrderForm() {
  const [items, setItems] = useState([]);
  const [orderItems, setOrderItems] = useState([{ itemId: '', quantity: 1 }]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/items`)
      .then(res => {
        setItems(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching items:', err);
        setLoading(false);
      });
  }, []);
  
  const handleItemChange = (index, e) => {
    const newOrderItems = [...orderItems];
    newOrderItems[index] = { ...newOrderItems[index], itemId: e.target.value };
    setOrderItems(newOrderItems);
  };
  
  const handleQuantityChange = (index, e) => {
    const newOrderItems = [...orderItems];
    newOrderItems[index] = { ...newOrderItems[index], quantity: e.target.value };
    setOrderItems(newOrderItems);
  };
  
  const addItem = () => {
    setOrderItems([...orderItems, { itemId: '', quantity: 1 }]);
  };
  
  const removeItem = (index) => {
    const newOrderItems = [...orderItems];
    newOrderItems.splice(index, 1);
    setOrderItems(newOrderItems);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    
    // Filter out any items that don't have an itemId selected
    const validItems = orderItems.filter(item => item.itemId);
    
    if (validItems.length === 0) {
      setMessage('Seleziona almeno un articolo');
      return;
    }
    
    axios.post(`${API_BASE_URL}/api/orders`, { items: validItems })
      .then(res => {
        setMessage('Ordine inviato con successo! Le email sono state inviate ai fornitori.');
        setOrderItems([{ itemId: '', quantity: 1 }]);
      })
      .catch(err => {
        console.error('Error creating order:', err);
        setMessage('Errore durante l\'invio dell\'ordine. Riprova.');
      });
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="row">
      <div className="col-md-8 offset-md-2">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h3>Nuovo Ordine</h3>
          </div>
          <div className="card-body">
            {message && (
              <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>
                {message}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {orderItems.map((item, index) => (
                <div className="row mb-3" key={index}>
                  <div className="col-md-6">
                    <select 
                      className="form-select" 
                      value={item.itemId} 
                      onChange={(e) => handleItemChange(index, e)}
                      required
                    >
                      <option value="">Seleziona un articolo...</option>
                      {items.map(i => (
                        <option key={i._id} value={i._id}>
                          {i.name} ({i.supplierId?.name || 'Fornitore sconosciuto'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input 
                      type="number" 
                      className="form-control" 
                      value={item.quantity} 
                      onChange={(e) => handleQuantityChange(index, e)}
                      min="1"
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    {index > 0 && (
                      <button 
                        type="button" 
                        className="btn btn-danger"
                        onClick={() => removeItem(index)}
                      >
                        Rimuovi
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="mb-3">
                <button type="button" className="btn btn-secondary me-2" onClick={addItem}>
                  Aggiungi Altro Articolo
                </button>
                <button type="submit" className="btn btn-primary">
                  Invia Ordine
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderForm; 