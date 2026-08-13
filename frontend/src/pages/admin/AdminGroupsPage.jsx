import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { RiGroupLine, RiAddLine, RiDeleteBinLine, RiEditLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';

export default function AdminGroupsPage() {
  const [groups, setGroups]           = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [newGroup, setNewGroup]       = useState('');
  const [newSpec, setNewSpec]         = useState('');

  // Edit states
  const [editGroup, setEditGroup] = useState({ id: null, name: '' });
  const [editSpec, setEditSpec] = useState({ id: null, name: '' });

  const load = () => {
    api.get('/admin/groups').then(r => setGroups(r.data));
    api.get('/admin/specialties').then(r => setSpecialties(r.data));
  };
  useEffect(load, []);

  const addGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.trim()) return;
    await api.post('/admin/groups', { name: newGroup });
    setNewGroup(''); load();
  };

  const addSpec = async (e) => {
    e.preventDefault();
    if (!newSpec.trim()) return;
    await api.post('/admin/specialties', { name: newSpec });
    setNewSpec(''); load();
  };

  const saveEditGroup = async () => {
    if (!editGroup.name.trim()) return;
    await api.put('/admin/groups/' + editGroup.id, { name: editGroup.name });
    setEditGroup({ id: null, name: '' });
    load();
  };

  const saveEditSpec = async () => {
    if (!editSpec.name.trim()) return;
    await api.put('/admin/specialties/' + editSpec.id, { name: editSpec.name });
    setEditSpec({ id: null, name: '' });
    load();
  };

  const del = async (type, id) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await api.delete('/admin/' + type + '/' + id); load();
  };

  const inputCls = "flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  const renderList = (items, type, editState, setEditState, saveEdit) => {
    return items.map(item => (
      <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 border border-gray-100">
        {editState.id === item.id ? (
          <div className="flex items-center gap-2 flex-1 mr-2">
            <input 
              autoFocus
              className={inputCls} 
              value={editState.name} 
              onChange={e => setEditState({ ...editState, name: e.target.value })} 
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); else if (e.key === 'Escape') setEditState({ id: null, name: '' }); }}
            />
            <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-700 bg-white hover:bg-emerald-50 p-1.5 rounded-md transition-colors shadow-sm border border-emerald-100">
              <RiCheckLine size={16} />
            </button>
            <button onClick={() => setEditState({ id: null, name: '' })} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-1.5 rounded-md transition-colors shadow-sm border border-gray-200">
              <RiCloseLine size={16} />
            </button>
          </div>
        ) : (
          <>
            <span className="text-sm text-gray-900">{item.name}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditState({ id: item.id, name: item.name })} className="text-indigo-500 hover:text-indigo-700 transition-colors bg-white hover:bg-indigo-50 p-1 rounded-md shadow-sm border border-indigo-50">
                <RiEditLine className="text-sm" />
              </button>
              <button onClick={() => del(type, item.id)} className="text-gray-400 hover:text-red-600 transition-colors bg-white hover:bg-red-50 p-1 rounded-md shadow-sm border border-red-50">
                <RiDeleteBinLine className="text-sm" />
              </button>
            </div>
          </>
        )}
      </div>
    ));
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RiGroupLine className="text-purple-500" /> Guruhlar va Mutaxassisliklar
        </h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Akademik Guruhlar */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Akademik Guruhlar ({groups.length})</h3>
          </div>
          <div className="p-4">
            <form onSubmit={addGroup} className="flex gap-2 mb-4">
              <input value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="Yangi akademik guruh nomi..." className={inputCls} />
              <button type="submit" className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 transition-all shadow-sm">
                <RiAddLine />
              </button>
            </form>
            <div className="space-y-2">
              {renderList(groups, 'groups', editGroup, setEditGroup, saveEditGroup)}
              {groups.length === 0 && <p className="text-xs text-gray-500 text-center py-2">Hali yo'q</p>}
            </div>
          </div>
        </div>

        {/* Mutaxassisliklar */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Mutaxassisliklar ({specialties.length})</h3>
          </div>
          <div className="p-4">
            <form onSubmit={addSpec} className="flex gap-2 mb-4">
              <input value={newSpec} onChange={e => setNewSpec(e.target.value)} placeholder="Yangi mutaxassislik nomi..." className={inputCls} />
              <button type="submit" className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 transition-all shadow-sm">
                <RiAddLine />
              </button>
            </form>
            <div className="space-y-2">
              {renderList(specialties, 'specialties', editSpec, setEditSpec, saveEditSpec)}
              {specialties.length === 0 && <p className="text-xs text-gray-500 text-center py-2">Hali yo'q</p>}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
