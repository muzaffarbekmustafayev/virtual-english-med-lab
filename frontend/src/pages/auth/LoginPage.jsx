import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../../components/LanguageSelector';
import {
  RiEyeLine, RiEyeOffLine, RiHeartPulseLine,
  RiLockPasswordLine, RiMailLine, RiUser3Line,
  RiUserStarLine, RiShieldCheckLine, RiLoader4Line
} from 'react-icons/ri';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      toast.success(`${t('auth.welcome_back')}, ${user.full_name || ''}!`);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      const msg = err.response?.data?.error || t('auth.invalid_creds');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (email, pass) => {
    setForm({ email, password: pass });
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Virtual Patient English</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{t('auth.login_subtitle')}</p>
        </div>

        {/* Card */}
        <div className="card-standard p-7 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">{t('auth.login_title')}</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Tizimga kirish uchun ma'lumotlaringizni kiriting</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type="email"
                  placeholder={t('auth.enter_email')}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="input-standard pl-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
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

            {/* Demo Accounts Quick-Pick */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('auth.demo_hint')} (1-bosish bilan to'ldirish):</h3>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoFill('student@vpe.uz', 'student123')}
                  className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-700 text-[11px] font-bold transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RiUser3Line className="text-blue-600" /> Talaba
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('teacher@vpe.uz', 'teacher123')}
                  className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 text-[11px] font-bold transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RiUserStarLine className="text-emerald-600" /> O'qituvchi
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('admin@vpe.uz', 'admin123')}
                  className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-slate-700 text-[11px] font-bold transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RiShieldCheckLine className="text-purple-600" /> Admin
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-gradient py-3 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RiLoader4Line className="animate-spin text-base" />
                  {t('auth.logging_in')}
                </span>
              ) : t('auth.sign_in_btn')}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 font-medium">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
              {t('auth.sign_up_btn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
