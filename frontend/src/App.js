import React from 'react';
import { useLocation } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { PvcOptionsProvider } from './components/PvcOptionsContext';
import { MalzemeOptionsProvider } from './components/MalzemeOptionsContext';
import Header from './components/Header';
import Login from './components/Login';
import FormList from './components/FormList';
import FormEntry from './components/FormEntry';
import FormDetail from './components/FormDetail';
import FormQuery from './components/FormQuery';
import AdminPvcTipleri from './components/AdminPvcTipleri';
import AdminMalzemeTipleri from './components/AdminMalzemeTipleri';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Yükleniyor…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Yalnızca admin rolüne açık route koruması
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Yükleniyor…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Shell() {
  return (
    <PvcOptionsProvider>
      <MalzemeOptionsProvider>
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
              path="/admin/pvc-tipleri"
              element={
                <AdminRoute>
                  <AdminPvcTipleri />
                </AdminRoute>
              }
            />
              <Route
                path="/admin/malzeme-tipleri"
                element={
                  <AdminRoute>
                    <AdminMalzemeTipleri />
                  </AdminRoute>
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
      </MalzemeOptionsProvider>
    </PvcOptionsProvider>
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