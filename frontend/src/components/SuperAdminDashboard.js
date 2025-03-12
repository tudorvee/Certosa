import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../api/index';

function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    restaurants: 0,
    users: 0,
    suppliers: 0,
    items: 0,
    orders: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/stats`);
      setStats(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  return (
    <div>
      <h2 className="mb-4">Dashboard Amministrazione</h2>
      
      <div className="row row-cols-1 row-cols-md-3 g-4 mb-4">
        <div className="col">
          <div className="card h-100 bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Ristoranti</h5>
              <p className="card-text display-4">{stats.restaurants}</p>
            </div>
            <div className="card-footer bg-primary border-0">
              <Link to="/restaurants" className="btn btn-outline-light btn-sm">Gestisci</Link>
            </div>
          </div>
        </div>
        
        <div className="col">
          <div className="card h-100 bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Utenti</h5>
              <p className="card-text display-4">{stats.users}</p>
            </div>
            <div className="card-footer bg-success border-0">
              <Link to="/system-users" className="btn btn-outline-light btn-sm">Gestisci</Link>
            </div>
          </div>
        </div>
        
        <div className="col">
          <div className="card h-100 bg-info text-white">
            <div className="card-body">
              <h5 className="card-title">Ordini Totali</h5>
              <p className="card-text display-4">{stats.orders}</p>
            </div>
            <div className="card-footer bg-info border-0">
              <Link to="/system-orders" className="btn btn-outline-light btn-sm">Visualizza</Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3>Azioni Rapide</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <Link to="/restaurants/new" className="btn btn-primary mb-2 w-100">
                <i className="bi bi-plus-circle me-2"></i> Nuovo Ristorante
              </Link>
            </div>
            <div className="col-md-6">
              <Link to="/system-users/new" className="btn btn-success mb-2 w-100">
                <i className="bi bi-person-plus me-2"></i> Nuovo Utente di Sistema
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard; 