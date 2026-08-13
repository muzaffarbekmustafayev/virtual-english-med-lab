import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { RiShieldLine, RiTeamLine, RiBookOpenLine, RiBarChartLine, RiTrophyLine, RiUserStarLine, RiSettings3Line, RiMessage3Line } from 'react-icons/ri';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/overview').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const cards = stats ? [
    { label: 'Talabalar',   value: stats.students,                icon: <RiTeamLine />, color: 'from-indigo-500 to-purple-500' },
    { label: "O'qituvchilar", value: stats.teachers,             icon: <RiUserStarLine />, color: 'from-emerald-500 to-teal-500' },
    { label: 'Adminlar',    value: stats.admins,                  icon: <RiSettings3Line />,  color: 'from-rose-500 to-pink-500'    },
    { label: 'Modullar',    value: stats.modules,                 icon: <RiBookOpenLine />,  color: 'from-amber-500 to-orange-500' },
    { label: 'Suhbatlar',   value: stats.completed_conversations, icon: <RiMessage3Line />,  color: 'from-cyan-500 to-blue-500'    },
    { label: "O'rtacha ball", value: `${stats.avg_score}%`,      icon: <RiTrophyLine />,  color: 'from-violet-500 to-purple-500' },
  ] : [];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RiShieldLine className="text-purple-500" /> Tizim Overview
        </h1>
        <p className="text-gray-500 text-sm mt-1">Platforma statistikasi va monitoring</p>
      </div>

      {!stats ? (
        <div className="flex justify-center h-40 items-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {cards.map(c => (
              <div key={c.label} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 hover:shadow-md">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-lg mb-3 shadow-sm`}>{c.icon}</div>
                <p className="text-2xl font-black text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tizim holati</h3>
            <div className="space-y-2">
              {[
                { label: 'Backend API', status: 'Ishlayapti', ok: true },
                { label: 'MySQL Database', status: 'Ulangan', ok: true },
                { label: 'Gemini AI', status: 'Faol', ok: true },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{s.label}</span>
                  <span className={`text-xs font-medium flex items-center gap-1.5 ${s.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
