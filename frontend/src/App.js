import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PatentSubmission from './pages/PatentSubmission';
import PatentAnalysis from './pages/PatentAnalysis';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    onLoad();
  }, []);

  async function onLoad() {
    try {
      const session = await Auth.currentSession();
      const userInfo = await Auth.currentUserInfo();
      setIsAuthenticated(true);
      setUser(userInfo);
    } catch (e) {
      if (e !== 'No current user') {
        console.error(e);
      }
    }
    setIsAuthenticating(false);
  }

  async function handleLogout() {
    await Auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  }

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  // Admin route component
  const AdminRoute = ({ children }) => {
    if (!isAuthenticated || !user || user.attributes['custom:role'] !== 'admin') {
      return <Navigate to="/dashboard" />;
    }
    return children;
  };

  return (
    !isAuthenticating && (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="App">
          <Header 
            isAuthenticated={isAuthenticated} 
            user={user} 
            handleLogout={handleLogout} 
          />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} />
              <Route path="/signup" element={<Signup />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard user={user} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/submit" 
                element={
                  <ProtectedRoute>
                    <PatentSubmission user={user} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analysis/:id" 
                element={
                  <ProtectedRoute>
                    <PatentAnalysis user={user} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminPanel user={user} />
                  </AdminRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ThemeProvider>
    )
  );
}

export default App;