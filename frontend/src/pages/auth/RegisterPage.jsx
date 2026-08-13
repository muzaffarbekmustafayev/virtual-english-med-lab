import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { RiStethoscopeLine, RiUser3Line, RiMailLine, RiLockPasswordLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', specialty_id: '', group_id: '' });
  const [specialties, setSpecialties] = useState([]);
  const [groups,      setGroups]      = useState([]);
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    api.get('/auth/specialties').then(r => setSpecialties(r.data)).catch(() => {});
    api.get('/auth/groups').then(r => setGroups(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', { ...form, role: 'student' });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || "Ro'yxatdan o'tish muvaffaqiyatsiz");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all";
  const selectCls = "w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
      style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), #f8fafc' }}>

      <div className="w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 mb-4 shadow-lg shadow-indigo-500/25">
            <RiStethoscopeLine className="text-3xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ro'yxatdan o'tish</h1>
          <p className="text-gray-500 text-sm mt-1">Talaba sifatida hisob yarating</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ism-Familiya</label>
              <div className="relative">
                <RiUser3Line className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Jasur Toshmatov" required
                  className={inputCls} value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="email@example.com" required
                  className={inputCls} value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Parol</label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" required minLength={6}
                  className={inputCls.replace('pr-4', 'pr-10')} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Mutaxassislik</label>
              <select className={selectCls} value={form.specialty_id}
                onChange={e => setForm({ ...form, specialty_id: e.target.value })}
                style={{ background: 'white' }}>
                <option value="">Tanlang...</option>
                {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Group */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Akademik guruh</label>
              <select className={selectCls} value={form.group_id}
                onChange={e => setForm({ ...form, group_id: e.target.value })}
                style={{ background: 'white' }}>
                <option value="">Tanlang...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 text-white transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 mt-2">
              {loading ? 'Yaratilmoqda...' : "Hisob yaratish"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-5">
            Hisobingiz bormi?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Kirish</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
