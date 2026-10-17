import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { NoSpecialtyBanner } from '../../components/ui';
import {
  RiBookOpenLine, RiCheckboxCircleLine, RiTimeLine, RiLockLine,
  RiArrowRightLine, RiTrophyLine, RiFirstAidKitLine, RiStethoscopeLine,
  RiMicroscopeLine, RiSyringeLine, RiHeartPulseLine, RiHospitalLine,
  RiPlayLine, RiSearchLine, RiAwardLine, RiSparklingLine, RiShieldCheckLine
} from 'react-icons/ri';
import { getModuleVisual } from '../../lib/moduleIcons';

export default function ModulesPage() {
  const navigate = useNavigate();
  const { t, getLocalized } = useLanguage();
  const { user } = useAuth();
  const isStudentAll = user?.role === 'student_all';

  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(user?.specialty_id || 1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');

  // student_all uchun mutaxassisliklar ro'yxatini yuklash
  useEffect(() => {
    if (isStudentAll) {
      api.get('/student/specialties')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setSpecialties(res.data);
            if (!user?.specialty_id) {
              setSelectedSpecialtyId(res.data[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isStudentAll]);

  useEffect(() => {
    setLoading(true);
    const query = isStudentAll ? `?specialty_id=${selectedSpecialtyId}` : '';

    // Avval curriculum (modullar + oraliq/yakuniy imtihonlar) ni olamiz
    api.get(`/student/curriculum${query}`)
      .then(r => {
        if (r.data?.items) {
          setItems(r.data.items);
        } else {
          // fallback
          return api.get(`/student/modules${query}`).then(res => {
            setItems(res.data.map(m => ({ ...m, kind: 'module' })));
          });
        }
      })
      .catch(() => {
        api.get(`/student/modules${query}`)
          .then(res => setItems(res.data.map(m => ({ ...m, kind: 'module' }))))
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [selectedSpecialtyId, isStudentAll]);

  const getStatus = (item) => {
    if (!item.is_unlocked) return 'locked';
    if (item.is_completed) return 'completed';
    if (item.best_score !== null || item.score !== null) return 'in-progress';
    return 'not-started';
  };

  const statusConfig = {
    completed:    { badge: 'badge-emerald', label: t('student.modules.completed_badge') || 'Yakunlangan', icon: RiCheckboxCircleLine },
    'in-progress':{ badge: 'badge-amber',   label: t('common.in_progress') || 'Jarayonda',            icon: RiTimeLine },
    'not-started':{ badge: 'badge-blue',    label: t('student.modules.start_btn') || 'Boshlash',            icon: RiPlayLine },
    locked:       { badge: 'badge-slate',   label: t('student.modules.locked_badge') || 'Qulflangan',                 icon: RiLockLine },
  };

  const filtered = items
    .filter(item => {
      if (filter === 'all') return true;
      if (filter === 'exams') return item.kind === 'exam';
      if (filter === 'modules') return item.kind === 'module';
      return getStatus(item) === filter;
    })
    .filter(item => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const title = (item.title || item.title_uz || '').toLowerCase();
      const desc = (item.description || item.description_uz || '').toLowerCase();
      return title.includes(term) || desc.includes(term);
    });

  const modulesOnly = items.filter(i => i.kind === 'module');
  const examsOnly = items.filter(i => i.kind === 'exam');

  const counts = {
    all:          items.length,
    modules:      modulesOnly.length,
    exams:        examsOnly.length,
    'not-started':items.filter(m => getStatus(m) === 'not-started').length,
    'in-progress':items.filter(m => getStatus(m) === 'in-progress').length,
    completed:    items.filter(m => getStatus(m) === 'completed').length,
    locked:       items.filter(m => getStatus(m) === 'locked').length,
  };

  const FILTERS = [
    { key: 'all',          label: t('common.all') || 'Barchasi' },
    { key: 'modules',      label: t('nav.modules') || 'Modullar' },
    { key: 'exams',        label: 'Imtihonlar' },
    { key: 'not-started',  label: t('student.modules.start_btn') || 'Boshlash' },
    { key: 'in-progress',  label: t('common.in_progress') || 'Jarayonda' },
    { key: 'completed',    label: t('student.modules.completed_badge') || 'Yakunlangan' },
    { key: 'locked',       label: t('student.modules.locked_badge') || 'Qulflangan' },
  ];

  const isNursing = user?.specialty?.code === 'NURSING' || modulesOnly.length === 18 || (user?.specialty?.name || '').toLowerCase().includes('hamshira');

  return (
    <Layout>
      <div className="space-y-5 sm:space-y-6">
        <NoSpecialtyBanner user={user} onChoose={() => navigate('/student/profile?tab=settings')} />

        {/* ── 1. Page Header ── */}
        <div className="card-hero p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-standard badge-blue">
                {modulesOnly.length} {t('nav.modules') || "Modullar"} · {examsOnly.length} Imtihon
              </span>
              <span className="text-xs text-slate-500 font-bold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                Clinical English Hub
              </span>
              {isStudentAll && (
                <span className="badge-standard badge-purple text-[10px] font-black uppercase tracking-wider">
                  Barcha yo'nalishlar
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-[1.9rem] font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xl shrink-0">
                <RiBookOpenLine />
              </span>
              {t('student.modules.title') || "O'quv Dasturi va Imtihonlar"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl leading-relaxed">
              {isNursing
                ? "Oliy hamshiralik (18 modul): 1–6-modullar → Oraliq imtihon I → 7–12-modullar → Oraliq imtihon II → 13–18-modullar → Yakuniy imtihon."
                : "Davolash ishi, Pediatriya va Stomatologiya (10 modul): 1–5-modul → Oraliq imtihon → 6–10-modul → Yakuniy imtihon."}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 z-10">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder={t('common.search') || "Qidiruv..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-standard has-icon-left text-xs bg-white"
            />
          </div>
        </div>

        {/* ── 1.5. Mutaxassisliklar Tanlash Paneli (Faqat student_all uchun) ── */}
        {isStudentAll && specialties.length > 0 && (
          <div className="card-glass p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RiHospitalLine className="text-indigo-600 text-base" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Tibbiy Yo'nalishni Tanlang ({specialties.length} ta yo'nalish)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Erkin kirish
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {specialties.map((s) => {
                const isSelected = selectedSpecialtyId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSpecialtyId(s.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
                        : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200/90 hover:border-blue-300 shadow-2xs'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{s.icon || '🩺'}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {getLocalized(s, 'name') || s.name}
                      </p>
                      <p className={`text-[10px] font-semibold truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {s.code}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 2. Filter Pills (Mobile Horizontal Scrollable) ── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full flex-nowrap sm:flex-wrap">
          {FILTERS.map(f => {
            const isActive = filter === f.key;
            const count = counts[f.key] || 0;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{f.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 3. Curriculum Grid (Modules + Midterm & Final Exams) ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-standard p-12 text-center">
            <p className="text-sm font-bold text-slate-700">Ma'lumot topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((item, idx) => {
              // Agar EXAM (Oraliq yoki Yakuniy Imtihon) bo'lsa
              if (item.kind === 'exam') {
                const isMidterm = item.type === 'midterm';
                const st = getStatus(item);
                const cfg = statusConfig[st];
                const StatusIcon = cfg.icon;

                return (
                  <div
                    key={`exam-${item.id}`}
                    onClick={() => item.is_unlocked && navigate(`/student/exams/${item.exam_type}`)}
                    className={`col-span-1 sm:col-span-2 lg:col-span-3 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border transition-all ${
                      item.is_unlocked
                        ? isMidterm
                          ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border-amber-300 hover:border-amber-400 hover:shadow-lg cursor-pointer'
                          : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-emerald-300 hover:border-emerald-400 hover:shadow-lg cursor-pointer'
                        : 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
                      <div className="flex items-start gap-3.5 sm:gap-4">
                        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0 shadow-sm ${
                          isMidterm
                            ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-amber-500/30'
                            : 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-emerald-500/30'
                        }`}>
                          <RiAwardLine />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isMidterm
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {item.badge || (isMidterm ? 'Oraliq Imtihon' : 'Yakuniy Imtihon')}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              Qamrov: {item.covered_modules?.join(', ')}-modullar
                            </span>
                            <span className={`badge-standard ${cfg.badge} text-[10px]`}>
                              <StatusIcon className="text-xs" />
                              <span>{cfg.label}</span>
                            </span>
                          </div>

                          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                            {getLocalized(item, 'title') || item.title}
                          </h3>

                          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed max-w-2xl">
                            {getLocalized(item, 'description') || item.description_uz}
                          </p>
                        </div>
                      </div>

                      {/* Right Action & Score */}
                      <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 w-full sm:w-auto">
                        {item.score !== null && (
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Natija</span>
                            <span className="text-lg sm:text-xl font-black text-amber-600 flex items-center gap-1">
                              <RiTrophyLine /> {item.score}%
                            </span>
                          </div>
                        )}

                        {item.is_unlocked ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/student/exams/${item.exam_type}`);
                            }}
                            className={`btn-primary text-xs font-black py-2.5 px-4 sm:px-5 shadow-sm hover:shadow-md transition-all w-full sm:w-auto justify-center cursor-pointer ${
                              isMidterm ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            <span>
                              {item.is_completed ? "Natijani ko'rish" : item.score !== null ? "Davom ettirish" : "Imtihonni topshirish"}
                            </span>
                            <RiArrowRightLine className="text-sm" />
                          </button>
                        ) : (
                          <div className="text-right ml-auto sm:ml-0">
                            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                              <RiLockLine /> Avvalgi modullarni o'ting
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Oddiy MODUL kartochkasi
              const mod = item;
              const st = getStatus(mod);
              const cfg = statusConfig[st];
              const StatusIcon = cfg.icon;
              const visual = getModuleVisual(mod, user?.specialty?.code);
              const IconComponent = visual.icon;
              const title = getLocalized(mod, 'title') || mod.title;
              const description = getLocalized(mod, 'description') || mod.description;

              return (
                <div
                  key={`mod-${mod.id}`}
                  onClick={() => mod.is_unlocked && navigate(`/student/modules/${mod.id}`)}
                  className={`card-standard p-6 flex flex-col justify-between transition-all ${
                    mod.is_unlocked
                      ? 'hover:border-blue-300 hover:shadow-md cursor-pointer hover:-translate-y-1'
                      : 'bg-slate-50/60 border-slate-200 opacity-70 cursor-not-allowed'
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 border ${visual.bg}`}>
                          <IconComponent />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          {t('student.modules.order') || "Modul"} #{mod.order_index}
                        </span>
                      </div>

                      <span className={`badge-standard ${cfg.badge}`}>
                        <StatusIcon className="text-xs" />
                        <span>{cfg.label}</span>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug mb-2">
                      {title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 font-medium">
                      {description}
                    </p>
                  </div>

                  {/* Footer & CTA */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    {mod.best_score !== null && (
                      <span className="badge-standard badge-amber">
                        <RiTrophyLine /> {mod.best_score}%
                      </span>
                    )}

                    {mod.is_unlocked ? (
                      <button
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors ml-auto"
                      >
                        <span>
                          {mod.is_completed
                            ? (t('student.modules.review_btn') || "Ko'rib chiqish")
                            : mod.best_score !== null
                            ? (t('student.modules.continue_btn') || "Davom ettirish")
                            : (t('student.modules.start_btn') || "Boshlash")}
                        </span>
                        <RiArrowRightLine />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 ml-auto">
                        <RiLockLine /> {t('student.modules.unlock_tip') || "Ketma-ket ochiladi"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
