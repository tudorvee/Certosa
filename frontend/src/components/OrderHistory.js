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
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  return (
    <div className="card">
      <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
        <h3>Storico Ordini</h3>
        <button 
          className="btn btn-sm btn-outline-light" 
          onClick={toggleSortOrder}
          title={sortOrder === 'desc' ? 'Ordina dal più vecchio' : 'Ordina dal più recente'}
        >
          <i className={`bi bi-sort-${sortOrder === 'desc' ? 'down' : 'up'}`}></i>
          {sortOrder === 'desc' ? ' Più recenti prima' : ' Più vecchi prima'}
        </button>
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
          filteredOrders.map(order => (
            <div key={order._id} className="card order-card mb-3">
              <div className="card-header order-header">
                <span className="order-date">
                  <i className="bi bi-calendar3 me-1"></i>
                  {new Date(order.orderDate).toLocaleDateString()} {new Date(order.orderDate).toLocaleTimeString()}
                </span>
                <span className={`badge ${order.status === 'pending' ? 'bg-warning' : 'bg-success'}`}>
                  {order.status === 'pending' ? 'In Attesa' : 'Completato'}
                </span>
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
                        <td>{item.quantity} {item.itemId?.unit || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OrderHistory; 