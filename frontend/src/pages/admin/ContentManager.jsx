import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  RiBookOpenLine, RiAddLine, RiDeleteBinLine, RiCloseLine,
  RiEditLine, RiFileListLine, RiBookLine, RiLightbulbLine,
  RiQuestionLine, RiSearchLine, RiSave3Line, RiCheckLine,
  RiStethoscopeLine, RiVolumeUpLine, RiInformationLine,
  RiSparklingLine, RiEyeLine, RiLayoutGridLine
} from 'react-icons/ri';

const TABS = [
  { id: 'vocabulary',  name: "Lug'at (Vocabulary)",       icon: RiBookLine,        desc: "Tibbiy atamalar, tarjima va misol gaplar" },
  { id: 'phrasebook',  name: "Smart Phrasebook (Iboralar)", icon: RiLightbulbLine,   desc: "Klinik muloqot va dialog iboralari" },
  { id: 'quizzes',     name: "Testlar (Quizzes)",          icon: RiQuestionLine,    desc: "4 variantli test savollari va kalitlar" },
  { id: 'scenarios',   name: "AI Bemor Ssenariysi",        icon: RiFileListLine,    desc: "Bemor konteksti va Final Challenge" },
];

export default function ContentManager() {
  const [tab, setTab]         = useState('vocabulary');
  const [modules, setModules] = useState([]);
  const [selMod, setSelMod]   = useState(1);
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Load modules
  const loadModules = () => {
    api.get('/admin/modules')
      .then(r => {
        setModules(r.data);
        if (r.data.length > 0 && !selMod) {
          setSelMod(r.data[0].id);
        }
      })
      .catch(() => toast.error("Modullarni yuklashda xatolik"));
  };

  useEffect(() => {
    loadModules();
  }, []);

  // Load items for selected module and tab
  const loadItems = async () => {
    if (!selMod) return;
    setLoading(true);
    try {
      if (tab === 'vocabulary') {
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
        const currentMod = res.data.find(m => m.id == selMod);
        setItems(currentMod ? [currentMod] : []);
      }
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    setSearch('');
  }, [tab, selMod]);

  // Delete item
  const handleDelete = async (id) => {
    if (!window.confirm("Haqiqatan ham ushbu yozuvni o'chirmoqchimisiz?")) return;
    const epMap = { vocabulary: 'vocabulary', phrasebook: 'phrasebook', quizzes: 'tests', scenarios: 'modules' };
    try {
      await api.delete(`/admin/${epMap[tab]}/${id}`);
      toast.success("Muvaffaqiyatli o'chirildi");
      loadItems();
    } catch {
      toast.error("O'chirishda xatolik yuz berdi");
    }
  };

  const activeModule = modules.find(m => m.id == selMod);

  // Filter items by search
  const filteredItems = items.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (tab === 'vocabulary') {
      return item.word?.toLowerCase().includes(q) || item.translation?.toLowerCase().includes(q);
    }
    if (tab === 'phrasebook') {
      return item.phrase?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q) || item.hint_uz?.toLowerCase().includes(q);
    }
    if (tab === 'quizzes') {
      return item.question?.toLowerCase().includes(q);
    }
    if (tab === 'scenarios') {
      return item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <Layout>
      {/* ── Header ── */}
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
            Stomatologik modullar, lug'at bazasi, smart phrasebook iboralari va test savollarini oson boshqaring
          </p>
        </div>

        {tab !== 'scenarios' && (
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <RiAddLine className="text-base" /> Yangi Qo'shish
          </button>
        )}
      </div>

      {/* ── 1. Modul Tanlash Paneli ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <RiLayoutGridLine className="text-indigo-500" /> O'quv Modulini Tanlang (10 ta Modul):
          </label>
          <span className="text-xs text-gray-400">Tanlangan: <b>{activeModule?.order_index}-modul</b></span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {modules.map((m) => {
            const isSelected = m.id == selMod;
            return (
              <button
                key={m.id}
                onClick={() => setSelMod(m.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-gray-50/70 hover:bg-gray-100 border-gray-200 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                    Modul {m.order_index}
                  </span>
                  {isSelected && <RiCheckLine className="text-sm" />}
                </div>
                <p className="text-xs font-bold truncate mt-1">{m.title}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Kontent Turlari (Tabs) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/10'
                  : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon />
                </div>
                {isActive && (
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Faol
                  </span>
                )}
              </div>
              <p className={`text-xs font-bold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{t.name}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{t.desc}</p>
            </button>
          );
        })}
      </div>

      {/* ── 3. Asosiy Ro'yxat & Filtrlash ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Sub-header with Search */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 uppercase">
              {TABS.find(t => t.id === tab)?.name}
            </span>
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

        {/* Content Items Display */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-2xl mx-auto mb-3">
              <RiInformationLine />
            </div>
            <p className="text-sm font-bold text-gray-700">Hech qanday ma'lumot topilmadi</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Ushbu modulda hozircha yozuvlar mavjud emas. Yuqoridagi "Yangi Qo'shish" tugmasi orqali kiritishingiz mumkin.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* ── TAB: VOCABULARY ── */}
            {tab === 'vocabulary' && filteredItems.map((item, idx) => (
              <div key={item.id || idx} className="p-4 hover:bg-gray-50/80 transition flex items-start justify-between gap-4">
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
                      <p className="text-xs text-gray-600 mt-1">
                        <b>Ta'rif:</b> {item.definition}
                      </p>
                    )}
                    {item.example && (
                      <p className="text-xs text-gray-500 italic mt-0.5 bg-gray-50 px-2.5 py-1 rounded border border-gray-100">
                        "{item.example}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    title="Tahrirlash"
                  >
                    <RiEditLine className="text-base" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="O'chirish"
                  >
                    <RiDeleteBinLine className="text-base" />
                  </button>
                </div>
              </div>
            ))}

            {/* ── TAB: PHRASEBOOK ── */}
            {tab === 'phrasebook' && filteredItems.map((item, idx) => (
              <div key={item.id || idx} className="p-4 hover:bg-gray-50/80 transition flex items-start justify-between gap-4">
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
                      <p className="text-xs text-gray-500 mt-1">
                        <b>Ma'nosi:</b> {item.hint_uz}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    title="Tahrirlash"
                  >
                    <RiEditLine className="text-base" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="O'chirish"
                  >
                    <RiDeleteBinLine className="text-base" />
                  </button>
                </div>
              </div>
            ))}

            {/* ── TAB: QUIZZES ── */}
            {tab === 'quizzes' && filteredItems.map((item, idx) => (
              <div key={item.id || idx} className="p-5 hover:bg-gray-50/80 transition flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 w-full max-w-3xl">
                  <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    #{idx + 1}
                  </span>
                  <div className="space-y-2 w-full">
                    <p className="text-sm font-bold text-gray-900">{item.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        const val = item[`option_${opt.toLowerCase()}`];
                        const isCorrect = item.correct_option === opt;
                        return (
                          <div
                            key={opt}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-gray-50 border-gray-200 text-gray-600'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {opt}
                            </span>
                            <span className="truncate">{val || '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    title="Tahrirlash"
                  >
                    <RiEditLine className="text-base" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="O'chirish"
                  >
                    <RiDeleteBinLine className="text-base" />
                  </button>
                </div>
              </div>
            ))}

            {/* ── TAB: SCENARIOS ── */}
            {tab === 'scenarios' && filteredItems.map((item) => (
              <div key={item.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{item.order_index}. {item.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition border border-indigo-200"
                  >
                    <RiEditLine /> Ssenariyni Tahrirlash
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Standard AI Bemor Konteksti
                    </span>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {item.patient_context || "Kontekst kiritilmagan"}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                      Final Challenge (Murakkab Ssenariy)
                    </span>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {item.final_challenge_context || "Final challenge konteksti kiritilmagan"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal for Add / Edit ── */}
      {showModal && (
        <ContentModal
          tab={tab}
          moduleId={selMod}
          initialData={editingItem}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadItems();
          }}
        />
      )}
    </Layout>
  );
}

// ── ADD / EDIT MODAL COMPONENT ──
function ContentModal({ tab, moduleId, initialData, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (initialData) return { ...initialData };
    if (tab === 'quizzes') {
      return { correct_option: 'A', question: '', option_a: '', option_b: '', option_c: '', option_d: '' };
    }
    return {};
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const epMap = { vocabulary: 'vocabulary', phrasebook: 'phrasebook', quizzes: 'tests', scenarios: 'modules' };
      const endpoint = epMap[tab];

      if (initialData?.id) {
        await api.put(`/admin/${endpoint}/${initialData.id}`, form);
        toast.success("Muvaffaqiyatli yangilandi");
      } else {
        await api.post(`/admin/${endpoint}`, { ...form, module_id: moduleId });
        toast.success("Muvaffaqiyatli qo'shildi");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-3xl w-full max-w-xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <h3 className="font-bold text-gray-900 text-base">
            {initialData ? "Tahrirlash" : "Yangi Yozuv Qo'shish"} — {tab.toUpperCase()}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* VOCABULARY FORM */}
          {tab === 'vocabulary' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Inglizcha Tibbiy So'z *</label>
                <input
                  type="text"
                  value={form.word || ''}
                  onChange={(e) => setForm({ ...form, word: e.target.value })}
                  placeholder="masalan: Odontalgia"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">O'zbekcha Tarjimasi *</label>
                <input
                  type="text"
                  value={form.translation || ''}
                  onChange={(e) => setForm({ ...form, translation: e.target.value })}
                  placeholder="masalan: Tish og'rig'i"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Inglizcha Ta'rifi</label>
                <input
                  type="text"
                  value={form.definition || ''}
                  onChange={(e) => setForm({ ...form, definition: e.target.value })}
                  placeholder="masalan: Pain in or around a tooth"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Klinik Misol Gap</label>
                <textarea
                  value={form.example || ''}
                  onChange={(e) => setForm({ ...form, example: e.target.value })}
                  placeholder="masalan: The patient presented with acute odontalgia in the lower right molar."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* PHRASEBOOK FORM */}
          {tab === 'phrasebook' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Klinik Bosqich / Kategoriya *</label>
                <input
                  type="text"
                  value={form.category || ''}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="masalan: Pain Assessment, Examination, Treatment Plan"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Inglizcha Muloqot Iborasi *</label>
                <input
                  type="text"
                  value={form.phrase || ''}
                  onChange={(e) => setForm({ ...form, phrase: e.target.value })}
                  placeholder="masalan: Does the pain radiate to your ear or neck?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">O'zbekcha Tushuntirish / Izoh</label>
                <input
                  type="text"
                  value={form.hint_uz || ''}
                  onChange={(e) => setForm({ ...form, hint_uz: e.target.value })}
                  placeholder="masalan: Og'riq quloqqa yoki bo'yinga tarqalyaptimi deb so'rash"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* QUIZZES FORM */}
          {tab === 'quizzes' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Savol Matni *</label>
                <textarea
                  value={form.question || ''}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="Test savolini kiriting..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600">4 Ta Variant & To'g'ri Javobni Tanlang *</label>
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const key = `option_${opt.toLowerCase()}`;
                  const isChecked = form.correct_option === opt;
                  return (
                    <div key={opt} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, correct_option: opt })}
                        className={`w-9 h-9 rounded-xl font-black text-xs shrink-0 flex items-center justify-center transition ${
                          isChecked
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="To'g'ri javob qilib belgilash"
                      >
                        {opt}
                      </button>
                      <input
                        type="text"
                        value={form[key] || ''}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        placeholder={`Variant ${opt}...`}
                        className={`w-full bg-gray-50 border rounded-xl p-2.5 text-xs focus:outline-none ${
                          isChecked ? 'border-emerald-400 bg-emerald-50/30' : 'border-gray-200'
                        }`}
                        required
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* SCENARIOS FORM */}
          {tab === 'scenarios' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Modul Nomi *</label>
                <input
                  type="text"
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Qisqacha Tavsif</label>
                <input
                  type="text"
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Standard AI Bemor Konteksti</label>
                <textarea
                  value={form.patient_context || ''}
                  onChange={(e) => setForm({ ...form, patient_context: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Final Challenge Ssenariysi</label>
                <textarea
                  value={form.final_challenge_context || ''}
                  onChange={(e) => setForm({ ...form, final_challenge_context: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
            >
              Bekor Qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <RiSave3Line /> {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
