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
  const [units, setUnits] = useState([]);
  const [customUnits, setCustomUnits] = useState({});
  const [showUnitSelector, setShowUnitSelector] = useState(null);

  // Add clearCart function
  const clearCart = () => {
    if (!window.confirm('Sei sicuro di voler svuotare il carrello?')) {
      return;
    }
    setSelectedItems({});
    setSupplierNotes({});
    setExpandedSuppliers(new Set());
    setCustomUnits({});
    
    // Remove from localStorage
    localStorage.removeItem('cartState');
    
    // Close cart on mobile
    if (window.innerWidth <= 768) {
      setIsCartVisible(false);
    }
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
    async function loadData() {
      setLoading(true);
      try {
        await Promise.all([fetchData(), fetchUnits()]);
        
        // Load cart state from localStorage
        try {
          const savedCartState = localStorage.getItem('cartState');
          if (savedCartState) {
            const parsedCart = JSON.parse(savedCartState);
            setSelectedItems(parsedCart.selectedItems || {});
            setSupplierNotes(parsedCart.supplierNotes || {});
            if (parsedCart.expandedSuppliers) {
              setExpandedSuppliers(new Set(parsedCart.expandedSuppliers));
            }
            if (parsedCart.customUnits) {
              setCustomUnits(parsedCart.customUnits);
            }
            
            // If there are items in the cart, show the cart on desktop
            if (Object.keys(parsedCart.selectedItems || {}).length > 0 && window.innerWidth > 768) {
              setIsCartVisible(true);
              setIsCartOpen(true);
              setLeftPanelWidth(70);
              // Add cart expanded class to body
              document.body.classList.add('cart-expanded');
              document.body.classList.remove('cart-collapsed');
            } else {
              // No items, ensure cart is hidden and body class is set
              setIsCartVisible(false);
              setIsCartOpen(false);
              document.body.classList.remove('cart-expanded');
              document.body.classList.add('cart-collapsed');
            }
            
            console.log('Cart loaded from localStorage');
          } else {
            // No saved cart, ensure cart is hidden and body class is set
            setIsCartVisible(false);
            setIsCartOpen(false);
            document.body.classList.remove('cart-expanded');
            document.body.classList.add('cart-collapsed');
          }
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setMessage('Si è verificato un errore nel caricamento dei dati. Riprova.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
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
      return true;
    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage('Errore nel caricamento dei dati');
      return false;
    } finally {
      // We don't set loading=false here since the parent loadData function will handle this
      // This prevents race conditions with multiple async calls
    }
  };
  
  const handleItemSelect = (itemId) => {
    // Check if this is a NOTA item
    if (itemId.startsWith('nota_')) {
      const supplierId = itemId.replace('nota_', '');
      
      // Find the supplier in the suppliers array
      const supplier = suppliers.find(s => s._id === supplierId);
      if (supplier) {
        // Add it to the cart - the NOTA item is a virtual item just to show in the cart
        setSelectedItems(prev => {
          // Only add if it doesn't exist already
          if (!prev[itemId]) {
            const newSelectedItems = {
              ...prev,
              [itemId]: {
                _id: itemId,
                name: `Nota per ${supplier.name}`,
                quantity: 1,
                supplierId: supplier
              }
            };
            
            // Save to localStorage
            setTimeout(() => saveCartToLocalStorage(), 0);
            
            return newSelectedItems;
          }
          return prev;
        });
        
        // Expand the supplier notes section
        setExpandedSuppliers(prev => {
          const newExpanded = new Set(prev);
          newExpanded.add(supplierId);
          return newExpanded;
        });
        
        // Make sure the cart is visible so they can see the notes field
        if (!isCartVisible) {
          toggleCart(); // Use toggleCart instead of directly setting isCartVisible
        }
        
        // Focus on the textarea after a moment
        setTimeout(() => {
          const textarea = document.querySelector(`textarea[data-supplier-id="${supplierId}"]`);
          if (textarea) {
            textarea.focus();
          }
        }, 100);
        
        return;
      }
    }
    
    // Get the item from the items array
    const item = items.find(i => i._id === itemId);
    if (!item) return;
    
    // Toggle item selection
    setSelectedItems(prev => {
      const wasEmpty = Object.keys(prev).length === 0;
      
      if (prev[itemId]) {
        // Item is already selected, update quantity
        const updatedItems = {
          ...prev,
          [itemId]: {
            ...prev[itemId],
            quantity: prev[itemId].quantity + 1
          }
        };
        
        // Save to localStorage
        setTimeout(() => saveCartToLocalStorage(), 0);
        
        return updatedItems;
      } else {
        // Item is not selected, add it
        const updatedItems = {
          ...prev,
          [itemId]: {
            _id: itemId,
            name: item.name,
            quantity: 1,
            unit: item.unit,
            supplierId: item.supplierId
          }
        };
        
        // Save to localStorage
        setTimeout(() => saveCartToLocalStorage(), 0);
        
        // If this is the first item, make sure cart is visible
        if (wasEmpty) {
          toggleCart(); // Use toggleCart instead of directly setting isCartVisible
        }
        
        return updatedItems;
      }
    });
  };
  
  const handleIncreaseQuantity = (itemId) => {
    setSelectedItems(prev => {
      if (prev[itemId]) {
        const updatedItems = {
          ...prev,
          [itemId]: {
            ...prev[itemId],
            quantity: prev[itemId].quantity + 1
          }
        };
        // Save to localStorage
        setTimeout(() => saveCartToLocalStorage(), 0);
        return updatedItems;
      }
      return prev;
    });
  };
  
  const handleDecreaseQuantity = (itemId) => {
    setSelectedItems(prev => {
      if (prev[itemId] && prev[itemId].quantity > 1) {
        const updatedItems = {
          ...prev,
          [itemId]: {
            ...prev[itemId],
            quantity: prev[itemId].quantity - 1
          }
        };
        // Save to localStorage
        setTimeout(() => saveCartToLocalStorage(), 0);
        return updatedItems;
      } else if (prev[itemId] && prev[itemId].quantity <= 1) {
        // If quantity is 1 or less, remove the item
        handleRemoveItem(itemId);
      }
      return prev;
    });
  };
  
  const handleRemoveItem = (itemId) => {
    setSelectedItems(prev => {
      const newSelectedItems = { ...prev };
      delete newSelectedItems[itemId];
      
      // Save to localStorage after state update
      setTimeout(() => saveCartToLocalStorage(), 0);
      
      return newSelectedItems;
    });
  };
  
  // Modify the handle note change function
  const handleNoteChange = (supplierId, text) => {
    setSupplierNotes(prev => {
      const updatedNotes = {
        ...prev,
        [supplierId]: text
      };
      
      // Save to localStorage
      setTimeout(() => saveCartToLocalStorage(), 0);
      
      return updatedNotes;
    });
  };
  
  // Add a function to handle note-only submissions
  const hasNoteOnlyOrder = () => {
    // Check if there are any supplier notes but no items
    const hasNotes = Object.values(supplierNotes).some(note => note?.trim());
    const hasItems = Object.keys(selectedItems).length > 0;
    
    return hasNotes && !hasItems;
  };
  
  // Update handleSubmit to allow note-only orders
  const handleSubmit = async () => {
    try {
      // Separate regular items from NOTA items
      const regularItems = Object.entries(selectedItems).filter(([itemId]) => !itemId.startsWith('nota_'));
      const notaItems = Object.entries(selectedItems).filter(([itemId]) => itemId.startsWith('nota_'));
      
      // Check if there are items selected or supplier notes
      const hasRegularItems = regularItems.length > 0;
      const hasNotaItems = notaItems.length > 0;
      const hasNotes = Object.values(supplierNotes).some(note => note?.trim());
      
      if (!hasRegularItems && !hasNotaItems && !hasNotes) {
        setMessage("Seleziona almeno un articolo o aggiungi una nota a un fornitore");
        return;
      }
      
      // Check if NOTA items have corresponding notes
      for (const [itemId] of notaItems) {
        const supplierId = itemId.replace('nota_', '');
        if (!supplierNotes[supplierId] || !supplierNotes[supplierId].trim()) {
          setMessage(`Aggiungi una nota per il fornitore o rimuovi l'elemento NOTA`);
          return;
        }
      }
      
      setLoading(true);
      setMessage('');

      // Convert selected items to array for API (excluding NOTA items)
      const itemsArray = [];
      regularItems.forEach(([itemId, details]) => {
        // Add custom unit if one was selected for this item
        const customUnit = customUnits[itemId] || null;
        
        itemsArray.push({
          itemId,
          name: details.name,
          quantity: details.quantity,
          unit: details.unit,
          customUnit: customUnit,
          supplierId: details.supplierId
        });
      });

      // Create a clean object of supplier notes (without empty notes)
      const cleanNotes = {};
      Object.entries(supplierNotes).forEach(([supplierId, note]) => {
        // Only include notes that are not empty
        if (note && note.trim()) {
          cleanNotes[supplierId] = note.trim();
        }
      });

      // Prepare request body
      const requestBody = {};
      
      // Only include items if there are any regular items
      if (hasRegularItems) {
        requestBody.items = itemsArray;
      }
      
      // Only include notes if there are any
      if (hasNotes) {
        requestBody.supplierNotes = cleanNotes;
      }

      // Send the order
      const response = await apiCall('/api/orders', 'POST', requestBody);

      // apiCall returns an axios response, not a fetch response, so we use response.data directly
      console.log('Order created:', response.data);
      
      // Show success message with any email errors
      if (response.data.emailErrors && response.data.emailErrors.length > 0) {
        setMessage(`Ordine creato con ${response.data.emailErrors.length} errori di email: ${response.data.emailErrors.join(', ')}`);
      } else {
        setMessage("Ordine inviato con successo!");
      }
      
      // Reset form
      setSelectedItems({});
      setSupplierNotes({});
      setExpandedSuppliers(new Set());
      setSearchTerm('');
      setFilter('all');
      setIsCartVisible(false);
      setCustomUnits({});
      
      // Reset local storage
      localStorage.removeItem('cartState');
    } catch (error) {
      console.error('Error submitting order:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
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
        
        // If filtering by supplier, add a special "NOTA" item at the beginning of the list
        // This allows adding notes without adding any real items
        if (filter !== 'all') {
          const supplier = suppliers.find(s => s._id === filter);
          if (supplier) {
            // Create a virtual "NOTA" item
            const notaItem = {
              _id: `nota_${supplier._id}`,
              name: "NOTA",
              description: "Invia un messaggio al fornitore",
              unit: "",
              supplierId: supplier,
              isNotaItem: true // Flag to identify this as a special item
            };
            
            // Add the NOTA item at the beginning of the list
            filteredItems = [notaItem, ...filteredItems];
          }
        }
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

  // Effect to ensure body classes match cart visibility state
  useEffect(() => {
    if (isCartVisible) {
      document.body.classList.add('cart-expanded');
      document.body.classList.remove('cart-collapsed');
    } else {
      document.body.classList.remove('cart-expanded');
      document.body.classList.add('cart-collapsed');
    }
  }, [isCartVisible]);

  // Clean up body overflow when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('cart-expanded');
      document.body.classList.remove('cart-collapsed');
    };
  }, []);

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

  // Function to fetch units of measure
  const fetchUnits = async () => {
    try {
      const response = await apiCall('/api/units');
      console.log('Units fetched for OrderForm:', response.data);
      setUnits(response.data || []);
      return true;
    } catch (error) {
      console.error('Error fetching units of measure:', error);
      // Add default units if API fails
      setUnits([
        { _id: 'default-kg', name: 'Kilogram', abbreviation: 'kg' },
        { _id: 'default-g', name: 'Gram', abbreviation: 'g' },
        { _id: 'default-l', name: 'Liter', abbreviation: 'l' },
        { _id: 'default-pz', name: 'Piece', abbreviation: 'pz' }
      ]);
      return false;
    }
  };
  
  // Function to save cart state to localStorage
  const saveCartToLocalStorage = () => {
    try {
      const cartState = {
        selectedItems,
        supplierNotes,
        expandedSuppliers: Array.from(expandedSuppliers),
        customUnits
      };
      localStorage.setItem('cartState', JSON.stringify(cartState));
      console.log('Cart saved to localStorage');
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  // Add handler for changing unit of measure
  const handleUnitChange = (itemId, unit) => {
    console.log(`Changing unit for item ${itemId} to ${unit}`);
    
    // If unit is null or matches the original item's unit, remove the custom unit
    const originalItem = items.find(i => i._id === itemId);
    
    if (!unit || (originalItem && unit === originalItem.unit)) {
      console.log(`Resetting to original unit: ${originalItem?.unit}`);
      // Reset to original unit
      setCustomUnits(prev => {
        const newUnits = {...prev};
        delete newUnits[itemId];
        return newUnits;
      });
    } else {
      // Set custom unit
      console.log(`Setting custom unit: ${unit}`);
      setCustomUnits(prev => ({
        ...prev,
        [itemId]: unit
      }));
    }
    
    // Close the dropdown
    setShowUnitSelector(null);
    
    // Update the selectedItems to force re-render
    setSelectedItems(prev => {
      const updatedItems = {...prev};
      if (updatedItems[itemId]) {
        updatedItems[itemId] = {
          ...updatedItems[itemId],
          // Preserve any existing properties
        };
      }
      return updatedItems;
    });
    
    // Save to localStorage
    saveCartToLocalStorage();
  };
  
  // Function to get the current unit for an item (custom or default)
  const getItemUnit = (item) => {
    const itemId = item._id;
    const customUnit = customUnits[itemId];
    return customUnit || item.unit;
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
      
      {/* Overlay when dropdown is open */}
      {showUnitSelector && (
        <div 
          className="dropdown-overlay" 
          onClick={() => setShowUnitSelector(null)}
        />
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
          <div className="items-section">
            {renderFilterSection()}
          <div className="items-grid">
            {getFilteredItems().length > 0 ? (
              getFilteredItems().map(item => (
                <div 
                  key={item._id} 
                    className={`item-card ${selectedItems[item._id] ? 'selected' : ''} ${item.isNotaItem ? 'nota-item' : ''}`}
                  onClick={() => handleItemSelect(item._id)}
                    style={{ 
                      backgroundColor: item.isNotaItem ? '#FFF9C4' : getCategoryColor(item.categoryId?._id),
                      border: item.isNotaItem ? '2px dashed #FFA000' : null,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {item.isNotaItem ? (
                      <>
                        <div className="item-card-header text-center">
                          <h5 className="item-name" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{item.name}</h5>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#555', textAlign: 'center', padding: '0 5px' }}>
                          {item.description}
                        </div>
                        <div style={{ marginTop: '5px' }}>
                          <i className="bi bi-pencil-square" style={{ fontSize: '1.5rem', color: '#FFA000' }}></i>
                        </div>
                      </>
                    ) : (
                      <>
                  <div className="item-card-header">
                          <h5 className="item-name" title={item.name}>{item.name}</h5>
                        </div>
                        
                        <div className="item-unit-corner">
                          <small>{getItemUnit(item)}</small>
                  </div>
                  
                  {selectedItems[item._id] && (
                    <div className="item-quantity-badge">
                      {selectedItems[item._id].quantity}
                    </div>
                        )}
                      </>
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
              // Get regular items for this supplier
                  const supplierItems = supplierData.items.filter(item => 
                    selectedItems[item._id]
                  );
                  
              // Check if there's a NOTA item for this supplier
              const hasNotaItem = Object.keys(selectedItems).some(
                itemId => itemId.startsWith('nota_') && itemId.includes(supplierId)
              );
              
              const hasNote = supplierNotes[supplierId] && supplierNotes[supplierId].trim().length > 0;
              const isExpanded = expandedSuppliers.has(supplierId);
              
              // Skip if no regular items AND no NOTA items AND no notes AND not expanded
              if (supplierItems.length === 0 && !hasNotaItem && !hasNote && !isExpanded) return null;
                  
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
                        <div style={{ display: "flex", alignItems: "flex-start", flexWrap: "wrap" }}>
                          <span className="item-name" title={item.name}>{item.name}</span>
                        </div>
                      </div>
                      <div className="quantity-controls">
                        <span 
                          className={`unit-button ${showUnitSelector === item._id ? 'unit-button-active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUnitSelector(item._id);
                          }}
                          title="Clicca per cambiare unità di misura"
                        >
                          {customUnits[item._id] || item.unit}
                          {showUnitSelector === item._id && (
                            <div className="unit-dropdown">
                              <div className="unit-dropdown-header">
                                <span>Cambia unità</span>
                                <span 
                                  className="unit-dropdown-close"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowUnitSelector(null);
                                  }}
                                >×</span>
                              </div>
                              
                              {item.unit !== (customUnits[item._id] || item.unit) && (
                                <div 
                                  className="unit-dropdown-item unit-dropdown-reset"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnitChange(item._id, null);
                                  }}
                                >
                                  Ripristina unità originale ({item.unit})
                                </div>
                              )}
                              
                              {units.map(unit => (
                                <div 
                                  key={unit._id}
                                  className={`unit-dropdown-item ${(customUnits[item._id] || item.unit) === unit.abbreviation ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnitChange(item._id, unit.abbreviation);
                                  }}
                                >
                                  {unit.name} ({unit.abbreviation})
                                </div>
                              ))}
                            </div>
                          )}
                        </span>
                        <button 
                          className="btn btn-outline-secondary btn-sm" 
                          onClick={() => handleDecreaseQuantity(item._id)}
                        >
                          <i className="bi bi-dash"></i>
                        </button>
                        <span className="quantity">{selectedItems[item._id].quantity}</span>
                        <button 
                          className="btn btn-outline-secondary btn-sm" 
                          onClick={() => handleIncreaseQuantity(item._id)}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                        <button 
                          className="btn btn-outline-danger btn-sm" 
                          onClick={() => handleRemoveItem(item._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Display NOTA items in the cart */}
                  {Object.entries(selectedItems)
                    .filter(([itemId]) => itemId.startsWith('nota_') && itemId.includes(supplierId))
                    .map(([itemId, item]) => (
                      <div key={itemId} className="selected-item-row nota-item-row">
                        <div className="item-info">
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span className="item-name" style={{ 
                              fontWeight: 'bold', 
                              color: '#FFA000',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <i className="bi bi-pencil-square me-1"></i>
                              {item.name}
                            </span>
                            <small 
                              className="text-muted ms-2"
                              style={{ fontStyle: 'italic' }}
                            >
                              (Messaggio al fornitore)
                            </small>
                          </div>
                        </div>
                        <div className="quantity-controls">
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(itemId);
                              // Also collapse the notes section when removing the NOTA item
                              setExpandedSuppliers(prev => {
                                const newExpanded = new Set(prev);
                                newExpanded.delete(supplierId);
                                return newExpanded;
                              });
                            }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  }
                  
                      {expandedSuppliers.has(supplierId) && (
                        <div className="supplier-note mt-2">
                          <label className="form-label fw-bold">Note per il fornitore:</label>
                          <textarea
                            className="form-control"
                            placeholder="Note per il fornitore (opzionale)"
                            value={supplierNotes[supplierId] || ''}
                            onChange={(e) => handleNoteChange(supplierId, e.target.value)}
                            rows="2"
                        data-supplier-id={supplierId}
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