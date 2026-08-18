import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../../components/LanguageSelector';
import {
  RiHeartPulseLine, RiUser3Line, RiMailLine,
  RiLockPasswordLine, RiEyeLine, RiEyeOffLine,
  RiLoader4Line, RiStethoscopeLine, RiGroupLine,
  RiArrowRightLine, RiShieldCheckLine
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
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { ...form, role: 'student' });
      toast.success((t('common.success') || "Ro'yxatdan o'tildi") + '! ' + t('auth.login_title'));
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error || t('common.error') || "Ro'yxatdan o'tishda xatolik";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/70 p-4 sm:p-6 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Top right language toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <LanguageSelector variant="compact" />
      </div>

      {/* Decorative ambient background blurs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[480px] animate-scale-in relative z-10 my-auto py-6">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 mb-3.5 shadow-lg shadow-blue-500/25 text-white ring-4 ring-blue-50">
            <RiHeartPulseLine className="text-3xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {t('auth.register_title')}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium max-w-sm mx-auto">
            {t('auth.register_subtitle')}
          </p>
        </div>

        {/* Form Card */}
        <div className="card-standard p-6 sm:p-8 space-y-5 bg-white border border-slate-200/90 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Yangi talaba hisobi</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Tibbiy ta'lim platformasidan foydalanish uchun ro'yxatdan o'ting</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-fade-in flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.full_name')} *</label>
              <div className="relative flex items-center">
                <RiUser3Line className="absolute left-3.5 text-slate-400 text-lg pointer-events-none select-none z-10" />
                <input
                  type="text"
                  placeholder={t('auth.enter_full_name')}
                  required
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="input-standard has-icon-left text-xs sm:text-sm"
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.email')} *</label>
              <div className="relative flex items-center">
                <RiMailLine className="absolute left-3.5 text-slate-400 text-lg pointer-events-none select-none z-10" />
                <input
                  type="email"
                  placeholder={t('auth.enter_email')}
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-standard has-icon-left text-xs sm:text-sm"
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.password')} *</label>
              <div className="relative flex items-center">
                <RiLockPasswordLine className="absolute left-3.5 text-slate-400 text-lg pointer-events-none select-none z-10" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-standard has-icon-left has-icon-right text-xs sm:text-sm"
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-center z-10"
                  aria-label="Toggle Password Visibility"
                >
                  {showPass ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
                </button>
              </div>
            </div>

            {/* Specialty & Group in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Specialty */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.specialty')}</label>
                <div className="relative flex items-center">
                  <RiStethoscopeLine className="absolute left-3.5 text-slate-400 text-lg pointer-events-none select-none z-10" />
                  <select
                    value={form.specialty_id}
                    onChange={e => setForm({ ...form, specialty_id: e.target.value })}
                    className="input-standard has-icon-left text-xs sm:text-sm cursor-pointer"
                    style={{ paddingLeft: '2.75rem' }}
                  >
                    <option value="">{t('auth.select_specialty')}</option>
                    {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.group')}</label>
                <div className="relative flex items-center">
                  <RiGroupLine className="absolute left-3.5 text-slate-400 text-lg pointer-events-none select-none z-10" />
                  <select
                    value={form.group_id}
                    onChange={e => setForm({ ...form, group_id: e.target.value })}
                    className="input-standard has-icon-left text-xs sm:text-sm cursor-pointer"
                    style={{ paddingLeft: '2.75rem' }}
                  >
                    <option value="">{t('auth.select_group')}</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <RiLoader4Line className="animate-spin text-base" />
                  <span>{t('auth.registering')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.sign_up_btn')}</span>
                  <RiArrowRightLine className="text-base" />
                </>
              )}
            </button>
          </form>

          {/* Footer Back to Login Link */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              {t('auth.have_account')}{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
                {t('auth.sign_in_btn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
