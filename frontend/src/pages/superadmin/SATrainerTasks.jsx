import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { ChevronLeft, ChevronRight, Clock, BookOpen, ClipboardList, Plus } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLORS = ['#4c6ef5', '#15aabf', '#7950f2', '#ffd43b', '#ff6b6b', '#51cf66', '#e64980', '#fab005'];
const statusColors = { assigned: '#4c6ef5', review: '#ffd43b', complete: '#51cf66', return: '#ff6b6b' };

export const SATrainerTasks = () => {
    const [trainers, setTrainers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const [showAssign, setShowAssign] = useState(false);
    const [taskForm, setTaskForm] = useState({ trainer_id: '', title: '', description: '', due_date: '' });
    const [reassignId, setReassignId] = useState(null);
    const [reassignDate, setReassignDate] = useState('');
    const [kras, setKras] = useState([]);

    const fetchData = async () => {
        try {
            const res = await superAdminAPI.getTrainerTasks();
            setTrainers(res.data.trainers || []);
            setTasks(res.data.tasks || []);
            setBatches(res.data.batches || []);
            setKras(res.data.kras || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const getTrainerColor = (tid) => {
        const idx = trainers.findIndex(t => t.id === tid);
        return COLORS[idx % COLORS.length];
    };

    const getTasksForDay = (day) => {
        if (!day || !selectedTrainer) return [];
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return tasks.filter(t => t.trainer_id === selectedTrainer.id && t.due_date?.split('T')[0] === dateStr);
    };

    const getBatchesForDay = (day) => {
        if (!day || !selectedTrainer) return [];
        const date = new Date(year, month, day);
        const dow = date.getDay();
        const isWeekend = dow === 0; // Only Sunday off; weekday = Mon-Sat
        return batches.filter(b => {
            if (b.trainer_id !== selectedTrainer.id) return false;
            if (b.status !== 'active') return false;
            const start = new Date(b.start_date);
            const end = b.end_date ? new Date(b.end_date) : new Date(2099, 0, 1);
            if (date < start || date > end) return false;
            return b.schedule_type === 'weekday' ? !isWeekend : isWeekend;
        });
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await superAdminAPI.createTrainerTask(taskForm);
            setShowAssign(false);
            setTaskForm({ trainer_id: '', title: '', description: '', due_date: '' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const handleUpdateStatus = async (taskId, status, due_date) => {
        try { await superAdminAPI.updateTrainerTask(taskId, { status, due_date }); setReassignId(null); setReassignDate(''); fetchData(); }
        catch { alert('Error updating task'); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    // Trainer Selection View
    if (!selectedTrainer) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem' }}>Trainer Task Calendar</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Select a trainer to view their schedule, or assign new tasks</p>
                    </div>
                    <button onClick={() => setShowAssign(true)}
                        style={{ padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                        <Plus size={16} /> Assign Task
                    </button>
                </div>

                {/* Assign Task Form */}
                {showAssign && (
                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-accent)' }}>Assign New Task</h3>
                        <form onSubmit={handleAssign} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <select required value={taskForm.trainer_id} onChange={e => setTaskForm({ ...taskForm, trainer_id: e.target.value })}
                                style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }}>
                                <option value="">Select Trainer</option>
                                {trainers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                            </select>
                            <input required type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} />
                            <input required placeholder="Task Title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                                style={{ gridColumn: 'span 2', padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} />
                            <textarea placeholder="Description" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={2}
                                style={{ gridColumn: 'span 2', padding: '10px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }} />
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowAssign(false)}
                                    style={{ padding: '10px 18px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit"
                                    style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Assign Task</button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {trainers.map((trainer, idx) => {
                        const color = COLORS[idx % COLORS.length];
                        const trainerTasks = tasks.filter(t => t.trainer_id === trainer.id);
                        const pending = trainerTasks.filter(t => t.status !== 'complete').length;
                        const trainerBatches = batches.filter(b => b.trainer_id === trainer.id && b.status === 'active');
                        return (
                            <div key={trainer.id} className="glass-card" onClick={() => setSelectedTrainer(trainer)}
                                style={{ cursor: 'pointer', transition: 'all 0.25s', position: 'relative', overflow: 'hidden' }}
                                onMouseOver={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1rem', marginTop: '0.25rem' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${color}25`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color }}>
                                        {trainer.first_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 600 }}>{trainer.first_name} {trainer.last_name}</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{trainer.email}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--bg-surface)', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Batches</p>
                                        <p style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{trainerBatches.length}</p>
                                    </div>
                                    <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--bg-surface)', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tasks</p>
                                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{trainerTasks.length}</p>
                                    </div>
                                    <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--bg-surface)', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending</p>
                                        <p style={{ fontSize: '1.2rem', fontWeight: 700, color: pending > 3 ? '#ff6b6b' : '#ffd43b' }}>{pending}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {trainerBatches.map(b => (
                                        <span key={b.id} style={{ background: `${color}15`, color, padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500 }}>
                                            {b.batch_name} - {b.course_name?.split(' ').map(w => w[0]).join('') || ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {trainers.length === 0 && (
                        <div className="glass-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No active trainers. Add trainers via Manage Trainers first.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Calendar View
    const color = getTrainerColor(selectedTrainer.id);
    const trainerBatches = batches.filter(b => b.trainer_id === selectedTrainer.id && b.status === 'active');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => { setSelectedTrainer(null); setSelectedDay(null); }}
                        style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: 500 }}>← All Trainers</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}25`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color }}>
                            {selectedTrainer.first_name.charAt(0)}
                        </div>
                        <h2 style={{ fontSize: '1.25rem' }}>{selectedTrainer.first_name} {selectedTrainer.last_name}</h2>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {trainerBatches.map(b => (
                        <span key={b.id} style={{ background: `${color}15`, color, padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <BookOpen size={14} /> {b.batch_name} — {b.course_name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{MONTHS[month]} {year}</span>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronRight size={20} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                    {DAYS.map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', padding: '8px' }}>{d}</div>
                    ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {cells.map((day, idx) => {
                        const dayTasks = getTasksForDay(day);
                        const dayBatches = getBatchesForDay(day);
                        const isSelected = day === selectedDay;
                        const has = dayTasks.length > 0 || dayBatches.length > 0;
                        return (
                            <div key={idx} onClick={() => day && setSelectedDay(day)}
                                style={{
                                    minHeight: '90px', padding: '6px',
                                    background: isSelected ? `${color}15` : 'transparent',
                                    border: isSelected ? `1px solid ${color}` : '1px solid var(--border-color)',
                                    borderRadius: '8px', cursor: day ? 'pointer' : 'default', transition: 'all 0.15s'
                                }}>
                                {day && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: isSelected ? color : 'var(--text-muted)' }}>{day}</span>
                                            {has && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />}
                                        </div>
                                        {dayBatches.map((b, i) => (
                                            <div key={`b-${i}`} style={{ background: `${color}20`, borderLeft: `3px solid ${color}`, borderRadius: '4px', padding: '2px 5px', fontSize: '0.6rem', marginBottom: '2px', color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {b.batch_name} - {b.course_name?.split(' ').map(w => w[0]).join('') || ''} - {b.timing || ''}
                                            </div>
                                        ))}
                                        {dayTasks.map((t, i) => (
                                            <div key={`t-${i}`} style={{ background: `${statusColors[t.status]}25`, borderLeft: `3px solid ${statusColors[t.status]}`, borderRadius: '4px', padding: '2px 5px', fontSize: '0.6rem', marginBottom: '2px', color: statusColors[t.status], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                                                📋 {t.title}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedDay && (
                <div className="glass-card">
                    <h3 style={{ color: 'var(--text-accent)', marginBottom: '1rem', fontSize: '1.05rem' }}>
                        {MONTHS[month]} {selectedDay}, {year} — {selectedTrainer.first_name} {selectedTrainer.last_name}
                    </h3>
                    {getBatchesForDay(selectedDay).length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Batch Sessions</p>
                            {getBatchesForDay(selectedDay).map((b, i) => {
                                const localDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                                const kra = kras.find(k => {
                                    if (!k.date) return false;
                                    const d = new Date(k.date);
                                    const kStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    return k.batch_id === b.id && kStr === localDateStr;
                                });
                                return (
                                    <div key={i} style={{ padding: '12px', borderRadius: '8px', marginBottom: '8px', background: `${color}10`, border: `1px solid ${color}25` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <BookOpen size={18} color={color} />
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{b.batch_name} — {b.course_name}</p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{b.schedule_type} | {b.timing}</p>
                                            </div>
                                        </div>
                                        {kra ? (
                                            <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-surface)', borderLeft: '3px solid #51cf66' }}>
                                                <span style={{ fontWeight: 700, color: '#51cf66', display: 'block', marginBottom: '4px', fontSize: '0.75rem', textTransform: 'uppercase' }}>KRA (Class Taken):</span>
                                                <p style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.9rem' }}>Topics: {kra.topics_covered}</p>
                                                {kra.notes && <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.85rem' }}>Notes: {kra.notes}</p>}
                                            </div>
                                        ) : (
                                            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-dark)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                No KRA entry filed for this day.
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {getTasksForDay(selectedDay).length > 0 && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Assigned Tasks</p>
                            {getTasksForDay(selectedDay).map(t => (
                                <div key={t.id} style={{ padding: '12px', borderRadius: '8px', marginBottom: '8px', border: `1px solid ${statusColors[t.status]}30`, background: `${statusColors[t.status]}08` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <ClipboardList size={18} color={statusColors[t.status]} style={{ marginTop: '2px' }} />
                                            <div>
                                                <p style={{ fontWeight: 500 }}>{t.title}</p>
                                                {t.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.description}</p>}
                                                <span style={{ background: `${statusColors[t.status]}20`, color: statusColors[t.status], padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', display: 'inline-block', marginTop: '4px' }}>{t.status}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                            {t.status === 'review' && (
                                                <>
                                                    <button onClick={() => handleUpdateStatus(t.id, 'complete')} style={{ padding: '6px 12px', borderRadius: '6px', background: '#51cf6620', color: '#51cf66', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Approve</button>
                                                    <button onClick={() => { setReassignId(t.id); setReassignDate(''); }} style={{ padding: '6px 12px', borderRadius: '6px', background: '#ff6b6b20', color: '#ff6b6b', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Reassign</button>
                                                </>
                                            )}
                                            {t.status === 'assigned' && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Awaiting Submission</span>
                                            )}
                                        </div>
                                    </div>
                                    {t.review_notes && (
                                        <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '6px', background: '#ffd43b10', borderLeft: '3px solid #ffd43b', fontSize: '0.85rem' }}>
                                            <span style={{ fontWeight: 600, color: '#ffd43b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Trainer's Review:</span>
                                            <p style={{ marginTop: '2px', color: 'var(--text-main)' }}>{t.review_notes}</p>
                                            {t.review_date && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Submitted: {new Date(t.review_date).toLocaleDateString()}</p>}
                                        </div>
                                    )}
                                    {reassignId === t.id && (
                                        <div style={{ marginTop: '8px', padding: '10px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid #ff6b6b30', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#ff6b6b', fontWeight: 500 }}>New Due Date:</span>
                                            <input type="date" value={reassignDate} onChange={e => setReassignDate(e.target.value)}
                                                style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none' }} />
                                            <button onClick={() => handleUpdateStatus(t.id, 'return', reassignDate)} disabled={!reassignDate}
                                                style={{ padding: '6px 14px', borderRadius: '6px', background: '#ff6b6b', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: reassignDate ? 1 : 0.5 }}>Reassign</button>
                                            <button onClick={() => setReassignId(null)}
                                                style={{ padding: '6px 14px', borderRadius: '6px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {getTasksForDay(selectedDay).length === 0 && getBatchesForDay(selectedDay).length === 0 && (
                        <p style={{ color: 'var(--text-muted)' }}>No scheduled batches or tasks for this date.</p>
                    )}
                </div>
            )}
        </div>
    );
};
