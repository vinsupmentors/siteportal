// Calendar v2 — batch labels include course name + timing, weekday = Mon–Sat
import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLORS = ['#4c6ef5', '#15aabf', '#7950f2', '#ffd43b', '#ff6b6b', '#51cf66', '#e64980', '#fab005'];
const statusColors = { assigned: '#4c6ef5', review: '#ffd43b', complete: '#51cf66', return: '#ff6b6b' };

export const SACalendar = () => {
    const [batches, setBatches] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [kras, setKras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bRes, tRes] = await Promise.all([
                    superAdminAPI.getBatches(),
                    superAdminAPI.getTrainerTasks(),
                ]);
                setBatches(bRes.data.batches.filter(b => b.status === 'active'));
                setTasks(tRes.data.tasks);
                setKras(tRes.data.kras || []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const getEventsForDay = (day) => {
        if (!day) return { dayBatches: [], dayTasks: [] };
        const date = new Date(year, month, day);
        const dow = date.getDay();
        const isWeekend = dow === 0; // Only Sunday is off; weekday = Mon–Sat
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const dayBatches = batches.filter(b => {
            const start = new Date(b.start_date);
            const end = b.end_date ? new Date(b.end_date) : new Date(2099, 0, 1);
            if (date < start || date > end) return false;
            return b.schedule_type === 'weekday' ? !isWeekend : isWeekend;
        });

        const dayTasks = tasks.filter(t => t.due_date?.split('T')[0] === dateStr);

        return { dayBatches, dayTasks };
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Master Calendar</h2>

            {/* Batch Legend */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {batches.map((b, i) => (
                    <span key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '6px', background: `${COLORS[i % COLORS.length]}15`, fontSize: '0.8rem', color: COLORS[i % COLORS.length] }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                        {b.batch_name} - {b.course_name} - {b.timing || 'N/A'}
                    </span>
                ))}
            </div>

            {/* Calendar */}
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{MONTHS[month]} {year}</span>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronRight size={20} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                    {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', padding: '8px' }}>{d}</div>)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {cells.map((day, idx) => {
                        const { dayBatches, dayTasks } = getEventsForDay(day);
                        const isSelected = day === selectedDay;
                        return (
                            <div key={idx} onClick={() => day && setSelectedDay(day)}
                                style={{
                                    minHeight: '85px', padding: '6px', borderRadius: '8px', cursor: day ? 'pointer' : 'default',
                                    background: isSelected ? 'var(--primary)10' : 'transparent',
                                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                    transition: 'all 0.15s'
                                }}>
                                {day && (
                                    <>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>{day}</span>
                                        {dayBatches.slice(0, 2).map((b, i) => {
                                            const ci = batches.indexOf(b);
                                            const color = COLORS[ci % COLORS.length];
                                            return (
                                                <div key={`b-${i}`} style={{ background: `${color}20`, borderLeft: `3px solid ${color}`, borderRadius: '3px', padding: '1px 4px', fontSize: '0.55rem', marginTop: '2px', color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {b.batch_name} - {b.course_name?.split(' ').map(w => w[0]).join('') || ''} - {b.timing || ''}
                                                </div>
                                            );
                                        })}
                                        {dayBatches.length > 2 && <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '2px' }}>+{dayBatches.length - 2} more</div>}
                                        {dayTasks.slice(0, 1).map((t, i) => (
                                            <div key={`t-${i}`} style={{ background: `${statusColors[t.status] || '#ffd43b'}25`, borderLeft: `3px solid ${statusColors[t.status] || '#ffd43b'}`, borderRadius: '3px', padding: '1px 4px', fontSize: '0.55rem', marginTop: '2px', color: statusColors[t.status] || '#ffd43b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
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

            {/* Day Detail */}
            {selectedDay && selectedEvents && (
                <div className="glass-card">
                    <h3 style={{ color: 'var(--text-accent)', marginBottom: '1rem' }}>{MONTHS[month]} {selectedDay}, {year}</h3>
                    {selectedEvents.dayBatches.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Batch Sessions</p>
                            {selectedEvents.dayBatches.map((b, i) => {
                                const ci = batches.indexOf(b);
                                const localDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                                const kra = kras.find(k => {
                                    if (!k.date) return false;
                                    const d = new Date(k.date);
                                    const kStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    return k.batch_id === b.id && kStr === localDateStr;
                                });
                                return (
                                    <div key={i} style={{ padding: '10px', borderRadius: '8px', marginBottom: '6px', background: `${COLORS[ci % COLORS.length]}10`, border: `1px solid ${COLORS[ci % COLORS.length]}20` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[ci % COLORS.length] }} />
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{b.batch_name} — {b.course_name}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.trainer_name || 'No trainer'} | {b.timing} | {b.schedule_type}</p>
                                            </div>
                                        </div>
                                        {kra ? (
                                            <div style={{ marginTop: '10px', padding: '10px', borderRadius: '6px', background: 'var(--bg-surface)', borderLeft: '3px solid #51cf66', fontSize: '0.85rem' }}>
                                                <span style={{ fontWeight: 700, color: '#51cf66', display: 'block', marginBottom: '4px', fontSize: '0.75rem', textTransform: 'uppercase' }}>KRA (Class Taken):</span>
                                                <p style={{ fontWeight: 500, color: 'var(--text-main)' }}>Topics: {kra.topics_covered}</p>
                                                {kra.notes && <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Notes: {kra.notes}</p>}
                                            </div>
                                        ) : (
                                            <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-dark)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                No KRA entry filed yet.
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {selectedEvents.dayTasks.length > 0 && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Assigned Tasks</p>
                            {selectedEvents.dayTasks.map(t => (
                                <div key={t.id} style={{ padding: '12px', borderRadius: '8px', marginBottom: '8px', border: `1px solid ${statusColors[t.status] || '#ffd43b'}30`, background: `${statusColors[t.status] || '#ffd43b'}08` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <p style={{ fontWeight: 500 }}>{t.title}</p>
                                            {t.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t.description}</p>}
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Assigned to: <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.trainer_name}</span></p>
                                        </div>
                                        <span style={{ background: `${statusColors[t.status] || '#ffd43b'}20`, color: statusColors[t.status] || '#ffd43b', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                            {t.status}
                                        </span>
                                    </div>
                                    {t.review_notes && (
                                        <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '6px', background: '#ffd43b10', borderLeft: '3px solid #ffd43b', fontSize: '0.85rem' }}>
                                            <span style={{ fontWeight: 600, color: '#ffd43b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Trainer's Review Notes:</span>
                                            <p style={{ marginTop: '2px', color: 'var(--text-main)' }}>{t.review_notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {selectedEvents.dayBatches.length === 0 && selectedEvents.dayTasks.length === 0 && (
                        <p style={{ color: 'var(--text-muted)' }}>No events scheduled for this date.</p>
                    )}
                </div>
            )}
        </div>
    );
};
