import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import AuthShell from './AuthShell';
import { Progress } from '../../components/ui';
import {
  RiUser3Line, RiMailLine, RiLockPasswordLine, RiEyeLine, RiEyeOffLine,
  RiLoader4Line, RiArrowRightLine, RiErrorWarningFill, RiCheckLine
} from 'react-icons/ri';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm]         = useState({ full_name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (form.password.length < 6) { setError(t('ui_password_min')); return; }
    setLoading(true);
    setError('');
    try {
      // Ro'yxatdan o'tishda guruh/yo'nalish talab qilinmaydi — talaba keyin profilda tanlaydi
      await api.post('/auth/register', { full_name: form.full_name.trim(), email: form.email.trim(), password: form.password, role: 'student', specialty_id: null, group_id: null });
      toast.success(`${t('common.success')}! ${t('auth.login_title')}`);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: RiCheckLine, label: t('register_feature_1') },
    { icon: RiCheckLine, label: t('register_feature_2') },
    { icon: RiCheckLine, label: t('register_feature_3') },
  ];
  const strength = Math.min(100, form.password.length * 10);

  return (
    <AuthShell
      heroTitle1={t('register_hero_prefix')}
      heroTitle2={t('register_hero_title')}
      heroDesc={t('login_hero_desc')}
      features={features}
      title={t('auth.register_title')}
      subtitle={t('register_subtitle')}
      footer={<>{t('auth.have_account')}{' '}<Link to="/login" className="text-slate-900 hover:text-blue-600 font-bold transition-colors">{t('auth.sign_in_btn')}</Link></>}
    >
      {error && (
        <div role="alert" className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold animate-fade-in flex items-center gap-2.5">
          <RiErrorWarningFill className="text-lg shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4.5">
        <div>
          <label htmlFor="reg-name" className="field-label uppercase tracking-wide">{t('auth.full_name')} *</label>
          <div className="relative flex items-center">
            <RiUser3Line className="absolute left-4 text-slate-400 text-lg pointer-events-none" />
            <input id="reg-name" type="text" autoComplete="name" placeholder={t('auth.enter_full_name')} required minLength={2}
              value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="input-standard has-icon-left py-3.5 bg-slate-50 focus:bg-white" />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="field-label uppercase tracking-wide">{t('auth.email')} *</label>
          <div className="relative flex items-center">
            <RiMailLine className="absolute left-4 text-slate-400 text-lg pointer-events-none" />
            <input id="reg-email" type="email" autoComplete="email" placeholder={t('auth.enter_email')} required
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-standard has-icon-left py-3.5 bg-slate-50 focus:bg-white" />
          </div>
        </div>

        <div>
          <label htmlFor="reg-password" className="field-label uppercase tracking-wide">{t('auth.password')} *</label>
          <div className="relative flex items-center">
            <RiLockPasswordLine className="absolute left-4 text-slate-400 text-lg pointer-events-none" />
            <input id="reg-password" type={showPass ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" required minLength={6}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-standard has-icon-left has-icon-right py-3.5 bg-slate-50 focus:bg-white" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label={showPass ? t('ui_hide_password') : t('ui_show_password')}>
              {showPass ? <RiEyeOffLine className="text-[17px]" /> : <RiEyeLine className="text-[17px]" />}
            </button>
          </div>
          {form.password && (
            <div className="mt-2 space-y-1">
              <Progress value={strength} tone={form.password.length >= 10 ? 'bg-emerald-500' : form.password.length >= 6 ? 'bg-amber-500' : 'bg-rose-500'} height="h-1.5" />
              <p className="text-[11px] text-slate-400 font-medium">{t('ui_password_min')}</p>
            </div>
          )}
        </div>

        <button id="register-submit" type="submit" disabled={loading} className="btn-dark w-full py-3.5 text-sm mt-1">
          {loading ? (
            <><RiLoader4Line className="animate-spin text-lg" /><span>{t('auth.registering')}...</span></>
          ) : (
            <><span>{t('auth.sign_up_btn')}</span><RiArrowRightLine className="text-lg" /></>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
