import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Users, Layers, Plus, Pencil, Trash2, X, Check,
    Calendar, Clock, UserCog, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Theme tokens ─────────────────────────────────────────────────────────────
const t = {
    bg: { main: '#0b1120', card: '#141d2f', input: '#0d1424', hover: '#1a2540' },
    border: { subtle: 'rgba(255,255,255,0.06)', light: 'rgba(255,255,255,0.1)' },
    text: { primary: '#fff', secondary: '#8892a4', muted: '#5a6478', label: '#6b7a90' },
    accent: {
        blue: '#3b82f6', green: '#10b981', yellow: '#f59e0b',
        red: '#ef4444', purple: '#8b5cf6', cyan: '#06b6d4',
    },
    radius: { sm: '8px', md: '12px', lg: '16px', full: '9999px' },
};

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
    <div style={{
        background: t.bg.card, border: `1px solid ${t.border.subtle}`,
        borderRadius: t.radius.lg, padding: '24px', ...style,
    }}>{children}</div>
);

const StatCard = ({ label, value, icon, color }) => (
    <div style={{
        background: t.bg.card, border: `1px solid ${t.border.subtle}`,
        borderRadius: t.radius.lg, padding: '20px 24px',
        borderLeft: `3px solid ${color}`,
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ margin: '0 0 6px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: t.text.label }}>{label}</p>
                <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: t.text.primary }}>{value}</h3>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: t.radius.md, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
        </div>
    </div>
);

const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: t.radius.sm,
    background: t.bg.input, border: `1px solid ${t.border.light}`,
    color: t.text.primary, fontSize: '13px', outline: 'none',
    boxSizing: 'border-box',
};

const StatusBadge = ({ status }) => {
    const map = {
        upcoming: { color: t.accent.yellow, label: 'Upcoming' },
        active:   { color: t.accent.green,  label: 'Active' },
        completed:{ color: t.text.muted,    label: 'Completed' },
    };
    const s = map[status] || map.upcoming;
    return (
        <span style={{
            padding: '3px 10px', borderRadius: t.radius.full,
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            background: `${s.color}15`, color: s.color,
        }}>{s.label}</span>
    );
};

const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(String(d).split('T')[0] + 'T00:00:00');
    return isNaN(dt) ? d : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Main Component ────────────────────────────────────────────────────────────
const SAIOPGroups = () => {
    const [groups, setGroups]       = useState([]);
    const [trainers, setTrainers]   = useState([]);
    const [batches, setBatches]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');

    // Modal state
    const [showGroupModal, setShowGroupModal]     = useState(false);
    const [showTrainerModal, setShowTrainerModal] = useState(false);
    const [editingGroup, setEditingGroup]         = useState(null); // null = create mode

    // Group form
    const [groupForm, setGroupForm] = useState({
        name: '', iop_trainer_id: '', batch_ids: [],
        start_date: '', end_date: '', timing: '', status: 'upcoming',
    });

    // Trainer form
    const [trainerForm, setTrainerForm] = useState({
        first_name: '', last_name: '', email: '', password: '', phone: '',
    });

    const [saving, setSaving] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState(null);

    // ── Load data ──
    const loadAll = async () => {
        try {
            setLoading(true);
            const [gRes, tRes, bRes] = await Promise.all([
                superAdminAPI.getIOPGroups(),
                superAdminAPI.getIOPTrainers(),
                superAdminAPI.getBatches(),
            ]);
            setGroups(gRes.data?.groups || []);
            setTrainers(tRes.data?.trainers || []);
            const rawBatches = Array.isArray(bRes.data) ? bRes.data
                : Array.isArray(bRes.data?.batches) ? bRes.data.batches : [];
            setBatches(rawBatches);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    // ── Open create/edit modal ──
    const openCreate = () => {
        setEditingGroup(null);
        setGroupForm({ name: '', iop_trainer_id: '', batch_ids: [], start_date: '', end_date: '', timing: '', status: 'upcoming' });
        setShowGroupModal(true);
    };

    const openEdit = (g) => {
        setEditingGroup(g);
        setGroupForm({
            name: g.name,
            iop_trainer_id: String(g.iop_trainer_id),
            batch_ids: (g.batches || []).map(b => String(b.id)),
            start_date: g.start_date ? g.start_date.split('T')[0] : '',
            end_date: g.end_date ? g.end_date.split('T')[0] : '',
            timing: g.timing || '',
            status: g.status || 'upcoming',
        });
        setShowGroupModal(true);
    };

    // ── Toggle batch selection ──
    const toggleBatch = (batchId) => {
        const id = String(batchId);
        setGroupForm(f => ({
            ...f,
            batch_ids: f.batch_ids.includes(id) ? f.batch_ids.filter(x => x !== id) : [...f.batch_ids, id],
        }));
    };

    // ── Save group ──
    const saveGroup = async () => {
        if (!groupForm.name.trim() || !groupForm.iop_trainer_id || groupForm.batch_ids.length === 0) {
            alert('Name, IOP Trainer, and at least one Batch are required.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...groupForm,
                batch_ids: groupForm.batch_ids.map(Number),
                iop_trainer_id: Number(groupForm.iop_trainer_id),
            };
            if (editingGroup) {
                await superAdminAPI.updateIOPGroup(editingGroup.id, payload);
            } else {
                await superAdminAPI.createIOPGroup(payload);
            }
            setShowGroupModal(false);
            await loadAll();
        } catch (err) {
            alert(err?.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    // ── Delete group ──
    const deleteGroup = async (id, name) => {
        if (!window.confirm(`Delete group "${name}"? This cannot be undone.`)) return;
        try {
            await superAdminAPI.deleteIOPGroup(id);
            await loadAll();
        } catch (err) {
            alert(err?.response?.data?.message || 'Delete failed');
        }
    };

    // ── Save new trainer ──
    const saveTrainer = async () => {
        const { first_name, last_name, email, password } = trainerForm;
        if (!first_name.trim() || !last_name.trim() || !email.trim() || !password.trim()) {
            alert('First name, last name, email, and password are required.');
            return;
        }
        setSaving(true);
        try {
            await superAdminAPI.createIOPTrainer(trainerForm);
            setShowTrainerModal(false);
            setTrainerForm({ first_name: '', last_name: '', email: '', password: '', phone: '' });
            await loadAll();
        } catch (err) {
            alert(err?.response?.data?.message || 'Could not create trainer');
        } finally {
            setSaving(false);
        }
    };

    // ── Computed stats ──
    const totalStudents = groups.reduce((s, g) => s + (g.student_count || 0), 0);
    const activeCount   = groups.filter(g => g.status === 'active').length;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: t.text.muted, fontSize: '14px' }}>
            Loading IOP Groups…
        </div>
    );

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: t.radius.lg, background: `${t.accent.purple}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent.purple }}>
                        <Layers size={24} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: t.text.primary }}>IOP Groups</h1>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: t.text.muted }}>Merge batches into IOP training groups and assign IOP trainers</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowTrainerModal(true)} style={{
                        padding: '9px 18px', borderRadius: t.radius.md, border: `1px solid ${t.border.light}`,
                        background: 'transparent', color: t.text.secondary, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                        <UserCog size={15} /> Add IOP Trainer
                    </button>
                    <button onClick={openCreate} style={{
                        padding: '9px 18px', borderRadius: t.radius.md, border: 'none',
                        background: t.accent.purple, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                        <Plus size={15} /> Create Group
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 16px', borderRadius: t.radius.md, background: `${t.accent.red}10`, border: `1px solid ${t.accent.red}25`, color: t.accent.red, fontSize: '13px', marginBottom: '20px' }}>{error}</div>
            )}

            {/* ── Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <StatCard label="Total Groups" value={groups.length} icon={<Layers size={18} />} color={t.accent.purple} />
                <StatCard label="Active Groups" value={activeCount} icon={<Check size={18} />} color={t.accent.green} />
                <StatCard label="Total Students" value={totalStudents} icon={<Users size={18} />} color={t.accent.cyan} />
                <StatCard label="IOP Trainers" value={trainers.length} icon={<UserCog size={18} />} color={t.accent.yellow} />
            </div>

            {/* ── Groups List ── */}
            {groups.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <Layers size={36} style={{ color: t.text.muted, marginBottom: '16px' }} />
                    <p style={{ color: t.text.muted, fontSize: '14px', margin: 0 }}>No IOP groups yet. Click <strong>Create Group</strong> to get started.</p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {groups.map(g => (
                        <Card key={g.id} style={{ padding: 0 }}>
                            {/* colour bar */}
                            <div style={{ height: '3px', background: `linear-gradient(90deg, ${t.accent.purple}, ${t.accent.cyan})`, borderRadius: `${t.radius.lg} ${t.radius.lg} 0 0` }} />
                            <div style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                    {/* Left: info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: t.text.primary }}>{g.name}</h3>
                                            <StatusBadge status={g.status} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '12px', color: t.text.muted, marginBottom: '10px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><UserCog size={12} /> {g.trainer_name}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} /> {g.student_count || 0} students</span>
                                            {g.start_date && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {formatDate(g.start_date)} → {formatDate(g.end_date)}</span>}
                                            {g.timing && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {g.timing}</span>}
                                        </div>
                                        {/* Batch tags */}
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {(g.batches || []).map(b => (
                                                <span key={b.id} style={{
                                                    padding: '3px 10px', borderRadius: t.radius.full,
                                                    background: `${t.accent.blue}12`, color: t.accent.blue,
                                                    fontSize: '10px', fontWeight: 700,
                                                }}>
                                                    {b.batch_name}
                                                    {b.course_name && <span style={{ color: t.text.muted, fontWeight: 500 }}> · {b.course_name}</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Right: actions */}
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button onClick={() => setExpandedGroup(expandedGroup === g.id ? null : g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.text.muted, display: 'flex', alignItems: 'center' }}>
                                            {expandedGroup === g.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                        <button onClick={() => openEdit(g)} style={{
                                            padding: '7px 14px', borderRadius: t.radius.sm, border: `1px solid ${t.border.light}`,
                                            background: 'transparent', color: t.accent.blue, cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                                        }}>
                                            <Pencil size={13} /> Edit
                                        </button>
                                        <button onClick={() => deleteGroup(g.id, g.name)} style={{
                                            padding: '7px 14px', borderRadius: t.radius.sm, border: `1px solid ${t.accent.red}30`,
                                            background: `${t.accent.red}08`, color: t.accent.red, cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                                        }}>
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded student/batch detail */}
                                {expandedGroup === g.id && (
                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${t.border.subtle}` }}>
                                        <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: t.text.label, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            Merged Batches ({(g.batches || []).length})
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                                            {(g.batches || []).map(b => (
                                                <div key={b.id} style={{ padding: '10px 14px', borderRadius: t.radius.sm, background: `${t.accent.purple}08`, border: `1px solid ${t.accent.purple}15` }}>
                                                    <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 700, color: t.text.primary }}>{b.batch_name}</p>
                                                    <p style={{ margin: 0, fontSize: '11px', color: t.text.muted }}>{b.course_name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Create / Edit Group Modal ── */}
            {showGroupModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,17,32,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' }}>
                    <div style={{ background: t.bg.card, borderRadius: t.radius.lg, border: `1px solid ${t.border.light}`, width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
                        {/* Modal header */}
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: t.text.primary }}>
                                {editingGroup ? `Edit: ${editingGroup.name}` : 'Create IOP Group'}
                            </h2>
                            <button onClick={() => setShowGroupModal(false)} style={{ background: 'none', border: 'none', color: t.text.muted, cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        {/* Modal body */}
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.text.label, marginBottom: '6px' }}>Group Name *</label>
                                <input style={inputStyle} placeholder="e.g. IOP Batch 11 Merged" value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} />
                            </div>

                            {/* IOP Trainer */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.text.label, marginBottom: '6px' }}>IOP Trainer *</label>
                                <select style={{ ...inputStyle, cursor: 'pointer' }} value={groupForm.iop_trainer_id} onChange={e => setGroupForm(f => ({ ...f, iop_trainer_id: e.target.value }))}>
                                    <option value="">Select IOP Trainer</option>
                                    {trainers.map(tr => (
                                        <option key={tr.id} value={tr.id}>{tr.first_name} {tr.last_name} — {tr.email}</option>
                                    ))}
                                </select>
                                {trainers.length === 0 && (
                                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: t.accent.yellow }}>No IOP Trainers found. Add one first using the button above.</p>
                                )}
                            </div>

                            {/* Select Batches */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.text.label, marginBottom: '6px' }}>
                                    Select Batches to Merge * ({groupForm.batch_ids.length} selected)
                                </label>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: `1px solid ${t.border.light}`, borderRadius: t.radius.sm, padding: '8px' }}>
                                    {batches.length === 0 ? (
                                        <p style={{ margin: 0, fontSize: '12px', color: t.text.muted, padding: '8px' }}>No batches available</p>
                                    ) : batches.map(b => {
                                        const id = String(b.id);
                                        const selected = groupForm.batch_ids.includes(id);
                                        const courseName = b.course_name || b.course?.name || '';
                                        return (
                                            <div key={b.id} onClick={() => toggleBatch(b.id)} style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '8px 10px', borderRadius: t.radius.sm, cursor: 'pointer',
                                                background: selected ? `${t.accent.blue}12` : 'transparent',
                                                border: `1px solid ${selected ? t.accent.blue : 'transparent'}`,
                                                marginBottom: '4px', transition: 'all 0.15s',
                                            }}>
                                                <div style={{
                                                    width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                                                    border: `2px solid ${selected ? t.accent.blue : t.border.light}`,
                                                    background: selected ? t.accent.blue : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {selected && <Check size={10} color="#fff" />}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: selected ? 700 : 500, color: selected ? t.text.primary : t.text.secondary }}>{b.batch_name}</p>
                                                    {courseName && <p style={{ margin: 0, fontSize: '11px', color: t.text.muted }}>{courseName}</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Dates + Timing */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.text.label, marginBottom: '6px' }}>Start Date</label>
                                    <input type="date" style={inputStyle} value={groupForm.start_date} onChange={e => setGroupForm(f => ({ ...f, start_date: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.text.label, marginBottom: '6px' }}>End Date</label>
                                    <input type="date" style={inputStyle} value={groupForm.end_date} onChange={e => setGroupForm(f => ({ ...f, end_date: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.text.label, marginBottom: '6px' }}>Session Timing</label>
                                <input style={inputStyle} placeholder="e.g. 9:00 AM – 11:00 AM" value={groupForm.timing} onChange={e => setGroupForm(f => ({ ...f, timing: e.target.value }))} />
                            </div>

                            {/* Status (edit only) */}
                            {editingGroup && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.text.label, marginBottom: '6px' }}>Status</label>
                                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={groupForm.status} onChange={e => setGroupForm(f => ({ ...f, status: e.target.value }))}>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        {/* Modal footer */}
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border.subtle}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowGroupModal(false)} style={{ padding: '9px 20px', borderRadius: t.radius.md, border: `1px solid ${t.border.light}`, background: 'transparent', color: t.text.secondary, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
                            <button onClick={saveGroup} disabled={saving} style={{ padding: '9px 20px', borderRadius: t.radius.md, border: 'none', background: saving ? t.text.muted : t.accent.purple, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700 }}>
                                {saving ? 'Saving…' : editingGroup ? 'Update Group' : 'Create Group'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add IOP Trainer Modal ── */}
            {showTrainerModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,17,32,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' }}>
                    <div style={{ background: t.bg.card, borderRadius: t.radius.lg, border: `1px solid ${t.border.light}`, width: '100%', maxWidth: '440px' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: t.text.primary }}>Add IOP Trainer</h2>
                            <button onClick={() => setShowTrainerModal(false)} style={{ background: 'none', border: 'none', color: t.text.muted, cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {[
                                { key: 'first_name', label: 'First Name *', placeholder: 'John' },
                                { key: 'last_name',  label: 'Last Name *',  placeholder: 'Doe' },
                                { key: 'email',      label: 'Email *',       placeholder: 'john@example.com', type: 'email' },
                                { key: 'password',   label: 'Password *',    placeholder: '••••••••', type: 'password' },
                                { key: 'phone',      label: 'Phone',         placeholder: '+91 9876543210' },
                            ].map(({ key, label, placeholder, type = 'text' }) => (
                                <div key={key}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.text.label, marginBottom: '6px' }}>{label}</label>
                                    <input type={type} style={inputStyle} placeholder={placeholder} value={trainerForm[key]} onChange={e => setTrainerForm(f => ({ ...f, [key]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border.subtle}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowTrainerModal(false)} style={{ padding: '9px 20px', borderRadius: t.radius.md, border: `1px solid ${t.border.light}`, background: 'transparent', color: t.text.secondary, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
                            <button onClick={saveTrainer} disabled={saving} style={{ padding: '9px 20px', borderRadius: t.radius.md, border: 'none', background: saving ? t.text.muted : t.accent.blue, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700 }}>
                                {saving ? 'Creating…' : 'Create Trainer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export { SAIOPGroups };
export default SAIOPGroups;
