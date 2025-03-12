import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, error } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // If already logged in, redirect to home
  if (isAuthenticated) {
    navigate('/');
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      console.log("Key pressed on login page:", e.key);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3>Accedi</h3>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">Accedi</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; 