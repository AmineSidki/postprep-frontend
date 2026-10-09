import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { cn } from '../../lib/cn';
import { initial } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { AppUserDTO } from '../../types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Modal } from '../../components/Modal';
import { PageSpinner, Spinner } from '../../components/Spinner';

function EditUserModal({ user, onClose, onSaved }: { user: AppUserDTO | null; onClose: () => void; onSaved: (u: AppUserDTO) => void }) {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      // id and role are read-only server-side; they are sent back unchanged so the body is a complete AppUserDTO.
      const { data } = await api.put<AppUserDTO>(`/admin/users/${user.id}`, { ...user, username: username.trim(), email: email.trim() });
      onSaved(data);
      toast.success('User updated.');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the user. The username or email may already be taken.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={user !== null}
      onClose={saving ? () => undefined : onClose}
      title="Edit user"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="edit-user" className="btn btn-primary" disabled={saving || !username.trim() || !email.trim()}>
            {saving && <Spinner size={16} />}
            Save
          </button>
        </>
      }
    >
      <form id="edit-user" onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="edit-username" className="eyebrow mb-2 block">
            Username
          </label>
          <input id="edit-username" className="field" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="edit-email" className="eyebrow mb-2 block">
            Email
          </label>
          <input id="edit-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <p className="text-xs italic text-slate-500">Roles can't be changed from here.</p>
      </form>
    </Modal>
  );
}

export function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<AppUserDTO[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AppUserDTO | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AppUserDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get<AppUserDTO[]>('/admin/users')
      .then((r) => setUsers(r.data))
      .catch(() => setError(true));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? []).filter((u) => !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, query]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${pendingDelete.id}`);
      setUsers((prev) => prev?.filter((u) => u.id !== pendingDelete.id) ?? prev);
      setPendingDelete(null);
      toast.success('User deleted.');
    } catch {
      toast.error('Could not delete the user.');
    } finally {
      setDeleting(false);
    }
  };

  if (error) return <p className="glass px-6 py-16 text-center text-white">We couldn't load the users.</p>;
  if (!users) return <PageSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="relative mb-4 sm:w-80">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="search" aria-label="Search users" placeholder="Search username or email…" className="field !rounded-full !py-2 pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="eyebrow px-5 py-3 font-normal">User</th>
                <th className="eyebrow px-5 py-3 font-normal">Role</th>
                <th className="eyebrow hidden px-5 py-3 font-normal md:table-cell">Email</th>
                <th className="px-5 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center italic text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isMe = !!me?.email && u.email?.toLowerCase() === me.email.toLowerCase();
                  return (
                    <tr key={u.id} className="transition hover:bg-white/[0.03]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-wine to-purple-600 text-xs font-semibold text-white">{initial(u.username || u.email)}</span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-white">
                              {u.username || 'Unknown'}
                              {isMe && <span className="ml-2 text-xs font-normal italic text-slate-500">you</span>}
                            </span>
                            <span className="block truncate text-xs text-slate-500 md:hidden">{u.email}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('chip !px-2.5 !py-0.5 text-[11px]', u.role === 'ADMIN' && 'border-purple-300/25 bg-purple-400/10 text-purple-200')}>{u.role}</span>
                      </td>
                      <td className="hidden px-5 py-3.5 text-slate-400 md:table-cell">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button className="icon-btn" aria-label={`Edit ${u.username}`} onClick={() => setEditing(u)}>
                            <Pencil size={15} />
                          </button>
                          <button className="icon-btn hover:!bg-red-500/15 hover:!text-red-200" aria-label={`Delete ${u.username}`} disabled={isMe} title={isMe ? "You can't delete your own account" : undefined} onClick={() => setPendingDelete(u)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={(saved) => setUsers((prev) => prev?.map((u) => (u.id === saved.id ? saved : u)) ?? prev)} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this user?"
        message={<>{pendingDelete?.username} will be removed along with all of their articles. This can't be undone.</>}
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
