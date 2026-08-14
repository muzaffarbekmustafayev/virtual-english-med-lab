import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  RiGroupLine, RiAddLine, RiDeleteBinLine, RiEditLine,
  RiCheckLine, RiCloseLine, RiUserStarLine, RiUser3Line,
  RiStethoscopeLine, RiSearchLine, RiSave3Line, RiShieldCheckLine,
  RiCheckboxCircleLine, RiFolderUserLine, RiExchangeLine,
  RiArrowRightLine, RiInformationLine
} from 'react-icons/ri';

export default function AdminGroupsPage() {
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'specialties' | 'teacher_assign' | 'student_assign'

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
      toast.error("Ma'lumotlarni yuklashda xatolik");
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
        toast.success("Guruh muvaffaqiyatli yangilandi");
      } else {
        await api.post('/admin/groups', {
          name: groupForm.name,
          specialty_id: groupForm.specialty_id || null,
        });
        toast.success("Yangi guruh yaratildi");
      }
      setShowGroupModal(false);
      setGroupForm({ id: null, name: '', specialty_id: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || "Guruhni saqlashda xatolik");
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Haqiqatan ham ushbu guruhni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/admin/groups/${id}`);
      toast.success("Guruh o'chirildi");
      loadAll();
    } catch {
      toast.error("O'chirishda xatolik");
    }
  };

  // ── SPECIALTY ACTIONS ──
  const handleSaveSpec = async (e) => {
    e.preventDefault();
    if (!specForm.name.trim()) return;
    try {
      if (specForm.id) {
        await api.put(`/admin/specialties/${specForm.id}`, { name: specForm.name });
        toast.success("Mutaxassislik yangilandi");
      } else {
        await api.post('/admin/specialties', { name: specForm.name });
        toast.success("Yangi mutaxassislik qo'shildi");
      }
      setShowSpecModal(false);
      setSpecForm({ id: null, name: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || "Saqlashda xatolik");
    }
  };

  const handleDeleteSpec = async (id) => {
    if (!window.confirm("Haqiqatan ham ushbu mutaxassislikni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/admin/specialties/${id}`);
      toast.success("Mutaxassislik o'chirildi");
      loadAll();
    } catch {
      toast.error("O'chirishda xatolik");
    }
  };

  // ── TEACHER-GROUP TOGGLE ──
  const toggleTeacherGroup = async (groupId, isAssigned) => {
    if (!selectedTeacherId) {
      toast.error("Avval o'qituvchini tanlang");
      return;
    }
    try {
      if (isAssigned) {
        await api.delete('/admin/teacher-groups', {
          data: { teacher_id: selectedTeacherId, group_id: groupId }
        });
        toast.success("Biriktiruv bekor qilindi");
      } else {
        await api.post('/admin/teacher-groups', {
          teacher_id: selectedTeacherId,
          group_id: groupId,
        });
        toast.success("O'qituvchiga guruh biriktirildi");
      }
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || "Amalni bajarishda xatolik");
    }
  };

  // ── STUDENT ASSIGNMENT ──
  const handleAssignStudent = async (studentId, newGroupId, newSpecId) => {
    try {
      await api.post('/admin/student-groups', {
        student_id: studentId,
        group_id: newGroupId,
        specialty_id: newSpecId,
      });
      toast.success("Talaba guruhi yangilandi");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || "Talabani biriktirishda xatolik");
    }
  };

  const selectedTeacher = teachers.find(t => t.id == selectedTeacherId);

  // Filtered Students
  const filteredStudents = students.filter(s => {
    const matchesSearch = !studentSearch.trim() ||
      s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesGroup = !groupFilter || s.group_id == groupFilter;
    return matchesSearch && matchesGroup;
  });

  return (
    <Layout>
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
              Admin Boshqaruv Markazi
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RiGroupLine className="text-purple-600" /> Guruhlar, Yo'nalishlar & Biriktirish
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tibbiy mutaxassisliklar yaratish, guruhlarni yo'nalishga biriktirish va o'qituvchi/talabalarni guruhlarga taqsimlash
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2">
          {activeTab === 'groups' && (
            <button
              onClick={() => {
                setGroupForm({ id: null, name: '', specialty_id: specialties[0]?.id || '' });
                setShowGroupModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <RiAddLine className="text-base" /> Yangi Guruh Yaratish
            </button>
          )}

          {activeTab === 'specialties' && (
            <button
              onClick={() => {
                setSpecForm({ id: null, name: '' });
                setShowSpecModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <RiAddLine className="text-base" /> Yangi Yo'nalish Qo'shish
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'groups'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <RiGroupLine className="text-base" /> Akademik Guruhlar ({groups.length})
        </button>

        <button
          onClick={() => setActiveTab('specialties')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'specialties'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <RiStethoscopeLine className="text-base" /> Tibbiy Yo'nalishlar ({specialties.length})
        </button>

        <button
          onClick={() => setActiveTab('teacher_assign')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'teacher_assign'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <RiUserStarLine className="text-base" /> O'qituvchiga Guruh Biriktirish
        </button>

        <button
          onClick={() => setActiveTab('student_assign')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'student_assign'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <RiUser3Line className="text-base" /> Talabalarni Guruhlarga Taqsimlash ({students.length})
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: AKADEMIK GURUHLAR RO'YXATI ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'groups' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 uppercase">
              Barcha Guruhlar & Biriktirilgan Yo'nalishlar
            </span>
            <span className="text-xs text-gray-500 font-semibold bg-gray-200 px-2.5 py-0.5 rounded-full">
              {groups.length} ta guruh
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <th className="px-5 py-3.5">Guruh Nomi</th>
                  <th className="px-5 py-3.5">Tibbiy Yo'nalish</th>
                  <th className="px-5 py-3.5">Biriktirilgan O'qituvchilar</th>
                  <th className="px-5 py-3.5 text-center">Talabalar Soni</th>
                  <th className="px-5 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groups.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {g.name.slice(0, 3)}
                        </span>
                        <span>{g.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {g.specialty ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <RiStethoscopeLine /> {g.specialty.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Yo'nalish biriktirilmagan</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {g.teachers?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {g.teachers.map((t) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200"
                            >
                              <RiUserStarLine /> {t.full_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">O'qituvchi tayinlanmagan</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {g.students?.length || 0} nafar talaba
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setGroupForm({
                              id: g.id,
                              name: g.name,
                              specialty_id: g.specialty_id || g.specialty?.id || '',
                            });
                            setShowGroupModal(true);
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Tahrirlash"
                        >
                          <RiEditLine className="text-base" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(g.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="O'chirish"
                        >
                          <RiDeleteBinLine className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {groups.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                      Guruhlar topilmadi. Yuqoridagi tugma orqali yangi guruh yarating.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: TIBBIY YO'NALISHLAR (SPECIALTIES) ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'specialties' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {specialties.map((s) => {
            const linkedGroups = groups.filter(g => g.specialty_id === s.id || g.specialty?.id === s.id);
            return (
              <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl border border-emerald-200">
                      <RiStethoscopeLine />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{s.name}</h3>
                      <p className="text-xs text-gray-400">Mutaxassislik ID: #{s.id}</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSpecForm({ id: s.id, name: s.name });
                        setShowSpecModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <RiEditLine />
                    </button>
                    <button
                      onClick={() => handleDeleteSpec(s.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <RiDeleteBinLine />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Biriktirilgan Guruhlar:</p>
                  {linkedGroups.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {linkedGroups.map(g => (
                        <span key={g.id} className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Hozircha guruh biriktirilmagan</p>
                  )}
                </div>
              </div>
            );
          })}

          {specialties.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-gray-200 text-gray-400">
              Yo'nalishlar mavjud emas. Yangi yo'nalish qo'shing.
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: O'QITUVCHIGA GURUH BIRIKTIRISH ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'teacher_assign' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Teachers Selector List */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
              <RiUserStarLine className="text-indigo-600" /> O'qituvchini Tanlang:
            </h3>

            <div className="space-y-2">
              {teachers.map((t) => {
                const isSelected = t.id == selectedTeacherId;
                // Count assigned groups
                const teacherGroupCount = groups.filter(g => g.teachers?.some(teach => teach.id === t.id)).length;

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-gray-50/80 hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{t.full_name}</p>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {t.email}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {teacherGroupCount} guruh
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Interactive Groups Matrix for Selected Teacher */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {selectedTeacher?.full_name || "O'qituvchi"} ga Biriktirilgan Guruhlar
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Guruhni biriktirish yoki olib tashlash uchun quyidagi tugmalarni bosing
                </p>
              </div>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-xl">
                O'qituvchi ID: #{selectedTeacherId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {groups.map((g) => {
                const isAssigned = g.teachers?.some(t => t.id === selectedTeacherId);

                return (
                  <div
                    key={g.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                      isAssigned
                        ? 'bg-emerald-50/50 border-emerald-300 shadow-sm'
                        : 'bg-gray-50/60 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {g.specialty?.name || "Yo'nalishsiz"} • {g.students?.length || 0} talaba
                      </p>
                    </div>

                    <button
                      onClick={() => toggleTeacherGroup(g.id, isAssigned)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                        isAssigned
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isAssigned ? 'Olib Tashlash' : '+ Biriktirish'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: TALABALARNI GURUHLARGA TAQSIMLASH ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'student_assign' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Filter Toolbar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Talabani qidirish (ism/email)..."
                  className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Barcha Guruhlar</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <span className="text-xs text-gray-500 font-semibold">
              Ko'rsatilmoqda: <b>{filteredStudents.length}</b> nafar talaba
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <th className="px-5 py-3.5">Talaba Ism-Familiyasi</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Tibbiy Yo'nalish</th>
                  <th className="px-5 py-3.5">Biriktirilgan Guruh</th>
                  <th className="px-5 py-3.5 text-right">Guruhni O'zgartirish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {s.full_name?.charAt(0)}
                      </div>
                      <span>{s.full_name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{s.email}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={s.specialty_id || s.specialty?.id || ''}
                        onChange={(e) => handleAssignStudent(s.id, s.group_id, e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">Yo'nalish tanlang...</option>
                        {specialties.map(spec => (
                          <option key={spec.id} value={spec.id}>{spec.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={s.group_id || s.group?.id || ''}
                        onChange={(e) => handleAssignStudent(s.id, e.target.value, s.specialty_id)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">Guruh tanlang...</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-emerald-600 font-semibold">
                      <RiCheckLine className="inline text-base" /> Avtomatik saqlanadi
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                      Talabalar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: CREATE / EDIT GROUP ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 shadow-2xl rounded-3xl w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="font-bold text-gray-900 text-base">
                {groupForm.id ? "Guruhni Tahrirlash" : "Yangi Akademik Guruh Yaratish"}
              </h3>
              <button
                onClick={() => setShowGroupModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Akademik Guruh Nomi *</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="masalan: 401-Stomatologiya"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Biriktiriladigan Tibbiy Yo'nalish</label>
                <select
                  value={groupForm.specialty_id}
                  onChange={(e) => setGroupForm({ ...groupForm, specialty_id: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Yo'nalishni tanlang...</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: CREATE / EDIT SPECIALTY ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showSpecModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 shadow-2xl rounded-3xl w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="font-bold text-gray-900 text-base">
                {specForm.id ? "Yo'nalishni Tahrirlash" : "Yangi Tibbiy Yo'nalish Qo'shish"}
              </h3>
              <button
                onClick={() => setShowSpecModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSaveSpec} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Mutaxassislik Nomi *</label>
                <input
                  type="text"
                  value={specForm.name}
                  onChange={(e) => setSpecForm({ ...specForm, name: e.target.value })}
                  placeholder="masalan: Stomatologiya, Pediatriya, Kardiologiya"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowSpecModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
