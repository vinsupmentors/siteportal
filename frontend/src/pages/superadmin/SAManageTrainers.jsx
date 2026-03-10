import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { Star, UserPlus, Pencil, Trash2, Calendar, Shield, BookOpen } from 'lucide-react';

const colors = ['#4c6ef5', '#15aabf', '#7950f2', '#ffd43b', '#ff6b6b', '#51cf66', '#e64980', '#fab005'];

export const SAManageTrainers = () => {
    const [trainers, setTrainers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', joining_date: '', is_probation: false, specialization_ids: [] });

    const inputStyle = { padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', width: '100%' };

    const fetchData = async () => {
        try {
            const [trainerRes, courseRes] = await Promise.all([
                superAdminAPI.getTrainers(),
                superAdminAPI.getCourses()
            ]);
            setTrainers(trainerRes.data.trainers);
            setCourses(courseRes.data.courses);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, specialization_ids: form.specialization_ids.map(Number) };
            if (editingId) await superAdminAPI.updateTrainer(editingId, payload);
            else await superAdminAPI.createTrainer(payload);
            setShowForm(false); setEditingId(null);
            setForm({ first_name: '', last_name: '', email: '', phone: '', joining_date: '', is_probation: false, specialization_ids: [] });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const handleEdit = (t) => {
        setEditingId(t.id);
        setForm({
            first_name: t.first_name, last_name: t.last_name, email: t.email, phone: t.phone || '',
            status: t.status,
            joining_date: t.joining_date ? t.joining_date.split('T')[0] : '',
            is_probation: !!t.is_probation,
            specialization_ids: t.specializations ? t.specializations.map(s => s.course_id) : []
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this trainer?')) return;
        try { await superAdminAPI.deleteTrainer(id); fetchData(); }
        catch { alert('Error deleting trainer'); }
    };

    const toggleSpecialization = (courseId) => {
        setForm(prev => {
            const ids = prev.specialization_ids.includes(courseId)
                ? prev.specialization_ids.filter(id => id !== courseId)
                : [...prev.specialization_ids, courseId];
            return { ...prev, specialization_ids: ids };
        });
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem' }}>Trainer Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage trainer profiles, specializations, and performance</p>
                </div>
                <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ first_name: '', last_name: '', email: '', phone: '', joining_date: '', is_probation: false, specialization_ids: [] }); }}
                    style={{ padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    <UserPlus size={16} /> Add Trainer
                </button>
            </div>

            {showForm && (
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-accent)' }}>{editingId ? 'Edit Trainer' : 'Add New Trainer'}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        {!editingId && <>Default password: <code style={{ background: 'var(--bg-dark)', padding: '2px 6px', borderRadius: '4px' }}>abcd@1234</code></>}
                    </p>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>First Name *</label>
                                <input required placeholder="John" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Last Name *</label>
                                <input required placeholder="Doe" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email *</label>
                                <input required type="email" placeholder="trainer@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Phone</label>
                                <input placeholder="9876543210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Joining Date</label>
                                <input type="date" value={form.joining_date} onChange={e => setForm({ ...form, joining_date: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', borderRadius: '8px', background: form.is_probation ? '#ff6b6b15' : 'var(--bg-dark)', border: `1px solid ${form.is_probation ? '#ff6b6b50' : 'var(--border-color)'}`, flex: 1 }}>
                                    <input type="checkbox" checked={form.is_probation} onChange={e => setForm({ ...form, is_probation: e.target.checked })}
                                        style={{ accentColor: '#ff6b6b' }} />
                                    <div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: form.is_probation ? '#ff6b6b' : 'var(--text-main)' }}>On Probation</span>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>No casual leave allowed</p>
                                    </div>
                                </label>
                            </div>
                            {editingId && (
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Specializations (select courses this trainer can teach)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {courses.map((c, idx) => {
                                    const selected = form.specialization_ids.includes(c.id);
                                    const color = colors[idx % colors.length];
                                    return (
                                        <button key={c.id} type="button" onClick={() => toggleSpecialization(c.id)}
                                            style={{
                                                padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                                                transition: 'all 0.2s',
                                                background: selected ? `${color}25` : 'var(--bg-dark)',
                                                color: selected ? color : 'var(--text-muted)',
                                                border: `1.5px solid ${selected ? color : 'var(--border-color)'}`,
                                            }}>
                                            {selected && '✓ '}{c.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                                style={{ padding: '10px 18px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit"
                                style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                {editingId ? 'Save Changes' : 'Create Trainer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {trainers.length === 0 ? (
                    <div className="glass-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No trainers found. Click "Add Trainer" to create one.</p>
                    </div>
                ) : trainers.map((t, i) => {
                    const color = colors[i % colors.length];
                    const rating = Number(t.avg_rating) || 0;
                    return (
                        <div key={t.id} className="glass-card" style={{ position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.borderColor = color}
                            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${color}25`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color }}>
                                        {t.first_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {t.first_name} {t.last_name}
                                            {t.is_probation ? <span style={{ fontSize: '0.65rem', background: '#ff6b6b20', color: '#ff6b6b', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>PROBATION</span> : null}
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.email}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => handleEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Pencil size={14} /></button>
                                    <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b' }}><Trash2 size={14} /></button>
                                </div>
                            </div>

                            {/* Joining Date */}
                            {t.joining_date && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    <Calendar size={12} /> Joined: {new Date(t.joining_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            )}

                            {/* Specialization Badges */}
                            {t.specializations && t.specializations.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.75rem' }}>
                                    {t.specializations.map((s, si) => (
                                        <span key={s.course_id} style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '12px', background: `${colors[si % colors.length]}15`, color: colors[si % colors.length], fontWeight: 500 }}>
                                            {s.course_name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--bg-surface)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{t.active_batches}</p>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Batches</p>
                                </div>
                                <div style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--bg-surface)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.tasks_completed}</p>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Done</p>
                                </div>
                                <div style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--bg-surface)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: t.tasks_pending > 3 ? '#ff6b6b' : 'var(--text-main)' }}>{t.tasks_pending}</p>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pending</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={14} fill={s <= Math.round(rating) ? '#ffd43b' : 'transparent'} color={s <= Math.round(rating) ? '#ffd43b' : 'var(--border-color)'} />
                                ))}
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                    {rating.toFixed(1)} ({t.total_reviews} reviews)
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
