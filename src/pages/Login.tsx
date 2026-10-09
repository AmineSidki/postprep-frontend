import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/api';
import { todayLabel } from '../lib/format';
import { PageSpinner, Spinner } from '../components/Spinner';

type Mode = 'signin' | 'signup';

const OUTPUTS = [
  ['Summary', 'The argument of a document in one paragraph.'],
  ['Keywords', 'The handful of terms it is really about.'],
  ['Categories', 'Where it belongs, with a ready-to-use SEO title.'],
];

export function Login() {
  const { user, loading, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading) return <PageSpinner />;
  if (user) return <Navigate to="/" replace />;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await register(username, email, password);
        try {
          await login(email, password);
        } catch {
          switchMode('signin');
          setNotice('Account created. Please sign in.');
        }
      }
    } catch (err) {
      setError(
        errorMessage(
          err,
          mode === 'signin'
            ? 'Incorrect email or password.'
            : 'Could not create the account. The email or username may already be in use.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="grid w-full max-w-5xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <section className="glass animate-fade-in p-8 sm:p-10">
          <p className="eyebrow">{mode === 'signin' ? 'Welcome back' : 'Get started'}</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
            PostPrep<span className="text-pink-400">.</span>
          </h1>

          {error && (
            <p role="alert" className="mt-6 rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="mt-6 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {notice}
            </p>
          )}

          <form onSubmit={submit} className="mt-8 space-y-5">
            {mode === 'signup' && (
              <div>
                <label htmlFor="username" className="eyebrow mb-2 block">
                  Username
                </label>
                <input id="username" className="field" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            )}
            <div>
              <label htmlFor="email" className="eyebrow mb-2 block">
                Email
              </label>
              <input id="email" type="email" className="field" autoComplete="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password" className="eyebrow mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="field pr-12"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="icon-btn absolute right-1.5 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn btn-primary w-full py-3">
              {busy && <Spinner size={16} />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-400">
            {mode === 'signin' ? 'New here?' : 'Already have an account?'}
            <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="ml-2 font-medium text-pink-300 underline-offset-4 hover:text-white hover:underline">
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </section>

        <section className="hidden md:block">
          <p className="eyebrow">{todayLabel()}</p>
          <h2 className="mt-4 text-5xl font-medium leading-[1.1] tracking-tight text-white">
            Long documents,
            <br />
            <span className="bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">short answers.</span>
          </h2>
          <p className="mt-5 max-w-sm italic text-slate-400">Upload a PDF or paste text. PostPrep reads it and hands back:</p>
          <dl className="mt-8 max-w-sm divide-y divide-white/10 border-y border-white/10">
            {OUTPUTS.map(([term, description], i) => (
              <div key={term} className="flex gap-4 py-4">
                <dt className="w-6 text-slate-500">{String(i + 1).padStart(2, '0')}</dt>
                <dd>
                  <span className="font-medium text-white">{term}</span>
                  <span className="mt-0.5 block text-slate-400">{description}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
