import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  RiTeamLine, RiAddLine, RiEditLine, RiDeleteBinLine,
  RiCloseLine, RiSearchLine, RiLockPasswordLine, RiUserLine,
  RiMailLine, RiShieldCheckLine, RiUserStarLine, RiUser3Line
} from 'react-icons/ri';

const ROLES = ['student', 'teacher', 'admin'];
const ROLE_BADGE = {
  student: 'badge-blue',
  teacher: 'badge-emerald',
  admin:   'badge-purple'
};

function UserModal({ user, onClose, onSaved, specialties, groups }) {
  const { t } = useLanguage();
  const isEditing = !!user;
  const [form, setForm] = useState({
    full_name:    user?.full_name || '',
    email:        user?.email || '',
    password:     '',
    role:         user?.role || 'student',
    specialty_id: user?.specialty_id || '',
    group_id:     user?.group_id || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        full_name:    form.full_name.trim(),
        email:        form.email.trim(),
        role:         form.role,
        specialty_id: form.role === 'student' && form.specialty_id ? parseInt(form.specialty_id) : null,
        group_id:     form.role === 'student' && form.group_id ? parseInt(form.group_id) : null,
      };

      if (form.password) {
        payload.password = form.password;
      } else if (!isEditing) {
        setError(t('auth.password') + ' talab qilinadi');
        setLoading(false);
        return;
      }

      if (isEditing) {
        await api.put(`/admin/users/${user.id}`, payload);
      } else {
        await api.post('/admin/users', payload);
      }

      toast.success(t('common.success'));
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 sm:p-7 w-full max-w-md animate-scale-in">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl ${isEditing ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
              {isEditing ? <RiEditLine size={18} /> : <RiAddLine size={18} />}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                {isEditing ? t('admin.users.edit_user') : t('admin.users.add_user_btn')}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <RiCloseLine size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.full_name')} *</label>
            <input
              placeholder={t('auth.enter_full_name')}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              className="input-standard text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.email')} *</label>
            <input
              type="email"
              placeholder={t('auth.enter_email')}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="input-standard text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('auth.password')} {isEditing && <span className="text-[10px] text-slate-400 font-normal">(O'zgartirish shart emas)</span>}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-standard text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.role')} *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input-standard text-xs font-bold"
            >
              <option value="student">Talaba / Student</option>
              <option value="teacher">O'qituvchi / Teacher</option>
              <option value="admin">Administrator / Admin</option>
            </select>
          </div>

          {form.role === 'student' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.specialty')}</label>
                <select
                  value={form.specialty_id}
                  onChange={(e) => setForm({ ...form, specialty_id: e.target.value })}
                  className="input-standard text-xs"
                >
                  <option value="">Tanlang...</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.group')}</label>
                <select
                  value={form.group_id}
                  onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                  className="input-standard text-xs"
                >
                  <option value="">Tanlang...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary-soft"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary-gradient"
            >
              {loading ? t('common.loading') : isEditing ? t('common.update') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers]             = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [groups, setGroups]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('all');
  const [modalUser, setModalUser]     = useState(null);
  const [showModal, setShowModal]     = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, sRes, gRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/specialties').catch(() => ({ data: [] })),
        api.get('/admin/groups').catch(() => ({ data: [] })),
      ]);
      setUsers(uRes.data || []);
      setSpecialties(sRes.data || []);
      setGroups(gRes.data || []);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.confirm_delete'))) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success(t('common.success'));
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  const filtered = users
    .filter(u => roleFilter === 'all' ? true : u.role === roleFilter)
    .filter(u => search.trim() ? (u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())) : true);

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── 1. Header ── */}
        <div className="card-standard p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-standard badge-blue">
                {users.length} {t('admin.users.title')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xl shrink-0">
                <RiTeamLine />
              </span>
              {t('admin.users.title')}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{t('admin.users.subtitle')}</p>
          </div>

          <button
            onClick={() => { setModalUser(null); setShowModal(true); }}
            className="btn-primary-gradient"
          >
            <RiAddLine className="text-base" />
            <span>{t('admin.users.add_user_btn')}</span>
          </button>
        </div>

        {/* ── 2. Filters & Search ── */}
        <div className="card-standard p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: t('common.all') },
              { key: 'student', label: 'Talabalar' },
              { key: 'teacher', label: "O'qituvchilar" },
              { key: 'admin', label: 'Adminlar' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setRoleFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === f.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-standard pl-9 py-2 text-xs"
            />
          </div>
        </div>

        {/* ── 3. Table ── */}
        <div className="card-standard overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              Foydalanuvchilar topilmadi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3">Foydalanuvchi</th>
                    <th className="px-5 py-3">{t('auth.role')}</th>
                    <th className="px-5 py-3">{t('auth.specialty')} / {t('auth.group')}</th>
                    <th className="px-5 py-3 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filtered.map(u => {
                    const badgeClass = ROLE_BADGE[u.role] || 'badge-slate';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-2xs shrink-0">
                              {u.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{u.full_name}</p>
                              <p className="text-[11px] text-slate-400 font-medium">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`badge-standard ${badgeClass}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">
                          {u.role === 'student' ? (
                            <span>{u.specialty?.name || '—'} {u.group?.name ? `(${u.group.name})` : ''}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setModalUser(u); setShowModal(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Tahrirlash"
                            >
                              <RiEditLine size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="O'chirish"
                            >
                              <RiDeleteBinLine size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Modal */}
        {showModal && (
          <UserModal
            user={modalUser}
            onClose={() => setShowModal(false)}
            onSaved={() => { setShowModal(false); loadData(); }}
            specialties={specialties}
            groups={groups}
          />
        )}
      </div>
    </Layout>
  );
}
