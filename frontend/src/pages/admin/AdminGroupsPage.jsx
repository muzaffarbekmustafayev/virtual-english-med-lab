import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  RiGroupLine, RiAddLine, RiDeleteBinLine, RiEditLine,
  RiCheckLine, RiCloseLine, RiUserStarLine, RiUser3Line,
  RiStethoscopeLine, RiSearchLine, RiSave3Line, RiShieldCheckLine,
  RiArrowRightSLine, RiDragDropLine, RiMore2Fill
} from 'react-icons/ri';

export default function AdminGroupsPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Data States
  const [specialties, setSpecialties] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selection States
  const [selectedSpecId, setSelectedSpecId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Modals / Forms
  const [specForm, setSpecForm] = useState({ show: false, id: null, name: '' });
  const [groupForm, setGroupForm] = useState({ show: false, id: null, name: '' });
  
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

  const [viewMode, setViewMode] = useState('all'); // 'specialty', 'group', 'all'

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'specialty') {
      setViewMode('specialty');
      setSpecForm(prev => prev.show ? prev : { show: true, id: null, name: '' });
    } else if (action === 'group') {
      setViewMode('group');
      setGroupForm(prev => prev.show ? prev : { show: true, id: null, name: '' });
    } else {
      setViewMode('all');
    }
  }, [location.search]);

  // Derived Data
  const teachers = useMemo(() => users.filter(u => u.role === 'teacher'), [users]);
  const students = useMemo(() => users.filter(u => u.role === 'student'), [users]);
  
  const filteredGroups = useMemo(() => {
    if (!selectedSpecId) return [];
    return groups.filter(g => g.specialty_id == selectedSpecId);
  }, [groups, selectedSpecId]);

  const activeGroup = useMemo(() => {
    return groups.find(g => g.id == selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // Handle Spec Click
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
    if (!groupForm.name.trim() || !selectedSpecId) return;
    try {
      if (groupForm.id) {
        await api.put(`/admin/groups/${groupForm.id}`, { name: groupForm.name, specialty_id: selectedSpecId });
      } else {
        await api.post('/admin/groups', { name: groupForm.name, specialty_id: selectedSpecId });
      }
      toast.success(t('common.success'));
      setGroupForm({ show: false, id: null, name: '' });
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
      <div className="space-y-6">
        {/* Header */}
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
              Tashkilot Tuzilmasi
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">Yo'nalishlar, Guruhlar, O'qituvchi va Talabalarni boshqarish</p>
          </div>
        </div>

        {loading && specialties.length === 0 ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className={`grid grid-cols-1 ${viewMode === 'specialty' ? 'lg:grid-cols-1' : viewMode === 'group' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
            
            {/* COLUMN 1: SPECIALTIES */}
            {(viewMode === 'all' || viewMode === 'specialty') && (
            <div className="card-standard p-5 h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <RiStethoscopeLine className="text-slate-500" /> Yo'nalishlar
                </h3>
                <button onClick={() => setSpecForm({ show: true, id: null, name: '' })} className="btn-primary-gradient px-3 py-1.5 text-xs">
                  <RiAddLine /> Qo'shish
                </button>
              </div>

              {specForm.show && (
                <form onSubmit={saveSpec} className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input autoFocus type="text" value={specForm.name} onChange={e => setSpecForm({...specForm, name: e.target.value})} placeholder="Yo'nalish nomi..." className="input-standard text-sm py-2 mb-2" />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setSpecForm({show:false, id:null, name:''})} className="btn-secondary-soft px-3 py-1.5 text-xs">Bekor</button>
                    <button type="submit" className="btn-primary-gradient px-3 py-1.5 text-xs">Saqlash</button>
                  </div>
                </form>
              )}

              <div className="overflow-y-auto pr-2 space-y-2 flex-1 custom-scrollbar">
                {specialties.length === 0 && !specForm.show && <p className="text-sm text-slate-500 text-center py-4">Yo'nalishlar yo'q</p>}
                {specialties.map(spec => (
                  <div 
                    key={spec.id} 
                    onClick={() => handleSpecClick(spec.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedSpecId === spec.id ? 'bg-slate-100 border-slate-300 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <div>
                      <h4 className={`font-bold text-sm ${selectedSpecId === spec.id ? 'text-slate-900' : 'text-slate-700'}`}>{spec.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{spec.groups?.length || 0} ta guruh</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setSpecForm({ show: true, id: spec.id, name: spec.name }); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"><RiEditLine /></button>
                      <button onClick={(e) => deleteSpec(spec.id, e)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"><RiDeleteBinLine /></button>
                      <RiArrowRightSLine className={`${selectedSpecId === spec.id ? 'text-slate-500' : 'text-slate-300'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* COLUMN 2: GROUPS */}
            {(viewMode === 'all' || viewMode === 'group') && (
            <div className="card-standard p-5 h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <RiGroupLine className="text-slate-500" /> Guruhlar
                </h3>
                {selectedSpecId && (
                  <button onClick={() => setGroupForm({ show: true, id: null, name: '' })} className="btn-primary-gradient px-3 py-1.5 text-xs">
                    <RiAddLine /> Qo'shish
                  </button>
                )}
              </div>

              {viewMode === 'group' && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Yo'nalishni tanlang</label>
                  <select 
                    className="input-standard text-sm w-full py-2"
                    value={selectedSpecId || ''}
                    onChange={(e) => handleSpecClick(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">-- Yo'nalish tanlang --</option>
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {!selectedSpecId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
                  <RiArrowRightSLine size={32} className="mb-2 opacity-50" />
                  <p>Chapdan yo'nalishni tanlang</p>
                </div>
              ) : (
                <>
                  {/* Group items are shown below */}
                  
                  <div className="overflow-y-auto pr-2 space-y-2 flex-1 custom-scrollbar">
                    {filteredGroups.length === 0 && !groupForm.show && <p className="text-sm text-slate-500 text-center py-4">Bu yo'nalishda guruhlar yo'q</p>}
                    {filteredGroups.map(group => (
                      <div 
                        key={group.id} 
                        onClick={() => setSelectedGroupId(group.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedGroupId === group.id ? 'bg-slate-100 border-slate-300 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        <div>
                          <h4 className={`font-bold text-sm ${selectedGroupId === group.id ? 'text-slate-900' : 'text-slate-700'}`}>{group.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><RiUserStarLine/> {group.teachers?.length || 0}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1"><RiUser3Line/> {group.students?.length || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setGroupForm({ show: true, id: group.id, name: group.name }); }} className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-50"><RiEditLine /></button>
                          <button onClick={(e) => deleteGroup(group.id, e)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"><RiDeleteBinLine /></button>
                          <RiArrowRightSLine className={`${selectedGroupId === group.id ? 'text-slate-500' : 'text-slate-300'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            )}

            {/* COLUMN 3: USERS IN GROUP */}
            {(viewMode === 'all' || viewMode === 'group') && (
            <div className="card-standard p-5 h-[600px] flex flex-col bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <RiUserStarLine className="text-slate-500" /> A'zolar
                </h3>
              </div>

              {!selectedGroupId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
                  <RiArrowRightSLine size={32} className="mb-2 opacity-50" />
                  <p>Chapdan guruhni tanlang</p>
                </div>
              ) : (
                <div className="overflow-y-auto pr-2 space-y-6 flex-1 custom-scrollbar">
                  
                  {/* Teachers Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-slate-700">O'qituvchilar</h4>
                      <button onClick={() => setShowAddTeacher(!showAddTeacher)} className="text-slate-600 hover:text-slate-800 text-xs font-bold flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                        <RiAddLine /> Qo'shish
                      </button>
                    </div>
                    
                    {showAddTeacher && (
                      <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <select 
                          className="input-standard text-sm py-2 w-full mb-2"
                          value={selectedTeacherId}
                          onChange={e => setSelectedTeacherId(e.target.value)}
                        >
                          <option value="">O'qituvchi tanlang...</option>
                          {teachers.filter(t => !activeGroup?.teachers?.some(at => at.id === t.id)).map(t => (
                            <option key={t.id} value={t.id}>{t.full_name}</option>
                          ))}
                        </select>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setShowAddTeacher(false)} className="btn-secondary-soft px-2 py-1 text-xs">Bekor</button>
                          <button onClick={assignTeacher} className="btn-primary-gradient px-2 py-1 rounded-lg text-xs">Biriktirish</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {activeGroup?.teachers?.length === 0 && <p className="text-xs text-slate-400 italic">O'qituvchilar yo'q</p>}
                      {activeGroup?.teachers?.map(t => (
                        <div key={t.id} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                              <RiUserStarLine className="text-lg" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">{t.full_name}</span>
                          </div>
                          <button onClick={() => removeTeacher(t.id)} className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg"><RiCloseLine/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Students Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-slate-700">Talabalar</h4>
                      <button onClick={() => setShowAddStudent(!showAddStudent)} className="text-slate-600 hover:text-slate-800 text-xs font-bold flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                        <RiAddLine /> Qo'shish
                      </button>
                    </div>
                    
                    {showAddStudent && (
                      <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <select 
                          className="input-standard text-sm py-2 w-full mb-2"
                          value={selectedStudentId}
                          onChange={e => setSelectedStudentId(e.target.value)}
                        >
                          <option value="">Talaba tanlang...</option>
                          {students.filter(s => s.group_id !== selectedGroupId).map(s => (
                            <option key={s.id} value={s.id} disabled={!!s.group_id}>{s.full_name} {s.group_id ? `(Boshqa guruhda)` : `(Guruhsiz)`}</option>
                          ))}
                        </select>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setShowAddStudent(false)} className="btn-secondary-soft px-2 py-1 text-xs">Bekor</button>
                          <button onClick={assignStudent} className="btn-primary-gradient px-2 py-1 rounded-lg text-xs">Qo'shish</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {activeGroup?.students?.length === 0 && <p className="text-xs text-slate-400 italic">Talabalar yo'q</p>}
                      {activeGroup?.students?.map(s => (
                        <div key={s.id} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                              {s.full_name?.charAt(0) || 'T'}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{s.full_name}</span>
                          </div>
                          <button onClick={() => removeStudent(s.id)} className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg"><RiCloseLine/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
            )}

          </div>
        )}
      </div>

      {/* Group Form Modal */}
      {groupForm.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  {groupForm.id ? <RiEditLine /> : <RiAddLine />}
                </span>
                {groupForm.id ? 'Guruhni Tahrirlash' : 'Yangi Guruh Yaratish'}
              </h3>
              <button 
                onClick={() => setGroupForm({ show: false, id: null, name: '' })}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={saveGroup} className="p-6">
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
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                  <RiCheckLine className="text-emerald-500" /> Ushbu guruh 
                  <span className="font-semibold text-slate-700">
                    {specialties.find(s => s.id == selectedSpecId)?.name}
                  </span> yo'nalishiga qo'shiladi.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setGroupForm({ show: false, id: null, name: '' })} 
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-200"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
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
