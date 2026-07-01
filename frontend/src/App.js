import React from 'react';
import { useLocation } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Header from './components/Header';
import Login from './components/Login';
import FormList from './components/FormList';
import FormEntry from './components/FormEntry';
import FormDetail from './components/FormDetail';
import FormQuery from './components/FormQuery';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Yükleniyor…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Shell() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <FormList />
              </PrivateRoute>
            }
          />
          <Route
            path="/forms/new"
            element={<FormEntry />}
          />
          <Route
            path="/forms/:id"
            element={
              <PrivateRoute>
                <FormDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/query"
            element={<FormQuery />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function PublicLoginShell() {
  return (
    <div className="public-shell">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function AppContent() {
  const location = useLocation();

  if (location.pathname === '/login') {
    return <PublicLoginShell />;
  }

  return <Shell />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}