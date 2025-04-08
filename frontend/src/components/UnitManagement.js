import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/apiUtils';

// Add CSS styles for the modal
const modalStyles = {
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1050
  },
  modalDialog: {
    zIndex: 1060
  }
};

function UnitManagement() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    isDefault: false
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/units');
      setUnits(response.data || []);
      console.log('Units fetched successfully:', response.data);
    } catch (error) {
      console.error('Error fetching units:', error);
      setMessage({ text: 'Errore nel caricamento delle unità di misura. Riprova più tardi.', type: 'error' });
      // Set units to empty array instead of leaving it undefined
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name,
        abbreviation: unit.abbreviation,
        isDefault: unit.isDefault
      });
    } else {
      setEditingUnit(null);
      setFormData({
        name: '',
        abbreviation: '',
        isDefault: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUnit(null);
    setFormData({
      name: '',
      abbreviation: '',
      isDefault: false
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUnit) {
        await apiCall(`/api/units/${editingUnit._id}`, 'PUT', formData);
        setMessage({ text: 'Unità di misura aggiornata con successo', type: 'success' });
      } else {
        await apiCall('/api/units', 'POST', formData);
        setMessage({ text: 'Unità di misura creata con successo', type: 'success' });
      }
      handleCloseModal();
      fetchUnits();
    } catch (error) {
      console.error('Error saving unit:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Errore nel salvataggio dell\'unità di misura', 
        type: 'error' 
      });
    }
  };

  const handleDelete = async (unitId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa unità di misura?')) {
      return;
    }
    
    try {
      await apiCall(`/api/units/${unitId}`, 'DELETE');
      setMessage({ text: 'Unità di misura eliminata con successo', type: 'success' });
      fetchUnits();
    } catch (error) {
      console.error('Error deleting unit:', error);
      setMessage({ text: 'Errore nell\'eliminazione dell\'unità di misura', type: 'error' });
    }
  };

  if (loading && units.length === 0) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
          {message.text}
          <button type="button" className="btn-close float-end" onClick={() => setMessage({ text: '', type: '' })}></button>
        </div>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestione Unità di Misura</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => handleOpenModal()}
        >
          <i className="bi bi-plus-circle me-1"></i> Nuova Unità
        </button>
      </div>

      {!loading && units.length === 0 ? (
        <div className="alert alert-info">
          Nessuna unità di misura trovata. Crea la tua prima unità di misura cliccando il pulsante "Nuova Unità".
          <div className="mt-3">
            <button className="btn btn-outline-primary" onClick={fetchUnits}>
              <i className="bi bi-arrow-clockwise me-1"></i> Riprova
            </button>
          </div>
        </div>
      ) : (
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Nome</th>
              <th style={{ width: '30%' }}>Abbreviazione</th>
              <th style={{ width: '15%' }}>Predefinita</th>
              <th style={{ width: '15%' }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {units.map(unit => (
              <tr key={unit._id}>
                <td>{unit.name}</td>
                <td>{unit.abbreviation}</td>
                <td>
                  {unit.isDefault ? (
                    <span className="badge bg-success">Si</span>
                  ) : (
                    <span className="badge bg-secondary">No</span>
                  )}
                </td>
                <td>
                  <button 
                    className="btn btn-outline-primary btn-sm me-2"
                    onClick={() => handleOpenModal(unit)}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDelete(unit._id)}
                    disabled={unit.isDefault}
                    title={unit.isDefault ? "Non puoi eliminare l'unità predefinita" : ""}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <>
          <div style={modalStyles.modalBackdrop}></div>
          <div className="modal show d-block" tabIndex="-1" style={modalStyles.modalDialog}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingUnit ? 'Modifica Unità di Misura' : 'Nuova Unità di Misura'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={handleCloseModal}
                    aria-label="Close"
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Nome</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="es. Chilogrammi"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="abbreviation" className="form-label">Abbreviazione</label>
                      <input
                        type="text"
                        className="form-control"
                        id="abbreviation"
                        name="abbreviation"
                        value={formData.abbreviation}
                        onChange={handleInputChange}
                        placeholder="es. kg"
                        required
                      />
                    </div>
                    <div className="mb-3 form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="isDefault"
                        name="isDefault"
                        checked={formData.isDefault}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="isDefault">
                        Imposta come unità predefinita
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Annulla
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingUnit ? 'Aggiorna' : 'Crea'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default UnitManagement; 