import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import {
    PageHeader, StatCard, Card, SectionTitle, ActionButton, EmptyState, LoadingSpinner, theme,
} from './TrainerComponents';
import {
    Users, MessageSquare, Award, CheckCircle, Calendar, Zap, ArrowRight,
    Play, AlertCircle, TrendingUp, BookOpen, ExternalLink,
} from 'lucide-react';

export const TrainerDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try { const res = await trainerAPI.getDashboardStats(); setData(res.data); }
            catch (err) { console.error(err); } finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <LoadingSpinner label="Loading workbench..." />;
    if (!data) return <EmptyState icon={<AlertCircle size={28} />} title="Failed to load" subtitle="Please try refreshing." />;

    const { stats, schedule } = data;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Trainer Workbench ⚡"
                subtitle={`Welcome back! You have ${stats.activeBatches} active batch${stats.activeBatches !== 1 ? 'es' : ''} to manage.`}
                icon={<TrendingUp size={24} />}
                accentColor={theme.accent.purple}
                actions={
                    <>
                        <Link to="/trainer/calendar" style={{ textDecoration: 'none' }}>
                            <ActionButton variant="secondary" icon={<Calendar size={14} />}>Calendar</ActionButton>
                        </Link>
                        <Link to="/trainer/announcements" style={{ textDecoration: 'none' }}>
                            <ActionButton icon={<Zap size={14} />}>Broadcast</ActionButton>
                        </Link>
                    </>
                }
            />

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <StatCard label="Active Students" value={stats.totalStudents} icon={<Users size={20} />} accentColor={theme.accent.blue} />
                <StatCard label="Pending Doubts" value={stats.pendingDoubts} icon={<MessageSquare size={20} />} accentColor={theme.accent.red} />
                <StatCard label="KRA Entries" value={stats.kraCompletion} icon={<Award size={20} />} accentColor={theme.accent.yellow} sub="This Month" />
                <StatCard label="Tasks Pending" value={stats.tasks?.assigned || 0} icon={<CheckCircle size={20} />} accentColor={theme.accent.green} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                {/* Today's Sessions */}
                <Card noPadding>
                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <SectionTitle>Today's Live Sessions</SectionTitle>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: theme.accent.blue, background: `${theme.accent.blue}12`, padding: '4px 12px', borderRadius: theme.radius.full }}>{schedule.length} Batches</span>
                    </div>
                    {schedule.length > 0 ? schedule.map(batch => (
                        <div key={batch.id} style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = theme.bg.cardHover}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: theme.radius.md,
                                    background: `${theme.accent.purple}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: theme.accent.purple, fontSize: '18px', fontWeight: 800,
                                }}>{batch.batch_name?.charAt(0)}</div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.accent.blue }}>{batch.course_name}</span>
                                        <span style={{ fontSize: '9px', color: theme.text.muted }}>·</span>
                                        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.muted }}>{batch.timing}</span>
                                    </div>
                                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: theme.text.primary, margin: 0 }}>{batch.batch_name}</h4>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Link to={`/trainer/attendance/${batch.id}`} style={{ textDecoration: 'none' }}>
                                    <ActionButton variant="secondary" icon={<CheckCircle size={12} />} style={{ padding: '8px 14px', fontSize: '10px' }}>Attendance</ActionButton>
                                </Link>
                                {batch.meeting_link && (
                                    <a href={batch.meeting_link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                        <ActionButton icon={<Play size={12} />} style={{ padding: '8px 14px', fontSize: '10px' }}>Launch</ActionButton>
                                    </a>
                                )}
                            </div>
                        </div>
                    )) : <EmptyState icon={<Calendar size={24} />} title="No sessions today" subtitle="Check the calendar for your upcoming schedule." />}
                </Card>

                {/* Right Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Doubts Alert */}
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: theme.text.primary, margin: 0 }}>Student Doubts</h3>
                            <div style={{ width: '32px', height: '32px', borderRadius: theme.radius.sm, background: `${theme.accent.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertCircle size={16} color={theme.accent.red} />
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: theme.text.muted, marginBottom: '16px', lineHeight: 1.6 }}>
                            {stats.pendingDoubts > 0
                                ? `You have ${stats.pendingDoubts} questions waiting for resolution.`
                                : 'All doubts resolved. Great job!'}
                        </p>
                        <Link to="/trainer/doubts" style={{ textDecoration: 'none' }}>
                            <ActionButton variant="secondary" icon={<ArrowRight size={14} />} style={{ width: '100%', justifyContent: 'center' }}>Go to Helpdesk</ActionButton>
                        </Link>
                    </Card>

                    {/* KRA CTA */}
                    <div style={{
                        background: `linear-gradient(135deg, ${theme.accent.blue}, ${theme.accent.purple})`,
                        borderRadius: theme.radius.lg, padding: '28px 24px', position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }}>
                            <BookOpen size={100} color="#fff" />
                        </div>
                        <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 8px', position: 'relative', zIndex: 1 }}>Finished a class?</h4>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: '0 0 20px', lineHeight: 1.5, position: 'relative', zIndex: 1 }}>
                            Log your topics in the KRA system.
                        </p>
                        <Link to="/trainer/calendar" style={{ textDecoration: 'none', position: 'relative', zIndex: 1 }}>
                            <button style={{
                                padding: '10px 20px', borderRadius: theme.radius.md, background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer',
                                fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <BookOpen size={14} /> Submit KRA
                            </button>
                        </Link>
                    </div>

                    {/* Performance */}
                    <Card>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: theme.text.primary, margin: '0 0 16px' }}>Task Completion</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: theme.text.muted, marginBottom: '8px' }}>
                            <span>Done</span><span style={{ color: theme.text.primary, fontWeight: 700 }}>{stats.tasks?.complete || 0}</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: theme.accent.blue, borderRadius: '3px', width: '65%', transition: 'width 0.6s' }} />
                        </div>
                    </Card>
                </div>
            </div>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
