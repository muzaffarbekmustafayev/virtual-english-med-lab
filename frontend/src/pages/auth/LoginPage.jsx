import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RiEyeLine, RiEyeOffLine, RiStethoscopeLine, RiLockPasswordLine, RiMailLine, RiUser3Line, RiUserStarLine, RiShieldUserLine } from 'react-icons/ri';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login muvaffaqiyatsiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.05) 0%, transparent 60%), #f8fafc' }}>

      <div className="w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 mb-4 shadow-lg shadow-indigo-500/25">
            <RiStethoscopeLine className="text-3xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Virtual Patient English</h1>
          <p className="text-gray-500 text-sm mt-1">Klinik ingliz tili mashq platformasi</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Tizimga kirish</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Parol</label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            {/* Demo accounts */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-2">Test akkauntlar:</h3>
              <div className="space-y-1.5 text-xs">
                <p className="text-gray-500 flex items-center gap-1.5"><RiUser3Line /> <span className="text-gray-700">student@vpe.uz</span> / student123</p>
                <p className="text-gray-500 flex items-center gap-1.5"><RiUserStarLine /> <span className="text-gray-700">teacher@vpe.uz</span> / teacher123</p>
                <p className="text-gray-500 flex items-center gap-1.5"><RiShieldUserLine /> <span className="text-gray-700">admin@vpe.uz</span> / admin123</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 text-white transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Kirish...
                </span>
              ) : 'Kirish'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-5">
            Hisobingiz yo'qmi?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
