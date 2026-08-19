import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  RiBookOpenLine, RiAddLine, RiDeleteBinLine, RiCloseLine,
  RiEditLine, RiFileListLine, RiBookLine, RiLightbulbLine,
  RiQuestionLine, RiSearchLine, RiSave3Line, RiCheckLine,
  RiInformationLine, RiLayoutGridLine, RiStethoscopeLine,
  RiArrowLeftLine, RiArrowRightLine, RiSparklingLine,
  RiMentalHealthLine, RiBrainLine, RiListCheck2,
  RiNumbersLine, RiText, RiFileTextLine,
} from 'react-icons/ri';

const TABS = [
  { id: 'grammar',     name: "Grammatika",       icon: RiBrainLine,      color: 'amber',   desc: "Klinik grammatik qoidalar va namunalar" },
  { id: 'vocabulary',  name: "Lug'at",          icon: RiBookLine,       color: 'indigo',  desc: "Tibbiy atamalar va tarjimalar" },
  { id: 'phrasebook',  name: "Iboralar",         icon: RiLightbulbLine,  color: 'cyan',    desc: "Klinik muloqot iboralari" },
  { id: 'quizzes',     name: "Testlar",          icon: RiQuestionLine,   color: 'purple',  desc: "4 variantli test savollari" },
  { id: 'scenarios',   name: "Modullar",         icon: RiFileListLine,   color: 'emerald', desc: "AI Bemor Ssenariysi" },
];

const COLOR_MAP = {
  amber:   { bg: 'bg-amber-600',   light: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-500',   ring: 'ring-amber-500/10',   badge: 'bg-amber-100 text-amber-800' },
  indigo:  { bg: 'bg-indigo-600',  light: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-500',  ring: 'ring-indigo-500/10',  badge: 'bg-indigo-100 text-indigo-800' },
  cyan:    { bg: 'bg-cyan-600',    light: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-500',    ring: 'ring-cyan-500/10',    badge: 'bg-cyan-100 text-cyan-800' },
  purple:  { bg: 'bg-purple-600',  light: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-500',  ring: 'ring-purple-500/10',  badge: 'bg-purple-100 text-purple-800' },
  emerald: { bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', ring: 'ring-emerald-500/10', badge: 'bg-emerald-100 text-emerald-800' },
};

export default function ContentManager() {
  const { tab = 'grammar' }       = useParams();
  const navigate                  = useNavigate();
  const [modules, setModules]     = useState([]);
  const [specialties, setSpec]    = useState([]);
  const [selMod, setSelMod]       = useState(1);
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEdit]    = useState(null);

  const [selSpec, setSelSpec]     = useState(null);

  const loadModules = () =>
    api.get('/admin/modules')
      .then(r => { setModules(r.data); if (r.data.length > 0 && !selMod) setSelMod(r.data[0].id); })
      .catch(() => toast.error('Modullarni yuklashda xatolik'));

  const loadSpecialties = () =>
    api.get('/admin/specialties').then(r => {
      setSpec(r.data);
      if (r.data.length > 0) setSelSpec(r.data[0].id);
    }).catch(() => {});

  useEffect(() => { loadModules(); loadSpecialties(); }, []);

  const loadItems = async () => {
    if (!selMod) return;
    setLoading(true);
    try {
      if (tab === 'grammar') {
        const res = await api.get(`/admin/grammar?module_id=${selMod}`);
        setItems(res.data || []);
      } else if (tab === 'vocabulary') {
        const res = await api.get(`/admin/vocabulary?module_id=${selMod}`);
        setItems(res.data || []);
      } else if (tab === 'phrasebook') {
        const res = await api.get(`/admin/phrasebook?module_id=${selMod}`);
        setItems(res.data || []);
      } else if (tab === 'quizzes') {
        const res = await api.get(`/admin/tests?module_id=${selMod}`);
        setItems(res.data || []);
      } else if (tab === 'scenarios') {
        const res = await api.get('/admin/modules');
        setItems(res.data || []);
      }
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); setSearch(''); }, [selMod, tab]);

  const handleDelete = async (id) => {
    if (!window.confirm("Haqiqatan ham ushbu yozuvni o'chirmoqchimisiz?")) return;
    const epMap = { grammar: 'grammar', vocabulary: 'vocabulary', phrasebook: 'phrasebook', quizzes: 'tests', scenarios: 'modules' };
    try {
      await api.delete(`/admin/${epMap[tab]}/${id}`);
      toast.success("Muvaffaqiyatli o'chirildi");
      loadItems();
      if (tab === 'scenarios') loadModules();
    } catch {
      toast.error("O'chirishda xatolik yuz berdi");
    }
  };

  const activeModule = modules.find(m => m.id == selMod);
  const activeTab = TABS.find(t => t.id === tab);

  const filteredItems = items.filter(item => {
    if (tab === 'scenarios' && selSpec && item.specialty_id !== selSpec) return false;
    
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (tab === 'grammar') return item.title?.toLowerCase().includes(q) || item.rule_explanation?.toLowerCase().includes(q) || item.structure_pattern?.toLowerCase().includes(q);
    if (tab === 'vocabulary') return item.word?.toLowerCase().includes(q) || item.translation?.toLowerCase().includes(q);
    if (tab === 'phrasebook') return item.phrase?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
    if (tab === 'quizzes')    return item.question?.toLowerCase().includes(q);
    if (tab === 'scenarios')  return item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    return true;
  });

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
              Admin Kontent Boshqaruvi
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RiBookOpenLine className="text-purple-600" /> Kontent & Ma'lumotlar Menejeri
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Modullar, lug'at, iboralar va test savollarini oson boshqaring
          </p>
        </div>
        <button
          onClick={() => { setEdit(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5"
        >
          <RiAddLine className="text-lg" />
          {tab === 'scenarios' ? 'Yangi Modul' : "Yangi Qo'shish"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 mb-4 border-b border-gray-100 pb-4">
          <div className="flex-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 mb-2">
              <RiStethoscopeLine className="text-purple-500" /> Yo'nalishni Tanlang:
            </label>
            <select
              value={selSpec || ''}
              onChange={(e) => {
                const specId = parseInt(e.target.value);
                setSelSpec(specId);
                const firstMod = modules.find(m => m.specialty_id == specId);
                if (firstMod) setSelMod(firstMod.id);
                else setSelMod(null);
              }}
              className="w-full max-w-sm bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-purple-500 focus:border-purple-500 block p-2.5"
            >
              {specialties.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {tab !== 'scenarios' && (
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <RiLayoutGridLine className="text-indigo-500" /> O'quv Modulini Tanlang:
              </label>
              <span className="text-xs text-gray-400">
                Tanlangan: <b className="text-gray-700">{activeModule?.order_index}-modul — {activeModule?.title}</b>
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {modules.filter(m => m.specialty_id == selSpec).map((m) => {
                const isSel = m.id == selMod;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelMod(m.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSel
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                        : 'bg-gray-50/70 hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase ${isSel ? 'text-indigo-200' : 'text-gray-400'}`}>
                        Modul {m.order_index}
                      </span>
                      {isSel && <RiCheckLine className="text-sm" />}
                    </div>
                    <p className="text-xs font-bold truncate mt-1">{m.title}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Jadval / Ro'yxat ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Sub-header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 uppercase">{activeTab?.name}</span>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full font-semibold">
              {filteredItems.length} ta
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-3">
              <RiInformationLine />
            </div>
            <p className="text-sm font-bold text-gray-700">Hech qanday ma'lumot topilmadi</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Yuqoridagi tugma orqali yangi yozuv qo'shishingiz mumkin.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">

            {/* GRAMMAR */}
            {tab === 'grammar' && filteredItems.map((item, idx) => (
              <div key={item.id || idx} className="p-5 hover:bg-gray-50/70 transition flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 w-full max-w-3xl">
                  <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                    §{idx + 1}
                  </span>
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-gray-900">{item.title}</h4>
                      {item.title_uz && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {item.title_uz}
                        </span>
                      )}
                    </div>
                    {(item.rule_explanation || item.rule_explanation_uz) && (
                      <p className="text-xs text-gray-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                        <b>Qoida:</b> {item.rule_explanation_uz || item.rule_explanation}
                      </p>
                    )}
                    {(item.structure_pattern || item.structure_pattern_uz || item.structure_pattern_ru || item.structure_pattern_en) && (
                      <div className="space-y-1 mt-1">
                        <div className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50/70 px-3 py-1 rounded-lg border border-indigo-100">
                          🇬🇧 Formula (EN): {item.structure_pattern_en || item.structure_pattern}
                        </div>
                        {item.structure_pattern_uz && (
                          <div className="text-xs font-mono font-bold text-amber-700 bg-amber-50/70 px-3 py-1 rounded-lg border border-amber-100">
                            🇺🇿 Formula (UZ): {item.structure_pattern_uz}
                          </div>
                        )}
                        {item.structure_pattern_ru && (
                          <div className="text-xs font-mono font-bold text-blue-700 bg-blue-50/70 px-3 py-1 rounded-lg border border-blue-100">
                            🇷🇺 Формула (RU): {item.structure_pattern_ru}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <ItemActions onEdit={() => { setEdit(item); setShowModal(true); }} onDelete={() => handleDelete(item.id)} />
              </div>
            ))}

            {/* VOCABULARY */}
            {tab === 'vocabulary' && filteredItems.map((item, idx) => (
              <div key={item.id || idx} className="p-4 hover:bg-gray-50/70 transition flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-gray-900">{item.word}</p>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {item.translation}
                      </span>
                    </div>
                    {item.definition && (
                      <p className="text-xs text-gray-600 mt-1"><b>Ta'rif:</b> {item.definition}</p>
                    )}
                    {item.example && (
                      <p className="text-xs text-gray-500 italic mt-0.5 bg-gray-50 px-2.5 py-1 rounded border border-gray-100">
                        "{item.example}"
                      </p>
                    )}
                  </div>
                </div>
                <ItemActions onEdit={() => { setEdit(item); setShowModal(true); }} onDelete={() => handleDelete(item.id)} />
              </div>
            ))}

            {/* PHRASEBOOK */}
            {tab === 'phrasebook' && filteredItems.map((item, idx) => (
              <div key={item.id || idx} className="p-4 hover:bg-gray-50/70 transition flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">
                        {item.category || 'Clinical Phrase'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 leading-snug">"{item.phrase}"</p>
                    {item.hint_uz && (
                      <p className="text-xs text-gray-500 mt-1"><b>Ma'nosi:</b> {item.hint_uz}</p>
                    )}
                  </div>
                </div>
                <ItemActions onEdit={() => { setEdit(item); setShowModal(true); }} onDelete={() => handleDelete(item.id)} />
              </div>
            ))}

            {/* QUIZZES */}
            {tab === 'quizzes' && filteredItems.map((item, idx) => (
              <div key={item.id || idx} className="p-5 hover:bg-gray-50/70 transition flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 w-full max-w-3xl">
                  <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    #{idx + 1}
                  </span>
                  <div className="space-y-2 w-full">
                    <p className="text-sm font-bold text-gray-900">{item.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        const val       = item[`option_${opt.toLowerCase()}`];
                        const isCorrect = item.correct_option === opt;
                        return (
                          <div key={opt} className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}>
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>{opt}</span>
                            <span className="truncate">{val || '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <ItemActions onEdit={() => { setEdit(item); setShowModal(true); }} onDelete={() => handleDelete(item.id)} />
              </div>
            ))}

            {/* SCENARIOS / MODULES */}
            {tab === 'scenarios' && filteredItems.map((item) => (
              <div key={item.id} className="p-6 space-y-4 hover:bg-gray-50/40 transition">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center">
                        {item.order_index}
                      </span>
                      <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1 ml-9">{item.description}</p>
                    )}
                  </div>
                  <ItemActions onEdit={() => { setEdit(item); setShowModal(true); }} onDelete={() => handleDelete(item.id)} editLabel="Tahrirlash" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-9">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                      <RiStethoscopeLine /> Bemor Konteksti
                    </span>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {item.patient_context || "Kontekst kiritilmagan"}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                      <RiBrainLine /> Final Challenge
                    </span>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {item.final_challenge_context || "Final challenge kiritilmagan"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        tab === 'scenarios'
          ? <ModuleModal
              initialData={editingItem}
              specialties={specialties}
              totalModules={modules.length}
              onClose={() => setShowModal(false)}
              onSaved={() => { setShowModal(false); loadItems(); loadModules(); }}
            />
          : <ContentModal
              tab={tab}
              moduleId={selMod}
              initialData={editingItem}
              onClose={() => setShowModal(false)}
              onSaved={() => { setShowModal(false); loadItems(); }}
            />
      )}
    </Layout>
  );
}

/* ── Kichik yordamchi: Amallar tugmalari ── */
function ItemActions({ onEdit, onDelete, editLabel }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {editLabel ? (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition border border-indigo-200"
        >
          <RiEditLine /> {editLabel}
        </button>
      ) : (
        <button onClick={onEdit}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition" title="Tahrirlash">
          <RiEditLine className="text-base" />
        </button>
      )}
      <button onClick={onDelete}
        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition" title="O'chirish">
        <RiDeleteBinLine className="text-base" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MODUL YARATISH / TAHRIRLASH MODALI
   Step-by-step wizard: 3 bosqich
══════════════════════════════════════════════ */
function ModuleModal({ initialData, specialties, totalModules, onClose, onSaved }) {
  const isEdit = !!initialData?.id;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title:                   initialData?.title                   || '',
    description:             initialData?.description             || '',
    specialty_id:            initialData?.specialty_id            || (specialties[0]?.id || ''),
    order_index:             initialData?.order_index             || (totalModules + 1),
    patient_context:         initialData?.patient_context         || '',
    final_challenge_context: initialData?.final_challenge_context || '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const STEPS = [
    { num: 1, label: "Asosiy Ma'lumot", icon: RiFileTextLine, desc: "Modul nomi va tartib raqami" },
    { num: 2, label: "Bemor Konteksti", icon: RiStethoscopeLine, desc: "AI bemor uchun ssenariy" },
    { num: 3, label: "Final Challenge", icon: RiBrainLine, desc: "Murakkab klinik ssenariy" },
  ];

  const canNext = () => {
    if (step === 1) return form.title.trim() && form.order_index && form.specialty_id;
    if (step === 2) return form.patient_context.trim().length > 10;
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/admin/modules/${initialData.id}`, form);
        toast.success('Modul yangilandi! ✓');
      } else {
        await api.post('/admin/modules', form);
        toast.success("Yangi modul yaratildi! ✓");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
                <RiFileListLine />
              </div>
              <div>
                <h3 className="font-black text-lg">
                  {isEdit ? 'Modulni Tahrirlash' : 'Yangi Modul Yaratish'}
                </h3>
                <p className="text-emerald-100 text-xs mt-0.5">
                  {isEdit ? form.title : `${STEPS[step - 1].label} — ${step}/3 bosqich`}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
              <RiCloseLine className="text-lg" />
            </button>
          </div>

          {/* Steps progress */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 flex-1 ${i < STEPS.length - 1 ? '' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                    step === s.num
                      ? 'bg-white text-emerald-700 shadow-lg shadow-black/20'
                      : step > s.num
                        ? 'bg-emerald-400/60 text-white'
                        : 'bg-white/20 text-white/60'
                  }`}>
                    {step > s.num ? <RiCheckLine /> : s.num}
                  </div>
                  <div className="flex-1 hidden sm:block">
                    <p className={`text-xs font-bold ${step >= s.num ? 'text-white' : 'text-white/50'}`}>{s.label}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-4 rounded-full transition-all ${step > s.num ? 'bg-white/60' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[55vh] overflow-y-auto">

          {/* ── STEP 1: Asosiy Ma'lumot ── */}
          {step === 1 && (
            <div className="space-y-5">
              <SectionHeader icon={RiFileTextLine} title="Asosiy Ma'lumotlar"
                desc="Modul nomi, tartibi va mutaxassislikni kiriting" />

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tartib Raqami (Order Index)" icon={RiNumbersLine} required>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={form.order_index}
                    onChange={(e) => set('order_index', parseInt(e.target.value) || '')}
                    className="form-input"
                    placeholder="1"
                  />
                </FormField>

                <FormField label="Mutaxassislik" icon={RiStethoscopeLine} required>
                  {specialties.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                      <span className="text-amber-800 text-sm font-medium">Yo'nalish yaratilmagan!</span>
                      <a href="/admin/groups" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors">
                        Yaratish
                      </a>
                    </div>
                  ) : (
                    <select
                      value={form.specialty_id}
                      onChange={(e) => set('specialty_id', e.target.value)}
                      className="form-input text-sm"
                    >
                      <option value="">Tanlang...</option>
                      {specialties.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </FormField>
              </div>

              <FormField label="Modul Nomi" icon={RiText} required>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="masalan: Pain Assessment & Chief Complaint"
                  className="form-input"
                  maxLength={150}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/150</p>
              </FormField>

              <FormField label="Qisqacha Tavsif (ixtiyoriy)" icon={RiListCheck2}>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="masalan: Bemorning asosiy shikoyatini aniqlaydigan klinik muloqot moduli"
                  rows={3}
                  className="form-input resize-none"
                  maxLength={400}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/400</p>
              </FormField>
            </div>
          )}

          {/* ── STEP 2: Bemor Konteksti ── */}
          {step === 2 && (
            <div className="space-y-5">
              <SectionHeader icon={RiStethoscopeLine} title="Standart AI Bemor Konteksti"
                desc="AI-ga bemor rolini o'ynash uchun ko'rsatma (inglizcha)" />

              <FormField label="Bemor Konteksti (Inglizcha)" icon={RiMentalHealthLine} required>
                <textarea
                  value={form.patient_context}
                  onChange={(e) => set('patient_context', e.target.value)}
                  placeholder={`You are a patient named John Smith, 35 years old male. You are visiting a dental clinic for the first time due to severe toothache in the lower right molar. You have been experiencing the pain for 3 days. The pain is sharp, throbbing, and worsens with cold drinks. You are slightly anxious about dental procedures. Respond naturally as a patient would, using simple English. Wait for the dental student to guide the conversation.`}
                  rows={9}
                  className="form-input resize-none font-mono text-xs leading-relaxed"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs font-medium ${form.patient_context.length > 10 ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {form.patient_context.length > 10 ? '✓ Yaxshi!' : 'Kamida 10 ta belgi'}
                  </span>
                  <span className="text-xs text-gray-400">{form.patient_context.length} belgi</span>
                </div>
              </FormField>
            </div>
          )}

          {/* ── STEP 3: Final Challenge ── */}
          {step === 3 && (
            <div className="space-y-5">
              <SectionHeader icon={RiBrainLine} title="Final Challenge Ssenariysi"
                desc="Suhbat so'ngida talabaga beriladigan murakkab holat (inglizcha)" />

              <FormField label="Final Challenge Konteksti (Inglizcha)" icon={RiSparklingLine}>
                <textarea
                  value={form.final_challenge_context}
                  onChange={(e) => set('final_challenge_context', e.target.value)}
                  placeholder={`[FINAL CHALLENGE ACTIVATED] You are now presenting with additional complications. You mention that the pain has been radiating to your jaw and you have noticed swelling in your cheek. You are very anxious and ask about emergency extraction. Challenge the student with more complex questions about treatment options, pain management, and possible complications.`}
                  rows={9}
                  className="form-input resize-none font-mono text-xs leading-relaxed"
                />
                <span className="text-xs text-gray-400 mt-1 block text-right">{form.final_challenge_context.length} belgi</span>
              </FormField>

              {/* Preview */}
              {form.title && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ko'rinish</p>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center">
                      {form.order_index}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{form.title}</p>
                      {form.description && <p className="text-xs text-gray-500">{form.description}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-100 transition"
          >
            <RiArrowLeftLine /> {step > 1 ? 'Orqaga' : 'Bekor qilish'}
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map(s => (
              <div key={s.num} className={`h-2 rounded-full transition-all ${
                step === s.num ? 'w-6 bg-emerald-600' : step > s.num ? 'w-2 bg-emerald-400' : 'w-2 bg-gray-300'
              }`} />
            ))}
          </div>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Keyingi <RiArrowRightLine />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md transition disabled:opacity-50"
            >
              <RiSave3Line /> {saving ? 'Saqlanmoqda...' : isEdit ? 'Yangilash' : "Modul Yaratish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   KONTENT (Vocabulary / Phrasebook / Quiz) MODALI
══════════════════════════════════════════════ */
function ContentModal({ tab, moduleId, initialData, onClose, onSaved }) {
  const isEdit = !!initialData?.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => {
    if (initialData) return { ...initialData };
    if (tab === 'quizzes') return { correct_option: 'A', question: '', option_a: '', option_b: '', option_c: '', option_d: '' };
    return {};
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const TAB_META = {
    grammar:     { label: "Grammatik Qoida", color: 'amber',   icon: RiBrainLine },
    vocabulary:  { label: "Lug'at So'zi",    color: 'indigo',  icon: RiBookLine },
    phrasebook:  { label: 'Muloqot Iborasi', color: 'cyan',    icon: RiLightbulbLine },
    quizzes:     { label: 'Test Savoli',     color: 'purple',  icon: RiQuestionLine },
  };
  const meta   = TAB_META[tab] || TAB_META.grammar;
  const colors = COLOR_MAP[meta.color];
  const Icon   = meta.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const epMap = { grammar: 'grammar', vocabulary: 'vocabulary', phrasebook: 'phrasebook', quizzes: 'tests' };
      const ep    = epMap[tab];
      if (isEdit) {
        await api.put(`/admin/${ep}/${initialData.id}`, form);
        toast.success('Muvaffaqiyatli yangilandi ✓');
      } else {
        await api.post(`/admin/${ep}`, { ...form, module_id: moduleId });
        toast.success("Muvaffaqiyatli qo'shildi ✓");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">

        {/* Header */}
        <div className={`${colors.bg} p-5 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                <Icon />
              </div>
              <div>
                <h3 className="font-black text-base">
                  {isEdit ? 'Tahrirlash' : "Yangi Qo'shish"} — {meta.label}
                </h3>
                <p className="text-white/70 text-xs">Barcha * belgilangan maydonlar majburiy</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
              <RiCloseLine className="text-lg" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">

            {/* GRAMMAR */}
            {tab === 'grammar' && (
              <>
                <FormField label="Grammatik Mavzu Nomi (English Title)" required>
                  <input
                    type="text"
                    value={form.title || ''}
                    onChange={e => set('title', e.target.value)}
                    placeholder="masalan: Present Simple in Pain Assessment"
                    className="form-input font-bold"
                    required
                  />
                </FormField>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-slate-700">Mavzu Nomi (O'zbek / Rus):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FormField label="🇺🇿 O'zbekcha Nomi">
                      <input
                        type="text"
                        value={form.title_uz || ''}
                        onChange={e => set('title_uz', e.target.value)}
                        placeholder="Og'riq davomiyligida Present Simple"
                        className="form-input text-sm"
                      />
                    </FormField>
                    <FormField label="🇷🇺 Русский Заголовок">
                      <input
                        type="text"
                        value={form.title_ru || ''}
                        onChange={e => set('title_ru', e.target.value)}
                        placeholder="Present Simple при оценке боли"
                        className="form-input text-sm"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-slate-700">Grammatik Qoida & Tushuntirish / Rule Explanation:</p>
                  <FormField label="🇬🇧 English Rule" required>
                    <textarea
                      value={form.rule_explanation || ''}
                      onChange={e => set('rule_explanation', e.target.value)}
                      placeholder="Use Present Simple for recurring symptoms..."
                      rows={2}
                      className="form-input text-sm resize-none"
                      required
                    />
                  </FormField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FormField label="🇺🇿 O'zbekcha Tushuntirish">
                      <textarea
                        value={form.rule_explanation_uz || ''}
                        onChange={e => set('rule_explanation_uz', e.target.value)}
                        placeholder="Bemorning takrorlanuvchi simptomlari haqida..."
                        rows={2}
                        className="form-input text-sm resize-none"
                      />
                    </FormField>
                    <FormField label="🇷🇺 Русское Объяснение">
                      <textarea
                        value={form.rule_explanation_ru || ''}
                        onChange={e => set('rule_explanation_ru', e.target.value)}
                        placeholder="Для расспроса о регулярных симптомах..."
                        rows={2}
                        className="form-input text-sm resize-none"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-slate-700">3 Tildagi Gap Formulasi / Structure Formula:</p>
                  <FormField label="🇬🇧 Formula (English)">
                    <input
                      type="text"
                      value={form.structure_pattern_en || form.structure_pattern || ''}
                      onChange={e => {
                        set('structure_pattern_en', e.target.value);
                        set('structure_pattern', e.target.value);
                      }}
                      placeholder="e.g. Subject + have / has + V3"
                      className="form-input font-mono text-sm font-bold text-indigo-700"
                    />
                  </FormField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FormField label="🇺🇿 Formula (O'zbekcha)">
                      <input
                        type="text"
                        value={form.structure_pattern_uz || ''}
                        onChange={e => set('structure_pattern_uz', e.target.value)}
                        placeholder="masalan: Ega + have / has + V3"
                        className="form-input font-mono text-sm font-bold text-amber-700"
                      />
                    </FormField>
                    <FormField label="🇷🇺 Формула (Русский)">
                      <input
                        type="text"
                        value={form.structure_pattern_ru || ''}
                        onChange={e => set('structure_pattern_ru', e.target.value)}
                        placeholder="например: Подлежащее + have / has + V3"
                        className="form-input font-mono text-sm font-bold text-blue-700"
                      />
                    </FormField>
                  </div>
                </div>
              </>
            )}

            {/* VOCABULARY */}
            {tab === 'vocabulary' && (
              <>
                <FormField label="Inglizcha Termin (Medical Word in English)" required>
                  <input type="text" value={form.word || ''} onChange={e => set('word', e.target.value)}
                    placeholder="masalan: Odontalgia / Pulpitis" className="form-input font-bold" required />
                </FormField>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-slate-700">3 Tildagi Tarjimalar / Translations:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <FormField label="🇺🇿 O'zbekcha" required>
                      <input type="text" value={form.translation_uz || form.translation || ''}
                        onChange={e => { set('translation_uz', e.target.value); set('translation', e.target.value); }}
                        placeholder="Tish og'rig'i" className="form-input text-sm" required />
                    </FormField>
                    <FormField label="🇷🇺 Русский">
                      <input type="text" value={form.translation_ru || ''} onChange={e => set('translation_ru', e.target.value)}
                        placeholder="Зубная боль" className="form-input text-sm" />
                    </FormField>
                    <FormField label="🇬🇧 English Synonym">
                      <input type="text" value={form.translation_en || ''} onChange={e => set('translation_en', e.target.value)}
                        placeholder="Toothache" className="form-input text-sm" />
                    </FormField>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-slate-700">Tibbiy Ta'rif / Definitions (3 Tilda):</p>
                  <FormField label="🇬🇧 English Definition">
                    <input type="text" value={form.definition_en || form.definition || ''}
                      onChange={e => { set('definition_en', e.target.value); set('definition', e.target.value); }}
                      placeholder="masalan: Acute pain originating from the dental pulp" className="form-input text-sm" />
                  </FormField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FormField label="🇺🇿 O'zbekcha Ta'rif">
                      <input type="text" value={form.definition_uz || ''} onChange={e => set('definition_uz', e.target.value)}
                        placeholder="Tish pulpasi yallig'lanishidan kelib chiquvchi og'riq" className="form-input text-sm" />
                    </FormField>
                    <FormField label="🇷🇺 Русское Определение">
                      <input type="text" value={form.definition_ru || ''} onChange={e => set('definition_ru', e.target.value)}
                        placeholder="Боль, возникающая из пульпы зуба" className="form-input text-sm" />
                    </FormField>
                  </div>
                </div>

                <FormField label="Klinik Misol Gap (English Example)">
                  <textarea value={form.example || ''} onChange={e => set('example', e.target.value)}
                    placeholder="masalan: The patient presented with acute odontalgia exacerbated by cold liquids..."
                    rows={2} className="form-input resize-none text-sm" />
                </FormField>
              </>
            )}

            {/* PHRASEBOOK */}
            {tab === 'phrasebook' && (
              <>
                <FormField label="Kategoriya / Klinik Bosqich" required>
                  <input type="text" value={form.category || ''} onChange={e => set('category', e.target.value)}
                    placeholder="masalan: Pain Assessment, Examination, Treatment Plan"
                    className="form-input text-sm font-bold" required />
                </FormField>

                <FormField label="Inglizcha Muloqot Iborasi (Clinical Phrase in English)" required>
                  <textarea value={form.phrase || ''} onChange={e => set('phrase', e.target.value)}
                    placeholder="masalan: Does the pain radiate to your ear, jaw, or neck?"
                    rows={2} className="form-input resize-none font-bold text-sm" required />
                </FormField>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-slate-700">Klinik Qo'llanilishi va Izohlar / Hints (3 Tilda):</p>
                  <FormField label="🇺🇿 O'zbekcha Izoh">
                    <input type="text" value={form.hint_uz || ''} onChange={e => set('hint_uz', e.target.value)}
                      placeholder="masalan: Og'riq quloqqa yoki bo'yinga tarqalyaptimi?"
                      className="form-input text-sm" />
                  </FormField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FormField label="🇷🇺 Русское Пояснение">
                      <input type="text" value={form.hint_ru || ''} onChange={e => set('hint_ru', e.target.value)}
                        placeholder="Иррадиирует ли боль в ухо или шею?" className="form-input text-sm" />
                    </FormField>
                    <FormField label="🇬🇧 English Context">
                      <input type="text" value={form.hint_en || ''} onChange={e => set('hint_en', e.target.value)}
                        placeholder="Inquire about pain radiation" className="form-input text-sm" />
                    </FormField>
                  </div>
                </div>
              </>
            )}

            {/* QUIZZES */}
            {tab === 'quizzes' && (
              <>
                <FormField label="Savol Matni" required>
                  <textarea value={form.question || ''} onChange={e => set('question', e.target.value)}
                    placeholder="Test savolini ingliz tilida kiriting..." rows={3}
                    className="form-input resize-none" required />
                </FormField>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    4 Ta Variant — To'g'ri javobni <span className="text-emerald-600">yashil tugma</span> bilan belgilang *
                  </label>
                  <div className="space-y-2">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const key       = `option_${opt.toLowerCase()}`;
                      const isChecked = form.correct_option === opt;
                      return (
                        <div key={opt} className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                          isChecked ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <button
                            type="button"
                            onClick={() => set('correct_option', opt)}
                            title="To'g'ri javob"
                            className={`w-8 h-8 rounded-lg font-black text-xs shrink-0 flex items-center justify-center transition ${
                              isChecked ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-300 hover:border-emerald-400'
                            }`}
                          >
                            {isChecked ? <RiCheckLine /> : opt}
                          </button>
                          <input
                            type="text"
                            value={form[key] || ''}
                            onChange={e => set(key, e.target.value)}
                            placeholder={`Variant ${opt}...`}
                            className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none"
                            required
                          />
                          {isChecked && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                              To'g'ri
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-100 transition">
              Bekor Qilish
            </button>
            <button type="submit" disabled={saving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl ${colors.bg} text-white text-sm font-bold shadow-sm transition disabled:opacity-50 hover:opacity-90`}>
              <RiSave3Line /> {saving ? 'Saqlanmoqda...' : isEdit ? 'Yangilash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Yordamchi komponentlar ── */
function SectionHeader({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center text-lg shrink-0">
        <Icon />
      </div>
      <div>
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function FormField({ label, icon: Icon, required, children, desc }) {
  return (
    <div className="mb-4">
      <label className="flex flex-col mb-1.5">
        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          {Icon && <Icon className="text-slate-400 text-base" />}
          {label} {required && <span className="text-rose-500">*</span>}
        </div>
        {desc && <span className="text-xs text-slate-400 mt-0.5">{desc}</span>}
      </label>
      {children}
    </div>
  );
}
