import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from './components/Navbar';
import OrderForm from './components/OrderForm';
import OrderHistory from './components/OrderHistory';
import SupplierManagement from './components/SupplierManagement';
import ItemManagement from './components/ItemManagement';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<OrderForm />} />
            <Route path="/history" element={<OrderHistory />} />
            <Route path="/suppliers" element={<SupplierManagement />} />
            <Route path="/items" element={<ItemManagement />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; 