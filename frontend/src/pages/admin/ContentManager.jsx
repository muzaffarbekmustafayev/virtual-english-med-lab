import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { RiBookOpenLine, RiAddLine, RiDeleteBinLine, RiCloseLine, RiEditLine, RiFileListLine, RiBookLine, RiLightbulbLine, RiQuestionLine } from 'react-icons/ri';

const TABS = [
  { id: 'scenarios',   label: <span className="flex items-center gap-1.5"><RiFileListLine /> Ssenariylar</span> },
  { id: 'vocabulary',  label: <span className="flex items-center gap-1.5"><RiBookLine /> Lug'at</span> },
  { id: 'phrasebook',  label: <span className="flex items-center gap-1.5"><RiLightbulbLine /> Phrasebook</span> },
  { id: 'quizzes',     label: <span className="flex items-center gap-1.5"><RiQuestionLine /> Testlar</span> },
];

export default function ContentManager() {
  const [tab, setTab]         = useState('scenarios');
  const [modules, setModules] = useState([]);
  const [selMod, setSelMod]   = useState('');
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    api.get('/admin/modules').then(r => setModules(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selMod) { setItems([]); return; }
    const load = async () => {
      setLoading(true);
      try {
        let res;
        if (tab === 'scenarios')  res = await api.get('/admin/modules');
        if (tab === 'vocabulary') res = await api.get(`/admin/vocabulary?module_id=${selMod}`);
        if (tab === 'phrasebook') res = await api.get(`/admin/phrasebook?module_id=${selMod}`);
        if (tab === 'quizzes')    res = await api.get(`/admin/tests?module_id=${selMod}`);
        setItems(tab === 'scenarios' ? res.data.filter(m => m.id == selMod) : res.data);
      } finally { setLoading(false); }
    };
    load();
  }, [tab, selMod]);

  const deleteItem = async (id) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
    const ep = { scenarios: 'modules', vocabulary: 'vocabulary', phrasebook: 'phrasebook', quizzes: 'tests' }[tab];
    await api.delete(`/admin/${ep}/${id}`);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RiBookOpenLine className="text-purple-500" /> Content Manager
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1 w-fit mb-5 shadow-sm">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t.id ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Module selector */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={selMod}
          onChange={e => setSelMod(e.target.value)}
          className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
        >
          <option value="">Modul tanlang...</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.order_index}. {m.title}</option>)}
        </select>
      </div>

      {!selMod && (
        <div className="text-center py-12 text-gray-500">Yuqoridan modul tanlang</div>
      )}

      {selMod && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">{items.length} ta yozuv</span>
            {tab !== 'scenarios' && (
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors shadow-sm">
                <RiAddLine /> Yangi qo'shish
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map(item => (
                <div key={item.id} className="px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    {/* Vocabulary */}
                    {tab === 'vocabulary' && (
                      <>
                        <p className="text-sm font-semibold text-gray-900">{item.word}</p>
                        <p className="text-xs text-indigo-600 font-medium">{item.translation}</p>
                        {item.example && <p className="text-xs text-gray-500 italic mt-0.5">"{item.example}"</p>}
                      </>
                    )}
                    {/* Phrasebook */}
                    {tab === 'phrasebook' && (
                      <>
                        <p className="text-xs text-indigo-500 font-medium">{item.category}</p>
                        <p className="text-sm text-gray-900 font-medium mt-0.5">"{item.phrase}"</p>
                        {item.hint_uz && <p className="text-xs text-gray-500 mt-0.5">{item.hint_uz}</p>}
                      </>
                    )}
                    {/* Quiz */}
                    {tab === 'quizzes' && (
                      <>
                        <p className="text-sm text-gray-900">{item.question}</p>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">To'g'ri: {item.correct_option}</p>
                      </>
                    )}
                    {/* Scenario */}
                    {tab === 'scenarios' && (
                      <>
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.patient_context?.substring(0,100)}...</p>
                      </>
                    )}
                  </div>
                  {tab !== 'scenarios' && (
                     <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0">
                      <RiDeleteBinLine />
                    </button>
                  )}
                </div>
              ))}
              {items.length === 0 && <div className="py-8 text-center text-gray-500 text-sm">Hali yozuv yo'q</div>}
            </div>
          )}
        </div>
      )}

      {/* Simple add form modal */}
      {showForm && (
        <AddItemModal tab={tab} moduleId={selMod} onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); setSelMod(s => { setTimeout(() => setSelMod(s), 10); return ''; }); }} />
      )}
    </Layout>
  );
}

function AddItemModal({ tab, moduleId, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const ep = { vocabulary: 'vocabulary', phrasebook: 'phrasebook', quizzes: 'tests' }[tab];
      await api.post(`/admin/${ep}`, { ...form, module_id: moduleId });
      onSaved();
    } catch (err) { alert(err.response?.data?.error || 'Xatolik'); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 shadow-xl rounded-2xl p-6 w-full max-w-md animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Yangi {tab}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><RiCloseLine /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {tab === 'vocabulary' && <>
            <input placeholder="Inglizcha so'z *" required className={inputCls} onChange={e => setForm({...form, word: e.target.value})} />
            <input placeholder="O'zbekcha tarjima *" required className={inputCls} onChange={e => setForm({...form, translation: e.target.value})} />
            <input placeholder="Inglizcha ta'rif" className={inputCls} onChange={e => setForm({...form, definition: e.target.value})} />
            <input placeholder="Misol gap" className={inputCls} onChange={e => setForm({...form, example: e.target.value})} />
          </>}
          {tab === 'phrasebook' && <>
            <input placeholder="Kategoriya *" required className={inputCls} onChange={e => setForm({...form, category: e.target.value})} />
            <input placeholder="Ibora (inglizcha) *" required className={inputCls} onChange={e => setForm({...form, phrase: e.target.value})} />
            <input placeholder="O'zbekcha izoh" className={inputCls} onChange={e => setForm({...form, hint_uz: e.target.value})} />
          </>}
          {tab === 'quizzes' && <>
            <textarea placeholder="Savol matni *" required rows={2} className={inputCls} onChange={e => setForm({...form, question: e.target.value})} />
            {['A','B','C','D'].map(o => (
              <input key={o} placeholder={`Variant ${o} *`} required className={inputCls} onChange={e => setForm({...form, [`option_${o.toLowerCase()}`]: e.target.value})} />
            ))}
            <select className={inputCls} onChange={e => setForm({...form, correct_option: e.target.value})}>
              <option value="">To'g'ri javob *</option>
              {['A','B','C','D'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">Bekor</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-xl border border-transparent bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50">
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
