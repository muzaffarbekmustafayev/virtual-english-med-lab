import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { RiGroupLine, RiArrowRightLine, RiUser3Line, RiTrophyLine } from 'react-icons/ri';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/teacher/dashboard').then(r => setData(r.data)).catch(() => {});
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">O'qituvchi Paneli</h1>
        <p className="text-gray-500 text-sm mt-1">Guruhlaring va talabalar faolligini kuzat</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Guruhlar', value: data?.total_groups ?? '—', icon: <RiGroupLine />, color: 'from-indigo-500 to-purple-500' },
          { label: 'Talabalar', value: data?.total_students ?? '—', icon: <RiUser3Line />, color: 'from-emerald-500 to-teal-500' },
          { label: "O'rtacha ball", value: data?.average_score ? `${data.average_score}%` : '—', icon: <RiTrophyLine />, color: 'from-amber-500 to-orange-500' },
          { label: "Suhbatlar", value: data?.recent_conversations ?? '—', icon: <RiArrowRightLine />, color: 'from-cyan-500 to-blue-500' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 hover:shadow-md">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-lg mb-3 shadow-sm`}>{s.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/teacher/groups')}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-sm hover:shadow-md hover:shadow-indigo-500/30 transition-all">
        <RiGroupLine /> Guruhlarni ko'rish <RiArrowRightLine />
      </button>
    </Layout>
  );
}
