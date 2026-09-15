import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AuthShell from './AuthShell';
import {
  RiMailLine, RiLockPasswordLine, RiEyeLine, RiEyeOffLine,
  RiLoader4Line, RiArrowRightLine, RiErrorWarningFill
} from 'react-icons/ri';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate  = useNavigate();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`${t('auth.welcome_back')}, ${user.full_name || ''}!`);
      navigate(`/${user.role}/dashboard`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || t('auth.invalid_creds');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      heroTitle1={t('login_hero_title_1')}
      heroTitle2={t('login_hero_title_2')}
      heroDesc={t('login_hero_desc')}
      title={t('auth.login_title')}
      subtitle={t('login_subtitle')}
      footer={<>{t('auth.no_account')}{' '}<Link to="/register" className="text-slate-900 hover:text-blue-600 font-bold transition-colors">{t('auth.sign_up_btn')}</Link></>}
    >
      {error && (
        <div role="alert" className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold animate-fade-in flex items-center gap-2.5">
          <RiErrorWarningFill className="text-lg shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4.5" noValidate>
        <div>
          <label htmlFor="login-email" className="field-label uppercase tracking-wide">{t('auth.email')}</label>
          <div className="relative flex items-center">
            <RiMailLine className="absolute left-4 text-slate-400 text-lg pointer-events-none" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.enter_email')}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="input-standard has-icon-left py-3.5 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="field-label uppercase tracking-wide">{t('auth.password')}</label>
          <div className="relative flex items-center">
            <RiLockPasswordLine className="absolute left-4 text-slate-400 text-lg pointer-events-none" />
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="input-standard has-icon-left has-icon-right py-3.5 bg-slate-50 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label={showPass ? t('ui_hide_password') : t('ui_show_password')}
            >
              {showPass ? <RiEyeOffLine className="text-[17px]" /> : <RiEyeLine className="text-[17px]" />}
            </button>
          </div>
        </div>

        <button
          id="login-submit"
          type="submit"
          disabled={loading || !form.email || !form.password}
          className="btn-dark w-full py-3.5 text-sm mt-1"
        >
          {loading ? (
            <><RiLoader4Line className="animate-spin text-lg" /><span>{t('auth.logging_in')}...</span></>
          ) : (
            <><span>{t('auth.sign_in_btn')}</span><RiArrowRightLine className="text-lg" /></>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
