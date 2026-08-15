import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  RiGroupLine, RiAddLine, RiDeleteBinLine, RiEditLine,
  RiCheckLine, RiCloseLine, RiUserStarLine, RiUser3Line,
  RiStethoscopeLine, RiSearchLine, RiSave3Line, RiShieldCheckLine,
  RiExchangeLine
} from 'react-icons/ri';

export default function AdminGroupsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('groups');

  // Data states
  const [groups, setGroups]           = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [teachers, setTeachers]       = useState([]);
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(false);

  // Group Create / Edit State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupForm, setGroupForm] = useState({ id: null, name: '', specialty_id: '' });

  // Specialty Create / Edit State
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [specForm, setSpecForm] = useState({ id: null, name: '' });

  // Teacher-Group Assignment State
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  
  // Student Assignment Search
  const [studentSearch, setStudentSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // Load all initial data
  const loadAll = async () => {
    setLoading(true);
    try {
      const [gRes, sRes, uRes] = await Promise.all([
        api.get('/admin/groups'),
        api.get('/admin/specialties'),
        api.get('/admin/users'),
      ]);
      setGroups(gRes.data || []);
      setSpecialties(sRes.data || []);
      
      const allUsers = uRes.data || [];
      const teacherList = allUsers.filter(u => u.role === 'teacher');
      const studentList = allUsers.filter(u => u.role === 'student');
      setTeachers(teacherList);
      setStudents(studentList);

      if (teacherList.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(teacherList[0].id);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ── GROUP ACTIONS ──
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;
    try {
      if (groupForm.id) {
        await api.put(`/admin/groups/${groupForm.id}`, {
          name: groupForm.name,
          specialty_id: groupForm.specialty_id || null,
        });
        toast.success(t('common.success'));
      } else {
        await api.post('/admin/groups', {
          name: groupForm.name,
          specialty_id: groupForm.specialty_id || null,
        });
        toast.success(t('common.success'));
      }
      setShowGroupModal(false);
      setGroupForm({ id: null, name: '', specialty_id: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm(t('common.confirm_delete'))) return;
    try {
      await api.delete(`/admin/groups/${id}`);
      toast.success(t('common.success'));
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  // ── SPECIALTY ACTIONS ──
  const handleSaveSpec = async (e) => {
    e.preventDefault();
    if (!specForm.name.trim()) return;
    try {
      if (specForm.id) {
        await api.put(`/admin/specialties/${specForm.id}`, { name: specForm.name });
        toast.success(t('common.success'));
      } else {
        await api.post('/admin/specialties', { name: specForm.name });
        toast.success(t('common.success'));
      }
      setShowSpecModal(false);
      setSpecForm({ id: null, name: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  const handleDeleteSpec = async (id) => {
    if (!window.confirm(t('common.confirm_delete'))) return;
    try {
      await api.delete(`/admin/specialties/${id}`);
      toast.success(t('common.success'));
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  // ── TEACHER ASSIGNMENT ACTIONS ──
  const handleToggleGroupForTeacher = async (groupId, isAssigned) => {
    if (!selectedTeacherId) return;
    try {
      if (isAssigned) {
        await api.delete(`/admin/teachers/${selectedTeacherId}/groups/${groupId}`);
      } else {
        await api.post(`/admin/teachers/${selectedTeacherId}/groups`, { group_id: groupId });
      }
      toast.success(t('common.success'));
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  // ── STUDENT GROUP ASSIGNMENT ──
  const handleUpdateStudentGroup = async (studentId, groupId) => {
    try {
      await api.put(`/admin/users/${studentId}`, {
        group_id: groupId ? parseInt(groupId) : null,
      });
      toast.success("Talaba guruhi biriktirildi!");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  const selectedTeacher = teachers.find(t => t.id === parseInt(selectedTeacherId));

  const filteredStudents = students
    .filter(s => {
      if (!studentSearch.trim()) return true;
      const q = studentSearch.toLowerCase();
      return s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
    })
    .filter(s => {
      if (!groupFilter) return true;
      if (groupFilter === 'none') return !s.group_id;
      return s.group_id === parseInt(groupFilter);
    });

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── 1. Header ── */}
        <div className="card-standard p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-standard badge-purple">
                <RiShieldCheckLine /> {t('nav.admin_portal')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center text-xl shrink-0">
                <RiGroupLine />
              </span>
              {t('admin.groups_page.title')}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{t('admin.groups_page.subtitle')}</p>
          </div>
        </div>

        {/* ── 2. Tab Navigation ── */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
          {[
            { key: 'groups',       label: t('admin.groups_page.tab_groups'),    icon: RiGroupLine },
            { key: 'specialties',  label: t('admin.groups_page.tab_specialties'), icon: RiStethoscopeLine },
            { key: 'teacher_assign', label: t('admin.groups_page.tab_assign_teacher'), icon: RiUserStarLine },
            { key: 'student_assign', label: t('admin.groups_page.tab_assign_student'), icon: RiExchangeLine },
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSel
                    ? 'border-purple-600 text-purple-700 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="text-base" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: GROUPS MANAGEMENT ── */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Mavjud Akademik Guruhlar ({groups.length})</p>
              <button
                onClick={() => { setGroupForm({ id: null, name: '', specialty_id: '' }); setShowGroupModal(true); }}
                className="btn-primary-gradient bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                <RiAddLine /> {t('admin.groups_page.add_group_btn')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(g => (
                <div key={g.id} className="card-standard p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge-standard badge-purple">
                        Guruh #{g.id}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setGroupForm({ id: g.id, name: g.name, specialty_id: g.specialty_id || '' }); setShowGroupModal(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <RiEditLine size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(g.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <RiDeleteBinLine size={16} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">{g.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Mutaxassislik: {g.specialty?.name || g.specialty_name || 'Umumiy'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                    <span className="badge-standard badge-slate">
                      <RiUser3Line /> {g.student_count || 0} talaba
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: SPECIALTIES MANAGEMENT ── */}
        {activeTab === 'specialties' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tibbiy Mutaxassisliklar ({specialties.length})</p>
              <button
                onClick={() => { setSpecForm({ id: null, name: '' }); setShowSpecModal(true); }}
                className="btn-primary-gradient bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                <RiAddLine /> {t('admin.groups_page.add_spec_btn')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {specialties.map(s => (
                <div key={s.id} className="card-standard p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xl shrink-0 font-bold">
                      🩺
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{s.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{s.student_count || 0} talaba ro'yxatda</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSpecForm({ id: s.id, name: s.name }); setShowSpecModal(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <RiEditLine size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSpec(s.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <RiDeleteBinLine size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: TEACHER-GROUP ASSIGNMENT ── */}
        {activeTab === 'teacher_assign' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-3">
              <h2 className="text-xs text-slate-400 font-black uppercase tracking-wider px-1">O'qituvchini tanlang</h2>
              <div className="space-y-2">
                {teachers.map(tch => {
                  const isSel = parseInt(selectedTeacherId) === tch.id;
                  return (
                    <button
                      key={tch.id}
                      onClick={() => setSelectedTeacherId(tch.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSel
                          ? 'border-purple-500 bg-purple-50 text-purple-950 shadow-xs font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-extrabold text-sm text-slate-900">{tch.full_name}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{tch.email}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-8 card-standard p-6 space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <RiUserStarLine className="text-purple-600" />
                <span>{selectedTeacher ? `${selectedTeacher.full_name} ga guruhlarni biriktirish` : 'O\'qituvchi tanlanmagan'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map(g => {
                  const isAssigned = selectedTeacher?.assigned_group_ids?.includes(g.id) || selectedTeacher?.groups?.some(x => x.id === g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => handleToggleGroupForTeacher(g.id, isAssigned)}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isAssigned
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">{g.name}</p>
                        <p className="text-[11px] text-slate-500">{g.student_count || 0} talaba</p>
                      </div>
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${isAssigned ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-transparent'}`}>
                        ✓
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: STUDENT DISTRIBUTION ── */}
        {activeTab === 'student_assign' && (
          <div className="space-y-4">
            <div className="card-standard p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Talabani izlash..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="input-standard pl-9 py-2 text-xs"
                />
              </div>

              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="input-standard py-2 text-xs w-auto font-bold"
              >
                <option value="">Barcha guruhlar</option>
                <option value="none">Guruhsiz talabalar</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="card-standard overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3">Talaba</th>
                    <th className="px-5 py-3">Mutaxassislik</th>
                    <th className="px-5 py-3">Guruhni tanlang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{s.full_name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{s.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {s.specialty?.name || 'Stomatologiya'}
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={s.group_id || ''}
                          onChange={(e) => handleUpdateStudentGroup(s.id, e.target.value)}
                          className="input-standard py-1.5 text-xs font-semibold w-52"
                        >
                          <option value="">Guruhga biriktirilmagan</option>
                          {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Group Modal */}
        {showGroupModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 w-full max-w-md animate-scale-in">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-900 text-base">{groupForm.id ? "Guruhni tahrirlash" : "Yangi guruh qo'shish"}</h3>
                <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <RiCloseLine size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Guruh nomi *</label>
                  <input
                    type="text"
                    placeholder="Masalan: 401-Stomatologiya"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    required
                    className="input-standard text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mutaxassislik</label>
                  <select
                    value={groupForm.specialty_id}
                    onChange={(e) => setGroupForm({ ...groupForm, specialty_id: e.target.value })}
                    className="input-standard text-xs"
                  >
                    <option value="">Tanlang...</option>
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowGroupModal(false)} className="flex-1 btn-secondary-soft">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="flex-1 btn-primary-gradient bg-gradient-to-r from-purple-600 to-indigo-600">
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Specialty Modal */}
        {showSpecModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 w-full max-w-md animate-scale-in">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-900 text-base">{specForm.id ? "Mutaxassislikni tahrirlash" : "Yangi mutaxassislik"}</h3>
                <button onClick={() => setShowSpecModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <RiCloseLine size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveSpec} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mutaxassislik nomi *</label>
                  <input
                    type="text"
                    placeholder="Masalan: Stomatologiya, Pediatriya..."
                    value={specForm.name}
                    onChange={(e) => setSpecForm({ ...specForm, name: e.target.value })}
                    required
                    className="input-standard text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowSpecModal(false)} className="flex-1 btn-secondary-soft">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="flex-1 btn-primary-gradient bg-gradient-to-r from-purple-600 to-indigo-600">
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
