import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ItemManagement() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', description: '', unit: '', supplierId: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:5001/api/items'),
      axios.get('http://localhost:5001/api/suppliers')
    ])
      .then(([itemsRes, suppliersRes]) => {
        setItems(itemsRes.data);
        setSuppliers(suppliersRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);
  
  const handleInputChange = (e) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newItem.supplierId) {
      setMessage('Seleziona un fornitore');
      return;
    }
    
    axios.post('http://localhost:5001/api/items', newItem)
      .then(res => {
        setMessage('Articolo aggiunto con successo!');
        setNewItem({ name: '', description: '', unit: '', supplierId: '' });
        
        // Refresh items list
        axios.get('http://localhost:5001/api/items')
          .then(res => {
            setItems(res.data);
          });
      })
      .catch(err => {
        console.error('Error adding item:', err);
        setMessage('Errore durante l\'aggiunta dell\'articolo. Riprova.');
      });
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-success text-white">
            <h3>Aggiungi Nuovo Articolo</h3>
          </div>
          <div className="card-body">
            {message && (
              <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>
                {message}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nome</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="name" 
                  value={newItem.name} 
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Descrizione</label>
                <textarea 
                  className="form-control" 
                  name="description" 
                  value={newItem.description} 
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label">Unità (es. kg, pezzi, scatole)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="unit" 
                  value={newItem.unit} 
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Fornitore</label>
                <select 
                  className="form-select" 
                  name="supplierId" 
                  value={newItem.supplierId} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleziona un fornitore...</option>
                  {suppliers.map(supplier => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-success">Aggiungi Articolo</button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h3>Lista Articoli</h3>
          </div>
          <div className="card-body">
            {items.length === 0 ? (
              <p>Nessun articolo trovato.</p>
            ) : (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Unità</th>
                    <th>Fornitore</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item._id}>
                      <td>{item.name}</td>
                      <td>{item.unit}</td>
                      <td>{item.supplierId?.name || 'Fornitore non disponibile'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemManagement; 