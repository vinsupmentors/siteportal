import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import theme from './theme';

const Card = ({ children, style = {} }) => (
    <div style={{
        background: theme.bg.card, border: `1px solid ${theme.border.subtle}`,
        borderRadius: theme.radius.lg, padding: theme.spacing.lg,
        boxShadow: theme.shadow.card, ...style,
    }}>
        {children}
    </div>
);

const StatCard = ({ label, value, sub, accentColor }) => (
    <div style={{
        background: theme.bg.card, border: `1px solid ${theme.border.subtle}`,
        borderLeft: `4px solid ${accentColor}`, borderRadius: theme.radius.md,
        padding: '20px 24px', flex: 1, minWidth: '180px', boxShadow: theme.shadow.card,
    }}>
        <div style={{ fontSize: theme.font.size.xs, color: theme.text.label, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: theme.font.weight.semibold }}>
            {label}
        </div>
        <div style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.text.primary }}>
            {value}
        </div>
        {sub && <div style={{ fontSize: theme.font.size.sm, color: theme.text.muted, marginTop: '4px' }}>{sub}</div>}
        <div style={{ marginTop: '14px', height: '4px', borderRadius: '2px', background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44)`, opacity: 0.6 }} />
    </div>
);

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDashboard(); }, []);

    const fetchDashboard = async () => {
        try {
            const { data } = await studentAPI.getDashboardStats();
            setDashData(data);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div style={{ color: theme.text.secondary, fontSize: theme.font.size.md }}>Loading dashboard...</div>
        </div>
    );

    if (!dashData?.activeBatch) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
            <div style={{ fontSize: '48px' }}>📚</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: theme.text.primary }}>No Active Batch</div>
            <div style={{ fontSize: '14px', color: theme.text.muted }}>You are not enrolled in any active batch yet.</div>
        </div>
    );

    const batch = dashData.activeBatch;
    const stats = dashData.stats || {};
    const announcements = dashData.announcements || [];
    const pendingWorksheets = dashData.pendingWorksheets || [];
    const moduleProgress = dashData.moduleProgress || { passed: 0, total: 0 };
    const studentName = dashData.studentName || 'Student';

    const attendancePct = stats.attendancePct || 0;
    const riskLevel = attendancePct < 50 ? 'AT RISK' : attendancePct < 75 ? 'MODERATE' : 'ON TRACK';
    const riskColor = riskLevel === 'AT RISK' ? theme.accent.red : riskLevel === 'ON TRACK' ? theme.accent.green : theme.accent.yellow;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ fontSize: theme.font.size.sm, color: theme.text.secondary, marginBottom: '4px' }}>
                        {getGreeting()},
                    </div>
                    <div style={{ fontSize: '42px', fontWeight: theme.font.weight.bold, color: theme.text.primary, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {studentName.split(' ')[0]}!
                        <span style={{ display: 'inline-block', fontSize: '36px', animation: 'wave 2s infinite' }}>👋</span>
                    </div>
                    <div style={{ fontSize: theme.font.size.base, color: theme.text.secondary, marginTop: '4px' }}>
                        <strong>{batch.batch_name}</strong> · {batch.course_name}
                    </div>
                </div>

                {/* Buttons with navigate */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/student/calendar')}
                        style={{
                            padding: '14px 28px', background: theme.bg.card,
                            color: '#ffffff', border: `1px solid ${theme.border.subtle}`,
                            borderRadius: theme.radius.md, fontSize: theme.font.size.base,
                            fontWeight: theme.font.weight.semibold, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                        </svg>
                        Schedule
                    </button>
                    <button
                        onClick={() => navigate('/student/materials')}
                        style={{
                            padding: '14px 28px',
                            background: theme.gradient?.blue || theme.accent.blue,
                            color: '#ffffff', border: 'none',
                            borderRadius: theme.radius.md, fontSize: theme.font.size.base,
                            fontWeight: theme.font.weight.semibold, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'transform 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polygon points="10 8 16 12 10 16 10 8" />
                        </svg>
                        Start Learning
                    </button>
                </div>
            </div>

            {/* Batch Info */}
            <Card style={{ marginBottom: '28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {[
                        { label: 'Batch',    value: batch.batch_name,                                    color: theme.accent.purple },
                        { label: 'Course',   value: batch.course_name,                                   color: theme.accent.cyan   },
                        { label: 'Schedule', value: `${batch.schedule_type || 'weekday'} · ${batch.timing || 'morning'}`, color: theme.accent.yellow },
                        { label: 'Mode',     value: batch.mode || 'Offline',                             color: theme.accent.green  },
                    ].map((item, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 18px', background: 'rgba(255,255,255,0.02)',
                            borderRadius: theme.radius.sm, border: `1px solid ${theme.border.subtle}`,
                        }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: theme.font.size.xs, color: theme.text.label, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: theme.font.weight.semibold }}>
                                    {item.label}
                                </div>
                                <div style={{ fontSize: theme.font.size.base, color: theme.text.primary, fontWeight: theme.font.weight.medium }}>
                                    {item.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Risk + Progress */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: theme.radius.full,
                    fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    background: `${riskColor}20`, color: riskColor,
                }}>
                    {riskLevel}
                </span>
                {moduleProgress.total > 0 && (
                    <span style={{ fontSize: '12px', color: theme.text.muted }}>
                        Module Progress: <strong style={{ color: theme.text.primary }}>{moduleProgress.passed} / {moduleProgress.total}</strong> passed
                    </span>
                )}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
                <StatCard label="Attendance" value={`${attendancePct}%`} accentColor={theme.accent.cyan} />
                <StatCard label="Loyalty Points" value={stats.loyaltyMarks ?? 0} sub="★★★★★" accentColor={theme.accent.yellow} />
                <StatCard label="Test Average" value={stats.avgTestScore > 0 ? `${stats.avgTestScore}%` : 'NO TESTS'} accentColor={theme.accent.purple} />
                <StatCard label="Projects Done" value={stats.completedProjects > 0 ? stats.completedProjects : 'NOT STARTED'} accentColor={theme.accent.green} />
            </div>

            {/* Bottom */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <Card>
                    <div style={{ fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold, color: theme.text.primary, marginBottom: '16px' }}>
                        📝 Pending Worksheets
                    </div>
                    {pendingWorksheets.length === 0 ? (
                        <div style={{ color: theme.text.muted, fontSize: theme.font.size.sm, padding: '20px 0', textAlign: 'center' }}>
                            All worksheets submitted 🎉
                        </div>
                    ) : pendingWorksheets.map((ws, i) => (
                        <div key={i} style={{
                            padding: '12px 0',
                            borderBottom: i < pendingWorksheets.length - 1 ? `1px solid ${theme.border.subtle}` : 'none',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <div style={{ fontSize: theme.font.size.base, color: theme.text.primary, fontWeight: theme.font.weight.medium }}>
                                    Day {ws.day_number} — {ws.topic_name}
                                </div>
                                <div style={{ fontSize: theme.font.size.sm, color: theme.text.muted }}>{ws.module_name}</div>
                            </div>
                            <button onClick={() => navigate('/student/materials')} style={{ fontSize: '11px', color: theme.accent.blue, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                                Submit →
                            </button>
                        </div>
                    ))}
                </Card>

                <Card>
                    <div style={{ fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold, color: theme.text.primary, marginBottom: '16px' }}>
                        📢 Recent Announcements
                    </div>
                    {announcements.length === 0 ? (
                        <div style={{ color: theme.text.muted, fontSize: theme.font.size.sm, padding: '20px 0', textAlign: 'center' }}>
                            No new announcements
                        </div>
                    ) : announcements.map((ann, i) => (
                        <div key={i} style={{
                            padding: '12px 0',
                            borderBottom: i < announcements.length - 1 ? `1px solid ${theme.border.subtle}` : 'none',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <div style={{ fontSize: theme.font.size.base, color: theme.text.primary, fontWeight: theme.font.weight.semibold }}>
                                    {ann.title}
                                </div>
                                <div style={{ fontSize: theme.font.size.xs, color: theme.text.muted }}>
                                    {new Date(ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </div>
                            </div>
                            <div style={{ fontSize: theme.font.size.sm, color: theme.text.secondary, lineHeight: 1.5 }}>
                                {ann.message}
                            </div>
                        </div>
                    ))}
                </Card>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes wave { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(20deg); } 75% { transform: rotate(-10deg); } }
            `}</style>
        </div>
    );
};

export { StudentDashboard };
export default StudentDashboard;