import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { BookOpen, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Layers } from 'lucide-react';

const TYPE_LABELS = { soft_skills: 'Soft Skills', aptitude: 'Aptitude' };
const TYPE_COLORS = {
    soft_skills: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    aptitude:    { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
};

const inp = {
    padding: '9px 12px', borderRadius: 8,
    background: '#0d1424', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', outline: 'none', fontSize: 13, width: '100%',
};

export const SAIOPCurriculum = () => {
    const [tab, setTab] = useState('soft_skills');
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    // Module form
    const [showModForm, setShowModForm] = useState(false);
    const [editingMod, setEditingMod] = useState(null);
    const [modForm, setModForm] = useState({ type: 'soft_skills', title: '', sequence_order: 0 });

    // Topics state
    const [expanded, setExpanded] = useState({});     // { moduleId: true/false }
    const [topics, setTopics] = useState({});          // { moduleId: [...] }
    const [showTopicForm, setShowTopicForm] = useState({}); // { moduleId: true/false }
    const [editingTopic, setEditingTopic] = useState(null);
    const [topicForms, setTopicForms] = useState({});  // { moduleId: { day_number, topic_name, notes } }

    const fetchModules = async () => {
        setLoading(true);
        try {
            const r = await superAdminAPI.getIOPModules();
            setModules(r.data.modules || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchModules(); }, []);

    const fetchTopics = async (moduleId) => {
        try {
            const r = await superAdminAPI.getIOPTopics(moduleId);
            setTopics(prev => ({ ...prev, [moduleId]: r.data.topics || [] }));
        } catch (e) { console.error(e); }
    };

    const toggleExpand = async (moduleId) => {
        const next = !expanded[moduleId];
        setExpanded(prev => ({ ...prev, [moduleId]: next }));
        if (next && !topics[moduleId]) await fetchTopics(moduleId);
    };

    // ── Module CRUD ───────────────────────────────────────────────────────────
    const openNewModule = () => {
        setEditingMod(null);
        setModForm({ type: tab, title: '', sequence_order: modules.filter(m => m.type === tab).length + 1 });
        setShowModForm(true);
    };

    const openEditMod = (m) => {
        setEditingMod(m.id);
        setModForm({ type: m.type, title: m.title, sequence_order: m.sequence_order });
        setShowModForm(true);
    };

    const saveModule = async () => {
        if (!modForm.title.trim()) return;
        try {
            if (editingMod) await superAdminAPI.updateIOPModule(editingMod, modForm);
            else await superAdminAPI.createIOPModule(modForm);
            setShowModForm(false);
            fetchModules();
        } catch (e) { alert(e.response?.data?.message || 'Error saving module'); }
    };

    const deleteModule = async (id) => {
        if (!window.confirm('Delete this IOP module and all its topics?')) return;
        try {
            await superAdminAPI.deleteIOPModule(id);
            fetchModules();
        } catch (e) { alert(e.response?.data?.message || 'Error deleting'); }
    };

    // ── Topic CRUD ────────────────────────────────────────────────────────────
    const openNewTopic = (moduleId, currentTopics) => {
        setEditingTopic(null);
        setTopicForms(prev => ({
            ...prev,
            [moduleId]: { module_id: moduleId, day_number: (currentTopics?.length || 0) + 1, topic_name: '', notes: '' }
        }));
        setShowTopicForm(prev => ({ ...prev, [moduleId]: true }));
    };

    const openEditTopic = (moduleId, t) => {
        setEditingTopic(t.id);
        setTopicForms(prev => ({ ...prev, [moduleId]: { module_id: moduleId, day_number: t.day_number, topic_name: t.topic_name, notes: t.notes || '' } }));
        setShowTopicForm(prev => ({ ...prev, [moduleId]: true }));
    };

    const saveTopic = async (moduleId) => {
        const form = topicForms[moduleId];
        if (!form?.topic_name?.trim()) return;
        try {
            if (editingTopic) await superAdminAPI.updateIOPTopic(editingTopic, form);
            else await superAdminAPI.createIOPTopic(form);
            setShowTopicForm(prev => ({ ...prev, [moduleId]: false }));
            setEditingTopic(null);
            fetchTopics(moduleId);
            fetchModules(); // refresh topic_count
        } catch (e) { alert(e.response?.data?.message || 'Error saving topic'); }
    };

    const deleteTopic = async (moduleId, topicId) => {
        if (!window.confirm('Delete this topic?')) return;
        try {
            await superAdminAPI.deleteIOPTopic(topicId);
            fetchTopics(moduleId);
            fetchModules();
        } catch (e) { alert(e.response?.data?.message || 'Error deleting'); }
    };

    const filteredModules = modules.filter(m => m.type === tab);

    const card = { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '16px 20px', marginBottom: 12 };
    const btn = (color = 'var(--primary)') => ({ padding: '8px 18px', borderRadius: 8, background: color === 'danger' ? 'rgba(239,68,68,0.12)' : `rgba(${color === 'var(--primary)' ? '59,130,246' : '16,185,129'},0.12)`, color: color === 'danger' ? '#ef4444' : color, border: `1px solid ${color === 'danger' ? '#ef4444' : color}`, fontWeight: 600, fontSize: 13, cursor: 'pointer' });

    return (
        <div style={{ padding: '24px', maxWidth: 900 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Layers size={24} color="#10b981" />
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>IOP Curriculum</h1>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                        Global Soft Skills &amp; Aptitude modules for all IOP students — same content across all batches
                    </p>
                </div>
            </div>

            {/* Tab pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {['soft_skills', 'aptitude'].map(t => (
                    <button key={t} onClick={() => { setTab(t); setShowModForm(false); }}
                        style={{ padding: '9px 22px', borderRadius: 24, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .2s',
                            background: tab === t ? TYPE_COLORS[t].bg : 'transparent',
                            color: tab === t ? TYPE_COLORS[t].color : 'var(--text-muted)',
                            border: `1.5px solid ${tab === t ? TYPE_COLORS[t].color : 'var(--border-color)'}`,
                        }}>
                        {TYPE_LABELS[t]} ({modules.filter(m => m.type === t).length})
                    </button>
                ))}
            </div>

            {/* Add Module button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={openNewModule} style={{ ...btn('#10b981'), display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={14} /> Add {TYPE_LABELS[tab]} Module
                </button>
            </div>

            {/* Module form */}
            {showModForm && (
                <div style={{ ...card, border: `1px solid ${TYPE_COLORS[tab].color}`, marginBottom: 16 }}>
                    <h4 style={{ margin: '0 0 14px', color: TYPE_COLORS[tab].color }}>{editingMod ? 'Edit' : 'New'} {TYPE_LABELS[tab]} Module</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10, marginBottom: 10 }}>
                        <input style={inp} placeholder="Module title (e.g. Communication Skills)" value={modForm.title}
                            onChange={e => setModForm({ ...modForm, title: e.target.value })} />
                        <input style={inp} type="number" placeholder="Order" value={modForm.sequence_order}
                            onChange={e => setModForm({ ...modForm, sequence_order: Number(e.target.value) })} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={saveModule} style={btn(TYPE_COLORS[tab].color)}>Save Module</button>
                        <button onClick={() => setShowModForm(false)} style={{ ...btn('danger'), background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Modules list */}
            {loading ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
            ) : filteredModules.length === 0 ? (
                <div style={{ ...card, textAlign: 'center', padding: 40 }}>
                    <Layers size={36} color="var(--text-muted)" style={{ marginBottom: 10 }} />
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>No {TYPE_LABELS[tab]} modules yet. Click "+ Add Module" to create one.</p>
                </div>
            ) : (
                filteredModules.map(m => (
                    <div key={m.id} style={card}>
                        {/* Module header row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button onClick={() => toggleExpand(m.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center' }}>
                                {expanded[m.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.sequence_order}. {m.title}</span>
                                <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-muted)' }}>{m.topic_count || 0} topic{m.topic_count !== 1 ? 's' : ''}</span>
                            </div>
                            <button onClick={() => openEditMod(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Pencil size={14} /></button>
                            <button onClick={() => deleteModule(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                        </div>

                        {/* Topics (expanded) */}
                        {expanded[m.id] && (
                            <div style={{ marginTop: 14, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                                {/* Topic list */}
                                {(topics[m.id] || []).map(t => (
                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <span style={{ fontSize: 12, color: TYPE_COLORS[tab].color, fontWeight: 700, minWidth: 50 }}>Day {t.day_number}</span>
                                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{t.topic_name}</span>
                                        {t.notes && <span style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes}</span>}
                                        <button onClick={() => openEditTopic(m.id, t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Pencil size={12} /></button>
                                        <button onClick={() => deleteTopic(m.id, t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={12} /></button>
                                    </div>
                                ))}

                                {/* Topic form */}
                                {showTopicForm[m.id] && (
                                    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, marginBottom: 8 }}>
                                            <input style={inp} type="number" placeholder="Day #" value={topicForms[m.id]?.day_number || ''}
                                                onChange={e => setTopicForms(prev => ({ ...prev, [m.id]: { ...prev[m.id], day_number: Number(e.target.value) } }))} />
                                            <input style={inp} placeholder="Topic name" value={topicForms[m.id]?.topic_name || ''}
                                                onChange={e => setTopicForms(prev => ({ ...prev, [m.id]: { ...prev[m.id], topic_name: e.target.value } }))} />
                                            <input style={inp} placeholder="Notes (optional)" value={topicForms[m.id]?.notes || ''}
                                                onChange={e => setTopicForms(prev => ({ ...prev, [m.id]: { ...prev[m.id], notes: e.target.value } }))} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => saveTopic(m.id)} style={btn(TYPE_COLORS[tab].color)}>Save Topic</button>
                                            <button onClick={() => { setShowTopicForm(prev => ({ ...prev, [m.id]: false })); setEditingTopic(null); }}
                                                style={{ ...btn(), background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>Cancel</button>
                                        </div>
                                    </div>
                                )}

                                {/* Add topic button */}
                                {!showTopicForm[m.id] && (
                                    <button onClick={() => openNewTopic(m.id, topics[m.id])}
                                        style={{ marginTop: 10, background: 'none', border: `1px dashed ${TYPE_COLORS[tab].color}`, color: TYPE_COLORS[tab].color, borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Plus size={12} /> Add Topic
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};
