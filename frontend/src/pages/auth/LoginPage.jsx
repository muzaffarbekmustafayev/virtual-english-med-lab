import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../../components/LanguageSelector';
import {
  RiEyeLine, RiEyeOffLine, RiHeartPulseLine,
  RiLockPasswordLine, RiMailLine, RiUser3Line,
  RiUserStarLine, RiShieldCheckLine, RiLoader4Line,
  RiArrowRightLine, RiSparklingFill, RiStethoscopeLine
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/70 p-4 sm:p-6 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Top right language toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <LanguageSelector variant="compact" />
      </div>

      {/* Decorative ambient background blurs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] animate-scale-in relative z-10 my-auto">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 mb-3.5 shadow-lg shadow-blue-500/25 text-white ring-4 ring-blue-50">
            <RiHeartPulseLine className="text-3xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Virtual Patient English
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium max-w-sm mx-auto">
            {t('auth.login_subtitle')}
          </p>
        </div>

        {/* Form Card */}
        <div className="card-standard p-6 sm:p-8 space-y-5 bg-white border border-slate-200/90 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('auth.login_title')}</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Tizimga kirish uchun elektron pochta va parolni kiriting</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-fade-in flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.email')}</label>
              <div className="relative flex items-center">
                <RiMailLine className="absolute left-3.5 text-slate-400 text-lg pointer-events-none select-none z-10" />
                <input
                  type="email"
                  placeholder={t('auth.enter_email')}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="input-standard has-icon-left text-xs sm:text-sm"
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative flex items-center">
                <RiLockPasswordLine className="absolute left-3.5 text-slate-400 text-lg pointer-events-none select-none z-10" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
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

            {/* Quick Demo Accounts Selection */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {t('auth.demo_hint')}
                </span>
                <span className="text-[10px] text-blue-600 font-bold">1-bosish</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoFill('student@vpe.uz', 'student123')}
                  className={`px-2 py-2 rounded-xl bg-white border text-[11px] font-extrabold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    form.email === 'student@vpe.uz'
                      ? 'border-blue-500 text-blue-700 bg-blue-50/50 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-blue-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <RiUser3Line className="text-blue-600 text-xs" />
                  <span>Talaba</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('teacher@vpe.uz', 'teacher123')}
                  className={`px-2 py-2 rounded-xl bg-white border text-[11px] font-extrabold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    form.email === 'teacher@vpe.uz'
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-100'
                      : 'border-slate-200 hover:border-emerald-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <RiUserStarLine className="text-emerald-600 text-xs" />
                  <span>O'qituvchi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('admin@gmail.com', 'admin123')}
                  className={`px-2 py-2 rounded-xl bg-white border text-[11px] font-extrabold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    form.email === 'admin@gmail.com'
                      ? 'border-purple-500 text-purple-700 bg-purple-50/50 ring-2 ring-purple-100'
                      : 'border-slate-200 hover:border-purple-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <RiShieldCheckLine className="text-purple-600 text-xs" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RiLoader4Line className="animate-spin text-base" />
                  <span>{t('auth.logging_in')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.sign_in_btn')}</span>
                  <RiArrowRightLine className="text-base" />
                </>
              )}
            </button>
          </form>

          {/* Footer Register Link */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
                {t('auth.sign_up_btn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
