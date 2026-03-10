import React, { useState, useEffect } from 'react';
import theme from './theme';
import { PageHeader, Card, LoadingSpinner } from './StudentComponents';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const eventColors = {
    class: theme.accent.blue,
    test: theme.accent.yellow,
    holiday: theme.accent.green,
    event: theme.accent.purple,
    leave: theme.accent.red,
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
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/student/calendar', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setEvents(data.events || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
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

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="My Calendar"
                subtitle="Track classes, tests, holidays and events"
                icon={<Calendar size={24} />}
                accentColor={theme.accent.blue}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
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
                        <div style={{
                            fontSize: '18px', fontWeight: 700, color: theme.text.primary,
                            display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
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

                    {/* Day Headings */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '14px 16px 8px' }}>
                        {DAYS.map(d => (
                            <div key={d} style={{
                                textAlign: 'center', fontSize: '10px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                                color: d === 'Sun' ? theme.accent.red : theme.text.muted,
                            }}>{d}</div>
                        ))}
                    </div>

                    {/* Day Cells */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0 16px 16px', gap: '4px' }}>
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayEvents = getEventsForDay(day);
                            const isSel = selectedDay === day;
                            const td = isToday(day);

                            return (
                                <button key={day} onClick={() => setSelectedDay(isSel ? null : day)}
                                    style={{
                                        width: '100%', aspectRatio: '1', borderRadius: '10px',
                                        border: isSel ? `2px solid ${theme.accent.blue}` : td ? `1px solid ${theme.accent.cyan}40` : `1px solid transparent`,
                                        background: isSel ? `${theme.accent.blue}15` : td ? `${theme.accent.cyan}08` : 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        justifyContent: 'center', gap: '4px', padding: '6px',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = td ? `${theme.accent.cyan}08` : 'transparent'; }}
                                >
                                    <span style={{
                                        fontSize: '14px', fontWeight: td ? 800 : 600,
                                        color: td ? theme.accent.cyan : isSel ? theme.accent.blue : theme.text.primary,
                                    }}>
                                        {day}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <div style={{ display: 'flex', gap: '3px' }}>
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

                {/* Event Details Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Legend */}
                    <Card>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '14px' }}>
                            Event Types
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.entries(eventColors).map(([type, color]) => (
                                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                                    <span style={{ fontSize: '13px', color: theme.text.secondary, fontWeight: 500, textTransform: 'capitalize' }}>{type}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Selected Day Events */}
                    <Card>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '14px' }}>
                            {selectedDay
                                ? `${MONTHS[month]} ${selectedDay}, ${year}`
                                : 'Select a Day'}
                        </div>
                        {selectedDay ? (
                            selectedEvents.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>📅</div>
                                    <div style={{ color: theme.text.muted, fontSize: theme.font.size.sm }}>No events scheduled</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selectedEvents.map((ev, i) => {
                                        const color = eventColors[ev.type] || theme.accent.blue;
                                        return (
                                            <div key={i} style={{
                                                padding: '12px 14px', borderRadius: theme.radius.sm,
                                                background: `${color}08`, border: `1px solid ${color}20`,
                                                borderLeft: `3px solid ${color}`,
                                            }}>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary, marginBottom: '4px' }}>
                                                    {ev.title || ev.topic || 'Event'}
                                                </div>
                                                {ev.time && <div style={{ fontSize: '11px', color, fontWeight: 600 }}>{ev.time}</div>}
                                                {ev.description && <div style={{ fontSize: '12px', color: theme.text.muted, marginTop: '4px', lineHeight: 1.5 }}>{ev.description}</div>}
                                                <span style={{
                                                    display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                                                    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                                                    letterSpacing: '0.08em', background: `${color}15`, color,
                                                    marginTop: '8px',
                                                }}>
                                                    {ev.type}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>👆</div>
                                <div style={{ color: theme.text.muted, fontSize: theme.font.size.sm }}>Click a date to view events</div>
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