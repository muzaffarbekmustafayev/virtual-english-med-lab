import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { PageHeader, Avatar, EmptyState } from '../../components/ui';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  RiTeamLine, RiAddLine, RiEditLine, RiDeleteBinLine,
  RiCloseLine, RiSearchLine, RiLockPasswordLine, RiUserLine,
  RiMailLine, RiShieldCheckLine, RiUserStarLine, RiUser3Line, RiSparklingLine,
  RiGroupLine, RiCheckLine, RiHospitalLine
} from 'react-icons/ri';

const ROLES = ['student', 'student_all', 'teacher', 'admin'];
const ROLE_BADGE = {
  student:     'badge-blue',
  student_all: 'badge-purple',
  teacher:     'badge-emerald',
  admin:       'badge-amber'
};

function UserModal({ user, onClose, onSaved, specialties, groups }) {
  const { t } = useLanguage();
  const isEditing = !!(user && user.id);
  const [form, setForm] = useState({
    full_name:          user?.full_name || '',
    email:              user?.email || '',
    password:           '',
    role:               user?.role || 'student',
    specialty_id:       user?.specialty_id || '',
    group_id:           user?.group_id || '',
    teacher_group_ids:  (user?.teacherGroups || []).map(g => g.id),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const toggleTeacherGroup = (groupId) => {
    setForm(prev => {
      const exists = prev.teacher_group_ids.includes(groupId);
      return {
        ...prev,
        teacher_group_ids: exists
          ? prev.teacher_group_ids.filter(id => id !== groupId)
          : [...prev.teacher_group_ids, groupId]
      };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isStudentLike = form.role === 'student' || form.role === 'student_all';
      const payload = {
        full_name:    form.full_name.trim(),
        email:        form.email.trim(),
        role:         form.role,
        specialty_id: form.specialty_id ? parseInt(form.specialty_id) : null,
        group_id:     isStudentLike && form.group_id ? parseInt(form.group_id) : null,
        teacher_group_ids: form.role === 'teacher' ? form.teacher_group_ids : undefined,
      };

      if (form.password) {
        payload.password = form.password;
      } else if (!isEditing) {
        setError(t('users_password_required'));
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden transform transition-all">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              {isEditing ? <RiEditLine /> : <RiAddLine />}
            </span>
            {isEditing ? t('admin.users.edit_user') : t('admin.users.add_user_btn')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {error && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2 shrink-0">
            <RiCloseLine className="text-lg" /> {error}
          </div>
        )}

        <form onSubmit={submit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.full_name')} *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiUserLine className="text-slate-400" />
              </div>
              <input
                autoFocus
                placeholder={t('auth.enter_full_name')}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.email')} *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiMailLine className="text-slate-400" />
              </div>
              <input
                type="email"
                placeholder={t('auth.enter_email')}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
              {t('auth.password')}
              {isEditing && <span className="text-[10px] text-slate-400 font-normal px-2 py-0.5 bg-slate-100 rounded-full">{t('users_optional')}</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiLockPasswordLine className="text-slate-400" />
              </div>
              <input
                type="password"
                placeholder={isEditing ? t('users_new_password_ph') : '••••••••'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.role')} *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiShieldCheckLine className="text-slate-400" />
              </div>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-slate-50 focus:bg-white appearance-none font-medium"
              >
                <option value="student">{t('admin_role_student') || "Talaba (Muayyan bitta yo'nalish)"}</option>
                <option value="student_all">🌟 Barcha modulni ko'ra oladigan student (Barcha yo'nalishlar)</option>
                <option value="teacher">{t('role_teacher') || "O'qituvchi"}</option>
                <option value="admin">{t('role_admin') || "Administrator"}</option>
              </select>
            </div>
          </div>

          {/* Student & Student All: Specialty and Single Group selection */}
          {(form.role === 'student' || form.role === 'student_all') && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('auth.specialty')} {form.role === 'student_all' && <span className="text-[10px] text-slate-400 font-normal">({t('default_optional') || "asosiy"})</span>}
                </label>
                <select
                  value={form.specialty_id}
                  onChange={(e) => setForm({ ...form, specialty_id: e.target.value, group_id: '' })}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs bg-slate-50 focus:bg-white font-medium"
                >
                  <option value="">{t('ui_select')}</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.group')}</label>
                <select
                  value={form.group_id}
                  onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs bg-slate-50 focus:bg-white font-medium"
                >
                  <option value="">{t('ui_select')}</option>
                  {groups
                    .filter(g => !form.specialty_id || g.specialty_id == form.specialty_id)
                    .map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Teacher: Specialty (Department) & Multi-Group Assignment */}
          {form.role === 'teacher' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kafedra / Mutaxassislik (Ixtiyoriy)
                </label>
                <select
                  value={form.specialty_id}
                  onChange={(e) => setForm({ ...form, specialty_id: e.target.value })}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-xs bg-slate-50 focus:bg-white font-medium"
                >
                  <option value="">-- Kafedra tanlanmagan --</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    O'qituvchi biriktirilgan guruhlar ({form.teacher_group_ids.length} ta)
                  </label>
                  <span className="text-[10px] text-slate-400">Guruh ustiga bosib tanlang</span>
                </div>

                {groups.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Hali guruhlar yaratilmagan</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {groups.map(g => {
                      const isSelected = form.teacher_group_ids.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleTeacherGroup(g.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <RiGroupLine className="text-xs" />
                          <span>{g.name}</span>
                          {isSelected && <RiCheckLine className="text-xs" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isEditing ? t('common.update') : t('common.create')
              )}
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
  const location = useLocation();
  const navigate = useNavigate();

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
      <div className="space-y-5 sm:space-y-6">
        {/* ── 1. Header ── */}
        <PageHeader
          tone="hero-purple"
          badge={`${users.length} ${t('admin.users.title')}`}
          badgeIcon={RiTeamLine}
          badgeTone="purple"
          title={t('admin.users.title')}
          subtitle={t('admin.users.subtitle')}
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setModalUser({ role: 'student_all' });
                  setShowModal(true);
                }}
                className="btn-primary-gradient bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 shadow-purple-500/25 hover:shadow-purple-500/40 text-xs font-black py-2.5 px-4 cursor-pointer flex items-center gap-2"
                title="Barcha yo'nalishlar va modullarga to'liq kirish huquqiga ega talaba qo'shish"
              >
                <RiSparklingLine className="text-base text-amber-300 animate-pulse" />
                <span>+ Barcha modulni ko'ra oladigan student qo'shish</span>
              </button>
              <button
                onClick={() => {
                  setModalUser(null);
                  setShowModal(true);
                }}
                className="btn-secondary text-xs font-bold py-2.5 px-3.5 cursor-pointer flex items-center gap-1.5"
              >
                <RiAddLine className="text-base" />
                <span>{t('admin.users.add_user_btn') || "Foydalanuvchi qo'shish"}</span>
              </button>
            </div>
          }
        />

        {/* ── 2. Filters & Search ── */}
        <div className="card-standard p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: t('common.all') },
              { key: 'student', label: t('role_students_plural') || 'Talabalar' },
              { key: 'student_all', label: "Barcha yo'nalish talabalari" },
              { key: 'teacher', label: t('role_teachers_plural') || "O'qituvchilar" },
              { key: 'admin', label: t('role_admins_plural') || 'Adminlar' },
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
            <EmptyState icon={RiTeamLine} title={t('users_not_found')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-premium min-w-[640px]">
                <thead>
                  <tr>
                    <th>{t('ui_user')}</th>
                    <th>{t('auth.role')}</th>
                    <th>Mutaxassislik & Biriktirilgan Guruhlar</th>
                    <th className="text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const badgeClass = ROLE_BADGE[u.role] || 'badge-slate';
                    const roleLabel = {
                      student:     t('role_student') || 'Talaba',
                      student_all: t('role_student_all') || 'Talaba (Barcha)',
                      teacher:     t('role_teacher') || "O'qituvchi",
                      admin:       t('role_admin') || 'Administrator',
                    }[u.role] || u.role;

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={u.full_name} seed={u.id} size="w-9 h-9 text-xs" />
                            <div>
                              <p className="font-bold text-slate-900">{u.full_name}</p>
                              <p className="text-[11px] text-slate-400 font-medium">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`badge-standard ${badgeClass}`}>
                            {roleLabel}
                          </span>
                        </td>

                        {/* Specialty & Groups Associations */}
                        <td>
                          {/* 1. Regular Student */}
                          {u.role === 'student' && (
                            <div className="space-y-1">
                              <span className="font-bold text-slate-800 text-xs block">
                                {u.specialty?.name || "Yo'nalishsiz"}
                              </span>
                              {u.group?.name ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                                  <RiGroupLine className="text-xs" /> {u.group.name}
                                </span>
                              ) : (
                                <span className="inline-block text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg font-medium border border-amber-200">
                                  Guruh biriktirilmagan
                                </span>
                              )}
                            </div>
                          )}

                          {/* 2. Student All Specialties */}
                          {u.role === 'student_all' && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 font-bold text-purple-700 text-xs">
                                <RiSparklingLine className="text-amber-500 text-sm" /> Barcha yo'nalishlar (All)
                              </span>
                              {u.group?.name ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200 block w-fit">
                                  <RiGroupLine className="text-xs" /> {u.group.name}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 block font-medium">
                                  Guruhsiz (Mustaqil)
                                </span>
                              )}
                            </div>
                          )}

                          {/* 3. Teacher: Specialty + ALL taught groups */}
                          {u.role === 'teacher' && (
                            <div className="space-y-1.5">
                              {u.specialty?.name && (
                                <span className="text-xs font-bold text-slate-700 block">
                                  {u.specialty.name}
                                </span>
                              )}
                              {u.teacherGroups && u.teacherGroups.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-[280px]">
                                  {u.teacherGroups.map(tg => (
                                    <span key={tg.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                                      <RiGroupLine className="text-xs text-emerald-600" /> {tg.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-block text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg font-medium">
                                  Guruh biriktirilmagan
                                </span>
                              )}
                            </div>
                          )}

                          {/* 4. Admin */}
                          {u.role === 'admin' && (
                            <span className="text-xs font-semibold text-slate-400">Tizim administratori</span>
                          )}
                        </td>

                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setModalUser(u); setShowModal(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title={t('ui_edit')}
                            >
                              <RiEditLine size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={t('ui_delete')}
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
