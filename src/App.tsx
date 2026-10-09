import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Background } from './components/Background';
import { Navbar } from './components/Navbar';
import { PageSpinner } from './components/Spinner';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MyArticles } from './pages/MyArticles';
import { AdminLayout } from './pages/admin/AdminLayout';

// Admin screens are rarely opened by most users, so they load on demand.
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminArticles = lazy(() => import('./pages/admin/AdminArticles').then((m) => ({ default: m.AdminArticles })));

/** Protects private routes and wraps them in the navbar. */
function PrivateLayout() {
  const { user, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Background />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<PrivateLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="my-articles" element={<MyArticles />} />

              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="articles" element={<AdminArticles />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
