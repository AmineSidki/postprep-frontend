import { useEffect, useMemo, useState } from 'react';
import { Eye, Search, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/cn';
import { shortId } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import type { AppUserDTO, ArticleStatus, LiteArticle } from '../../types';
import { ArticleModal } from '../../components/ArticleModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageSpinner } from '../../components/Spinner';
import { Segmented } from '../../components/Segmented';
import { STATUS_FILTERS, StatusBadge } from '../../components/StatusBadge';

export function AdminArticles() {
  const toast = useToast();
  const [articles, setArticles] = useState<LiteArticle[] | null>(null);
  const [owners, setOwners] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<'ALL' | ArticleStatus>('ALL');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LiteArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    // Articles only carry the owner's id, so users are loaded alongside to show names instead.
    Promise.all([api.get<LiteArticle[]>('/admin/articles'), api.get<AppUserDTO[]>('/admin/users').catch(() => null)])
      .then(([a, u]) => {
        if (!alive) return;
        setArticles(a.data);
        if (u) setOwners(new Map(u.data.map((x) => [x.id, x.username || x.email])));
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const ownerName = (id: string) => owners.get(id) ?? `#${shortId(id)}`;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (articles ?? []).filter(
      (a) => (filter === 'ALL' || a.status === filter) && (!q || (a.title ?? '').toLowerCase().includes(q) || (owners.get(a.owner) ?? '').toLowerCase().includes(q)),
    );
  }, [articles, filter, query, owners]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/articles/${pendingDelete.id}`);
      setArticles((prev) => prev?.filter((a) => a.id !== pendingDelete.id) ?? prev);
      setPendingDelete(null);
      toast.success('Article deleted.');
    } catch {
      toast.error('Could not delete the article.');
    } finally {
      setDeleting(false);
    }
  };

  if (error) return <p className="glass px-6 py-16 text-center text-white">We couldn't load the articles.</p>;
  if (!articles) return <PageSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Filter by status" value={filter} onChange={setFilter} options={STATUS_FILTERS} />
        <div className="relative w-full sm:w-72">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="search" aria-label="Search articles" placeholder="Search title or owner…" className="field !rounded-full !py-2 pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="eyebrow px-5 py-3 font-normal">Title</th>
                <th className="eyebrow px-5 py-3 font-normal">Status</th>
                <th className="eyebrow hidden px-5 py-3 font-normal md:table-cell">Owner</th>
                <th className="px-5 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center italic text-slate-400">
                    {articles.length === 0 ? 'No articles yet.' : 'No articles match.'}
                  </td>
                </tr>
              ) : (
                visible.map((a) => (
                  <tr key={a.id} className="transition hover:bg-white/[0.03]">
                    <td className="max-w-[16rem] px-5 py-3.5 sm:max-w-md">
                      <span className={cn('block truncate font-medium', a.title ? 'text-white' : 'italic text-slate-400')}>{a.title || 'Untitled document'}</span>
                      <span className="block truncate text-xs text-slate-500 md:hidden">{ownerName(a.owner)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="hidden px-5 py-3.5 text-slate-400 md:table-cell">{ownerName(a.owner)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button className="icon-btn" aria-label={`View ${a.title || 'article'}`} onClick={() => setOpenId(a.id)}>
                          <Eye size={15} />
                        </button>
                        <button className="icon-btn hover:!bg-red-500/15 hover:!text-red-200" aria-label={`Delete ${a.title || 'article'}`} onClick={() => setPendingDelete(a)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ArticleModal id={openId} onClose={() => setOpenId(null)} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this article?"
        message={<>“{pendingDelete?.title || 'Untitled document'}” will be permanently removed for its owner too.</>}
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
