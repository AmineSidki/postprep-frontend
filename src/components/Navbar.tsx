import { Link, NavLink } from 'react-router-dom';
import { FilePlus2, Library, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/60',
    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white',
  );

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          PostPrep<span className="text-pink-400">.</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          <NavLink to="/" end className={linkCls} aria-label="New analysis">
            <FilePlus2 size={16} />
            <span className="hidden sm:inline">New analysis</span>
          </NavLink>
          <NavLink to="/my-articles" className={linkCls} aria-label="My articles">
            <Library size={16} />
            <span className="hidden sm:inline">My articles</span>
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin" className={linkCls} aria-label="Admin">
              <ShieldCheck size={16} />
              <span className="hidden sm:inline">Admin</span>
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user?.email && <span className="hidden max-w-[14rem] truncate text-xs text-slate-400 md:block">{user.email}</span>}
          <button onClick={() => void logout()} className="icon-btn border border-white/10" aria-label="Sign out" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
