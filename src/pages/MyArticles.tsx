import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, RefreshCw, Search, Trash2 } from 'lucide-react';
import { api, statusOf } from '../lib/api';
import { cn } from '../lib/cn';
import { shortId } from '../lib/format';
import { useToast } from '../context/ToastContext';
import type { ArticleStatus, LiteArticle } from '../types';
import { ArticleModal } from '../components/ArticleModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageHeader } from '../components/PageHeader';
import { Segmented } from '../components/Segmented';
import { STATUS_FILTERS, StatusBadge } from '../components/StatusBadge';

export function MyArticles() {
  const toast = useToast();
  const [articles, setArticles] = useState<LiteArticle[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | ArticleStatus>('ALL');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LiteArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get<LiteArticle[]>('/article/myArticles');
      setArticles(data);
      setError(false);
    } catch {
      if (!silent) setError(true);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // While anything is still being analysed, quietly refresh the list.
  const hasProcessing = articles?.some((a) => a.status === 'PROCESSING') ?? false;
  useEffect(() => {
    if (!hasProcessing) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [hasProcessing, load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (articles ?? []).filter((a) => (filter === 'ALL' || a.status === filter) && (!q || (a.title ?? '').toLowerCase().includes(q)));
  }, [articles, filter, query]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/article/delete/${pendingDelete.id}`);
      setArticles((prev) => prev?.filter((a) => a.id !== pendingDelete.id) ?? prev);
      setPendingDelete(null);
      toast.success('Article deleted.');
    } catch (err) {
      toast.error(statusOf(err) === 403 ? "You can't delete this article." : 'Could not delete the article.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My articles"
        description={articles ? `${articles.length} ${articles.length === 1 ? 'document' : 'documents'} analyzed.` : undefined}
        actions={
          <button className="btn btn-ghost" onClick={() => void load()} disabled={refreshing}>
            <RefreshCw size={15} className={cn(refreshing && 'animate-spin')} />
            Refresh
          </button>
        }
      />

      {articles === null && !error ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading articles">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : error && articles === null ? (
        <div className="glass px-6 py-16 text-center">
          <p className="text-white">We couldn't load your articles.</p>
          <button className="btn btn-ghost mt-4" onClick={() => void load()}>
            Try again
          </button>
        </div>
      ) : articles && articles.length === 0 ? (
        <div className="glass px-6 py-16 text-center">
          <p className="text-white">Nothing here yet.</p>
          <p className="mt-1 italic text-slate-400">Documents you analyze will be listed here.</p>
          <Link to="/" className="btn btn-primary mt-6">
            Start an analysis
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Segmented label="Filter by status" value={filter} onChange={setFilter} options={STATUS_FILTERS} />
            <div className="relative w-full sm:w-64">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="search" aria-label="Search by title" placeholder="Search titles…" className="field !rounded-full !py-2 pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="glass px-6 py-12 text-center italic text-slate-400">No articles match.</p>
          ) : (
            <ul className="glass divide-y divide-white/10 overflow-hidden">
              {visible.map((a, i) => (
                <li key={a.id} className="group flex items-center gap-2 pr-3 transition hover:bg-white/[0.04]">
                  <button onClick={() => setOpenId(a.id)} className="flex min-w-0 flex-1 items-center gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-300/50">
                    <span className="hidden w-6 text-slate-600 sm:block">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate font-medium', a.title ? 'text-white' : 'italic text-slate-400')}>
                        {a.title || (a.status === 'PROCESSING' ? 'Analyzing…' : 'Untitled document')}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">#{shortId(a.id)}</span>
                    </span>
                    <StatusBadge status={a.status} />
                    <ChevronRight size={16} className="hidden text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-300 sm:block" />
                  </button>
                  <button onClick={() => setPendingDelete(a)} aria-label={`Delete ${a.title || 'article'}`} className="icon-btn hover:!bg-red-500/15 hover:!text-red-200">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ArticleModal id={openId} onClose={() => setOpenId(null)} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this article?"
        message={<>“{pendingDelete?.title || 'Untitled document'}” and its analysis will be permanently removed.</>}
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
