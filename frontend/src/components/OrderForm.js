import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  const [supplierNotes, setSupplierNotes] = useState({});  // Add state for supplier notes
  const [expandedSuppliers, setExpandedSuppliers] = useState(new Set());  // Track which suppliers have expanded notes
  const [isDragging, setIsDragging] = useState(false);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const containerRef = useRef(null);
  const initialX = useRef(0);
  const initialLeftWidth = useRef(0);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(100); // Start with items section at 100%
  const [isCartVisible, setIsCartVisible] = useState(false); // Cart starts hidden
  const [itemsBySupplier, setItemsBySupplier] = useState({});
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Add clearCart function
  const clearCart = () => {
    setSelectedItems({});
    setSupplierNotes({});
    localStorage.removeItem('cartState');
  };

  // Load saved cart state on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cartState');
    if (savedCart) {
      const { selectedItems: savedItems, supplierNotes: savedNotes } = JSON.parse(savedCart);
      setSelectedItems(savedItems);
      setSupplierNotes(savedNotes);
    }
  }, []);

  // Save cart state whenever it changes
  useEffect(() => {
    if (Object.keys(selectedItems).length > 0 || Object.keys(supplierNotes).length > 0) {
      localStorage.setItem('cartState', JSON.stringify({
        selectedItems,
        supplierNotes
      }));
    }
  }, [selectedItems, supplierNotes]);

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    initialX.current = e.clientX;
    initialLeftWidth.current = leftPanelRef.current.getBoundingClientRect().width;
    document.body.classList.add('resizing');
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const delta = e.clientX - initialX.current;
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const newWidth = initialLeftWidth.current + delta;
    const newPercentage = (newWidth / containerWidth) * 100;

    // Constrain between 30% and 70%
    const constrainedPercentage = Math.min(Math.max(newPercentage, 30), 70);
    
    leftPanelRef.current.style.width = `${constrainedPercentage}%`;
    rightPanelRef.current.style.width = `${100 - constrainedPercentage}%`;
    setLeftPanelWidth(constrainedPercentage);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.classList.remove('resizing');
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getCurrentDayOfWeek = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
    return days[today];
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, suppliersRes, categoriesRes] = await Promise.all([
        apiCall('/api/items'),
        apiCall('/api/suppliers'),
        apiCall('/api/categories')
      ]);

      const currentDay = getCurrentDayOfWeek();
      
      // Filter items that are active on the current day
      const availableItems = itemsRes.data.filter(item => 
        item.activeDays?.includes(currentDay)
      );

      setItems(availableItems);
      setSuppliers(suppliersRes.data);
      setCategories(categoriesRes.data);

      // Group items by supplier
      const groupedItems = {};
      availableItems.forEach(item => {
        if (item.supplierId && item.supplierId._id) {
          if (!groupedItems[item.supplierId._id]) {
            groupedItems[item.supplierId._id] = {
              supplier: item.supplierId,
              items: []
            };
          }
          groupedItems[item.supplierId._id].items.push(item);
        }
      });
      setItemsBySupplier(groupedItems);

    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };
  
  const handleItemSelect = (itemId) => {
    const wasEmpty = Object.keys(selectedItems).length === 0;
    
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
    
    // If this was the first item added to cart and cart is hidden, show the cart
    if (wasEmpty && !isCartVisible && window.innerWidth > 768) {
      toggleCart();
    }
    
    // Keep search expanded and don't clear search term when selecting an item
    // This ensures that the search results stay visible
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
  
  // Handle note change for a supplier
  const handleNoteChange = (supplierId, note) => {
    console.log('Setting note for supplier:', supplierId, note);
    setSupplierNotes(prev => ({
      ...prev,
      [supplierId]: note
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    const orderItems = Object.entries(selectedItems)
      .filter(([_, itemData]) => itemData.quantity > 0)
      .map(([itemId, itemData]) => ({
        itemId: itemId,
        quantity: itemData.quantity
      }));
    
    if (orderItems.length === 0) {
      setMessage('Seleziona almeno un articolo');
      return;
    }
    
    try {
      console.log('Submitting order with items:', orderItems);
      
      // Create a clean object of supplier notes for only suppliers with items in this order
      const notesForOrder = {};
      
      // First find which suppliers are in this order
      const supplierIds = new Set();
      for (const orderItem of orderItems) {
        const item = items.find(i => i._id === orderItem.itemId);
        if (item && item.supplierId) {
          supplierIds.add(item.supplierId._id);
        }
      }
      
      // Then only include notes for those suppliers
      for (const supplierId of supplierIds) {
        const note = supplierNotes[supplierId];
        if (note && note.trim()) {
          notesForOrder[supplierId] = note.trim();
        }
      }
      
      console.log('Notes being sent with order:', notesForOrder);
      
      const response = await apiCall('/api/orders', 'POST', { 
        items: orderItems,
        supplierNotes: notesForOrder
      });
      
      console.log('Order submitted successfully:', response.data);
      setMessage('Ordine inviato con successo! Le email sono state inviate ai fornitori.');
      setSelectedItems({});
      setSupplierNotes({});
      // Clear cart from localStorage after successful submission
      localStorage.removeItem('cartState');
    } catch (err) {
      console.error('Error creating order:', err);
      
      // Check if there's a specific message from the server
      const errorMessage = err.response?.data?.message || 'Errore durante l\'invio dell\'ordine. Riprova.';
      setMessage(errorMessage);
    }
  };
  
  // Get unique category colors for item cards
  const getCategoryColor = (categoryId) => {
    const colors = [
      '#ffcccb', // Light red
      '#c1e1c1', // Light green
      '#c4c3d0', // Light purple
      '#ffe4c4', // Light orange
      '#87cefa', // Light blue
      '#e6e6fa'  // Lavender
    ];
    
    if (!categoryId) return '#ffffff'; // White for items with no category
    
    const categoryIndex = categories.findIndex(c => c._id === categoryId);
    return categoryIndex >= 0 ? colors[categoryIndex % colors.length] : '#ffffff';
  };
  
  // Get unique supplier colors for supplier headers
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
  const handleFilterTypeChange = () => {
    const newType = filterType === 'supplier' ? 'category' : 'supplier';
    setFilterType(newType);
    setFilter('all'); // Reset filter when changing type
  };
  
  // Get filtered items based on current filter settings
  const getFilteredItems = () => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    // Get current day of the week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[new Date().getDay()];

    // First filter by active days - safely handle undefined activeDays
    let filteredItems = items.filter(item => 
      item && Array.isArray(item.activeDays) && item.activeDays.includes(currentDay)
    );
    
    // Then apply search term filter if it exists
    if (searchTerm?.trim()) {
      filteredItems = filteredItems.filter(item => 
        item && (
          (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
    
    // Apply supplier/category filter if one is selected
    if (filter && filter !== 'all') {
      if (filterType === 'supplier') {
        filteredItems = filteredItems.filter(item => 
          item && item.supplierId && item.supplierId._id === filter
        );
      } else if (filterType === 'category') {
        filteredItems = filteredItems.filter(item => 
          item && item.categoryId && item.categoryId._id === filter
        );
      }
    }
    
    return filteredItems;
  };
  
  // Add a function to get the current day name in Italian
  const getCurrentDayInItalian = () => {
    const days = {
      'sunday': 'Domenica',
      'monday': 'Lunedì',
      'tuesday': 'Martedì',
      'wednesday': 'Mercoledì',
      'thursday': 'Giovedì',
      'friday': 'Venerdì',
      'saturday': 'Sabato'
    };
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
    return days[currentDay];
  };
  
  // Add a new function to test email
  const handleTestEmail = async () => {
    try {
      setMessage('');
      setLoading(true);
      const response = await apiCall('/api/orders/test-email', 'POST', {});  // Add empty object as body
      
      if (response.data.success) {
        setMessage('Email di test inviata con successo!');
      } else {
        setMessage('Errore nell\'invio dell\'email di test: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error testing email:', error);
      setMessage('Errore nell\'invio dell\'email di test: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Add a new function to test email with notes
  const handleTestNoteEmail = async () => {
    try {
      setMessage('');
      setLoading(true);
      
      // Get the first supplier that has a note
      let testNote = '';
      let testSupplierId = '';
      for (const [supplierId, note] of Object.entries(supplierNotes)) {
        if (note && note.trim()) {
          testNote = note;
          testSupplierId = supplierId;
          break;
        }
      }
      
      // If no note found, use a default one
      if (!testNote) {
        testNote = 'Questa è una nota di test per verificare il funzionamento delle note nelle email!';
      }
      
      console.log('Sending test note email with note:', testNote);
      
      const response = await apiCall('/api/orders/test-note-email', 'POST', {
        note: testNote,
        supplierId: testSupplierId
      });
      
      if (response.data.success) {
        setMessage(`Email di test con nota inviata con successo a ${response.data.supplierEmail}!`);
      } else {
        setMessage('Errore nell\'invio dell\'email di test con nota: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error testing note email:', error);
      setMessage('Errore nell\'invio dell\'email di test con nota: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Add this function to handle search input changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Add function to toggle supplier note visibility
  const toggleSupplierNote = (supplierId) => {
    setExpandedSuppliers(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(supplierId)) {
        newExpanded.delete(supplierId);
      } else {
        newExpanded.add(supplierId);
      }
      return newExpanded;
    });
  };
  
  // Add emergency test function
  const handleEmergencyTest = async () => {
    try {
      setMessage('');
      setLoading(true);
      
      // Use a default test note if none is provided
      const testNote = "EMERGENCY TEST NOTE - PLEASE VERIFY THIS NOTE APPEARS IN THE EMAIL";
      
      console.log('EMERGENCY TEST: Sending direct test email with note:', testNote);
      
      // Use apiCall instead of fetch for consistency
      const response = await apiCall('/api/orders/emergency-note', 'POST', { 
        note: testNote 
      });
      
      if (response.data.success) {
        setMessage(`EMERGENCY TEST: Email sent to ${response.data.to}! Check if the note appears in the email.`);
      } else {
        setMessage('EMERGENCY TEST FAILED: ' + response.data.error);
      }
    } catch (error) {
      console.error('Emergency test failed:', error);
      setMessage('EMERGENCY TEST FAILED: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Add a function to test a complete order with notes
  const handleDirectOrderTest = async () => {
    try {
      setMessage('');
      setLoading(true);
      
      // Find a supplier
      if (suppliers.length === 0) {
        setMessage('No suppliers found. Please add suppliers first.');
        return;
      }
      
      const testSupplier = suppliers[0]; // Get the first supplier
      const testNote = "TEST NOTE for direct order test: Please verify this note appears in the email.";
      
      // Find an item from this supplier
      const supplierItems = items.filter(item => 
        item.supplierId && item.supplierId._id === testSupplier._id
      );
      
      if (supplierItems.length === 0) {
        setMessage('No items found for supplier ' + testSupplier.name);
        return;
      }
      
      const testItem = supplierItems[0]; // Get the first item
      
      // Create a test order with just this item
      const orderData = {
        items: [
          {
            itemId: testItem._id,
            quantity: 1
          }
        ],
        supplierNotes: {
          [testSupplier._id]: testNote
        }
      };
      
      console.log('Sending direct test order:', orderData);
      
      const response = await apiCall('/api/orders', 'POST', orderData);
      
      setMessage('Test order sent successfully! Check if the note appears in the email sent to ' + testSupplier.email);
      console.log('Order response:', response.data);
      
    } catch (error) {
      console.error('Direct order test failed:', error);
      setMessage('Direct order test failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Modify the toggle cart function to work for both mobile and desktop
  const toggleCart = () => {
    const newCartVisibility = !isCartVisible;
    setIsCartVisible(newCartVisibility);
    setIsCartOpen(newCartVisibility); // Update isCartOpen state for CSS classes
    
    // Add or remove a class from the body to help with CSS targeting
    if (newCartVisibility) {
      document.body.classList.add('cart-expanded');
      document.body.classList.remove('cart-collapsed');
      
      // When showing the cart, restore its position and width
      if (rightPanelRef.current) {
        rightPanelRef.current.style.position = '';
        rightPanelRef.current.style.right = '';
        rightPanelRef.current.style.width = '';
      }
    } else {
      document.body.classList.remove('cart-expanded');
      document.body.classList.add('cart-collapsed');
    }
    
    // Adjust the left panel width when toggling cart visibility on desktop
    if (window.innerWidth > 768) {
      if (newCartVisibility) {
        // Cart is being shown, resize items section to 70%
        setLeftPanelWidth(70);
      } else {
        // Cart is being hidden, expand items section to 100%
        setLeftPanelWidth(100);
        // Force the right panel to be completely removed from layout
        if (rightPanelRef.current) {
          rightPanelRef.current.style.position = 'absolute';
          rightPanelRef.current.style.right = '-9999px';
        }
      }
    }
    
    // Mobile specific behavior
    if (window.innerWidth <= 768) {
      if (newCartVisibility) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  };

  // Clean up body overflow when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('cart-expanded');
      document.body.classList.remove('cart-collapsed');
    };
  }, []);

  // Set initial cart class on the body when component mounts
  useEffect(() => {
    if (isCartVisible) {
      document.body.classList.add('cart-expanded');
      document.body.classList.remove('cart-collapsed');
    } else {
      document.body.classList.remove('cart-expanded');
      document.body.classList.add('cart-collapsed');
    }
  }, [isCartVisible]);

  // Add this function to get the number of items in cart
  const getCartItemCount = () => {
    return Object.keys(selectedItems).length;
  };
  
  // Get total items count
  const getTotalItemsCount = () => {
    return Object.values(selectedItems).reduce((total, item) => total + item.quantity, 0);
  };
  
  // Add Italian day names mapping
  const dayNamesItalian = {
    'Sunday': 'Domenica',
    'Monday': 'Lunedì',
    'Tuesday': 'Martedì',
    'Wednesday': 'Mercoledì',
    'Thursday': 'Giovedì',
    'Friday': 'Venerdì',
    'Saturday': 'Sabato'
  };
  
  const renderFilterToggle = () => {
    return (
      <div className="filter-toggle-wrapper">
        <button 
          className={`filter-toggle ${filterType === 'category' ? 'category' : ''}`}
          onClick={handleFilterTypeChange}
        >
          <div className="toggle-text">
            {filterType === 'supplier' ? 'Fornitore' : 'Categoria'}
          </div>
          <div className="toggle-slider"></div>
        </button>
        
        <div className={`search-container ${isSearchExpanded ? 'expanded' : 'collapsed'}`}>
          <button className="search-button" onClick={toggleSearch}>
            <i className="bi bi-search"></i>
          </button>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cerca articoli..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ 
              opacity: isSearchExpanded ? 1 : 0,
              pointerEvents: isSearchExpanded ? 'auto' : 'none'
            }}
          />
        </div>
      </div>
    );
  };

  const renderFilterButtons = () => {
    const data = filterType === 'supplier' ? suppliers : categories;
    
    return (
      <div className="filter-scroll-container">
        <button
          key="all"
          className={`filter-button ${filter === 'all' ? 'active' : ''} ${filterType === 'category' ? 'category' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tutti
        </button>
        {data.map(item => (
          <button
            key={item._id}
            className={`filter-button ${filter === item._id ? 'active' : ''} ${filterType === 'category' ? 'category' : ''}`}
            onClick={() => setFilter(item._id)}
          >
            {item.name}
          </button>
        ))}
      </div>
    );
  };

  // Add this function to handle search button click
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      // Focus the input when expanding
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Only clear search when collapsing manually
      // Don't clear when clicking on an item
      setSearchTerm('');
    }
  };

  // Add click outside handler to collapse search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSearchExpanded && 
          searchInputRef.current && 
          !searchInputRef.current.contains(event.target) &&
          !event.target.closest('.search-button') &&
          !event.target.closest('.item-card')) {  // Don't close when clicking on an item
        setIsSearchExpanded(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchExpanded]);

  const renderFilterSection = () => {
    return (
      <div className="filter-section">
        {renderFilterToggle()}
        {renderFilterButtons()}
      </div>
    );
  };

  const toggleCartVisibility = () => {
    setIsCartOpen(!isCartOpen);
  };

  if (loading) {
    return <div className="text-center my-3"><div className="spinner-border" role="status"></div></div>;
  }
  
  return (
    <div className="order-form-container">
      {message && (
        <div className={`alert ${message.includes('successo') ? 'alert-success' : 'alert-danger'} m-1 py-2`}>
          {message}
        </div>
      )}
      
      <div className={`order-content ${isCartOpen ? 'cart-open' : ''}`} ref={containerRef}>
        <div 
          className={`left-content ${isCartVisible ? 'with-cart' : ''}`}
          ref={leftPanelRef}
          style={{ 
            width: isCartVisible ? `${leftPanelWidth}%` : '100%',
            flex: isCartVisible ? `0 0 ${leftPanelWidth}%` : '1 0 100%'
          }}
        >
          {renderFilterSection()}
          
          <div className="items-grid">
            {getFilteredItems().length > 0 ? (
              getFilteredItems().map(item => (
                <div 
                  key={item._id} 
                  className={`item-card ${selectedItems[item._id] ? 'selected' : ''}`}
                  onClick={() => handleItemSelect(item._id)}
                  style={{ backgroundColor: getCategoryColor(item.categoryId?._id) }}
                >
                  <div className="item-card-header">
                    <h5 className="item-name" title={item.name}>{item.name}</h5>
                  </div>
                  
                  <div className="item-unit-corner">
                    <small>{item.unit}</small>
                  </div>
                  
                  {selectedItems[item._id] && (
                    <div className="item-quantity-badge">
                      {selectedItems[item._id].quantity}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-items-found">
                <p className="text-center text-muted my-3">
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
        
        <div 
          className={`selected-section ${isCartVisible ? 'expanded' : 'collapsed'}`}
          ref={rightPanelRef}
          style={{ 
            width: isCartVisible ? `${100 - leftPanelWidth}%` : '0%',
            flex: isCartVisible ? `0 0 ${100 - leftPanelWidth}%` : '0'
          }}
        >
          {isCartVisible && <div className="resize-handle" onMouseDown={handleMouseDown} />}
          
          <div className="selected-section-header">
            <div className="d-flex align-items-center">
              <h3 className="mb-0">
                <i className="bi bi-cart me-2"></i>
                Carrello
              </h3>
              {getTotalItemsCount() > 0 && (
                <button 
                  className="btn btn-sm btn-outline-danger ms-3"
                  onClick={clearCart}
                  title="Rimuovi tutti gli articoli dal carrello"
                >
                  <i className="bi bi-trash me-1"></i>
                  Svuota Carrello
                </button>
              )}
            </div>
            <div className="d-flex align-items-center">
              <div className="me-3">
                {getTotalItemsCount()} {getTotalItemsCount() === 1 ? 'articolo' : 'articoli'}
              </div>
              <i 
                className="bi bi-x-lg close-cart" 
                onClick={toggleCart}
                title="Chiudi carrello"
              ></i>
            </div>
          </div>

          <div className="selected-items-list">
            {Object.entries(itemsBySupplier).map(([supplierId, supplierData]) => {
              const supplierItems = supplierData.items.filter(item => 
                selectedItems[item._id]
              );
              
              if (supplierItems.length === 0) return null;
              
              return (
                <div key={supplierId} className="supplier-group mb-3">
                  <h5 
                    className="supplier-name mb-1" 
                    style={{
                      backgroundColor: getSupplierColor(supplierId),
                      padding: '6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.95rem',
                      flexWrap: 'wrap',
                      gap: '5px'
                    }}
                    onClick={() => toggleSupplierNote(supplierId)}
                  >
                    <span style={{ flex: '1', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {supplierData.supplier.name}
                    </span>
                    <small style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {expandedSuppliers.has(supplierId) ? 'Nascondi nota' : 'Aggiungi nota'}
                    </small>
                  </h5>
                  {supplierItems.map(item => (
                    <div key={item._id} className="selected-item-row">
                      <div className="item-info">
                        <div style={{ display: "flex", alignItems: "flex-start" }}>
                          <span className="item-name" title={item.name}>{item.name}</span>
                          <small className="text-muted" style={{ marginLeft: "5px" }}>({item.unit})</small>
                        </div>
                      </div>
                      <div className="quantity-controls">
                        <button 
                          className="btn btn-sm btn-outline-secondary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecreaseQuantity(item._id);
                          }}
                        >
                          -
                        </button>
                        <span className="quantity">{selectedItems[item._id].quantity}</span>
                        <button 
                          className="btn btn-sm btn-outline-secondary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIncreaseQuantity(item._id);
                          }}
                        >
                          +
                        </button>
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item._id);
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  {expandedSuppliers.has(supplierId) && (
                    <div className="supplier-note mt-2">
                      <label className="form-label fw-bold">Note per il fornitore:</label>
                      <textarea
                        className="form-control"
                        placeholder="Note per il fornitore (opzionale)"
                        value={supplierNotes[supplierId] || ''}
                        onChange={(e) => handleNoteChange(supplierId, e.target.value)}
                        rows="2"
                        style={{
                          border: supplierNotes[supplierId] ? "2px solid green" : "1px solid #ced4da"
                        }}
                      />
                      {supplierNotes[supplierId] && (
                        <div className="text-success mt-1">
                          <small>✓ Nota impostata: {supplierNotes[supplierId].length} caratteri</small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="order-button-container">
            <button
              className="btn btn-primary order-button"
              onClick={handleSubmit}
            >
              <i className="bi bi-send" />
              <span>Invia Ordine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile cart button - only visible on mobile */}
      <div className="mobile-cart-button" onClick={toggleCart}>
        <i className="bi bi-cart-fill"></i>
        {getTotalItemsCount() > 0 && (
          <div className="cart-count">{getTotalItemsCount()}</div>
        )}
      </div>
      
      {/* Desktop fixed cart button - visible when cart is collapsed */}
      <div 
        className={`desktop-fixed-cart-button ${!isCartVisible ? 'visible' : ''}`} 
        onClick={toggleCart}
        title="Mostra Carrello"
      >
        <i className="bi bi-cart-fill"></i>
        {getTotalItemsCount() > 0 && (
          <div className="cart-count">{getTotalItemsCount()}</div>
        )}
      </div>
    </div>
  );
}

export default OrderForm; 