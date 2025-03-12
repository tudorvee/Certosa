import React, { useState, useEffect, useContext } from 'react';
import { apiCall } from '../utils/apiUtils';
import { AuthContext } from '../context/AuthContext';

function ItemManagement() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemForm, setItemForm] = useState({
    name: '', 
    description: '', 
    unit: '', 
    supplierId: '',
    categoryId: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [selectionFilter, setSelectionFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [bulkAction, setBulkAction] = useState('');
  const [bulkEditField, setBulkEditField] = useState('');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [itemsRes, suppliersRes, categoriesRes] = await Promise.all([
        apiCall('/api/items'),
        apiCall('/api/suppliers'),
        apiCall('/api/categories')
      ]);
      
      setItems(itemsRes.data);
      setSuppliers(suppliersRes.data);
      setCategories(categoriesRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage('Errore nel caricamento dei dati');
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    setItemForm({ ...itemForm, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!itemForm.supplierId) {
      setMessage('Seleziona un fornitore');
      return;
    }
    
    try {
      let response;
      
      if (editMode) {
        // Update existing item
        response = await apiCall(`/api/items/${editingItemId}`, 'put', itemForm);
        setMessage('Articolo aggiornato con successo!');
        setEditMode(false);
        setEditingItemId(null);
      } else {
        // Create new item
        response = await apiCall('/api/items', 'post', itemForm);
        setMessage('Articolo aggiunto con successo!');
      }
      
      // Reset form
      setItemForm({ 
        name: '', 
        description: '', 
        unit: '', 
        supplierId: '',
        categoryId: ''
      });
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error saving item:', err);
      setMessage('Errore durante il salvataggio dell\'articolo. Riprova.');
    }
  };
  
  const handleEdit = (item) => {
    setItemForm({
      name: item.name,
      description: item.description || '',
      unit: item.unit,
      supplierId: item.supplierId._id,
      categoryId: item.categoryId?._id || ''
    });
    setEditMode(true);
    setEditingItemId(item._id);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancel = () => {
    setItemForm({ 
      name: '', 
      description: '', 
      unit: '', 
      supplierId: '',
      categoryId: ''
    });
    setEditMode(false);
    setEditingItemId(null);
  };
  
  const handleDelete = async (itemId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo articolo?')) {
      try {
        await apiCall(`/api/items/${itemId}`, 'delete');
        setMessage('Articolo eliminato con successo');
        fetchData();
      } catch (err) {
        console.error('Error deleting item:', err);
        setMessage('Errore durante l\'eliminazione dell\'articolo');
      }
    }
  };
  
  // Bulk selection handlers
  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      updated[itemId] = !updated[itemId];
      return updated;
    });
  };
  
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    const newSelectedItems = {};
    items.forEach(item => {
      newSelectedItems[item._id] = newSelectAll;
    });
    setSelectedItems(newSelectedItems);
  };
  
  const applySelectionFilter = () => {
    const newSelectedItems = {};
    
    // Reset all selections first
    items.forEach(item => {
      newSelectedItems[item._id] = false;
    });
    
    if (selectionFilter === 'all') {
      // Select all items
      items.forEach(item => {
        newSelectedItems[item._id] = true;
      });
      setSelectAll(true);
    } else if (selectionFilter === 'category' && selectedCategory) {
      // Select items by category
      items.forEach(item => {
        if (item.categoryId && item.categoryId._id === selectedCategory) {
          newSelectedItems[item._id] = true;
        }
      });
      setSelectAll(false);
    } else if (selectionFilter === 'noCategory') {
      // Select items without category
      items.forEach(item => {
        if (!item.categoryId) {
          newSelectedItems[item._id] = true;
        }
      });
      setSelectAll(false);
    } else if (selectionFilter === 'supplier' && selectedSupplier) {
      // Select items by supplier
      items.forEach(item => {
        if (item.supplierId && item.supplierId._id === selectedSupplier) {
          newSelectedItems[item._id] = true;
        }
      });
      setSelectAll(false);
    }
    
    setSelectedItems(newSelectedItems);
  };
  
  const handleFilterChange = (e) => {
    setSelectionFilter(e.target.value);
    
    // Reset related selections
    if (e.target.value !== 'category') {
      setSelectedCategory('');
    }
    
    if (e.target.value !== 'supplier') {
      setSelectedSupplier('');
    }
  };
  
  const getSelectedItemIds = () => {
    return Object.keys(selectedItems).filter(id => selectedItems[id]);
  };
  
  // Bulk actions
  const handleBulkAction = async () => {
    const selectedIds = getSelectedItemIds();
    
    if (selectedIds.length === 0) {
      setMessage('Nessun articolo selezionato');
      return;
    }
    
    try {
      if (bulkAction === 'delete') {
        if (window.confirm(`Sei sicuro di voler eliminare ${selectedIds.length} articoli?`)) {
          // Delete selected items one by one
          for (const id of selectedIds) {
            await apiCall(`/api/items/${id}`, 'delete');
          }
          setMessage(`${selectedIds.length} articoli eliminati con successo`);
          setSelectedItems({});
          setSelectAll(false);
          fetchData();
        }
      } else if (bulkAction === 'edit') {
        if (!bulkEditField || !bulkEditValue) {
          setMessage('Seleziona un campo e inserisci un valore');
          return;
        }
        
        // Update all selected items with the new field value
        for (const id of selectedIds) {
          const updateData = { [bulkEditField]: bulkEditValue };
          await apiCall(`/api/items/${id}`, 'put', updateData);
        }
        
        setMessage(`${selectedIds.length} articoli aggiornati con successo`);
        setBulkEditField('');
        setBulkEditValue('');
        setSelectedItems({});
        setSelectAll(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setMessage('Errore durante l\'esecuzione dell\'azione di massa');
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
            <h3>{editMode ? 'Modifica Articolo' : 'Aggiungi Nuovo Articolo'}</h3>
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
                  value={itemForm.name} 
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Descrizione</label>
                <textarea 
                  className="form-control" 
                  name="description" 
                  value={itemForm.description} 
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label">Unità (es. kg, pezzi, scatole)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="unit" 
                  value={itemForm.unit} 
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Fornitore</label>
                <select 
                  className="form-select" 
                  name="supplierId" 
                  value={itemForm.supplierId} 
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
              <div className="mb-3">
                <label className="form-label">Categoria</label>
                <select 
                  className="form-select" 
                  name="categoryId" 
                  value={itemForm.categoryId} 
                  onChange={handleInputChange}
                >
                  <option value="">Seleziona una categoria...</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className={`btn ${editMode ? 'btn-warning' : 'btn-success'}`}>
                  {editMode ? 'Aggiorna Articolo' : 'Aggiungi Articolo'}
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
        {getSelectedItemIds().length > 0 && (
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h3>Azioni di Massa ({getSelectedItemIds().length} articoli selezionati)</h3>
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
                  <option value="delete">Elimina Articoli</option>
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
                      <option value="categoryId">Categoria</option>
                      <option value="supplierId">Fornitore</option>
                      <option value="unit">Unità</option>
                    </select>
                  </div>
                  
                  {bulkEditField === 'categoryId' && (
                    <div className="mb-3">
                      <label className="form-label">Nuova Categoria</label>
                      <select
                        className="form-select"
                        value={bulkEditValue}
                        onChange={(e) => setBulkEditValue(e.target.value)}
                      >
                        <option value="">Seleziona una categoria...</option>
                        {categories.map(category => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {bulkEditField === 'supplierId' && (
                    <div className="mb-3">
                      <label className="form-label">Nuovo Fornitore</label>
                      <select
                        className="form-select"
                        value={bulkEditValue}
                        onChange={(e) => setBulkEditValue(e.target.value)}
                      >
                        <option value="">Seleziona un fornitore...</option>
                        {suppliers.map(supplier => (
                          <option key={supplier._id} value={supplier._id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {bulkEditField === 'unit' && (
                    <div className="mb-3">
                      <label className="form-label">Nuova Unità</label>
                      <input
                        type="text"
                        className="form-control"
                        value={bulkEditValue}
                        onChange={(e) => setBulkEditValue(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
              
              <button
                className="btn btn-primary"
                onClick={handleBulkAction}
                disabled={!bulkAction || (bulkAction === 'edit' && (!bulkEditField || !bulkEditValue))}
              >
                Applica a {getSelectedItemIds().length} Articoli
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h3>Lista Articoli</h3>
            
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
                    <option value="category">Per Categoria</option>
                    <option value="noCategory">Senza Categoria</option>
                    <option value="supplier">Per Fornitore</option>
                  </select>
                </div>
                
                {selectionFilter === 'category' && (
                  <div className="col-md-5">
                    <select
                      className="form-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">Seleziona una categoria...</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {selectionFilter === 'supplier' && (
                  <div className="col-md-5">
                    <select
                      className="form-select"
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                    >
                      <option value="">Seleziona un fornitore...</option>
                      {suppliers.map(supplier => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="col">
                  <button
                    className="btn btn-light"
                    onClick={applySelectionFilter}
                    disabled={
                      !selectionFilter || 
                      (selectionFilter === 'category' && !selectedCategory) || 
                      (selectionFilter === 'supplier' && !selectedSupplier)
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
                  id="selectAllItems"
                />
                <label className="form-check-label text-white" htmlFor="selectAllItems">
                  Seleziona/Deseleziona Tutti
                </label>
              </div>
            </div>
          </div>
          <div className="card-body">
            {items.length === 0 ? (
              <p>Nessun articolo trovato.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th style={{width: '40px'}}></th>
                      <th>Nome</th>
                      <th>Unità</th>
                      <th>Fornitore</th>
                      <th>Categoria</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item._id}>
                        <td>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={!!selectedItems[item._id]}
                              onChange={() => toggleSelectItem(item._id)}
                            />
                          </div>
                        </td>
                        <td>{item.name}</td>
                        <td>{item.unit}</td>
                        <td>{item.supplierId?.name || 'Fornitore non disponibile'}</td>
                        <td>{item.categoryId?.name || 'Nessuna categoria'}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-warning"
                              onClick={() => handleEdit(item)}
                              title="Modifica"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(item._id)}
                              title="Elimina"
                            >
                              <i className="bi bi-trash"></i>
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

export default ItemManagement; 