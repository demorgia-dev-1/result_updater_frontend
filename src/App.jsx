import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import UpdateCandidateResult from './components/HomePage';
import { Toaster } from 'react-hot-toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // app
  return (
    <>
      <Toaster position='top-right' toastOptions={{
        duration: 6000,
      }} />
      <Router>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/update-result" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/update-result" element={isAuthenticated ? <UpdateCandidateResult /> : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;