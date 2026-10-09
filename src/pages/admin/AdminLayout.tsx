import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/cn';
import { PageHeader } from '../../components/PageHeader';

const tabCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-4 py-1.5 text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/60',
    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white',
  );

/** Guard + shared header for every /admin screen. */
export function AdminLayout() {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <>
      <PageHeader title="Administration" description="Users, articles and activity across PostPrep." />
      <nav aria-label="Admin sections" className="mb-8 inline-flex rounded-full border border-white/10 bg-black/20 p-1">
        <NavLink to="/admin" end className={tabCls}>
          Overview
        </NavLink>
        <NavLink to="/admin/users" className={tabCls}>
          Users
        </NavLink>
        <NavLink to="/admin/articles" className={tabCls}>
          Articles
        </NavLink>
      </nav>
      <Outlet />
    </>
  );
}
