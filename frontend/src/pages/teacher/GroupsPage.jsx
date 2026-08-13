import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { RiGroupLine, RiUser3Line, RiArrowRightLine, RiTrophyLine, RiTimeLine } from 'react-icons/ri';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups]           = useState([]);
  const [selectedGroup, setSelected]  = useState(null);
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [studLoading, setStudLoading] = useState(false);

  useEffect(() => {
    api.get('/teacher/groups').then(r => setGroups(r.data)).finally(() => setLoading(false));
  }, []);

  const loadStudents = async (group) => {
    setSelected(group);
    setStudLoading(true);
    try {
      const res = await api.get(`/teacher/groups/${group.id}/students`);
      setStudents(res.data);
    } finally {
      setStudLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RiGroupLine className="text-indigo-500" /> Mening Guruhlarim
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Groups list */}
        <div className="space-y-3">
          <h2 className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Guruhlar</h2>
          {loading && <div className="text-gray-500 text-sm">Yuklanmoqda...</div>}
          {groups.map(g => (
            <button key={g.id} onClick={() => loadStudents(g)}
              className={`w-full text-left p-4 rounded-xl border transition-all shadow-sm ${
                selectedGroup?.id === g.id
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}>
              <p className="font-semibold">{g.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{g.student_count} talaba</p>
            </button>
          ))}
          {!loading && groups.length === 0 && (
            <p className="text-gray-500 text-sm">Guruh biriktirilmagan</p>
          )}
        </div>

        {/* Students table */}
        <div className="lg:col-span-2">
          {!selectedGroup && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex items-center justify-center h-48 text-gray-500 text-sm">
              Chap tarafdan guruh tanlang
            </div>
          )}
          {selectedGroup && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900">{selectedGroup.name}</h3>
              </div>
              {studLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="text-left text-xs text-gray-500 font-semibold px-5 py-3">Talaba</th>
                      <th className="text-left text-xs text-gray-500 font-semibold px-5 py-3 hidden sm:table-cell">Ball</th>
                      <th className="text-left text-xs text-gray-500 font-semibold px-5 py-3 hidden md:table-cell">So'nggi modul</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                              {s.full_name[0]}
                            </div>
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{s.full_name}</p>
                              <p className="text-xs text-gray-500">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-sm font-bold text-amber-500">{s.average_score}%</span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs text-gray-600">{s.last_module || '—'}</span>
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={() => navigate(`/teacher/students/${s.id}`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <RiArrowRightLine />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
