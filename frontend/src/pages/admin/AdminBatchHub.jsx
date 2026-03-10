import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Plus, Pencil, Trash2, Hexagon
} from 'lucide-react';

export const AdminBatchHub = () => {
    const [loading, setLoading] = useState(true);
    const [batches, setBatches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [trainers, setTrainers] = useState([]);

    // --- BATCH STATE ---
    const [batchFilter, setBatchFilter] = useState('all');
    const [showBatchForm, setShowBatchForm] = useState(false);
    const [editingBatchId, setEditingBatchId] = useState(null);
    const [batchForm, setBatchForm] = useState({
        batch_name: '', course_id: '', trainer_id: '',
        schedule_type: 'weekday', timing: 'morning',
        start_date: '', end_date: '', meeting_link: '', status: 'active'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [batchRes, courseRes, trainerRes] = await Promise.all([
                superAdminAPI.getBatches(),
                superAdminAPI.getCourses(),
                superAdminAPI.getTrainers()
            ]);
            setBatches(batchRes.data.batches);
            setCourses(courseRes.data.courses);
            setTrainers(trainerRes.data.trainers);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleBatchSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBatchId) await superAdminAPI.updateBatch(editingBatchId, batchForm);
            else await superAdminAPI.createBatch(batchForm);
            setShowBatchForm(false); setEditingBatchId(null);
            setBatchForm({
                batch_name: '', course_id: '', trainer_id: '',
                schedule_type: 'weekday', timing: 'morning',
                start_date: '', end_date: '', meeting_link: '', status: 'active'
            });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error saving batch'); }
    };

    const handleBatchDelete = async (id) => {
        if (!confirm('Delete this batch? All student enrollments will be removed.')) return;
        try { await superAdminAPI.deleteBatch(id); fetchData(); }
        catch { alert('Error deleting batch'); }
    };

    const filteredBatches = batches.filter(b => batchFilter === 'all' || b.status === batchFilter);

    const statusColors = { active: '#51cf66', upcoming: '#4c6ef5', completed: '#868e96' };
    const inputStyle = { padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', width: '100%' };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Batch Hub</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Schedule management and trainer coordination</p>
                </div>
                <button onClick={() => { setShowBatchForm(true); setEditingBatchId(null); setBatchForm({ batch_name: '', course_id: '', trainer_id: '', schedule_type: 'weekday', timing: 'morning', start_date: '', end_date: '', meeting_link: '', status: 'active' }); }}
                    style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={18} /> New Batch
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['all', 'active', 'upcoming', 'completed'].map(s => (
                    <button key={s} onClick={() => setBatchFilter(s)}
                        style={{
                            padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', textTransform: 'capitalize',
                            background: batchFilter === s ? 'var(--primary)' : 'var(--bg-surface)',
                            color: batchFilter === s ? 'white' : 'var(--text-muted)',
                            border: `1px solid ${batchFilter === s ? 'var(--primary)' : 'var(--border-color)'}`
                        }}>
                        {s}
                    </button>
                ))}
            </div>

            {showBatchForm && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{editingBatchId ? 'Edit Batch Details' : 'Create New Academic Batch'}</h3>
                    <form onSubmit={handleBatchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        <input required placeholder="Batch Unique Name (e.g. SEP-23-WEB)" value={batchForm.batch_name} onChange={e => setBatchForm({ ...batchForm, batch_name: e.target.value })} style={inputStyle} />
                        <select required value={batchForm.course_id} onChange={e => setBatchForm({ ...batchForm, course_id: e.target.value })} style={inputStyle}>
                            <option value="">Select Primary Course</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={batchForm.trainer_id} onChange={e => setBatchForm({ ...batchForm, trainer_id: e.target.value })} style={inputStyle}>
                            <option value="">Assign Chief Trainer</option>
                            {trainers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                        </select>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <select required value={batchForm.schedule_type} onChange={e => setBatchForm({ ...batchForm, schedule_type: e.target.value })} style={inputStyle}>
                                <option value="weekday">Weekday</option>
                                <option value="weekend">Weekend</option>
                            </select>
                            <select required value={batchForm.timing} onChange={e => setBatchForm({ ...batchForm, timing: e.target.value })} style={inputStyle}>
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                                <option value="evening">Evening</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input required type="date" value={batchForm.start_date} onChange={e => setBatchForm({ ...batchForm, start_date: e.target.value })} style={inputStyle} />
                            <input type="date" value={batchForm.end_date} onChange={e => setBatchForm({ ...batchForm, end_date: e.target.value })} style={inputStyle} />
                        </div>
                        <input placeholder="Meeting Link (Classroom URL)" value={batchForm.meeting_link} onChange={e => setBatchForm({ ...batchForm, meeting_link: e.target.value })} style={inputStyle} />
                        <select value={batchForm.status} onChange={e => setBatchForm({ ...batchForm, status: e.target.value })} style={inputStyle}>
                            <option value="active">Active</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed</option>
                        </select>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowBatchForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '10px 25px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Confirm Batch</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredBatches.map(b => (
                    <div key={b.id} className="glass-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: statusColors[b.status] || 'var(--primary)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ background: 'var(--bg-dark)', padding: '8px', borderRadius: '10px', color: 'var(--primary)' }}>
                                    <Hexagon size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{b.batch_name}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{b.course_name}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => { setEditingBatchId(b.id); setBatchForm({ ...b, start_date: b.start_date?.split('T')[0], end_date: b.end_date?.split('T')[0] || '' }); setShowBatchForm(true); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Pencil size={16} /></button>
                                <button onClick={() => handleBatchDelete(b.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{b.student_count}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Students</p>
                            </div>
                            <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'capitalize' }}>{b.timing}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Session</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{b.trainer_name || 'No lead trainer'}</span>
                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: `${statusColors[b.status]}20`, color: statusColors[b.status], textTransform: 'uppercase' }}>{b.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
