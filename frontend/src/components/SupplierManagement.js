import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/index';
import { AuthContext } from '../context/AuthContext';
import { apiCall } from '../utils/apiUtils';

function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierForm, setSupplierForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [selectionFilter, setSelectionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkAction, setBulkAction] = useState('');
  const [bulkEditField, setBulkEditField] = useState('');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const { user } = useContext(AuthContext);
  const [lastSelectedSupplierId, setLastSelectedSupplierId] = useState(null);
  const [inactiveSuppliers, setInactiveSuppliers] = useState([]);
  const [showInactiveSuppliers, setShowInactiveSuppliers] = useState(false);
  
  useEffect(() => {
    fetchSuppliers();
  }, []);
  
  const fetchSuppliers = async () => {
    try {
      const res = await apiCall('/api/suppliers?includeInactive=true');
      
      // Separate active and inactive suppliers
      const allSuppliers = res.data;
      setSuppliers(allSuppliers.filter(supplier => supplier.isActive !== false));
      setInactiveSuppliers(allSuppliers.filter(supplier => supplier.isActive === false));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setMessage('Errore nel caricamento dei fornitori');
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    setSupplierForm({ ...supplierForm, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      let response;
      
      if (editMode) {
        // Update existing supplier
        response = await apiCall(`/api/suppliers/${editingSupplierId}`, 'put', supplierForm);
        setMessage('Fornitore aggiornato con successo!');
        setEditMode(false);
        setEditingSupplierId(null);
      } else {
        // Create new supplier
        response = await apiCall('/api/suppliers', 'post', supplierForm);
        setMessage('Fornitore aggiunto con successo!');
      }
      
      // Reset form
      setSupplierForm({ 
        name: '', 
        email: '', 
        phone: '', 
        notes: ''
      });
      
      // Refresh supplier list
      fetchSuppliers();
    } catch (err) {
      console.error('Error saving supplier:', err);
      setMessage('Errore durante il salvataggio del fornitore. Riprova.');
    }
  };
  
  const handleEdit = (supplier) => {
    setSupplierForm({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      notes: supplier.notes || ''
    });
    setEditMode(true);
    setEditingSupplierId(supplier._id);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancel = () => {
    setSupplierForm({ 
      name: '', 
      email: '', 
      phone: '', 
      notes: ''
    });
    setEditMode(false);
    setEditingSupplierId(null);
  };
  
  const handleDelete = async (supplierId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo fornitore?')) {
      try {
        await apiCall(`/api/suppliers/${supplierId}`, 'delete');
        setMessage('Fornitore eliminato con successo');
        fetchSuppliers();
      } catch (err) {
        console.error('Error deleting supplier:', err);
        setMessage('Errore durante l\'eliminazione del fornitore');
      }
    }
  };
  
  // Bulk selection handlers
  const toggleSelectSupplier = (supplierId, event) => {
    // Handle keyboard modifiers
    if (event) {
      // Control/Command key for toggling individual selections
      if (event.ctrlKey || event.metaKey) {
        setSelectedSuppliers(prev => {
          const updated = { ...prev };
          updated[supplierId] = !updated[supplierId];
          return updated;
        });
        setLastSelectedSupplierId(supplierId);
        return;
      }
      
      // Shift key for range selection
      if (event.shiftKey && lastSelectedSupplierId) {
        const supplierIds = suppliers.map(supplier => supplier._id);
        const currentIndex = supplierIds.indexOf(supplierId);
        const lastIndex = supplierIds.indexOf(lastSelectedSupplierId);
        
        if (currentIndex !== -1 && lastIndex !== -1) {
          const startIndex = Math.min(currentIndex, lastIndex);
          const endIndex = Math.max(currentIndex, lastIndex);
          const suppliersInRange = supplierIds.slice(startIndex, endIndex + 1);
          
          setSelectedSuppliers(prev => {
            const updated = { ...prev };
            suppliersInRange.forEach(id => {
              updated[id] = true;
            });
            return updated;
          });
          return;
        }
      }
    }
    
    // Default behavior (no modifiers) - toggle single item
    setSelectedSuppliers(prev => {
      const updated = { ...prev };
      updated[supplierId] = !updated[supplierId];
      return updated;
    });
    setLastSelectedSupplierId(supplierId);
  };
  
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    const newSelectedSuppliers = {};
    suppliers.forEach(supplier => {
      newSelectedSuppliers[supplier._id] = newSelectAll;
    });
    setSelectedSuppliers(newSelectedSuppliers);
  };
  
  const applySelectionFilter = () => {
    const newSelectedSuppliers = {};
    
    // Reset all selections first
    suppliers.forEach(supplier => {
      newSelectedSuppliers[supplier._id] = false;
    });
    
    if (selectionFilter === 'all') {
      // Select all suppliers
      suppliers.forEach(supplier => {
        newSelectedSuppliers[supplier._id] = true;
      });
      setSelectAll(true);
    } else if (selectionFilter === 'withEmail') {
      // Select suppliers with email
      suppliers.forEach(supplier => {
        if (supplier.email && supplier.email.trim() !== '') {
          newSelectedSuppliers[supplier._id] = true;
        }
      });
      setSelectAll(false);
    } else if (selectionFilter === 'withoutEmail') {
      // Select suppliers without email
      suppliers.forEach(supplier => {
        if (!supplier.email || supplier.email.trim() === '') {
          newSelectedSuppliers[supplier._id] = true;
        }
      });
      setSelectAll(false);
    } else if (selectionFilter === 'withPhone') {
      // Select suppliers with phone
      suppliers.forEach(supplier => {
        if (supplier.phone && supplier.phone.trim() !== '') {
          newSelectedSuppliers[supplier._id] = true;
        }
      });
      setSelectAll(false);
    } else if (selectionFilter === 'withoutPhone') {
      // Select suppliers without phone
      suppliers.forEach(supplier => {
        if (!supplier.phone || supplier.phone.trim() === '') {
          newSelectedSuppliers[supplier._id] = true;
        }
      });
      setSelectAll(false);
    } else if (selectionFilter === 'search' && searchTerm.trim() !== '') {
      // Select suppliers matching search term (case insensitive)
      const term = searchTerm.toLowerCase();
      suppliers.forEach(supplier => {
        if (
          supplier.name.toLowerCase().includes(term) || 
          (supplier.email && supplier.email.toLowerCase().includes(term)) ||
          (supplier.phone && supplier.phone.toLowerCase().includes(term)) ||
          (supplier.notes && supplier.notes.toLowerCase().includes(term))
        ) {
          newSelectedSuppliers[supplier._id] = true;
        }
      });
      setSelectAll(false);
    }
    
    setSelectedSuppliers(newSelectedSuppliers);
  };
  
  const handleFilterChange = (e) => {
    setSelectionFilter(e.target.value);
    
    // Reset search term if not in search mode
    if (e.target.value !== 'search') {
      setSearchTerm('');
    }
  };
  
  const getSelectedSupplierIds = () => {
    return Object.keys(selectedSuppliers).filter(id => selectedSuppliers[id]);
  };
  
  // Bulk actions
  const handleBulkAction = async () => {
    const selectedIds = getSelectedSupplierIds();
    
    if (selectedIds.length === 0) {
      setMessage('Nessun fornitore selezionato');
      return;
    }
    
    try {
      if (bulkAction === 'delete') {
        if (window.confirm(`Sei sicuro di voler eliminare ${selectedIds.length} fornitori?`)) {
          // Delete selected suppliers one by one
          for (const id of selectedIds) {
            await apiCall(`/api/suppliers/${id}`, 'delete');
          }
          setMessage(`${selectedIds.length} fornitori eliminati con successo`);
          setSelectedSuppliers({});
          setSelectAll(false);
          fetchSuppliers();
        }
      } else if (bulkAction === 'edit') {
        if (!bulkEditField || !bulkEditValue) {
          setMessage('Seleziona un campo e inserisci un valore');
          return;
        }
        
        // Update all selected suppliers with the new field value
        for (const id of selectedIds) {
          const updateData = { [bulkEditField]: bulkEditValue };
          await apiCall(`/api/suppliers/${id}`, 'put', updateData);
        }
        
        setMessage(`${selectedIds.length} fornitori aggiornati con successo`);
        setBulkEditField('');
        setBulkEditValue('');
        setSelectedSuppliers({});
        setSelectAll(false);
        fetchSuppliers();
      }
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setMessage('Errore durante l\'esecuzione dell\'azione di massa');
    }
  };
  
  // Add soft delete function
  const handleSoftDelete = async (supplierId) => {
    if (window.confirm('Sei sicuro di voler disattivare questo fornitore?')) {
      try {
        await apiCall(`/api/suppliers/${supplierId}`, 'put', { isActive: false });
        setMessage('Fornitore disattivato con successo');
        fetchSuppliers();
      } catch (err) {
        console.error('Error disabling supplier:', err);
        setMessage('Errore durante la disattivazione del fornitore');
      }
    }
  };
  
  // Add restore function
  const handleRestoreSupplier = async (supplierId) => {
    try {
      await apiCall(`/api/suppliers/${supplierId}`, 'put', { isActive: true });
      setMessage('Fornitore ripristinato con successo');
      fetchSuppliers();
    } catch (err) {
      console.error('Error restoring supplier:', err);
      setMessage('Errore durante il ripristino del fornitore');
    }
  };
  
  // Add force delete function
  const handleForceDelete = async (supplierId) => {
    if (window.confirm('ATTENZIONE: Questa azione eliminerà definitivamente il fornitore. Procedere?')) {
      try {
        await apiCall(`/api/suppliers/${supplierId}/force`, 'delete');
        setMessage('Fornitore eliminato definitivamente');
        fetchSuppliers();
      } catch (err) {
        console.error('Error force deleting supplier:', err);
        setMessage('Errore durante l\'eliminazione definitiva');
      }
    }
  };
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card mb-4">
          <div className={`card-header ${editMode ? 'bg-warning' : 'bg-success'} text-white`}>
            <h3>{editMode ? 'Modifica Fornitore' : 'Aggiungi Nuovo Fornitore'}</h3>
          </div>
          <div className="card-body">
            {message && (
              <div className={`alert ${message.includes('successo') ? 'alert-success' : 'alert-danger'}`}>
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
                  value={supplierForm.name} 
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
                  value={supplierForm.email} 
                  onChange={handleInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Telefono</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  name="phone" 
                  value={supplierForm.phone} 
                  onChange={handleInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Note</label>
                <textarea 
                  className="form-control" 
                  name="notes" 
                  value={supplierForm.notes} 
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className={`btn ${editMode ? 'btn-warning' : 'btn-success'}`}>
                  {editMode ? 'Aggiorna Fornitore' : 'Aggiungi Fornitore'}
                </button>
                {editMode && (
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    Annulla
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Bulk Actions Panel */}
        {getSelectedSupplierIds().length > 0 && (
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h3>Azioni di Massa ({getSelectedSupplierIds().length} fornitori selezionati)</h3>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Azione di Massa</label>
                <select
                  className="form-select"
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                >
                  <option value="">Seleziona un'azione...</option>
                  <option value="delete">Elimina Fornitori</option>
                  <option value="edit">Modifica Campo</option>
                </select>
              </div>
              
              {bulkAction === 'edit' && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Campo da Modificare</label>
                    <select
                      className="form-select"
                      value={bulkEditField}
                      onChange={(e) => setBulkEditField(e.target.value)}
                    >
                      <option value="">Seleziona un campo...</option>
                      <option value="email">Email</option>
                      <option value="phone">Telefono</option>
                      <option value="notes">Note</option>
                    </select>
                  </div>
                  
                  {(bulkEditField === 'email' || bulkEditField === 'phone') && (
                    <div className="mb-3">
                      <label className="form-label">Nuovo Valore</label>
                      <input
                        type={bulkEditField === 'email' ? 'email' : 'tel'}
                        className="form-control"
                        value={bulkEditValue}
                        onChange={(e) => setBulkEditValue(e.target.value)}
                      />
                    </div>
                  )}
                  
                  {bulkEditField === 'notes' && (
                    <div className="mb-3">
                      <label className="form-label">Nuove Note</label>
                      <textarea
                        className="form-control"
                        value={bulkEditValue}
                        onChange={(e) => setBulkEditValue(e.target.value)}
                      ></textarea>
                    </div>
                  )}
                </>
              )}
              
              <button
                className="btn btn-primary"
                onClick={handleBulkAction}
                disabled={!bulkAction || (bulkAction === 'edit' && (!bulkEditField || !bulkEditValue))}
              >
                Applica a {getSelectedSupplierIds().length} Fornitori
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h3>Lista Fornitori</h3>
            
            <div className="mt-3">
              <div className="row g-3 align-items-center">
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={selectionFilter}
                    onChange={handleFilterChange}
                  >
                    <option value="">Seleziona filtro...</option>
                    <option value="all">Seleziona Tutti</option>
                    <option value="withEmail">Con Email</option>
                    <option value="withoutEmail">Senza Email</option>
                    <option value="withPhone">Con Telefono</option>
                    <option value="withoutPhone">Senza Telefono</option>
                    <option value="search">Ricerca</option>
                  </select>
                </div>
                
                {selectionFilter === 'search' && (
                  <div className="col-md-5">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cerca fornitori..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="col">
                  <button
                    className="btn btn-light"
                    onClick={applySelectionFilter}
                    disabled={
                      !selectionFilter || 
                      (selectionFilter === 'search' && !searchTerm.trim())
                    }
                  >
                    Applica Selezione
                  </button>
                </div>
              </div>
              
              <div className="form-check mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  id="selectAllSuppliers"
                />
                <label className="form-check-label text-white" htmlFor="selectAllSuppliers">
                  Seleziona/Deseleziona Tutti
                </label>
              </div>
            </div>
          </div>
          <div className="card-body">
            {suppliers.length === 0 ? (
              <p>Nessun fornitore trovato.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th style={{width: '40px'}}></th>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Telefono</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(supplier => (
                      <tr 
                        key={supplier._id} 
                        onClick={(e) => toggleSelectSupplier(supplier._id, e)}
                        style={{ cursor: 'pointer', backgroundColor: selectedSuppliers[supplier._id] ? '#e9ecef' : 'inherit' }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={!!selectedSuppliers[supplier._id]}
                              onChange={(e) => toggleSelectSupplier(supplier._id, e)}
                            />
                          </div>
                        </td>
                        <td>{supplier.name}</td>
                        <td>{supplier.email || '-'}</td>
                        <td>{supplier.phone || '-'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-warning"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(supplier);
                              }}
                            >
                              Modifica
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSoftDelete(supplier._id);
                              }}
                            >
                              Disattiva
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierManagement; 