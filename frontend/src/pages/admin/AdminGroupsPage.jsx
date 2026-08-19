import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  RiGroupLine, RiAddLine, RiDeleteBinLine, RiEditLine,
  RiCloseLine, RiUserStarLine, RiUser3Line,
  RiStethoscopeLine, RiShieldCheckLine, RiArrowRightSLine,
  RiSave3Line, RiGraduationCapLine
} from 'react-icons/ri';

export default function AdminGroupsPage() {
  const { t } = useLanguage();
  
  // Data States
  const [specialties, setSpecialties] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selection States
  const [selectedSpecId, setSelectedSpecId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Modals
  const [specForm, setSpecForm] = useState({ show: false, id: null, name: '' });
  const [groupForm, setGroupForm] = useState({ show: false, id: null, name: '', specialty_id: '' });
  
  // Assignment states
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, gRes, uRes] = await Promise.all([
        api.get('/admin/specialties'),
        api.get('/admin/groups'),
        api.get('/admin/users')
      ]);
      setSpecialties(sRes.data || []);
      setGroups(gRes.data || []);
      setUsers(uRes.data || []);
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Derived Data
  const teachers = useMemo(() => users.filter(u => u.role === 'teacher'), [users]);
  const students = useMemo(() => users.filter(u => u.role === 'student'), [users]);
  
  const filteredGroups = useMemo(() => {
    if (!selectedSpecId) return groups;
    return groups.filter(g => g.specialty_id == selectedSpecId);
  }, [groups, selectedSpecId]);

  const activeGroup = useMemo(() => {
    return groups.find(g => g.id == selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // Handle Clicks
  const handleSpecClick = (id) => {
    setSelectedSpecId(id);
    if (id) {
      const specsGroups = groups.filter(g => g.specialty_id == id);
      if (specsGroups.length > 0) {
        setSelectedGroupId(specsGroups[0].id);
      } else {
        setSelectedGroupId(null);
      }
    } else {
      setSelectedGroupId(null);
    }
  };

  // --- SPECIALTY ACTIONS ---
  const saveSpec = async (e) => {
    e.preventDefault();
    if (!specForm.name.trim()) return;
    try {
      if (specForm.id) {
        await api.put(`/admin/specialties/${specForm.id}`, { name: specForm.name });
      } else {
        await api.post('/admin/specialties', { name: specForm.name });
      }
      toast.success(t('common.success'));
      setSpecForm({ show: false, id: null, name: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  const deleteSpec = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t('common.confirm_delete'))) return;
    try {
      await api.delete(`/admin/specialties/${id}`);
      if (selectedSpecId === id) setSelectedSpecId(null);
      toast.success(t('common.success'));
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  // --- GROUP ACTIONS ---
  const saveGroup = async (e) => {
    e.preventDefault();
    const specId = groupForm.specialty_id || selectedSpecId;
    if (!groupForm.name.trim() || !specId) return;
    try {
      if (groupForm.id) {
        await api.put(`/admin/groups/${groupForm.id}`, { name: groupForm.name, specialty_id: specId });
      } else {
        await api.post('/admin/groups', { name: groupForm.name, specialty_id: specId });
      }
      toast.success(t('common.success'));
      setGroupForm({ show: false, id: null, name: '', specialty_id: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  const deleteGroup = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t('common.confirm_delete'))) return;
    try {
      await api.delete(`/admin/groups/${id}`);
      if (selectedGroupId == id) setSelectedGroupId(null);
      toast.success(t('common.success'));
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  // --- ASSIGNMENT ACTIONS ---
  const assignTeacher = async () => {
    if (!selectedTeacherId || !selectedGroupId) return;
    try {
      await api.post('/admin/teacher-groups', { teacher_id: parseInt(selectedTeacherId), group_id: selectedGroupId });
      toast.success(t('common.success'));
      setShowAddTeacher(false);
      setSelectedTeacherId('');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  const removeTeacher = async (teacherId) => {
    if (!selectedGroupId) return;
    try {
      await api.delete('/admin/teacher-groups', { data: { teacher_id: teacherId, group_id: selectedGroupId } });
      toast.success(t('common.success'));
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  const assignStudent = async () => {
    if (!selectedStudentId || !selectedGroupId) return;
    try {
      await api.post('/admin/student-groups', { student_id: parseInt(selectedStudentId), group_id: selectedGroupId, specialty_id: selectedSpecId });
      toast.success(t('common.success'));
      setShowAddStudent(false);
      setSelectedStudentId('');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  const removeStudent = async (studentId) => {
    try {
      await api.post('/admin/student-groups', { student_id: studentId, group_id: null });
      toast.success(t('common.success'));
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold tracking-wide uppercase">
                <RiShieldCheckLine size={12} /> {t('nav.admin_portal')}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Tashkilot Tuzilmasi
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium max-w-xl">
              Universitet yo'nalishlari, o'quv guruhlari hamda ularga biriktirilgan o'qituvchi va talabalarni markazlashgan holda boshqaring.
            </p>
          </div>
        </div>

        {loading && specialties.length === 0 ? (
          <div className="flex justify-center p-16">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
            
            {/* COLUMN 1: SPECIALTIES */}
            <div className="lg:col-span-3 bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                    <RiStethoscopeLine size={18} />
                  </div>
                  Yo'nalishlar
                </h3>
                <button 
                  onClick={() => setSpecForm({ show: true, id: null, name: '' })} 
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white transition-all shadow-sm group"
                  title="Yo'nalish qo'shish"
                >
                  <RiAddLine className="group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="p-3 overflow-y-auto flex-1 custom-scrollbar space-y-1.5 bg-slate-50/30">
                <div 
                  onClick={() => handleSpecClick(null)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${
                    selectedSpecId === null 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <RiGroupLine size={18} className={selectedSpecId === null ? 'text-blue-200' : 'text-slate-400'} />
                  <span className="font-semibold text-sm flex-1">Barcha Guruhlar</span>
                </div>

                <div className="h-px bg-slate-100 my-2 mx-2"></div>

                {specialties.length === 0 && <p className="text-sm text-slate-400 text-center py-4 font-medium">Yo'nalishlar mavjud emas</p>}
                
                {specialties.map(spec => {
                  const isActive = selectedSpecId === spec.id;
                  return (
                    <div 
                      key={spec.id} 
                      onClick={() => handleSpecClick(spec.id)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between border group ${
                        isActive 
                          ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className={`font-bold text-sm truncate ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {spec.name}
                        </h4>
                        <p className={`text-xs font-medium mt-0.5 ${isActive ? 'text-indigo-600/80' : 'text-slate-500'}`}>
                          {spec.groups?.length || 0} ta guruh
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSpecForm({ show: true, id: spec.id, name: spec.name }); }} 
                          className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-indigo-500 hover:bg-indigo-100' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}
                        >
                          <RiEditLine />
                        </button>
                        <button 
                          onClick={(e) => deleteSpec(spec.id, e)} 
                          className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-indigo-500 hover:bg-rose-100 hover:text-rose-600' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                        >
                          <RiDeleteBinLine />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: GROUPS */}
            <div className="lg:col-span-4 bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex flex-col">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
                      <RiGroupLine size={18} />
                    </div>
                    Guruhlar
                  </h3>
                  {selectedSpecId && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mt-1 ml-10">
                      {specialties.find(s => s.id === selectedSpecId)?.name}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setGroupForm({ show: true, id: null, name: '', specialty_id: selectedSpecId || '' })} 
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-purple-600 text-slate-500 hover:text-white transition-all shadow-sm group"
                  title="Guruh qo'shish"
                >
                  <RiAddLine className="group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/30">
                <div className="grid grid-cols-1 gap-3">
                  {filteredGroups.length === 0 && (
                    <div className="text-center py-10 flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <RiGroupLine className="text-2xl text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-500">Bu yerda guruhlar yo'q</p>
                      <button 
                        onClick={() => setGroupForm({ show: true, id: null, name: '', specialty_id: selectedSpecId || '' })}
                        className="mt-3 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        + Yangi guruh yaratish
                      </button>
                    </div>
                  )}
                  
                  {filteredGroups.map(group => {
                    const groupSpec = specialties.find(s => s.id == group.specialty_id);
                    const isActive = selectedGroupId === group.id;
                    return (
                      <div 
                        key={group.id} 
                        onClick={() => setSelectedGroupId(group.id)}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border relative overflow-hidden group ${
                          isActive 
                            ? 'bg-white border-purple-300 shadow-md ring-1 ring-purple-100' 
                            : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-purple-500 to-indigo-600"></div>}
                        
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className={`font-bold text-base ${isActive ? 'text-purple-950' : 'text-slate-800'}`}>
                              {group.name}
                            </h4>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
                              {groupSpec ? groupSpec.name : "Yo'nalishsiz"}
                            </p>
                          </div>
                          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setGroupForm({ show: true, id: group.id, name: group.name, specialty_id: group.specialty_id }); }} 
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            >
                              <RiEditLine size={14} />
                            </button>
                            <button 
                              onClick={(e) => deleteGroup(group.id, e)} 
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            >
                              <RiDeleteBinLine size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">
                              <RiUserStarLine size={12} />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{group.teachers?.length || 0}</span>
                          </div>
                          <div className="w-px h-4 bg-slate-200"></div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <RiUser3Line size={12} />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{group.students?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* COLUMN 3: USERS IN GROUP */}
            <div className="lg:col-span-5 bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 flex flex-col overflow-hidden relative">
              {!selectedGroupId ? (
                <div className="absolute inset-0 bg-slate-50/50 flex flex-col items-center justify-center text-center p-6 backdrop-blur-[2px] z-10">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 transform rotate-12">
                    <RiGraduationCapLine className="text-4xl text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-1">Guruh a'zolari</h3>
                  <p className="text-sm font-medium text-slate-500 max-w-[250px]">
                    Ro'yxatni ko'rish va yangi a'zolar qo'shish uchun chap tomondan guruhni tanlang
                  </p>
                </div>
              ) : null}

              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex flex-col">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                      <RiGraduationCapLine size={18} />
                    </div>
                    Guruh A'zolari
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mt-1 ml-10 truncate max-w-[200px]">
                    {activeGroup?.name || '...'}
                  </span>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar bg-slate-50/30">
                {/* Teachers Section */}
                <div className="p-5 border-b border-slate-100 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <RiUserStarLine className="text-amber-500" /> 
                      O'qituvchilar 
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{activeGroup?.teachers?.length || 0}</span>
                    </h4>
                    <button 
                      onClick={() => setShowAddTeacher(!showAddTeacher)} 
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${showAddTeacher ? 'bg-slate-200 text-slate-700' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                    >
                      {showAddTeacher ? 'Yopish' : '+ Biriktirish'}
                    </button>
                  </div>
                  
                  {showAddTeacher && (
                    <div className="mb-4 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">O'qituvchi tanlang</label>
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                          value={selectedTeacherId}
                          onChange={e => setSelectedTeacherId(e.target.value)}
                        >
                          <option value="">-- Tanlash --</option>
                          {teachers.filter(t => !activeGroup?.teachers?.some(at => at.id === t.id)).map(t => (
                            <option key={t.id} value={t.id}>{t.full_name}</option>
                          ))}
                        </select>
                        <button 
                          onClick={assignTeacher} 
                          disabled={!selectedTeacherId}
                          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
                        >
                          Qo'shish
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {activeGroup?.teachers?.length === 0 && (
                      <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-400 font-medium">O'qituvchilar biriktirilmagan</p>
                      </div>
                    )}
                    {activeGroup?.teachers?.map(t => (
                      <div key={t.id} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm font-bold">
                            {t.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-800 block">{t.full_name}</span>
                            <span className="text-[10px] font-semibold text-slate-400">{t.email}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeTeacher(t.id)} 
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                          title="Guruhdan olib tashlash"
                        >
                          <RiCloseLine size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Students Section */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <RiUser3Line className="text-emerald-500" /> 
                      Talabalar 
                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">{activeGroup?.students?.length || 0}</span>
                    </h4>
                    <button 
                      onClick={() => setShowAddStudent(!showAddStudent)} 
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${showAddStudent ? 'bg-slate-200 text-slate-700' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      {showAddStudent ? 'Yopish' : '+ Qo\'shish'}
                    </button>
                  </div>
                  
                  {showAddStudent && (
                    <div className="mb-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Talaba tanlang</label>
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={selectedStudentId}
                          onChange={e => setSelectedStudentId(e.target.value)}
                        >
                          <option value="">-- Tanlash --</option>
                          {students.filter(s => s.group_id !== selectedGroupId).map(s => (
                            <option key={s.id} value={s.id} disabled={!!s.group_id}>
                              {s.full_name} {s.group_id ? `(Boshqa guruhda)` : `(Guruhsiz)`}
                            </option>
                          ))}
                        </select>
                        <button 
                          onClick={assignStudent} 
                          disabled={!selectedStudentId}
                          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
                        >
                          Qo'shish
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {activeGroup?.students?.length === 0 && (
                      <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-400 font-medium">Talabalar yo'q</p>
                      </div>
                    )}
                    {activeGroup?.students?.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold">
                            {s.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-800 block">{s.full_name}</span>
                            <span className="text-[10px] font-semibold text-slate-400">{s.email}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeStudent(s.id)} 
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                          title="Guruhdan olib tashlash"
                        >
                          <RiCloseLine size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Specialty Form Modal */}
      {specForm.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  {specForm.id ? <RiEditLine /> : <RiAddLine />}
                </span>
                {specForm.id ? 'Yo\'nalishni Tahrirlash' : 'Yangi Yo\'nalish'}
              </h3>
              <button 
                onClick={() => setSpecForm({ show: false, id: null, name: '' })}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={saveSpec} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Yo'nalish nomi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <RiStethoscopeLine className="text-slate-400" />
                  </div>
                  <input 
                    autoFocus 
                    type="text" 
                    value={specForm.name} 
                    onChange={e => setSpecForm({ ...specForm, name: e.target.value })} 
                    placeholder="Masalan: Davolash ishi" 
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setSpecForm({ show: false, id: null, name: '' })} 
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-200"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                >
                  <RiSave3Line /> {specForm.id ? 'Saqlash' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Form Modal */}
      {groupForm.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  {groupForm.id ? <RiEditLine /> : <RiAddLine />}
                </span>
                {groupForm.id ? 'Guruhni Tahrirlash' : 'Yangi Guruh Yaratish'}
              </h3>
              <button 
                onClick={() => setGroupForm({ show: false, id: null, name: '', specialty_id: '' })}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={saveGroup} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Yo'nalishni tanlang
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <RiStethoscopeLine className="text-slate-400" />
                  </div>
                  <select 
                    value={groupForm.specialty_id || selectedSpecId || ''}
                    onChange={e => setGroupForm({ ...groupForm, specialty_id: e.target.value })}
                    className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm bg-slate-50 focus:bg-white appearance-none font-medium"
                    required
                  >
                    <option value="" disabled>-- Yo'nalish tanlang --</option>
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Guruh nomi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <RiGroupLine className="text-slate-400" />
                  </div>
                  <input 
                    autoFocus 
                    type="text" 
                    value={groupForm.name} 
                    onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} 
                    placeholder="Masalan: 401-Stomatologiya" 
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setGroupForm({ show: false, id: null, name: '', specialty_id: '' })} 
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-200"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-purple-500 flex items-center gap-2"
                >
                  <RiSave3Line /> {groupForm.id ? 'Saqlash' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
