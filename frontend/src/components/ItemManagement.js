import React, { useState, useEffect, useContext, useRef } from 'react';
import { apiCall } from '../utils/apiUtils';
import { AuthContext } from '../context/AuthContext';
import Papa from 'papaparse';

// Animation styles
const modalAnimationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

function ItemManagement() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemForm, setItemForm] = useState({
    name: '', 
    description: '', 
    unit: '', 
    supplierId: '',
    categoryId: '',
    activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
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
  const [bulkActiveDays, setBulkActiveDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
  const [showInactiveItems, setShowInactiveItems] = useState(false);
  const [inactiveItems, setInactiveItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempViewActive, setTempViewActive] = useState(false);
  const [tempViewCriteria, setTempViewCriteria] = useState({
    type: '', // 'category', 'supplier', 'noCategory'
    value: '' // category or supplier ID
  });
  
  // Add state for active tab
  const [activeTab, setActiveTab] = useState('list');
  
  // Add days of week array
  const daysOfWeek = [
    { id: 'monday', label: 'Lunedì' },
    { id: 'tuesday', label: 'Martedì' },
    { id: 'wednesday', label: 'Mercoledì' },
    { id: 'thursday', label: 'Giovedì' },
    { id: 'friday', label: 'Venerdì' },
    { id: 'saturday', label: 'Sabato' },
    { id: 'sunday', label: 'Domenica' }
  ];
  
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
        setShowEditModal(false);
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
        categoryId: '',
        activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      });
      
      // Refresh data
      fetchData();
      
      // Switch to list tab after adding/editing
      setActiveTab('list');
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
      categoryId: item.categoryId?._id || '',
      activeDays: item.activeDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    });
    setEditMode(true);
    setEditingItemId(item._id);
    setShowEditModal(true);
  };
  
  const handleCancel = () => {
    setItemForm({ 
      name: '', 
      description: '', 
      unit: '', 
      supplierId: '',
      categoryId: '',
      activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    });
    setEditMode(false);
    setEditingItemId(null);
    setShowEditModal(false);
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
          console.error('Error deleting item:', err);
          
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
    if (selectAll) {
      // If already all selected, deselect all
      setSelectedItems({});
    } else {
      // Select all current filtered items
      const newSelectedItems = {};
      items.forEach(item => {
        newSelectedItems[item._id] = true;
      });
      setSelectedItems(newSelectedItems);
    }
    setSelectAll(!selectAll);
  };
  
  const applySelectionFilter = () => {
    // Instead of immediately selecting items, create a temporary view
    if (selectionFilter === 'all') {
      // No need for a temp view - just select all items
      const newSelectedItems = {};
      items.forEach(item => {
        newSelectedItems[item._id] = true;
      });
      setSelectedItems(newSelectedItems);
      const allSelected = items.every(item => newSelectedItems[item._id]);
      setSelectAll(allSelected);
      // Clear any existing temp view
      setTempViewActive(false);
      setTempViewCriteria({ type: '', value: '' });
    }
    else if (selectionFilter === 'category' && selectedCategory) {
      // Create a temporary view for this category
      setTempViewActive(true);
      setTempViewCriteria({ 
        type: 'category', 
        value: selectedCategory 
      });
      // Reset any previous selection
      setSelectedItems({});
      setSelectAll(false);
    }
    else if (selectionFilter === 'noCategory') {
      // Create a temporary view for items without a category
      setTempViewActive(true);
      setTempViewCriteria({ 
        type: 'noCategory', 
        value: '' 
      });
      // Reset any previous selection
      setSelectedItems({});
      setSelectAll(false);
    }
    else if (selectionFilter === 'supplier' && selectedSupplier) {
      // Create a temporary view for this supplier
      setTempViewActive(true);
      setTempViewCriteria({ 
        type: 'supplier', 
        value: selectedSupplier 
      });
      // Reset any previous selection
      setSelectedItems({});
      setSelectAll(false);
    }
  };
  
  const clearTempView = () => {
    setTempViewActive(false);
    setTempViewCriteria({ type: '', value: '' });
  };
  
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSelectionFilter(value);
    
    // Reset category/supplier selection when filter changes
    if (value !== 'category') setSelectedCategory('');
    if (value !== 'supplier') setSelectedSupplier('');
  };
  
  const getSelectedItemIds = () => {
    return Object.keys(selectedItems).filter(id => selectedItems[id]);
  };
  
  const handleBulkAction = async () => {
    const selectedIds = getSelectedItemIds();
    if (selectedIds.length === 0) return;
    
    if (bulkAction === 'delete') {
      if (window.confirm(`Sei sicuro di voler disattivare ${selectedIds.length} articoli?`)) {
        try {
          console.log(`Attempting to soft-delete ${selectedIds.length} items`);
          
          // Perform each request sequentially to avoid overwhelming the server
          for (const id of selectedIds) {
            await apiCall(`/api/items/${id}/soft-delete`, 'put', {});
          }
          
          setMessage(`${selectedIds.length} articoli disattivati con successo`);
          setSelectedItems({});
          setSelectAll(false);
          fetchData();
        } catch (err) {
          console.error('Error performing bulk soft-delete:', err);
          setMessage(`Errore durante la disattivazione degli articoli: ${err.message || 'Errore sconosciuto'}`);
        }
      }
    } else if (bulkAction === 'edit' && bulkEditField && bulkEditValue) {
      try {
        console.log(`Attempting to bulk edit ${selectedIds.length} items`);
        
        // Prepare the update data
        const updateData = {};
        if (bulkEditField === 'activeDays') {
          updateData.activeDays = JSON.parse(bulkEditValue);
        } else {
          updateData[bulkEditField] = bulkEditValue;
        }
        
        // Update all selected items
        await Promise.all(
          selectedIds.map(id => apiCall(`/api/items/${id}`, 'put', updateData))
        );
        
        setMessage(`${selectedIds.length} articoli aggiornati con successo`);
        fetchData();
      } catch (err) {
        console.error('Error performing bulk edit:', err);
        setMessage(`Errore durante l'aggiornamento degli articoli: ${err.message || 'Errore sconosciuto'}`);
      }
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
    if (!bulkItemText || !bulkUnit || !bulkSupplierId) {
      setMessage('Compila tutti i campi obbligatori');
      return;
    }

    try {
      setProcessingImport(true);
      setMessage('');

      // Split items by newline and filter out empty lines
      const itemNames = bulkItemText
        .split('\n')
        .map(name => name.trim())
        .filter(name => name);

      if (itemNames.length === 0) {
        setMessage('Inserisci almeno un articolo');
        return;
      }

      // Create items array
      const items = itemNames.map(name => ({
        name,
        unit: bulkUnit,
        supplierId: bulkSupplierId,
        categoryId: bulkCategoryId || undefined,
        activeDays: bulkActiveDays
      }));

      // Send request to create items
      const response = await apiCall('/api/items/bulk', 'post', { items });
      
      // Reset form
      setBulkItemText('');
      setBulkUnit('');
      setBulkSupplierId('');
      setBulkCategoryId('');
      setBulkActiveDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
      
      // Refresh data and show success message
      await fetchData();
      setMessage(`${response.data.length} articoli aggiunti con successo!`);
      
    } catch (error) {
      console.error('Error adding bulk items:', error);
      setMessage('Errore durante l\'aggiunta degli articoli. Riprova.');
    } finally {
      setProcessingImport(false);
    }
  };
  
  // Add soft delete function
  const handleSoftDelete = async (itemId) => {
    if (window.confirm('Sei sicuro di voler disattivare questo articolo?')) {
      try {
        console.log(`Attempting soft delete for item: ${itemId}`);
        const response = await apiCall(`/api/items/${itemId}/soft-delete`, 'put', {});
        console.log('Soft delete response:', response);
        setMessage('Articolo disattivato con successo');
        fetchData();
      } catch (err) {
        console.error('Error soft deleting item:', err);
        setMessage(`Errore durante la disattivazione dell'articolo: ${err.message || 'Errore sconosciuto'}`);
      }
    }
  };
  
  // Add restore function
  const handleRestoreItem = async (itemId) => {
    try {
      console.log(`Attempting to restore item: ${itemId}`);
      const response = await apiCall(`/api/items/${itemId}/restore`, 'put', {});
      console.log('Restore response:', response);
      setMessage('Articolo ripristinato con successo');
      fetchData();
    } catch (err) {
      console.error('Error restoring item:', err);
      setMessage(`Errore durante il ripristino dell'articolo: ${err.message || 'Errore sconosciuto'}`);
    }
  };
  
  // Add force delete function
  const handleForceDelete = async (itemId) => {
    if (window.confirm('Sei sicuro di voler eliminare definitivamente questo articolo? Questa azione non può essere annullata.')) {
      try {
        console.log(`Attempting force delete for item: ${itemId}`);
        const response = await apiCall(`/api/items/${itemId}/force-delete`, 'delete');
        console.log('Force delete response:', response);
        setMessage('Articolo eliminato definitivamente');
        fetchData();
      } catch (err) {
        console.error('Error force deleting item:', err);
        setMessage(`Errore durante l'eliminazione definitiva: ${err.message || 'Errore sconosciuto'}`);
      }
    }
  };

  // New function to handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter items based on search term and filters
  const filteredItems = items.filter(item => {
    // First check if we're showing only selected items
    if (showOnlySelected && !selectedItems[item._id]) {
      return false;
    }
    
    // Then check if we have an active temporary view
    if (tempViewActive) {
      if (tempViewCriteria.type === 'category') {
        if (!item.categoryId || item.categoryId._id !== tempViewCriteria.value) {
          return false;
        }
      } else if (tempViewCriteria.type === 'noCategory') {
        if (item.categoryId) {
          return false;
        }
      } else if (tempViewCriteria.type === 'supplier') {
        if (!item.supplierId || item.supplierId._id !== tempViewCriteria.value) {
          return false;
        }
      }
    }
    
    // Then apply text search filter
    return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.supplierId?.name && item.supplierId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.categoryId?.name && item.categoryId.name.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  const handleDayToggle = (day) => {
    setItemForm(prev => ({
      ...prev,
      activeDays: prev.activeDays.includes(day) 
        ? prev.activeDays.filter(d => d !== day)
        : [...prev.activeDays, day]
    }));
  };
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  return (
    <div className="container-fluid px-0">
      {/* Add the style tag for animations */}
      <style>{modalAnimationStyles}</style>
      
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
            onClick={() => {
              setActiveTab('list');
              // We don't clear the temporary view when going to the list tab
              // as that's where the temporary view is shown
            }}
          >
            <i className="bi bi-list-ul me-2"></i>
            Lista Articoli
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
              // Clear temporary view when switching tabs
              clearTempView();
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            {editMode ? 'Modifica Articolo' : 'Aggiungi Articolo'}
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'bulk' ? 'active' : ''}`} 
            onClick={() => {
              setActiveTab('bulk');
              // Clear temporary view when switching tabs
              clearTempView();
            }}
          >
            <i className="bi bi-collection-plus me-2"></i>
            Aggiungi in Blocco
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'inactive' ? 'active' : ''}`} 
            onClick={() => {
              setActiveTab('inactive');
              // Clear temporary view when switching tabs
              clearTempView();
            }}
          >
            <i className="bi bi-archive me-2"></i>
            Articoli Disattivati
            {inactiveItems.length > 0 && (
              <span className="badge bg-danger ms-2">{inactiveItems.length}</span>
            )}
          </button>
        </li>
      </ul>
      
      {/* List Articles Tab */}
      {activeTab === 'list' && (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Articoli</h4>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-success"
                  onClick={() => setActiveTab('add')}
                >
                  <i className="bi bi-plus-circle me-1"></i> Nuovo Articolo
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
                    placeholder="Cerca articoli..." 
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
                    `${filteredItems.length} risultati trovati per "${searchTerm}"` : 
                    `${filteredItems.length} articoli ${showOnlySelected ? 'selezionati' : 'totali'}`
                  }
                </small>
                
                {/* Toggle button for showing only selected items */}
                {Object.keys(selectedItems).filter(id => selectedItems[id]).length > 0 && (
                  <div className="mt-2">
                    <button
                      className={`btn btn-sm ${showOnlySelected ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setShowOnlySelected(!showOnlySelected)}
                    >
                      {showOnlySelected ? (
                        <>
                          <i className="bi bi-eye"></i> Mostra Tutti
                        </>
                      ) : (
                        <>
                          <i className="bi bi-eye-fill"></i> Mostra Solo Selezionati ({Object.keys(selectedItems).filter(id => selectedItems[id]).length})
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <div className="row g-2">
                  <div className="col-md-5">
                    <select
                      className="form-select"
                      value={selectionFilter}
                      onChange={handleFilterChange}
                    >
                      <option value="">Crea Vista Temporanea...</option>
                      <option value="all">Seleziona Tutti</option>
                      <option value="category">Per Categoria</option>
                      <option value="noCategory">Senza Categoria</option>
                      <option value="supplier">Per Fornitore</option>
                    </select>
                  </div>
                  
                  {selectionFilter === 'category' && (
                    <div className="col-md-4">
                      <select
                        className="form-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="">Seleziona...</option>
                        {categories.map(category => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {selectionFilter === 'supplier' && (
                    <div className="col-md-4">
                      <select
                        className="form-select"
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                      >
                        <option value="">Seleziona...</option>
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
                      className="btn btn-primary w-100"
                      onClick={applySelectionFilter}
                      disabled={
                        !selectionFilter || 
                        (selectionFilter === 'category' && !selectedCategory) || 
                        (selectionFilter === 'supplier' && !selectedSupplier)
                      }
                    >
                      {selectionFilter === 'all' ? 'Seleziona Tutti' : 'Crea Vista'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Temporary View Banner */}
            {tempViewActive && (
              <div className="alert alert-info mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Vista Temporanea: </strong> 
                    {tempViewCriteria.type === 'category' && (
                      <>Articoli nella categoria <span className="badge bg-secondary">{categories.find(c => c._id === tempViewCriteria.value)?.name}</span></>
                    )}
                    {tempViewCriteria.type === 'noCategory' && (
                      <>Articoli senza categoria</>
                    )}
                    {tempViewCriteria.type === 'supplier' && (
                      <>Articoli del fornitore <span className="badge bg-secondary">{suppliers.find(s => s._id === tempViewCriteria.value)?.name}</span></>
                    )}
                    <span className="ms-2">({filteredItems.length} articoli)</span>
                  </div>
                  <div>
                    <button 
                      className="btn btn-outline-secondary btn-sm me-2"
                      onClick={clearTempView}
                    >
                      <i className="bi bi-x"></i> Chiudi Vista
                    </button>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        // Select all items in the temporary view
                        const newSelectedItems = {};
                        filteredItems.forEach(item => {
                          newSelectedItems[item._id] = true;
                        });
                        setSelectedItems(newSelectedItems);
                        // Keep the view active
                      }}
                    >
                      <i className="bi bi-check-all"></i> Seleziona Tutti
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bulk Actions Panel - only show when items are selected */}
            {getSelectedItemIds().length > 0 && (
              <div className="alert alert-info mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{getSelectedItemIds().length} articoli selezionati</strong>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 'auto' }}
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                    >
                      <option value="">Azione...</option>
                      <option value="delete">Disattiva</option>
                      <option value="edit">Modifica</option>
                    </select>
                    
                    {bulkAction === 'edit' && (
                      <>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: 'auto' }}
                          value={bulkEditField}
                          onChange={(e) => {
                            setBulkEditField(e.target.value);
                            // Initialize bulkEditValue for activeDays
                            if (e.target.value === 'activeDays') {
                              setBulkEditValue(JSON.stringify([]));
                            } else {
                              setBulkEditValue('');
                            }
                          }}
                        >
                          <option value="">Campo...</option>
                          <option value="categoryId">Categoria</option>
                          <option value="supplierId">Fornitore</option>
                          <option value="unit">Unità</option>
                          <option value="activeDays">Giorni di disponibilità</option>
                        </select>
                        
                        {bulkEditField === 'categoryId' && (
                          <select
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                            value={bulkEditValue}
                            onChange={(e) => setBulkEditValue(e.target.value)}
                          >
                            <option value="">Categoria...</option>
                            {categories.map(category => (
                              <option key={category._id} value={category._id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {bulkEditField === 'activeDays' && (
                          <div className="d-flex flex-wrap gap-2">
                            {daysOfWeek.map(day => (
                              <div key={day.id} className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`bulk-edit-day-${day.id}`}
                                  checked={bulkEditValue ? JSON.parse(bulkEditValue).includes(day.id) : false}
                                  onChange={() => {
                                    const currentDays = bulkEditValue ? JSON.parse(bulkEditValue) : [];
                                    const newDays = currentDays.includes(day.id)
                                      ? currentDays.filter(d => d !== day.id)
                                      : [...currentDays, day.id];
                                    setBulkEditValue(JSON.stringify(newDays));
                                  }}
                                />
                                <label className="form-check-label" htmlFor={`bulk-edit-day-${day.id}`}>
                                  {day.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {bulkEditField === 'supplierId' && (
                          <select
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                            value={bulkEditValue}
                            onChange={(e) => setBulkEditValue(e.target.value)}
                          >
                            <option value="">Fornitore...</option>
                            {suppliers.map(supplier => (
                              <option key={supplier._id} value={supplier._id}>
                                {supplier.name}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {bulkEditField === 'unit' && (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            style={{ width: '100px' }}
                            placeholder="Unità"
                            value={bulkEditValue}
                            onChange={(e) => setBulkEditValue(e.target.value)}
                          />
                        )}
                      </>
                    )}
                    
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={handleBulkAction}
                      disabled={!bulkAction || (bulkAction === 'edit' && (!bulkEditField || !bulkEditValue))}
                    >
                      Applica
                    </button>
                    
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setSelectedItems({});
                        setSelectAll(false);
                      }}
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Table of items */}
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          id="selectAllItems"
                        />
                      </div>
                    </th>
                    <th>Nome</th>
                    <th>Unità</th>
                    <th>Fornitore</th>
                    <th>Categoria</th>
                    <th className="text-end">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-3 text-muted">
                        {searchTerm ? 
                          `Nessun articolo trovato per "${searchTerm}"` : 
                          "Nessun articolo disponibile"
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => (
                      <tr 
                        key={item._id} 
                        onClick={(e) => toggleSelectItem(item._id, e)}
                        style={{ 
                          cursor: 'pointer', 
                          backgroundColor: selectedItems[item._id] ? '#e9ecef' : 'inherit' 
                        }}
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
                        <td>
                          {item.categoryId ? (
                            <span className="badge bg-light text-dark">
                              {item.categoryId.name}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(item);
                              }}
                              title="Modifica"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSoftDelete(item._id);
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
      
      {/* Add/Edit Item Tab */}
      {activeTab === 'add' && (
        <div className="card">
          <div className={`card-header ${editMode ? 'bg-warning' : 'bg-success'} text-white`}>
            <h4 className="mb-0">{editMode ? 'Modifica Articolo' : 'Aggiungi Nuovo Articolo'}</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
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
                </div>
                <div className="col-md-6">
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
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6">
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
                </div>
                <div className="col-md-6">
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
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Descrizione</label>
                <textarea 
                  className="form-control" 
                  name="description" 
                  value={itemForm.description} 
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Giorni di disponibilità</label>
                <div className="d-flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <div key={day.id} className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`day-${day.id}`}
                        checked={itemForm.activeDays.includes(day.id)}
                        onChange={() => handleDayToggle(day.id)}
                      />
                      <label className="form-check-label" htmlFor={`day-${day.id}`}>
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
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
      )}
      
      {/* Bulk Add Tab */}
      {activeTab === 'bulk' && (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">Aggiungi Articoli in Blocco</h4>
          </div>
          <div className="card-body">
            <div className="bulk-add-form">
              <h4>Aggiungi Articoli in Blocco</h4>
              <p className="text-muted">
                Inserisci un articolo per riga. Tutti gli articoli avranno le stesse proprietà selezionate sotto.
              </p>
              
              <div className="mb-3">
                <label className="form-label">Articoli (uno per riga)</label>
                <textarea
                  className="form-control"
                  value={bulkItemText}
                  onChange={(e) => setBulkItemText(e.target.value)}
                  rows="5"
                  placeholder="Esempio:&#10;Pomodori&#10;Carote&#10;Patate"
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Unità</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bulkUnit}
                    onChange={(e) => setBulkUnit(e.target.value)}
                    placeholder="es. kg, pezzi, scatole"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Fornitore</label>
                  <select
                    className="form-select"
                    value={bulkSupplierId}
                    onChange={(e) => setBulkSupplierId(e.target.value)}
                    required
                  >
                    <option value="">Seleziona fornitore...</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Categoria (opzionale)</label>
                <select
                  className="form-select"
                  value={bulkCategoryId}
                  onChange={(e) => setBulkCategoryId(e.target.value)}
                >
                  <option value="">Seleziona categoria...</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Giorni di disponibilità</label>
                <div className="d-flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <div key={day.id} className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`bulk-day-${day.id}`}
                        checked={bulkActiveDays.includes(day.id)}
                        onChange={() => {
                          setBulkActiveDays(prev => 
                            prev.includes(day.id)
                              ? prev.filter(d => d !== day.id)
                              : [...prev, day.id]
                          );
                        }}
                      />
                      <label className="form-check-label" htmlFor={`bulk-day-${day.id}`}>
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBulkAddWithForm}
                disabled={processingImport}
              >
                {processingImport ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Aggiunta in corso...
                  </>
                ) : (
                  'Aggiungi Articoli'
                    )}
                  </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Inactive Items Tab */}
      {activeTab === 'inactive' && (
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h4 className="mb-0">Articoli Disattivati</h4>
          </div>
          <div className="card-body">
            {inactiveItems.length === 0 ? (
              <div className="alert alert-info">
                Non ci sono articoli disattivati al momento.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Nome</th>
                      <th>Unità</th>
                      <th>Fornitore</th>
                      <th>Categoria</th>
                      <th className="text-end">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveItems.map(item => (
                      <tr key={item._id} style={{ backgroundColor: '#f8f9fa' }}>
                        <td>{item.name}</td>
                        <td>{item.unit}</td>
                        <td>{item.supplierId?.name || 'Fornitore non disponibile'}</td>
                        <td>
                          {item.categoryId ? (
                            <span className="badge bg-light text-dark">
                              {item.categoryId.name}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleRestoreItem(item._id)}
                              title="Ripristina"
                            >
                              <i className="bi bi-arrow-return-left"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleForceDelete(item._id)}
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
            )}
          </div>
        </div>
      )}
      
      {/* Edit Item Modal */}
      {showEditModal && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div className="modal-dialog modal-lg" style={{ 
            margin: 0, 
            maxWidth: '90%', 
            width: '800px', 
            maxHeight: '90vh',
            boxShadow: '0 10px 25px rgba(0,0,0,.5)',
            animation: 'scaleIn 0.2s ease-in-out',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div className="modal-content" style={{ 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              border: '1px solid #555',
              borderRadius: '8px',
              background: '#fff'
            }}>
              <div className="modal-header bg-warning text-white" style={{
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                borderBottom: '2px solid #e0a800'
              }}>
                <h5 className="modal-title" style={{ fontWeight: 'bold' }}>Modifica Articolo</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  aria-label="Close"
                  onClick={handleCancel}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
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
                    </div>
                    <div className="col-md-6">
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
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
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
                    </div>
                    <div className="col-md-6">
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
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Descrizione</label>
                    <textarea 
                      className="form-control" 
                      name="description" 
                      value={itemForm.description} 
                      onChange={handleInputChange}
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Giorni di disponibilità</label>
                    <div className="d-flex flex-wrap gap-2">
                      {daysOfWeek.map(day => (
                        <div key={day.id} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`modal-day-${day.id}`}
                            checked={itemForm.activeDays.includes(day.id)}
                            onChange={() => handleDayToggle(day.id)}
                          />
                          <label className="form-check-label" htmlFor={`modal-day-${day.id}`}>
                            {day.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ 
                  borderTop: '1px solid #dee2e6',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-warning" style={{ fontWeight: 'bold' }}>
                    Aggiorna Articolo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemManagement; 