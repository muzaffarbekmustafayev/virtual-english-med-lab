import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { RiTeamLine, RiAddLine, RiEditLine, RiDeleteBinLine, RiCloseLine } from 'react-icons/ri';

const ROLES = ['student', 'teacher', 'admin'];
const ROLE_BADGE = { student: 'bg-indigo-100 text-indigo-700', teacher: 'bg-emerald-100 text-emerald-700', admin: 'bg-purple-100 text-purple-700' };

function UserModal({ onClose, onSaved, specialties, groups }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student', specialty_id: '', group_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await api.post('/admin/users', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Xatolik'); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 shadow-xl rounded-2xl p-6 w-full max-w-md animate-scale-in">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-semibold text-gray-900">Yangi Foydalanuvchi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><RiCloseLine /></button>
        </div>
        {error && <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-600 border border-red-100 text-xs">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input placeholder="Ism Familiya" required className={inputCls} value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
          <input type="email" placeholder="Email" required className={inputCls} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input type="password" placeholder="Parol (min 6 belgi)" required minLength={6} className={inputCls} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <select className={inputCls} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {form.role === 'student' && <>
            <select className={inputCls} value={form.specialty_id} onChange={e => setForm({...form, specialty_id: e.target.value})}>
              <option value="">Mutaxassislik tanlang</option>
              {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className={inputCls} value={form.group_id} onChange={e => setForm({...form, group_id: e.target.value})}>
              <option value="">Guruh tanlang</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">Bekor</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50">
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers]           = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [groups, setGroups]         = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [filter, setFilter]         = useState('');
  const [loading, setLoading]       = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/specialties'),
      api.get('/admin/groups'),
    ]).then(([u, s, g]) => {
      setUsers(u.data); setSpecialties(s.data); setGroups(g.data);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const deleteUser = async (id) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
    await api.delete(`/admin/users/${id}`); load();
  };

  const filtered = filter ? users.filter(u => u.role === filter) : users;

  return (
    <Layout>
      {showModal && <UserModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} specialties={specialties} groups={groups} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RiTeamLine className="text-purple-500" /> Foydalanuvchilar
        </h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all">
          <RiAddLine /> Yangi foydalanuvchi
        </button>
      </div>

      {/* Role filter */}
      <div className="flex gap-2 mb-4">
        {['', ...ROLES].map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shadow-sm ${
              filter === r ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}>
            {r || 'Hammasi'} {r && `(${users.filter(u=>u.role===r).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                {['Foydalanuvchi','Rol','Guruh','Sana','Amallar'].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 font-semibold px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">{u.full_name[0]}</div>
                      <div>
                        <p className="text-sm text-gray-900 font-medium">{u.full_name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">{u.group?.name || '—'}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <RiDeleteBinLine />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
