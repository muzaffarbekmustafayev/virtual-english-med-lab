import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../../components/LanguageSelector';
import {
  RiHeartPulseLine, RiMailLine, RiLockPasswordLine,
  RiEyeLine, RiEyeOffLine, RiLoader4Line,
  RiArrowRightLine, RiErrorWarningFill
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

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left Pane: Branding (Desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 z-0"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <RiHeartPulseLine size={24} />
          </div>
          <span className="text-white text-xl font-black tracking-tight">UzMedik</span>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.15] mb-6 tracking-tight">
            Tibbiy Ingliz Tilini <br/><span className="text-emerald-400">Amaliyotda O'rganing</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-md">
            Virtual bemorlar bilan sun'iy intellekt orqali klinik muloqot olib boring, tibbiy terminologiyani o'zlashtiring va xalqaro standartlar asosida bilimingizni baholang.
          </p>
        </div>
        
        <div className="relative z-10 text-slate-500 text-xs font-medium">
          © {new Date().getFullYear()} UzMedik. Barcha huquqlar himoyalangan.
        </div>
      </div>

      {/* ── Right Pane: Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-6 right-6">
          <LanguageSelector variant="compact" />
        </div>
        
        <div className="w-full max-w-[400px]">
          {/* Mobile Branding */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md">
              <RiHeartPulseLine size={22} />
            </div>
            <span className="text-slate-900 text-xl font-black tracking-tight">UzMedik</span>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t('auth.login_title')}</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Tizimga kirish uchun ma'lumotlaringizni kiriting.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold animate-fade-in flex items-center gap-2.5">
              <RiErrorWarningFill className="text-lg shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">{t('auth.email')}</label>
              <div className="relative flex items-center">
                <RiMailLine className="absolute left-4 text-slate-400 text-lg pointer-events-none" />
                <input
                  type="email"
                  placeholder={t('auth.enter_email')}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl py-3.5 pr-4 text-sm font-medium transition-all outline-none"
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">{t('auth.password')}</label>
              <div className="relative flex items-center">
                <RiLockPasswordLine className="absolute left-4 text-slate-400 text-lg pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl py-3.5 pl-12 pr-12 text-sm font-medium transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <RiEyeOffLine className="text-[17px]" /> : <RiEyeLine className="text-[17px]" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RiLoader4Line className="animate-spin text-lg" />
                  <span>{t('auth.logging_in')}...</span>
                </>
              ) : (
                <>
                  <span>{t('auth.sign_in_btn')}</span>
                  <RiArrowRightLine className="text-lg" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-medium">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-slate-900 hover:text-blue-600 font-bold transition-colors">
                {t('auth.sign_up_btn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
