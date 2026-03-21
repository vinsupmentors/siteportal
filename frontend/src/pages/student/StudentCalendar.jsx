import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import theme from './theme';
import { PageHeader, Card, LoadingSpinner } from './StudentComponents';
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const eventColors = {
    class:    theme.accent.blue,
    test:     theme.accent.yellow,
    holiday:  theme.accent.green,
    event:    theme.accent.purple,
    leave:    theme.accent.red,
    deadline: '#f97316',
    project:  theme.accent.blue,
    capstone: '#f97316',
    feedback: theme.accent.green,
    material: theme.accent.purple,
};

const StudentCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(null);

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    useEffect(() => { fetchCalendar(); }, []);

    const fetchCalendar = async () => {
        setLoading(true);

        // ── 1. Fetch base calendar events (class sessions, attendance, leaves) ──
        let calEvents = [];
        try {
            const calRes = await studentAPI.getCalendar();
            calEvents = calRes.data?.events || calRes.data?.data?.events || [];
        } catch (err) {
            console.error('Calendar fetch error:', err);
        }

        // ── 2. Fetch release due-dates (tests, projects, feedbacks) ────────────
        // This ALWAYS runs even if the calendar endpoint fails above.
        let releaseEvents = [];
        try {
            const relRes = await studentAPI.getReleases();
            const releases = relRes.data?.releases || [];

            const TYPE_LABELS = {
                module_project:             { label: 'Project Due',          type: 'deadline' },
                module_test:                { label: 'Test Due',             type: 'test'     },
                module_feedback:            { label: 'Feedback Due',         type: 'feedback' },
                module_study_material:      { label: 'Study Material',       type: 'material' },
                module_interview_questions: { label: 'Interview Q&A',        type: 'material' },
                capstone_project:           { label: 'Capstone Project Due', type: 'capstone' },
            };

            releaseEvents = releases
                .filter(r => r.due_date)
                .map(r => {
                    const meta = TYPE_LABELS[r.release_type] || { label: 'Due', type: 'deadline' };
                    const dateStr = new Date(r.due_date).toISOString().split('T')[0];
                    return {
                        date: dateStr,
                        title: `${meta.label}: ${r.name}`,
                        type: meta.type,
                        submitted: !!r.submission_id,
                        description: r.submission_id
                            ? '✓ Already submitted'
                            : new Date(r.due_date) < new Date()
                                ? '⚠ Overdue — submit now'
                                : null,
                    };
                });
        } catch (_) {}

        // ── 3. Merge — prefer rich releaseEvents; strip backend duplicates ──────
        // calEvents may include basic release-* events (backend fallback).
        // releaseEvents (from getReleases) are richer — include submission status.
        const filteredCalEvents = releaseEvents.length > 0
            ? calEvents.filter(e => !String(e.id || '').startsWith('release-'))
            : calEvents;

        setEvents([...filteredCalEvents, ...releaseEvents]);
        setLoading(false);
    };

    const nav = (dir) => {
        setCurrentDate(new Date(year, month + dir, 1));
        setSelectedDay(null);
    };

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const getEventsForDay = (d) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return events.filter(e => (e.date || '').startsWith(dateStr));
    };

    const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

    if (loading) return <LoadingSpinner label="Loading calendar..." />;

    const dueDates = events.filter(e => {
        const parts = (e.date || '').split('-');
        return parseInt(parts[0]) === year &&
            parseInt(parts[1]) === month + 1 &&
            ['deadline', 'test', 'capstone', 'project', 'feedback'].includes(e.type);
    });

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="My Calendar"
                subtitle="Track classes, due dates, tests and events"
                icon={<Calendar size={24} />}
                accentColor={theme.accent.blue}
            />

            {/* Due this month banner */}
            {dueDates.length > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 18px', borderRadius: theme.radius.md, marginBottom: '20px',
                    background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
                    fontSize: '13px', color: '#fdba74',
                }}>
                    <AlertCircle size={16} color="#f97316" style={{ flexShrink: 0 }} />
                    <span>
                        <strong>{dueDates.length} deadline{dueDates.length !== 1 ? 's' : ''}</strong> due this month — click the orange dates to see details
                    </span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
                {/* Calendar Grid */}
                <Card noPadding>
                    {/* Month Nav */}
                    <div style={{
                        padding: '18px 24px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', borderBottom: `1px solid ${theme.border.subtle}`,
                    }}>
                        <button onClick={() => nav(-1)} style={{
                            width: '36px', height: '36px', borderRadius: theme.radius.sm,
                            background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.border.subtle}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: theme.text.secondary, cursor: 'pointer',
                        }}>
                            <ChevronLeft size={18} />
                        </button>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: theme.text.primary, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: theme.accent.blue }}>{MONTHS[month]}</span> {year}
                        </div>
                        <button onClick={() => nav(1)} style={{
                            width: '36px', height: '36px', borderRadius: theme.radius.sm,
                            background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.border.subtle}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: theme.text.secondary, cursor: 'pointer',
                        }}>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Day headings */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '14px 16px 8px' }}>
                        {DAYS.map(d => (
                            <div key={d} style={{
                                textAlign: 'center', fontSize: '10px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                                color: d === 'Sun' ? theme.accent.red : theme.text.muted,
                            }}>{d}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0 16px 16px', gap: '4px' }}>
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayEvents = getEventsForDay(day);
                            const isSel = selectedDay === day;
                            const td = isToday(day);
                            const hasDeadline = dayEvents.some(e =>
                                ['deadline', 'test', 'capstone', 'project', 'feedback'].includes(e.type)
                            );

                            return (
                                <button key={day} onClick={() => setSelectedDay(isSel ? null : day)}
                                    style={{
                                        width: '100%', aspectRatio: '1', borderRadius: '10px',
                                        border: isSel
                                            ? `2px solid ${theme.accent.blue}`
                                            : td ? `1px solid ${theme.accent.cyan}40`
                                            : hasDeadline ? `1px solid rgba(249,115,22,0.4)`
                                            : `1px solid transparent`,
                                        background: isSel
                                            ? `${theme.accent.blue}15`
                                            : td ? `${theme.accent.cyan}08`
                                            : hasDeadline ? 'rgba(249,115,22,0.06)'
                                            : 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        gap: '4px', padding: '6px', transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                    onMouseLeave={e => {
                                        if (!isSel) e.currentTarget.style.background =
                                            td ? `${theme.accent.cyan}08`
                                            : hasDeadline ? 'rgba(249,115,22,0.06)'
                                            : 'transparent';
                                    }}
                                >
                                    <span style={{
                                        fontSize: '14px', fontWeight: td ? 800 : 600,
                                        color: td ? theme.accent.cyan : isSel ? theme.accent.blue : theme.text.primary,
                                    }}>
                                        {day}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {dayEvents.slice(0, 3).map((ev, j) => (
                                                <span key={j} style={{
                                                    width: '5px', height: '5px', borderRadius: '50%',
                                                    background: eventColors[ev.type] || theme.accent.blue,
                                                }} />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </Card>

                {/* Right panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Legend */}
                    <Card>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '14px' }}>
                            Event Types
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { type: 'class',    label: 'Class Session'     },
                                { type: 'test',     label: 'Test Due'          },
                                { type: 'deadline', label: 'Project Deadline'  },
                                { type: 'capstone', label: 'Capstone Due'      },
                                { type: 'leave',    label: 'Leave'             },
                                { type: 'holiday',  label: 'Holiday'           },
                                { type: 'material', label: 'Material Released' },
                            ].map(({ type, label }) => (
                                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: eventColors[type], flexShrink: 0 }} />
                                    <span style={{ fontSize: '13px', color: theme.text.secondary, fontWeight: 500 }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Selected day */}
                    <Card>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '14px' }}>
                            {selectedDay ? `${MONTHS[month]} ${selectedDay}, ${year}` : 'Select a Day'}
                        </div>

                        {!selectedDay ? (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>👆</div>
                                <div style={{ color: theme.text.muted, fontSize: '13px' }}>Click a date to view events</div>
                            </div>
                        ) : selectedEvents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>📅</div>
                                <div style={{ color: theme.text.muted, fontSize: '13px' }}>No events scheduled</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedEvents.map((ev, i) => {
                                    const color = eventColors[ev.type] || theme.accent.blue;
                                    const isDeadline = ['deadline', 'test', 'capstone', 'project', 'feedback'].includes(ev.type);
                                    return (
                                        <div key={i} style={{
                                            padding: '12px 14px', borderRadius: theme.radius.sm,
                                            background: `${color}08`, border: `1px solid ${color}20`,
                                            borderLeft: `3px solid ${color}`,
                                        }}>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary, marginBottom: '4px' }}>
                                                {ev.title || ev.topic || 'Event'}
                                            </div>
                                            {ev.time && (
                                                <div style={{ fontSize: '11px', color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                                    <Clock size={11} /> {ev.time}
                                                </div>
                                            )}
                                            {ev.description && (
                                                <div style={{ fontSize: '12px', color: theme.text.muted, marginTop: '4px', lineHeight: 1.5 }}>
                                                    {ev.description}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: `${color}15`, color }}>
                                                    {ev.type}
                                                </span>
                                                {isDeadline && ev.submitted && (
                                                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${theme.accent.green}15`, color: theme.accent.green }}>
                                                        ✓ Submitted
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export { StudentCalendar };
export default StudentCalendar;