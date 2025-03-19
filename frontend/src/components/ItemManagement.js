import React, { useState, useEffect, useContext, useRef } from 'react';
import { apiCall } from '../utils/apiUtils';
import { AuthContext } from '../context/AuthContext';
import Papa from 'papaparse';

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
  const [lastSelectedItemId, setLastSelectedItemId] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [importedNames, setImportedNames] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedImportSupplier, setSelectedImportSupplier] = useState('');
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const [bulkItemText, setBulkItemText] = useState('');
  const [processingImport, setProcessingImport] = useState(false);
  const [bulkUnit, setBulkUnit] = useState('');
  const [bulkSupplierId, setBulkSupplierId] = useState('');
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [showInactiveItems, setShowInactiveItems] = useState(false);
  const [inactiveItems, setInactiveItems] = useState([]);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [itemsRes, suppliersRes, categoriesRes] = await Promise.all([
        apiCall('/api/items?includeInactive=true'),
        apiCall('/api/suppliers'),
        apiCall('/api/categories')
      ]);
      
      // Detailed logging to debug the isActive field
      console.log("All items from API:", itemsRes.data);
      console.log("Sample item structure:", itemsRes.data.length > 0 ? 
        JSON.stringify(itemsRes.data[0], null, 2) : "No items returned");
      console.log("isActive fields present in items:", 
        itemsRes.data.map(item => ({id: item._id, name: item.name, isActive: item.isActive})));
      
      // Separate active and inactive items
      const allItems = itemsRes.data;
      const activeItems = allItems.filter(item => item.isActive !== false);
      const inactiveItems = allItems.filter(item => item.isActive === false);
      
      console.log(`Active items count: ${activeItems.length}`);
      console.log(`Inactive items count: ${inactiveItems.length}`);
      
      setItems(activeItems);
      setInactiveItems(inactiveItems);
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
  
  const checkItemUsage = async (itemId) => {
    try {
      // You could create a new endpoint to check if an item can be deleted
      const result = await apiCall(`/api/items/${itemId}/canDelete`, 'get');
      return { canDelete: true };
    } catch (err) {
      return { 
        canDelete: false, 
        reason: "Questo articolo è probabilmente in uso negli ordini e non può essere eliminato."
      };
    }
  };
  
  const handleDelete = async (itemId) => {
    try {
      // First check if the item can be deleted
      const { canDelete, reason } = await checkItemUsage(itemId);
      
      if (!canDelete) {
        setMessage(reason || "Impossibile eliminare: questo articolo è in uso");
        return;
      }
      
      if (window.confirm('Sei sicuro di voler eliminare questo articolo?')) {
        try {
          await apiCall(`/api/items/${itemId}`, 'delete');
          setMessage('Articolo eliminato con successo');
          fetchData();
        } catch (err) {
          // Your existing error handling
          console.error('Error deleting item:', err);
          
          // More specific error messaging
          if (err.response) {
            if (err.response.status === 400) {
              setMessage('Impossibile eliminare: questo articolo è in uso negli ordini');
            } else if (err.response.status === 403) {
              setMessage('Non hai i permessi per eliminare questo articolo');
            } else {
              setMessage(`Errore durante l'eliminazione: ${err.response.data.message || 'Errore sconosciuto'}`);
            }
          } else {
            setMessage('Errore durante l\'eliminazione dell\'articolo');
          }
        }
      }
    } catch (err) {
      setMessage('Errore durante la verifica dell\'articolo');
    }
  };
  
  // Bulk selection handlers
  const toggleSelectItem = (itemId, event) => {
    // Handle keyboard modifiers
    if (event) {
      // Control/Command key for toggling individual selections
      if (event.ctrlKey || event.metaKey) {
        setSelectedItems(prev => {
          const updated = { ...prev };
          updated[itemId] = !updated[itemId];
          return updated;
        });
        setLastSelectedItemId(itemId);
        return;
      }
      
      // Shift key for range selection
      if (event.shiftKey && lastSelectedItemId) {
        const itemIds = items.map(item => item._id);
        const currentIndex = itemIds.indexOf(itemId);
        const lastIndex = itemIds.indexOf(lastSelectedItemId);
        
        if (currentIndex !== -1 && lastIndex !== -1) {
          const startIndex = Math.min(currentIndex, lastIndex);
          const endIndex = Math.max(currentIndex, lastIndex);
          const itemsInRange = itemIds.slice(startIndex, endIndex + 1);
          
          setSelectedItems(prev => {
            const updated = { ...prev };
            itemsInRange.forEach(id => {
              updated[id] = true;
            });
            return updated;
          });
          return;
        }
      }
    }
    
    // Default behavior (no modifiers) - toggle single item
    setSelectedItems(prev => {
      const updated = { ...prev };
      updated[itemId] = !updated[itemId];
      return updated;
    });
    setLastSelectedItemId(itemId);
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
  
  // Modified state to handle the simplified import process
  const handleCsvParse = () => {
    if (!csvFile) {
      setMessage('Seleziona un file CSV da caricare');
      return;
    }
    
    console.log("Parsing CSV file:", csvFile); // Add debugging
    
    Papa.parse(csvFile, {
      skipEmptyLines: true,
      complete: (results) => {
        console.log("Parse results:", results); // Add debugging
        
        // Extract names from the parsed data (assuming one column)
        const names = results.data
          .flat() // Flatten in case there are multiple columns
          .filter(name => name && name.trim()) // Remove empty entries
          .map(name => name.trim()); // Clean up whitespace
        
        console.log("Extracted names:", names); // Add debugging
        
        if (names.length === 0) {
          setMessage('Nessun nome valido trovato nel file');
          return;
        }
        
        // Store the imported names and show the supplier selection modal
        setImportedNames(names);
        setShowSupplierModal(true);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setMessage('Errore durante la lettura del file');
      }
    });
  };
  
  // Function to actually import the items after supplier is selected
  const handleImportWithSupplier = async () => {
    if (!selectedImportSupplier) {
      setMessage('Seleziona un fornitore per continuare');
      return;
    }
    
    try {
      setProcessingImport(true);
      
      // Create items with the selected supplier
      let successCount = 0;
      
      for (const name of importedNames) {
        try {
          const itemData = {
            name: name,
            supplierId: selectedImportSupplier,
            // Leave unit and category blank/null
            unit: '',
            categoryId: ''
          };
          
          await apiCall('/api/items', 'post', itemData);
          successCount++;
        } catch (err) {
          console.error('Error adding item:', name, err);
        }
      }
      
      // Show results and reset
      setMessage(`Importazione completata: ${successCount} articoli aggiunti su ${importedNames.length}`);
      fetchData();
      
      // Reset the import state
      setImportedNames([]);
      setShowSupplierModal(false);
      setSelectedImportSupplier('');
      setBulkItemText('');
      
    } catch (err) {
      console.error('Error during import:', err);
      setMessage('Errore durante l\'importazione');
    } finally {
      setProcessingImport(false);
    }
  };
  
  // Function to cancel the import
  const cancelImport = () => {
    setImportedNames([]);
    setShowSupplierModal(false);
    setSelectedImportSupplier('');
    // Don't clear the text area in case they want to try again
  };
  
  const handleBulkAdd = () => {
    console.log("Button clicked!");
    
    const itemNames = bulkItemText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);
    
    console.log("Item names:", itemNames);
      
    if (itemNames.length === 0) {
      setMessage('Inserisci almeno un nome articolo');
      return;
    }
    
    // Store names and show modal
    setImportedNames(itemNames);
    setShowSupplierModal(true);
    console.log("Supplier modal should be visible now");
  };
  
  const handleBulkAddWithForm = async () => {
    const itemNames = bulkItemText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);
    
    if (itemNames.length === 0) {
      setMessage('Inserisci almeno un nome articolo');
      return;
    }
    
    try {
      setProcessingImport(true);
      setMessage('');
      
      // Prepare the common data for all items
      const commonData = {
        unit: bulkUnit,
        supplierId: bulkSupplierId || '',
        categoryId: bulkCategoryId || ''
      };
      
      // Create items one by one
      let successCount = 0;
      
      for (const name of itemNames) {
        try {
          const itemData = {
            name: name,
            ...commonData
          };
          
          await apiCall('/api/items', 'post', itemData);
          successCount++;
        } catch (err) {
          console.error('Error adding item:', name, err);
        }
      }
      
      // Show results and reset
      setMessage(`Importazione completata: ${successCount} articoli aggiunti su ${itemNames.length}`);
      fetchData();
      
      // Reset the form
      setBulkItemText('');
      
    } catch (err) {
      console.error('Error during import:', err);
      setMessage('Errore durante l\'importazione');
    } finally {
      setProcessingImport(false);
    }
  };
  
  // Add soft delete function
  const handleSoftDelete = async (itemId) => {
    if (window.confirm('Sei sicuro di voler disattivare questo articolo? Non sarà più disponibile per nuovi ordini.')) {
      try {
        // Instead of deleting, we're updating the item to mark it as inactive
        const response = await apiCall(`/api/items/${itemId}`, 'put', { isActive: false });
        console.log("Soft delete response:", response);
        setMessage('Articolo disattivato con successo');
        
        // Move the item from active to inactive list immediately in UI
        const item = items.find(i => i._id === itemId);
        if (item) {
          setItems(items.filter(i => i._id !== itemId));
          setInactiveItems([...inactiveItems, {...item, isActive: false}]);
        }
        
        // Then refresh from server
        fetchData();
      } catch (err) {
        console.error('Error disabling item:', err);
        setMessage('Errore durante la disattivazione dell\'articolo');
      }
    }
  };
  
  // Add restore function
  const handleRestoreItem = async (itemId) => {
    try {
      const response = await apiCall(`/api/items/${itemId}`, 'put', { isActive: true });
      console.log("Restore item response:", response);
      setMessage('Articolo ripristinato con successo');
      
      // Move the item from inactive to active list immediately in UI
      const item = inactiveItems.find(i => i._id === itemId);
      if (item) {
        setInactiveItems(inactiveItems.filter(i => i._id !== itemId));
        setItems([...items, {...item, isActive: true}]);
      }
      
      // Then refresh from server
      fetchData();
    } catch (err) {
      console.error('Error restoring item:', err);
      setMessage('Errore durante il ripristino dell\'articolo');
    }
  };
  
  // Add force delete function
  const handleForceDelete = async (itemId) => {
    if (window.confirm('ATTENZIONE: Questa azione eliminerà definitivamente l\'articolo. Procedere?')) {
      try {
        const response = await apiCall(`/api/items/${itemId}/force`, 'delete');
        console.log("Force delete response:", response);
        setMessage('Articolo eliminato definitivamente');
        
        // Remove from inactive items list immediately
        setInactiveItems(inactiveItems.filter(i => i._id !== itemId));
        
        // Then refresh from server
        fetchData();
      } catch (err) {
        console.error('Error force deleting item:', err);
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
        
        <div className="card mt-4">
          <div className="card-header bg-secondary text-white">
            <h3>Aggiungi Articoli in Blocco</h3>
          </div>
          <div className="card-body">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleBulkAddWithForm();
            }}>
              <div className="mb-3">
                <label className="form-label">Nomi Articoli (uno per riga)</label>
                <textarea 
                  className="form-control" 
                  rows="10" 
                  value={bulkItemText}
                  onChange={(e) => setBulkItemText(e.target.value)}
                  placeholder="CONIGLIO INTERO&#10;STRACCIATELLA PROD. FAIC VS&#10;CROCHETTE PATATE MIGNON&#10;..."
                  required
                ></textarea>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Unità (es. kg, pezzi, scatole)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="bulkUnit" 
                  value={bulkUnit} 
                  onChange={(e) => setBulkUnit(e.target.value)}
                />
                <div className="form-text">Opzionale - sarà applicata a tutti gli articoli</div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Fornitore</label>
                <select 
                  className="form-select" 
                  value={bulkSupplierId}
                  onChange={(e) => setBulkSupplierId(e.target.value)}
                >
                  <option value="">Nessun fornitore</option>
                  {suppliers.map(supplier => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <div className="form-text">Opzionale - sarà applicato a tutti gli articoli</div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Categoria</label>
                <select 
                  className="form-select"
                  value={bulkCategoryId}
                  onChange={(e) => setBulkCategoryId(e.target.value)}
                >
                  <option value="">Nessuna categoria</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="form-text">Opzionale - sarà applicata a tutti gli articoli</div>
              </div>
              
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={!bulkItemText.trim() || processingImport}
              >
                {processingImport ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Importazione...
                  </>
                ) : (
                  'Aggiungi Articoli'
                )}
              </button>
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
            <div className="card mb-4">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h3>{showInactiveItems ? 'Articoli Disattivati' : 'Lista Articoli'}</h3>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => setShowInactiveItems(!showInactiveItems)}
                >
                  {showInactiveItems ? 'Mostra Articoli Attivi' : 'Mostra Articoli Disattivati'}
                </button>
              </div>
              <div className="card-body">
                {showInactiveItems ? (
                  inactiveItems.length === 0 ? (
                    <p>Nessun articolo disattivato.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Unità</th>
                            <th>Fornitore</th>
                            <th>Categoria</th>
                            <th>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inactiveItems.map(item => (
                            <tr key={item._id} style={{ backgroundColor: '#f8d7da' }}>
                              <td>{item.name}</td>
                              <td>{item.unit}</td>
                              <td>{item.supplierId?.name || 'Fornitore non disponibile'}</td>
                              <td>{item.categoryId?.name || 'Nessuna categoria'}</td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-success"
                                    onClick={() => handleRestoreItem(item._id)}
                                  >
                                    Ripristina
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleForceDelete(item._id)}
                                  >
                                    Elimina Definitivamente
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
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
                          <tr 
                            key={item._id} 
                            onClick={(e) => toggleSelectItem(item._id, e)}
                            style={{ cursor: 'pointer', backgroundColor: selectedItems[item._id] ? '#e9ecef' : 'inherit' }}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={!!selectedItems[item._id]}
                                  onChange={(e) => toggleSelectItem(item._id, e)}
                                />
                              </div>
                            </td>
                            <td>{item.name}</td>
                            <td>{item.unit}</td>
                            <td>{item.supplierId?.name || 'Fornitore non disponibile'}</td>
                            <td>{item.categoryId?.name || 'Nessuna categoria'}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-warning"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(item);
                                  }}
                                >
                                  Modifica
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSoftDelete(item._id);
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
      </div>
    </div>
  );
}

export default ItemManagement; 