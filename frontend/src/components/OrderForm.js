import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/index';
import { apiCall } from '../utils/apiUtils';
import './OrderForm.css'; // We'll create this CSS file

function OrderForm() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filterType, setFilterType] = useState('supplier'); // 'supplier' or 'category'
  const [filter, setFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      console.log('Fetching order form data...');
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
      console.error('Error fetching order form data:', err);
      setMessage('Errore nel caricamento dei dati');
      setLoading(false);
    }
  };
  
  const handleItemSelect = (itemId) => {
    setSelectedItems(prev => {
      const updatedItems = { ...prev };
      if (updatedItems[itemId]) {
        // If already selected, increase quantity
        updatedItems[itemId] = {
          ...updatedItems[itemId],
          quantity: updatedItems[itemId].quantity + 1
        };
      } else {
        // If not selected, add with quantity 1
        updatedItems[itemId] = {
          id: itemId,
          quantity: 1
        };
      }
      return updatedItems;
    });
  };
  
  const handleIncreaseQuantity = (itemId) => {
    setSelectedItems(prev => {
      const updatedItems = { ...prev };
      if (updatedItems[itemId]) {
        updatedItems[itemId] = {
          ...updatedItems[itemId],
          quantity: updatedItems[itemId].quantity + 1
        };
      }
      return updatedItems;
    });
  };
  
  const handleDecreaseQuantity = (itemId) => {
    setSelectedItems(prev => {
      const updatedItems = { ...prev };
      if (updatedItems[itemId] && updatedItems[itemId].quantity > 1) {
        updatedItems[itemId] = {
          ...updatedItems[itemId],
          quantity: updatedItems[itemId].quantity - 1
        };
      } else if (updatedItems[itemId] && updatedItems[itemId].quantity === 1) {
        // Remove item if quantity becomes 0
        delete updatedItems[itemId];
      }
      return updatedItems;
    });
  };
  
  const handleRemoveItem = (itemId) => {
    setSelectedItems(prev => {
      const updatedItems = { ...prev };
      delete updatedItems[itemId];
      return updatedItems;
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    const orderItems = Object.values(selectedItems).map(item => ({
      itemId: item.id,
      quantity: item.quantity
    }));
    
    if (orderItems.length === 0) {
      setMessage('Seleziona almeno un articolo');
      return;
    }
    
    try {
      console.log('Submitting order with items:', orderItems);
      const response = await apiCall('/api/orders', 'post', { items: orderItems });
      console.log('Order submitted successfully:', response.data);
      
      setMessage('Ordine inviato con successo! Le email sono state inviate ai fornitori.');
      setSelectedItems({});
    } catch (err) {
      console.error('Error creating order:', err);
      
      // Check if there's a specific message from the server
      const errorMessage = err.response?.data?.message || 'Errore durante l\'invio dell\'ordine. Riprova.';
      setMessage(errorMessage);
    }
  };
  
  // Get unique supplier colors
  const getSupplierColor = (supplierId) => {
    const colors = [
      '#ffcccb', // Light red
      '#c1e1c1', // Light green
      '#c4c3d0', // Light purple
      '#ffe4c4', // Light orange
      '#87cefa', // Light blue
      '#e6e6fa'  // Lavender
    ];
    
    const supplierIndex = suppliers.findIndex(s => s._id === supplierId);
    return colors[supplierIndex % colors.length];
  };
  
  // Toggle between filtering by supplier or by category
  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    setFilter('all'); // Reset filter when changing filter type
  };
  
  // Get filtered items based on current filter settings
  const getFilteredItems = () => {
    let filteredItems = [...items];
    
    // Apply search term filter
    if (searchTerm.trim() !== '') {
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply supplier/category filter
    if (filter !== 'all') {
      if (filterType === 'supplier') {
        filteredItems = filteredItems.filter(item => item.supplierId?._id === filter);
      } else if (filterType === 'category') {
        filteredItems = filteredItems.filter(item => item.categoryId?._id === filter);
      }
    }
    
    return filteredItems;
  };
  
  // Add a new function to test email configuration
  const testEmailConfig = async () => {
    setMessage('');
    try {
      console.log('Testing email configuration...');
      const response = await apiCall('/api/orders/test-email', 'post');
      console.log('Email test response:', response.data);
      
      if (response.data.success) {
        setMessage('Email di test inviata con successo! Controlla la tua casella di posta.');
      } else {
        setMessage(`Errore nell'invio dell'email di test: ${response.data.error}`);
      }
    } catch (err) {
      console.error('Error testing email:', err);
      setMessage(`Errore nel test email: ${err.response?.data?.error || err.message}`);
    }
  };
  
  // Add this function to handle search input changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  return (
    <div className="order-form-container">
      <div className="card mb-4">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h3>Nuovo Ordine</h3>
          <button 
            type="button" 
            className="btn btn-outline-light btn-sm" 
            onClick={testEmailConfig}
          >
            Testa Email
          </button>
        </div>
        <div className="card-body">
          {message && (
            <div className={`alert ${message.includes('successo') ? 'alert-success' : 'alert-danger'}`}>
              {message}
            </div>
          )}
          
          <div className="order-content">
            {/* Left Column - Items */}
            <div className="items-section">
              <div className="filter-bar">
                {/* Filter Controls */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <button 
                      className={`btn ${filterType === 'supplier' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                      onClick={() => handleFilterTypeChange('supplier')}
                    >
                      Filtra per Fornitore
                    </button>
                    <button 
                      className={`btn ${filterType === 'category' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                      onClick={() => handleFilterTypeChange('category')}
                    >
                      Filtra per Categoria
                    </button>
                  </div>
                  
                  {filterType === 'supplier' ? (
                    <div className="btn-group mb-3" role="group">
                      <button
                        className={`btn ${filter === 'all' ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => setFilter('all')}
                      >
                        Tutti
                      </button>
                      {suppliers.map(supplier => (
                        <button
                          key={supplier._id}
                          className={`btn ${filter === supplier._id ? 'btn-success' : 'btn-outline-success'}`}
                          onClick={() => setFilter(supplier._id)}
                          style={{ 
                            borderLeft: `5px solid ${getSupplierColor(supplier._id)}`,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0
                          }}
                        >
                          {supplier.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="btn-group mb-3" role="group">
                      <button
                        className={`btn ${filter === 'all' ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => setFilter('all')}
                      >
                        Tutte
                      </button>
                      {categories.map(category => (
                        <button
                          key={category._id}
                          className={`btn ${filter === category._id ? 'btn-success' : 'btn-outline-success'}`}
                          onClick={() => setFilter(category._id)}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="search-container mt-3">
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cerca articoli..."
                      value={searchTerm}
                      onChange={handleSearchChange}
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
                </div>
              </div>
              
              <div className="filter-summary mt-2 mb-3">
                <small className="text-muted">
                  {searchTerm ? 
                    `${getFilteredItems().length} risultati trovati per "${searchTerm}"` : 
                    `${getFilteredItems().length} articoli totali`
                  }
                  {filter !== 'all' && ` (Filtrati per ${filterType === 'supplier' ? 'fornitore: ' + suppliers.find(s => s._id === filter)?.name : 'categoria: ' + categories.find(c => c._id === filter)?.name})`}
                </small>
              </div>
              
              <div className="items-grid">
                {getFilteredItems().length > 0 ? (
                  getFilteredItems().map(item => (
                    <div 
                      key={item._id} 
                      className={`item-card ${selectedItems[item._id] ? 'selected' : ''}`}
                      onClick={() => handleItemSelect(item._id)}
                    >
                      <div className="item-card-header">
                        <h5 className="item-name">{item.name}</h5>
                        <small className="item-unit">{item.unit}</small>
                      </div>
                      
                      <div className="item-card-body">
                        {item.description && <p className="item-description">{item.description}</p>}
                      </div>
                      
                      <div className="item-card-footer">
                        <span 
                          className="supplier-tag"
                          style={{ backgroundColor: getSupplierColor(item.supplierId?._id) }}
                        >
                          {item.supplierId?.name || 'Fornitore sconosciuto'}
                        </span>
                        
                        {item.categoryId && (
                          <span className="category-tag">
                            {item.categoryId.name}
                          </span>
                        )}
                        
                        {selectedItems[item._id] && (
                          <div className="item-quantity-badge">
                            {selectedItems[item._id].quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-items-found">
                    <p className="text-center text-muted my-4">
                      <i className="bi bi-search me-2"></i>
                      {searchTerm ? 
                        `Nessun articolo trovato per "${searchTerm}"` : 
                        "Nessun articolo disponibile"
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column - Selected Items */}
            <div className="selected-section">
              {Object.keys(selectedItems).length > 0 ? (
                <div className="selected-items-container">
                  <div className="selected-items-header">
                    <h4>Articoli Selezionati</h4>
                  </div>
                  <div className="selected-items-list">
                    {Object.keys(selectedItems).map(itemId => {
                      const item = items.find(i => i._id === itemId);
                      return (
                        <div key={itemId} className="selected-item-row">
                          <div className="item-info">
                            <span className="item-name">{item?.name}</span>
                            <span className="supplier-name">({item?.supplierId?.name})</span>
                          </div>
                          <div className="quantity-controls">
                            <button 
                              className="btn btn-sm btn-outline-secondary" 
                              onClick={() => handleDecreaseQuantity(itemId)}
                            >
                              -
                            </button>
                            <span className="quantity">{selectedItems[itemId].quantity}</span>
                            <button 
                              className="btn btn-sm btn-outline-secondary" 
                              onClick={() => handleIncreaseQuantity(itemId)}
                            >
                              +
                            </button>
                            <button 
                              className="btn btn-sm btn-danger ms-2" 
                              onClick={() => handleRemoveItem(itemId)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="order-button-container">
                    <button 
                      className="btn btn-success btn-lg w-100" 
                      onClick={handleSubmit}
                    >
                      Invia Ordine
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted h-100 d-flex align-items-center justify-content-center">
                  <div>
                    <i className="bi bi-cart3 fs-1"></i>
                    <p className="mt-3">Seleziona degli articoli dalla lista</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderForm; 