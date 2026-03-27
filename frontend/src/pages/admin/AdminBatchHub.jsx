import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Plus, Pencil, Trash2, ChevronDown, ChevronRight, BookOpen, Users
} from 'lucide-react';

export const AdminBatchHub = () => {
    const [loading, setLoading] = useState(true);
    const [batches, setBatches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [trainers, setTrainers] = useState([]);

    const [batchFilter, setBatchFilter] = useState('all');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [showBatchForm, setShowBatchForm] = useState(false);
    const [editingBatchId, setEditingBatchId] = useState(null);
    const [prefillBatchName, setPrefillBatchName] = useState('');
    const [batchForm, setBatchForm] = useState({
        batch_name: '', course_id: '', trainer_id: '', iop_trainer_id: '',
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

    const openNewCourse = (batchName = '') => {
        setPrefillBatchName(batchName);
        setEditingBatchId(null);
        setBatchForm({
            batch_name: batchName, course_id: '', trainer_id: '', iop_trainer_id: '',
            schedule_type: 'weekday', timing: 'morning',
            start_date: '', end_date: '', meeting_link: '', status: 'active'
        });
        setShowBatchForm(true);
    };

    const openEdit = (b) => {
        setPrefillBatchName('');
        setEditingBatchId(b.id);
        setBatchForm({ ...b, start_date: b.start_date?.split('T')[0], end_date: b.end_date?.split('T')[0] || '' });
        setShowBatchForm(true);
    };

    const handleBatchSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBatchId) await superAdminAPI.updateBatch(editingBatchId, batchForm);
            else await superAdminAPI.createBatch(batchForm);
            setShowBatchForm(false); setEditingBatchId(null); setPrefillBatchName('');
            setBatchForm({ batch_name: '', course_id: '', trainer_id: '', iop_trainer_id: '', schedule_type: 'weekday', timing: 'morning', start_date: '', end_date: '', meeting_link: '', status: 'active' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error saving batch'); }
    };

    const handleBatchDelete = async (id) => {
        if (!confirm('Delete this course from the batch? All student enrollments will be removed.')) return;
        try { await superAdminAPI.deleteBatch(id); fetchData(); }
        catch { alert('Error deleting batch'); }
    };

    const toggleGroup = (name) => setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));

    const filteredBatches = batches.filter(b => batchFilter === 'all' || b.status === batchFilter);

    // Group by batch_name
    const batchGroups = Object.entries(
        filteredBatches.reduce((groups, batch) => {
            const key = batch.batch_name;
            if (!groups[key]) groups[key] = [];
            groups[key].push(batch);
            return groups;
        }, {})
    );

    const statusColors = { upcoming: '#4c6ef5', active: '#51cf66', technical_class: '#f59f00', project_phase: '#f97316', softskill_aptitude_phase: '#cc5de8', completed: '#868e96' };
    const statusLabels = { upcoming: 'Upcoming', active: 'Active', technical_class: 'Technical Class', project_phase: 'Project Phase', softskill_aptitude_phase: 'SoftSkill & Aptitude', completed: 'Completed' };
    const inputStyle = { padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', width: '100%' };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Batch Hub</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Schedule management and trainer coordination</p>
                </div>
                <button onClick={() => openNewCourse()}
                    style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={18} /> New Batch
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                    { key: 'all', label: 'All' },
                    { key: 'upcoming', label: 'Upcoming' },
                    { key: 'active', label: 'Active' },
                    { key: 'technical_class', label: 'Technical Class' },
                    { key: 'project_phase', label: 'Project Phase' },
                    { key: 'softskill_aptitude_phase', label: 'SoftSkill & Aptitude' },
                    { key: 'completed', label: 'Completed' },
                ].map(({ key, label }) => (
                    <button key={key} onClick={() => setBatchFilter(key)}
                        style={{
                            padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem',
                            background: batchFilter === key ? 'var(--primary)' : 'var(--bg-surface)',
                            color: batchFilter === key ? 'white' : 'var(--text-muted)',
                            border: `1px solid ${batchFilter === key ? 'var(--primary)' : 'var(--border-color)'}`
                        }}>
                        {label}
                    </button>
                ))}
            </div>

            {showBatchForm && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{editingBatchId ? 'Edit Course Details' : prefillBatchName ? `Add Course to "${prefillBatchName}"` : 'Create New Batch'}</h3>
                    <form onSubmit={handleBatchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        <input required placeholder="Batch Name (e.g. Batch 11)" value={batchForm.batch_name}
                            onChange={e => setBatchForm({ ...batchForm, batch_name: e.target.value })}
                            style={inputStyle} readOnly={!!prefillBatchName && !editingBatchId} />
                        <select required value={batchForm.course_id} onChange={e => setBatchForm({ ...batchForm, course_id: e.target.value })} style={inputStyle}>
                            <option value="">Select Course</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={batchForm.trainer_id} onChange={e => setBatchForm({ ...batchForm, trainer_id: e.target.value })} style={inputStyle}>
                            <option value="">Assign Technical Trainer</option>
                            {trainers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                        </select>
                        <select value={batchForm.iop_trainer_id || ''} onChange={e => setBatchForm({ ...batchForm, iop_trainer_id: e.target.value })} style={inputStyle}>
                            <option value="">Assign IOP Trainer (optional)</option>
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
                            <option value="upcoming">Upcoming</option>
                            <option value="active">Active</option>
                            <option value="technical_class">Technical Class</option>
                            <option value="project_phase">Project Phase</option>
                            <option value="softskill_aptitude_phase">SoftSkill & Aptitude Phase</option>
                            <option value="completed">Completed</option>
                        </select>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => { setShowBatchForm(false); setPrefillBatchName(''); }} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '10px 25px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {batchGroups.length === 0 && (
                    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No batches found. Create your first batch above.
                    </div>
                )}
                {batchGroups.map(([batchName, courses]) => {
                    const totalStudents = courses.reduce((sum, c) => sum + (c.student_count || 0), 0);
                    const isExpanded = expandedGroups[batchName] !== false; // default open
                    return (
                        <div key={batchName} className="glass-card" style={{ overflow: 'hidden' }}>
                            {/* Batch Group Header */}
                            <div
                                onClick={() => toggleGroup(batchName)}
                                style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-surface)' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {isExpanded ? <ChevronDown size={18} color="var(--primary)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                                    <div>
                                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{batchName}</span>
                                        <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {courses.length} course{courses.length !== 1 ? 's' : ''} · {totalStudents} student{totalStudents !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); openNewCourse(batchName); }}
                                    style={{ padding: '6px 14px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    <Plus size={14} /> Add Course
                                </button>
                            </div>

                            {/* Course Rows */}
                            {isExpanded && (
                                <div>
                                    {courses.map((b, idx) => (
                                        <div key={b.id} style={{
                                            padding: '0.875rem 1.25rem',
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            borderTop: '1px solid var(--border-color)',
                                            background: idx % 2 === 0 ? 'transparent' : 'var(--bg-dark)'
                                        }}>
                                            {/* Status dot */}
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[b.status] || '#868e96', flexShrink: 0 }} />

                                            {/* Course name */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 180, flex: '1' }}>
                                                <BookOpen size={14} color="var(--primary)" />
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.course_name}</span>
                                            </div>

                                            {/* Schedule */}
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize', minWidth: 130 }}>
                                                {b.timing} · {b.schedule_type}
                                            </span>

                                            {/* Trainer */}
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: 140 }}>
                                                {b.trainer_name || 'No trainer'}
                                                {b.iop_trainer_name && (
                                                    <span style={{ display: 'block', fontSize: '0.73rem', color: '#10b981' }}>
                                                        IOP: {b.iop_trainer_name}
                                                    </span>
                                                )}
                                            </span>

                                            {/* Students */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 80 }}>
                                                <Users size={13} color="var(--text-muted)" />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.student_count || 0}</span>
                                            </div>

                                            {/* Status badge */}
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                                                background: `${statusColors[b.status] || '#868e96'}20`,
                                                color: statusColors[b.status] || '#868e96', textTransform: 'uppercase',
                                                minWidth: 80, textAlign: 'center'
                                            }}>{b.status}</span>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                                                <button onClick={() => openEdit(b)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><Pencil size={15} /></button>
                                                <button onClick={() => handleBatchDelete(b.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
