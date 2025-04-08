import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiCall } from '../utils/apiUtils';
import './OrderHistory.css';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first, 'asc' = oldest first
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [expandedOrderNotes, setExpandedOrderNotes] = useState({});
  
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/orders');
      setOrders(response.data);
      setFilteredOrders(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setLoading(false);
    }
  };
  
  // Apply date filtering and sorting
  useEffect(() => {
    let result = [...orders];
    
    // Apply date filtering if dates are specified
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      startDate.setHours(0, 0, 0, 0); // Set to beginning of day
      result = result.filter(order => new Date(order.orderDate) >= startDate);
    }
    
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      result = result.filter(order => new Date(order.orderDate) <= endDate);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.orderDate);
      const dateB = new Date(b.orderDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setFilteredOrders(result);
  }, [orders, dateRange, sortOrder]);
  
  // Handle date filter changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Clear date filters
  const clearDateFilters = () => {
    setDateRange({
      startDate: '',
      endDate: ''
    });
  };
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };
  
  // Toggle expanded notes for an order
  const toggleOrderNotes = (orderId) => {
    setExpandedOrderNotes(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };
  
  // Function to generate and download CSV
  const exportToCSV = () => {
    if (filteredOrders.length === 0) return;
    
    // Prepare CSV header row
    let csvContent = "Data,Ora,Stato,Articolo,Fornitore,Quantità,Note al Fornitore\n";
    
    // Add each order to CSV
    filteredOrders.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const dateStr = orderDate.toLocaleDateString();
      const timeStr = orderDate.toLocaleTimeString();
      const status = order.status === 'pending' ? 'In Attesa' : 'Completato';
      
      // Group items by supplier to include notes
      const supplierGroups = {};
      
      // Initialize supplier groups
      order.items.forEach(item => {
        const supplierId = item.itemId?.supplierId?._id;
        if (supplierId && !supplierGroups[supplierId]) {
          supplierGroups[supplierId] = {
            name: item.itemId.supplierId.name,
            items: [],
            note: order.supplierNotes && order.supplierNotes[supplierId] ? order.supplierNotes[supplierId] : ''
          };
        }
        
        if (supplierId) {
          supplierGroups[supplierId].items.push(item);
        }
      });
      
      // Write supplier-specific CSV rows
      Object.entries(supplierGroups).forEach(([supplierId, supplierData]) => {
        supplierData.items.forEach((item, index) => {
          const itemName = item.itemId?.name || 'Articolo non disponibile';
          const supplierName = supplierData.name || 'Fornitore non disponibile';
          const quantity = `${item.quantity} ${item.customUnit || item.itemId?.unit || ''}`;
          const note = index === 0 ? supplierData.note : ''; // Include note only on first item for this supplier
          
          // Format: Date,Time,Status,Item,Supplier,Quantity,Note
          const csvLine = `"${dateStr}","${timeStr}","${status}","${itemName}","${supplierName}","${quantity}","${note.replace(/"/g, '""')}"\n`;
          csvContent += csvLine;
        });
      });
      
      // Handle items without supplier info
      const itemsWithoutSupplier = order.items.filter(item => !item.itemId?.supplierId?._id);
      itemsWithoutSupplier.forEach(item => {
        const itemName = item.itemId?.name || 'Articolo non disponibile';
        const supplierName = 'Fornitore non disponibile';
        // Use customUnit if available, otherwise fall back to the default unit
        const unit = item.customUnit || item.itemId?.unit || '';
        const quantity = `${item.quantity} ${unit}`;
        
        const csvLine = `"${dateStr}","${timeStr}","${status}","${itemName}","${supplierName}","${quantity}",""\n`;
        csvContent += csvLine;
      });
    });
    
    // Create a download link and trigger download
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ordini_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Helper function to group order items by supplier
  const getOrderItemsBySupplier = (order) => {
    const supplierGroups = {};
    
    // Group items by supplier
    order.items.forEach(item => {
      if (item.itemId?.supplierId?._id) {
        const supplierId = item.itemId.supplierId._id;
        if (!supplierGroups[supplierId]) {
          supplierGroups[supplierId] = {
            supplier: item.itemId.supplierId,
            items: []
          };
        }
        supplierGroups[supplierId].items.push(item);
      }
    });
    
    return supplierGroups;
  };
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  return (
    <div className="card">
      <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
        <h3>Storico Ordini</h3>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-sm btn-outline-light" 
            onClick={toggleSortOrder}
            title={sortOrder === 'desc' ? 'Ordina dal più vecchio' : 'Ordina dal più recente'}
          >
            <i className={`bi bi-sort-${sortOrder === 'desc' ? 'down' : 'up'}`}></i>
            {sortOrder === 'desc' ? ' Più recenti prima' : ' Più vecchi prima'}
          </button>
          
          <button 
            className="btn btn-sm btn-success" 
            onClick={exportToCSV}
            disabled={filteredOrders.length === 0}
            title="Esporta ordini filtrati in CSV"
          >
            <i className="bi bi-file-earmark-spreadsheet me-1"></i>
            Esporta CSV
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {/* Date filter controls */}
        <div className="date-filter-container mb-4">
          <div className="row g-2 date-controls">
            <div className="col-sm-5 date-control-item">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-calendar-minus"></i></span>
                <input
                  type="date"
                  className="form-control"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  placeholder="Data inizio"
                />
              </div>
            </div>
            <div className="col-sm-5 date-control-item">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-calendar-plus"></i></span>
                <input
                  type="date"
                  className="form-control"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  placeholder="Data fine"
                />
              </div>
            </div>
            <div className="col-sm-2 date-control-item">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={clearDateFilters}
                disabled={!dateRange.startDate && !dateRange.endDate}
              >
                <i className="bi bi-x-circle me-1"></i> Cancella
              </button>
            </div>
          </div>
        </div>
        
        {/* Results summary */}
        <div className="mb-3">
          <small className="text-muted">
            {filteredOrders.length === orders.length ? 
              `Mostrando tutti gli ordini (${orders.length})` : 
              `Mostrando ${filteredOrders.length} di ${orders.length} ordini`
            }
            {(dateRange.startDate || dateRange.endDate) && (
              <span>
                {dateRange.startDate && ` dal ${new Date(dateRange.startDate).toLocaleDateString()}`}
                {dateRange.endDate && ` al ${new Date(dateRange.endDate).toLocaleDateString()}`}
              </span>
            )}
          </small>
        </div>
        
        {/* Orders list */}
        {filteredOrders.length === 0 ? (
          <div className="alert alert-info">
            Nessun ordine trovato nel periodo selezionato.
          </div>
        ) : (
          filteredOrders.map(order => {
            const orderItemsBySupplier = getOrderItemsBySupplier(order);
            const hasNotes = order.supplierNotes && Object.keys(order.supplierNotes).length > 0;
            const isExpanded = expandedOrderNotes[order._id] || false;
            
            return (
              <div key={order._id} className="card order-card mb-3">
                <div className="card-header order-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="order-date">
                      <i className="bi bi-calendar3 me-1"></i>
                      {new Date(order.orderDate).toLocaleDateString()} {new Date(order.orderDate).toLocaleTimeString()}
                    </span>
                    <div className="d-flex gap-2 align-items-center">
                      {hasNotes && (
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => toggleOrderNotes(order._id)}
                          title={isExpanded ? "Nascondi note" : "Mostra note"}
                        >
                          <i className={`bi ${isExpanded ? 'bi-card-text' : 'bi-card-heading'}`}></i>
                          {isExpanded ? ' Nascondi note' : ' Mostra note'}
                        </button>
                      )}
                      <span className={`badge ${order.status === 'pending' ? 'bg-warning' : 'bg-success'}`}>
                        {order.status === 'pending' ? 'In Attesa' : 'Completato'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <table className="table table-striped table-sm order-items-table">
                    <thead>
                      <tr>
                        <th>Articolo</th>
                        <th>Fornitore</th>
                        <th>Quantità</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.itemId?.name || 'Articolo non disponibile'}</td>
                          <td>{item.itemId?.supplierId?.name || 'Fornitore non disponibile'}</td>
                          <td>
                            {item.quantity} {item.customUnit || item.itemId?.unit || ''}
                            {item.customUnit && item.customUnit !== item.itemId?.unit && (
                              <small className="text-muted ms-1">
                                (Unità personalizzata)
                              </small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Supplier Notes Section */}
                  {isExpanded && hasNotes && (
                    <div className="supplier-notes-section mt-3">
                      <h5 className="notes-heading">Note ai Fornitori</h5>
                      <div className="notes-container">
                        {Object.entries(orderItemsBySupplier).map(([supplierId, supplierGroup]) => {
                          const note = order.supplierNotes && order.supplierNotes[supplierId];
                          if (!note) return null;
                          
                          return (
                            <div key={supplierId} className="supplier-note-card">
                              <div className="supplier-note-header">
                                <strong>{supplierGroup.supplier.name}</strong>
                              </div>
                              <div className="supplier-note-content">
                                {note}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default OrderHistory; 