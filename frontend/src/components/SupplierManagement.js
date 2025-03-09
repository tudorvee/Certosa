import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchSuppliers();
  }, []);
  
  const fetchSuppliers = () => {
    axios.get('http://localhost:5001/api/suppliers')
      .then(res => {
        setSuppliers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching suppliers:', err);
        setLoading(false);
      });
  };
  
  const handleInputChange = (e) => {
    setNewSupplier({ ...newSupplier, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    axios.post('http://localhost:5001/api/suppliers', newSupplier)
      .then(res => {
        setMessage('Fornitore aggiunto con successo!');
        setNewSupplier({ name: '', email: '', phone: '', address: '' });
        fetchSuppliers();
      })
      .catch(err => {
        console.error('Error adding supplier:', err);
        setMessage('Errore durante l\'aggiunta del fornitore. Riprova.');
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
            <h3>Aggiungi Nuovo Fornitore</h3>
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
                  value={newSupplier.name} 
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  name="email" 
                  value={newSupplier.email} 
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Telefono</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="phone" 
                  value={newSupplier.phone} 
                  onChange={handleInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Indirizzo</label>
                <textarea 
                  className="form-control" 
                  name="address" 
                  value={newSupplier.address} 
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-success">Aggiungi Fornitore</button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h3>Lista Fornitori</h3>
          </div>
          <div className="card-body">
            {suppliers.length === 0 ? (
              <p>Nessun fornitore trovato.</p>
            ) : (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Telefono</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(supplier => (
                    <tr key={supplier._id}>
                      <td>{supplier.name}</td>
                      <td>{supplier.email}</td>
                      <td>{supplier.phone}</td>
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

export default SupplierManagement; 