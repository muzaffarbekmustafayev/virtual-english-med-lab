import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../../components/LanguageSelector';
import {
  RiHeartPulseLine, RiUser3Line, RiMailLine,
  RiLockPasswordLine, RiEyeLine, RiEyeOffLine,
  RiLoader4Line, RiStethoscopeLine, RiGroupLine
} from 'react-icons/ri';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', specialty_id: '', group_id: '' });
  const [specialties, setSpecialties] = useState([]);
  const [groups,      setGroups]      = useState([]);
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    api.get('/auth/specialties').then(r => setSpecialties(r.data || [])).catch(() => {});
    api.get('/auth/groups').then(r => setGroups(r.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', { ...form, role: 'student' });
      toast.success(t('common.success') + '! ' + t('auth.login_title'));
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error || t('common.error');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 relative">
      {/* Top right language toggle */}
      <div className="absolute top-5 right-5 z-20">
        <LanguageSelector variant="compact" />
      </div>

      <div className="w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 mb-3 shadow-lg shadow-blue-500/20 text-white">
            <RiHeartPulseLine className="text-3xl" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('auth.register_title')}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{t('auth.register_subtitle')}</p>
        </div>

        <div className="card-standard p-7 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.full_name')} *</label>
              <div className="relative">
                <RiUser3Line className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type="text"
                  placeholder={t('auth.enter_full_name')}
                  required
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="input-standard pl-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.email')} *</label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type="email"
                  placeholder={t('auth.enter_email')}
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-standard pl-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.password')} *</label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-standard pl-10 pr-10 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.specialty')}</label>
              <select
                value={form.specialty_id}
                onChange={e => setForm({ ...form, specialty_id: e.target.value })}
                className="input-standard text-xs sm:text-sm"
              >
                <option value="">{t('auth.select_specialty')}</option>
                {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Group */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.group')}</label>
              <select
                value={form.group_id}
                onChange={e => setForm({ ...form, group_id: e.target.value })}
                className="input-standard text-xs sm:text-sm"
              >
                <option value="">{t('auth.select_group')}</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-gradient py-3 text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RiLoader4Line className="animate-spin text-base" />
                  {t('auth.registering')}
                </span>
              ) : t('auth.sign_up_btn')}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 font-medium">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
              {t('auth.sign_in_btn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
