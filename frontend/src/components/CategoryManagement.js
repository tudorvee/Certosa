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
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card mb-4">
          <div className={`card-header ${editMode ? 'bg-warning' : 'bg-success'} text-white`}>
            <h3>{editMode ? 'Modifica Categoria' : 'Aggiungi Nuova Categoria'}</h3>
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
                  value={categoryForm.name} 
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Descrizione</label>
                <textarea 
                  className="form-control" 
                  name="description" 
                  value={categoryForm.description} 
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className={`btn ${editMode ? 'btn-warning' : 'btn-success'}`}>
                  {editMode ? 'Aggiorna Categoria' : 'Aggiungi Categoria'}
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
      </div>
      
      <div className="col-md-6">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h3>Lista Categorie</h3>
          </div>
          <div className="card-body">
            {categories.length === 0 ? (
              <p>Nessuna categoria trovata.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Descrizione</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(category => (
                      <tr key={category._id}>
                        <td>{category.name}</td>
                        <td>{category.description || '-'}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-warning"
                              onClick={() => handleEdit(category)}
                              title="Modifica"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(category._id)}
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

export default CategoryManagement; 