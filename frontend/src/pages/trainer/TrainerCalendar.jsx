import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, Card, ActionButton, FormField, inputStyle, LoadingSpinner, SectionTitle, StatusBadge, theme,
} from './TrainerComponents';
import { ChevronLeft, ChevronRight, BookOpen, ClipboardList, Send, CheckCircle, FileText, Clock } from 'lucide-react';

export const TrainerCalendar = () => {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [batches, setBatches] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [kras, setKras] = useState([]);
    const [otherWorks, setOtherWorks] = useState([]);
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [loading, setLoading] = useState(true);

    // KRA form
    const [kraForm, setKraForm] = useState({ batch_id: '', topics_covered: '', notes: '', session: 'morning' });
    // Other work form
    const [owForm, setOwForm] = useState({ title: '', description: '', time_spent: '' });
    // Feedback
    const [feedbackForms, setFeedbackForms] = useState([]);

    const [activePanel, setActivePanel] = useState('kra');

    useEffect(() => { fetchData(); }, [month, year]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await trainerAPI.getMyCalendar(month + 1, year);
            setBatches(res.data.batches || []);
            setTasks(res.data.tasks || []);
            setKras(res.data.kras || []);
            setOtherWorks(res.data.otherWorks || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        trainerAPI.getFeedbackForms().then(r => setFeedbackForms(r.data || [])).catch(() => { });
    }, []);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    const getBatchesForDay = (day) => {
        const d = new Date(year, month, day);
        return batches.filter(b => {
            if (!b.start_date) return false;
            const s = new Date(b.start_date), e = new Date(b.end_date || '2099-12-31');
            return d >= s && d <= e && d.getDay() !== 0;
        });
    };

    const getKRAForDay = (day, bid, session) => {
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return kras.find(k => {
            const kd = typeof k.date === 'string' ? k.date.slice(0, 10) : new Date(k.date).toISOString().slice(0, 10);
            return kd === ds && (!bid || k.batch_id == bid) && (!session || k.session === session);
        });
    };

    const hasKRA = (day) => {
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return kras.some(k => {
            const kd = typeof k.date === 'string' ? k.date.slice(0, 10) : new Date(k.date).toISOString().slice(0, 10);
            return kd === ds;
        });
    };

    const handleSubmitKRA = async () => {
        if (!kraForm.batch_id || !kraForm.topics_covered) return;
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
        try {
            await trainerAPI.submitKRA({ ...kraForm, date: ds });
            setKraForm({ batch_id: '', topics_covered: '', notes: '', session: 'morning' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const handleSubmitOtherWork = async () => {
        if (!owForm.title) return;
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
        try {
            await trainerAPI.submitOtherWork({ ...owForm, date: ds });
            setOwForm({ title: '', description: '', time_spent: '' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const handleReleaseFeedback = async (formId) => {
        if (!kraForm.batch_id) return alert("Select a batch first");
        try {
            await trainerAPI.releaseFeedback({ batch_id: kraForm.batch_id, module_id: null, form_id: formId });
            alert("Feedback released!");
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    if (loading) return <LoadingSpinner label="Loading calendar..." />;

    const dayBatches = getBatchesForDay(selectedDay);

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader title="My Calendar" subtitle="View your schedule, submit KRA, and manage feedback" icon={<ClipboardList size={24} />} accentColor={theme.accent.cyan} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
                {/* Calendar Grid */}
                <Card noPadding>
                    <div style={{ padding: '18px 24px', borderBottom: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text.muted, padding: '6px' }}><ChevronLeft size={18} /></button>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: theme.text.primary, margin: 0 }}>{monthName} {year}</h3>
                        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text.muted, padding: '6px' }}><ChevronRight size={18} /></button>
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label, padding: '8px 0' }}>{d}</div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                            {Array(firstDow).fill(null).map((_, i) => <div key={`e-${i}`} />)}
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                                const isSelected = day === selectedDay;
                                const hasBatches = getBatchesForDay(day).length > 0;
                                const hasKra = hasKRA(day);
                                return (
                                    <div key={day} onClick={() => setSelectedDay(day)}
                                        style={{
                                            textAlign: 'center', padding: '8px 4px', borderRadius: theme.radius.sm, cursor: 'pointer',
                                            background: isSelected ? theme.accent.blue : 'transparent',
                                            border: isToday && !isSelected ? `1px solid ${theme.accent.blue}50` : '1px solid transparent',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                                        <span style={{ fontSize: '13px', fontWeight: isSelected || isToday ? 800 : 500, color: isSelected ? '#fff' : theme.text.primary }}>{day}</span>
                                        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '3px' }}>
                                            {hasBatches && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? '#fff' : theme.accent.blue }} />}
                                            {hasKra && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? '#fff' : theme.accent.green }} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>

                {/* Side Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Selected Day Info */}
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: theme.radius.sm, background: `${theme.accent.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: theme.accent.blue }}>{selectedDay}</span>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 800, color: theme.text.primary, margin: 0 }}>{monthName} {selectedDay}</h4>
                                <p style={{ fontSize: '10px', color: theme.text.muted, margin: 0 }}>{dayBatches.length} batch{dayBatches.length !== 1 ? 'es' : ''}</p>
                            </div>
                        </div>
                        {dayBatches.map(b => (
                            <div key={b.id} style={{ marginBottom: '10px' }}>
                                <div style={{ padding: '8px 10px', borderRadius: theme.radius.sm, background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>{b.batch_name}</p>
                                        <span style={{ fontSize: '10px', color: theme.text.muted }}>{b.timing}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {['morning', 'afternoon', 'evening', 'weekends'].map(s => (
                                            getKRAForDay(selectedDay, b.id, s) && (
                                                <div key={s} title={`KRA submitted for ${s}`} style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.accent.green }} />
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Card>

                    {/* Panel Tabs */}
                    <div style={{ display: 'flex', gap: '4px', background: theme.bg.card, borderRadius: theme.radius.md, padding: '4px', border: `1px solid ${theme.border.subtle}` }}>
                        {[{ key: 'kra', label: 'KRA' }, { key: 'other', label: 'Other Work' }, { key: 'feedback', label: 'Feedback' }].map(t => (
                            <button key={t.key} onClick={() => setActivePanel(t.key)}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: theme.radius.sm, border: 'none', cursor: 'pointer',
                                    fontSize: '11px', fontWeight: 700,
                                    background: activePanel === t.key ? theme.accent.blue : 'transparent',
                                    color: activePanel === t.key ? '#fff' : theme.text.muted,
                                    transition: 'all 0.2s',
                                }}>{t.label}</button>
                        ))}
                    </div>

                    {/* KRA Panel */}
                    {activePanel === 'kra' && (
                        <Card>
                            <SectionTitle>Submit KRA</SectionTitle>
                            <FormField label="Batch & Session">
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select style={{ ...inputStyle, cursor: 'pointer', flex: 2 }} value={kraForm.batch_id} onChange={e => {
                                        const bid = e.target.value;
                                        const batch = dayBatches.find(b => b.id == bid);
                                        setKraForm(f => ({ ...f, batch_id: bid, session: batch ? (batch.timing.toLowerCase().includes('morning') ? 'morning' : batch.timing.toLowerCase().includes('evening') ? 'evening' : 'afternoon') : 'morning' }));
                                    }}>
                                        <option value="">Select batch</option>
                                        {Object.entries(dayBatches.reduce((acc, b) => { if (!acc[b.batch_name]) acc[b.batch_name] = []; acc[b.batch_name].push(b); return acc; }, {})).map(([bn, cs]) => (
                                            <optgroup key={bn} label={bn}>{cs.map(b => <option key={b.id} value={b.id}>{b.course_name}</option>)}</optgroup>
                                        ))}
                                    </select>
                                    <select style={{ ...inputStyle, cursor: 'pointer', flex: 1 }} value={kraForm.session} onChange={e => setKraForm(f => ({ ...f, session: e.target.value }))}>
                                        <option value="morning">Morning</option>
                                        <option value="afternoon">Afternoon</option>
                                        <option value="evening">Evening</option>
                                        <option value="weekends">Weekend</option>
                                    </select>
                                </div>
                            </FormField>
                            <FormField label="Topics Covered">
                                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="What did you cover today?" value={kraForm.topics_covered}
                                    onChange={e => setKraForm(f => ({ ...f, topics_covered: e.target.value }))} />
                            </FormField>
                            <FormField label="Notes (Optional)">
                                <input style={inputStyle} placeholder="Any observations..." value={kraForm.notes}
                                    onChange={e => setKraForm(f => ({ ...f, notes: e.target.value }))} />
                            </FormField>
                            <ActionButton onClick={handleSubmitKRA} icon={<Send size={14} />} style={{ width: '100%', justifyContent: 'center' }}>Submit KRA</ActionButton>
                        </Card>
                    )}

                    {/* Other Work Panel */}
                    {activePanel === 'other' && (
                        <Card>
                            <SectionTitle>Log Other Work</SectionTitle>
                            <FormField label="Title">
                                <input style={inputStyle} placeholder="e.g. Content Prep" value={owForm.title} onChange={e => setOwForm(f => ({ ...f, title: e.target.value }))} />
                            </FormField>
                            <FormField label="Description">
                                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={owForm.description} onChange={e => setOwForm(f => ({ ...f, description: e.target.value }))} />
                            </FormField>
                            <FormField label="Time Spent">
                                <input style={inputStyle} placeholder="e.g. 2 hours" value={owForm.time_spent} onChange={e => setOwForm(f => ({ ...f, time_spent: e.target.value }))} />
                            </FormField>
                            <ActionButton onClick={handleSubmitOtherWork} icon={<Clock size={14} />} style={{ width: '100%', justifyContent: 'center' }}>Log Work</ActionButton>
                        </Card>
                    )}

                    {/* Feedback Panel */}
                    {activePanel === 'feedback' && (
                        <Card>
                            <SectionTitle>Release Feedback</SectionTitle>
                            <FormField label="Target Batch">
                                <select style={{ ...inputStyle, cursor: 'pointer' }} value={kraForm.batch_id} onChange={e => setKraForm(f => ({ ...f, batch_id: e.target.value }))}>
                                    <option value="">Select batch</option>
                                    {Object.entries(batches.reduce((acc, b) => { if (!acc[b.batch_name]) acc[b.batch_name] = []; acc[b.batch_name].push(b); return acc; }, {})).map(([bn, cs]) => (
                                        <optgroup key={bn} label={bn}>{cs.map(b => <option key={b.id} value={b.id}>{b.course_name}</option>)}</optgroup>
                                    ))}
                                </select>
                            </FormField>
                            {feedbackForms.length === 0 ? (
                                <p style={{ fontSize: '12px', color: theme.text.muted, textAlign: 'center', padding: '16px 0' }}>No feedback forms available.</p>
                            ) : feedbackForms.map(f => (
                                <div key={f.id} style={{ padding: '10px 14px', borderRadius: theme.radius.sm, border: `1px solid ${theme.border.subtle}`, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text.primary }}>{f.title}</span>
                                    <button onClick={() => handleReleaseFeedback(f.id)}
                                        style={{ padding: '6px 12px', borderRadius: theme.radius.sm, background: theme.accent.green, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}>
                                        Release
                                    </button>
                                </div>
                            ))}
                        </Card>
                    )}
                </div>
            </div>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
