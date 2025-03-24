import React, { useState, useEffect, useContext } from 'react';
import { apiCall } from '../utils/apiUtils';
import { AuthContext } from '../context/AuthContext';

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const { user } = useContext(AuthContext);
  const [inactiveCategories, setInactiveCategories] = useState([]);
  const [showInactiveCategories, setShowInactiveCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [selectedCategories, setSelectedCategories] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    try {
      const res = await apiCall('/api/categories?includeInactive=true');
      
      // Separate active and inactive categories
      const allCategories = res.data;
      setCategories(allCategories.filter(category => category.isActive !== false));
      setInactiveCategories(allCategories.filter(category => category.isActive === false));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setMessage('Errore nel caricamento delle categorie');
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      let response;
      
      if (editMode) {
        // Update existing category
        response = await apiCall(`/api/categories/${editingCategoryId}`, 'put', categoryForm);
        setMessage('Categoria aggiornata con successo!');
        setEditMode(false);
        setEditingCategoryId(null);
      } else {
        // Create new category
        response = await apiCall('/api/categories', 'post', categoryForm);
        setMessage('Categoria aggiunta con successo!');
      }
      
      // Reset form
      setCategoryForm({ name: '', description: '' });
      fetchCategories();
      
      // Switch to list tab after adding/editing
      setActiveTab('list');
    } catch (err) {
      console.error('Error saving category:', err);
      setMessage(err.response?.data?.message || 'Errore durante il salvataggio della categoria. Riprova.');
    }
  };
  
  const handleEdit = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || ''
    });
    setEditMode(true);
    setEditingCategoryId(category._id);
    
    // Switch to add/edit tab
    setActiveTab('add');
  };
  
  const handleCancel = () => {
    setCategoryForm({ name: '', description: '' });
    setEditMode(false);
    setEditingCategoryId(null);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Sei sicuro di voler eliminare questa categoria?')) {
      try {
        await apiCall(`/api/categories/${categoryId}`, 'delete');
        setMessage('Categoria eliminata con successo');
        fetchCategories();
      } catch (err) {
        console.error('Error deleting category:', err);
        // Display the specific error message from the server
        setMessage(err.response?.data?.message || 'Errore durante l\'eliminazione della categoria');
      }
    }
  };
  
  const handleSoftDelete = async (categoryId) => {
    if (window.confirm('Sei sicuro di voler disattivare questa categoria?')) {
      try {
        await apiCall(`/api/categories/${categoryId}`, 'put', { isActive: false });
        setMessage('Categoria disattivata con successo');
        fetchCategories();
      } catch (err) {
        console.error('Error disabling category:', err);
        setMessage('Errore durante la disattivazione della categoria');
      }
    }
  };
  
  const handleRestoreCategory = async (categoryId) => {
    try {
      await apiCall(`/api/categories/${categoryId}`, 'put', { isActive: true });
      setMessage('Categoria ripristinata con successo');
      fetchCategories();
    } catch (err) {
      console.error('Error restoring category:', err);
      setMessage('Errore durante il ripristino della categoria');
    }
  };
  
  const handleForceDelete = async (categoryId) => {
    if (window.confirm('ATTENZIONE: Questa azione eliminerà definitivamente la categoria. Procedere?')) {
      try {
        await apiCall(`/api/categories/${categoryId}/force`, 'delete');
        setMessage('Categoria eliminata definitivamente');
        fetchCategories();
      } catch (err) {
        console.error('Error force deleting category:', err);
        setMessage('Errore durante l\'eliminazione definitiva');
      }
    }
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const toggleSelectCategory = (categoryId, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCategories({});
    } else {
      const allSelected = {};
      filteredCategories.forEach(category => {
        allSelected[category._id] = true;
      });
      setSelectedCategories(allSelected);
    }
    setSelectAll(!selectAll);
  };
  
  const getSelectedCategoryIds = () => {
    return Object.keys(selectedCategories).filter(id => selectedCategories[id]);
  };
  
  const handleBulkAction = async (action) => {
    const selectedIds = getSelectedCategoryIds();
    if (selectedIds.length === 0) return;
    
    if (action === 'delete') {
      if (window.confirm(`Sei sicuro di voler disattivare ${selectedIds.length} categorie?`)) {
        try {
          await Promise.all(selectedIds.map(id => 
            apiCall(`/api/categories/${id}`, 'put', { isActive: false })
          ));
          setMessage(`${selectedIds.length} categorie disattivate con successo`);
          setSelectedCategories({});
          setSelectAll(false);
          fetchCategories();
        } catch (err) {
          console.error('Error disabling categories:', err);
          setMessage('Errore durante la disattivazione delle categorie');
        }
      }
    }
  };
  
  // Filter categories based on search term
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredInactiveCategories = inactiveCategories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  return (
    <div className="container-fluid px-0">
      {message && (
        <div className={`alert ${message.includes('successo') ? 'alert-success' : 'alert-danger'} alert-dismissible fade show mb-3`}>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}
      
      {/* Tabs Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'list' ? 'active' : ''}`} 
            onClick={() => setActiveTab('list')}
          >
            <i className="bi bi-list-ul me-2"></i>
            Lista Categorie
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'add' ? 'active' : ''}`} 
            onClick={() => {
              setActiveTab('add');
              if (editMode) {
                handleCancel();
              }
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            {editMode ? 'Modifica Categoria' : 'Aggiungi Categoria'}
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'inactive' ? 'active' : ''}`} 
            onClick={() => setActiveTab('inactive')}
          >
            <i className="bi bi-archive me-2"></i>
            Categorie Disattivate
            {inactiveCategories.length > 0 && (
              <span className="badge bg-danger ms-2">{inactiveCategories.length}</span>
            )}
          </button>
        </li>
      </ul>
      
      {/* List Categories Tab */}
      {activeTab === 'list' && (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Categorie</h4>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-success"
                  onClick={() => setActiveTab('add')}
                >
                  <i className="bi bi-plus-circle me-1"></i> Nuova Categoria
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-6">
                {/* Search */}
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-search"></i></span>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Cerca categorie..." 
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  {searchTerm && (
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
                <small className="text-muted">
                  {searchTerm ? 
                    `${filteredCategories.length} risultati trovati per "${searchTerm}"` : 
                    `${categories.length} categorie totali`
                  }
                </small>
              </div>
              
              {/* Bulk action controls */}
              {getSelectedCategoryIds().length > 0 && (
                <div className="col-md-6">
                  <div className="alert alert-info mb-0 d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{getSelectedCategoryIds().length} categorie selezionate</strong>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleBulkAction('delete')}
                      >
                        <i className="bi bi-archive me-1"></i> Disattiva
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setSelectedCategories({});
                          setSelectAll(false);
                        }}
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Table of categories */}
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "40px" }}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          id="selectAllCategories"
                        />
                      </div>
                    </th>
                    <th>Nome</th>
                    <th>Descrizione</th>
                    <th className="text-end">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-3 text-muted">
                        {searchTerm ? 
                          `Nessuna categoria trovata per "${searchTerm}"` : 
                          "Nessuna categoria disponibile"
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map(category => (
                      <tr 
                        key={category._id} 
                        onClick={(e) => toggleSelectCategory(category._id, e)}
                        style={{ 
                          cursor: 'pointer', 
                          backgroundColor: selectedCategories[category._id] ? '#e9ecef' : 'inherit' 
                        }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={!!selectedCategories[category._id]}
                              onChange={(e) => toggleSelectCategory(category._id, e)}
                            />
                          </div>
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '200px' }} title={category.name}>
                            {category.name}
                          </div>
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '300px' }} title={category.description || ''}>
                            {category.description || <span className="text-muted">-</span>}
                          </div>
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(category);
                              }}
                              title="Modifica"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSoftDelete(category._id);
                              }}
                              title="Disattiva"
                            >
                              <i className="bi bi-archive"></i>
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
      )}
      
      {/* Add/Edit Category Tab */}
      {activeTab === 'add' && (
        <div className="card">
          <div className={`card-header ${editMode ? 'bg-warning' : 'bg-success'} text-white`}>
            <h4 className="mb-0">{editMode ? 'Modifica Categoria' : 'Aggiungi Nuova Categoria'}</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nome</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="name" 
                  value={categoryForm.name} 
                  onChange={handleInputChange}
                  required
                  placeholder="Inserisci il nome della categoria"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Descrizione <span className="text-muted">(opzionale)</span></label>
                <textarea 
                  className="form-control" 
                  name="description" 
                  value={categoryForm.description} 
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Inserisci una descrizione opzionale"
                ></textarea>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className={`btn ${editMode ? 'btn-warning' : 'btn-success'}`}>
                  {editMode ? 'Aggiorna Categoria' : 'Crea Categoria'}
                </button>
                {editMode && (
                  <button type="button" className="btn btn-outline-secondary" onClick={handleCancel}>
                    Annulla
                  </button>
                )}
                <button type="button" className="btn btn-outline-secondary ms-auto" onClick={() => setActiveTab('list')}>
                  Torna alla Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Inactive Categories Tab */}
      {activeTab === 'inactive' && (
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h4 className="mb-0">Categorie Disattivate</h4>
          </div>
          <div className="card-body">
            {inactiveCategories.length === 0 ? (
              <div className="alert alert-info">
                Non ci sono categorie disattivate.
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Cerca categorie disattivate..." 
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    {searchTerm && (
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button"
                        onClick={() => setSearchTerm('')}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                  <small className="text-muted">
                    {searchTerm ? 
                      `${filteredInactiveCategories.length} risultati trovati per "${searchTerm}"` : 
                      `${inactiveCategories.length} categorie disattivate`
                    }
                  </small>
                </div>
                
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Nome</th>
                        <th>Descrizione</th>
                        <th className="text-end">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInactiveCategories.map(category => (
                        <tr key={category._id}>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '200px' }} title={category.name}>
                              {category.name}
                            </div>
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '300px' }} title={category.description || ''}>
                              {category.description || <span className="text-muted">-</span>}
                            </div>
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-success"
                                onClick={() => handleRestoreCategory(category._id)}
                                title="Ripristina"
                              >
                                <i className="bi bi-arrow-counterclockwise"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleForceDelete(category._id)}
                                title="Elimina definitivamente"
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryManagement; 