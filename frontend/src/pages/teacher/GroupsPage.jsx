import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { RiGroupLine, RiArrowRightLine, RiUser3Line, RiTrophyLine } from 'react-icons/ri';

export default function GroupsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [groups, setGroups]           = useState([]);
  const [selectedGroup, setSelected]  = useState(null);
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [studLoading, setStudLoading] = useState(false);

  useEffect(() => {
    api.get('/teacher/groups')
      .then(r => {
        setGroups(r.data || []);
        if (r.data?.length > 0) {
          loadStudents(r.data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadStudents = async (group) => {
    setSelected(group);
    setStudLoading(true);
    try {
      const res = await api.get(`/teacher/groups/${group.id}/students`);
      setStudents(res.data || []);
    } catch {
      setStudents([]);
    } finally {
      setStudLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── 1. Header ── */}
        <div className="card-standard p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-standard badge-emerald">
                {groups.length} {t('teacher.groups.title')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
                <RiGroupLine />
              </span>
              {t('teacher.groups.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{t('teacher.groups.subtitle')}</p>
          </div>
        </div>

        {/* ── 2. Groups & Student Roster Split ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Groups list */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs text-slate-400 font-black uppercase tracking-wider px-1">
              {t('teacher.groups.select_group')}
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="card-standard p-6 text-center text-xs text-slate-400">
                Guruhlar topilmadi
              </div>
            ) : (
              <div className="space-y-2.5">
                {groups.map(g => {
                  const isSel = selectedGroup?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => loadStudents(g)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSel
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-sm text-slate-900">{g.name}</p>
                        <span className={`badge-standard ${isSel ? 'badge-emerald bg-white' : 'badge-slate'}`}>
                          {g.student_count || 0} talaba
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Mutaxassislik: {g.specialty_name || 'Stomatologiya'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Students table */}
          <div className="lg:col-span-8">
            {!selectedGroup ? (
              <div className="card-standard flex items-center justify-center h-64 text-slate-400 text-sm font-semibold">
                {t('teacher.groups.select_group')}
              </div>
            ) : (
              <div className="card-standard overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{selectedGroup.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Talabalar ro'yxati</p>
                  </div>
                  <span className="badge-standard badge-emerald">
                    {students.length} {t('admin.overview.total_students').toLowerCase()}
                  </span>
                </div>

                {studLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs font-medium">
                    Ushbu guruhda talabalar mavjud emas.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/40 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-3">{t('teacher.groups.student_name')}</th>
                          <th className="px-6 py-3 hidden sm:table-cell">{t('teacher.groups.average_score')}</th>
                          <th className="px-6 py-3 hidden md:table-cell">{t('teacher.groups.last_active')}</th>
                          <th className="px-6 py-3 text-right">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {students.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-black shadow-2xs shrink-0">
                                  {s.full_name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{s.full_name}</p>
                                  <p className="text-[11px] text-slate-400">{s.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 hidden sm:table-cell">
                              <span className="badge-standard badge-amber">
                                {s.average_score || 0}%
                              </span>
                            </td>
                            <td className="px-6 py-3.5 hidden md:table-cell">
                              <span className="text-xs text-slate-600 font-medium">{s.last_module || '—'}</span>
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <button
                                onClick={() => navigate('/teacher/reports')}
                                className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title={t('teacher.groups.view_student_details')}
                              >
                                <RiArrowRightLine className="text-base" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
