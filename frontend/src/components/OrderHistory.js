import React, { useState, useEffect } from 'react';
import axios from 'axios';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    axios.get('http://localhost:5001/api/orders')
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setLoading(false);
      });
  }, []);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="card">
      <div className="card-header bg-info text-white">
        <h3>Storico Ordini</h3>
      </div>
      <div className="card-body">
        {orders.length === 0 ? (
          <p>Nessun ordine trovato.</p>
        ) : (
          orders.map(order => (
            <div key={order._id} className="card mb-3">
              <div className="card-header">
                <strong>Data Ordine:</strong> {new Date(order.orderDate).toLocaleString()}
                <span className="badge bg-secondary float-end">{order.status}</span>
              </div>
              <div className="card-body">
                <table className="table table-striped">
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