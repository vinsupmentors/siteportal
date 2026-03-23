// IOP Trainer Portal — Dashboard
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard, Users, BookOpen, Layers,
    TrendingUp, Calendar, ChevronRight,
} from 'lucide-react';
import { iopTrainerAPI } from '../../services/api';
import theme from '../student/theme';
import {
    PageHeader, StatCard, Card, StatusBadge,
    ActionButton, EmptyState, LoadingSpinner, SectionTitle,
} from '../trainer/TrainerComponents';

const fadeIn = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}
`;

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const IOPTrainerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await iopTrainerAPI.getDashboard();
                setStats(res.data);
            } catch (err) {
                setError(err?.response?.data?.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <LoadingSpinner label="Loading IOP Dashboard…" />;

    return (
        <div style={{
            minHeight: '100vh',
            background: theme.bg.main,
            padding: '32px',
            fontFamily: theme.font.family,
            animation: 'fadeIn 0.4s ease',
        }}>
            <style>{fadeIn}</style>

            <PageHeader
                title="IOP Trainer Portal"
                subtitle={
                    stats
                        ? `${stats.activeGroups ?? 0} active group${stats.activeGroups !== 1 ? 's' : ''} under your management`
                        : 'Integrated Outreach Programme — Trainer View'
                }
                icon={<TrendingUp size={22} />}
                accentColor={theme.accent.purple}
            />

            {error && (
                <div style={{
                    padding: '14px 18px',
                    borderRadius: theme.radius.md,
                    background: `${theme.accent.red}10`,
                    border: `1px solid ${theme.accent.red}25`,
                    color: theme.accent.red,
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '24px',
                }}>
                    {error}
                </div>
            )}

            {/* ── Stats Row ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
            }}>
                <StatCard
                    label="Total Groups"
                    value={stats?.totalGroups ?? '—'}
                    icon={<Layers size={18} />}
                    accentColor={theme.accent.purple}
                />
                <StatCard
                    label="Active Groups"
                    value={stats?.activeGroups ?? '—'}
                    icon={<TrendingUp size={18} />}
                    accentColor={theme.accent.green}
                />
                <StatCard
                    label="Total Students"
                    value={stats?.totalStudents ?? '—'}
                    icon={<Users size={18} />}
                    accentColor={theme.accent.cyan}
                />
                <StatCard
                    label="Total Modules"
                    value={stats?.totalModules ?? '—'}
                    icon={<BookOpen size={18} />}
                    accentColor={theme.accent.yellow}
                />
            </div>

            {/* ── Next Session Card ── */}
            {stats?.nextGroup && (
                <div style={{ marginBottom: '28px' }}>
                    <SectionTitle>Upcoming Session</SectionTitle>
                    <Card accentTop={theme.accent.purple}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: theme.radius.md,
                                    background: `${theme.accent.purple}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: theme.accent.purple, flexShrink: 0,
                                }}>
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 4px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: theme.text.label }}>
                                        Next Group Session
                                    </p>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: theme.text.primary }}>
                                        {stats.nextGroup.name}
                                    </h3>
                                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: theme.text.muted, fontWeight: 500 }}>
                                        Starts {formatDate(stats.nextGroup.start_date)}
                                        {stats.nextGroup.timing ? ` · ${stats.nextGroup.timing}` : ''}
                                    </p>
                                </div>
                            </div>
                            <Link
                                to="/iop-trainer/groups"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '9px 18px', borderRadius: theme.radius.md,
                                    background: theme.accent.purple, color: '#fff',
                                    textDecoration: 'none', fontSize: '12px', fontWeight: 700,
                                }}
                            >
                                View Group <ChevronRight size={14} />
                            </Link>
                        </div>
                    </Card>
                </div>
            )}

            {/* ── Quick Links ── */}
            <SectionTitle>Quick Access</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {/* My Groups */}
                <Link to="/iop-trainer/groups" style={{ textDecoration: 'none' }}>
                    <div style={{
                        background: theme.bg.card,
                        border: `1px solid ${theme.border.subtle}`,
                        borderRadius: theme.radius.lg,
                        padding: '28px 24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderTop: `3px solid ${theme.accent.purple}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = theme.bg.cardHover; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = theme.bg.card; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <div style={{
                            width: '44px', height: '44px', borderRadius: theme.radius.md,
                            background: `${theme.accent.purple}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: theme.accent.purple,
                        }}>
                            <Layers size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: theme.text.primary }}>My Groups</h3>
                            <p style={{ margin: 0, fontSize: '12px', color: theme.text.muted, fontWeight: 500 }}>
                                Manage your IOP batch groups, unlock curriculum modules, take attendance
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.accent.purple, fontSize: '12px', fontWeight: 700 }}>
                            Open <ChevronRight size={14} />
                        </div>
                    </div>
                </Link>

                {/* IOP Curriculum — visual info card */}
                <div style={{
                    background: theme.bg.card,
                    border: `1px solid ${theme.border.subtle}`,
                    borderRadius: theme.radius.lg,
                    padding: '28px 24px',
                    borderTop: `3px solid ${theme.accent.cyan}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* decorative gradient blob */}
                    <div style={{
                        position: 'absolute', top: '-20px', right: '-20px',
                        width: '100px', height: '100px',
                        borderRadius: '50%',
                        background: `${theme.accent.cyan}08`,
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        width: '44px', height: '44px', borderRadius: theme.radius.md,
                        background: `${theme.accent.cyan}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: theme.accent.cyan, position: 'relative',
                    }}>
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: theme.text.primary }}>IOP Curriculum</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: theme.text.muted, fontWeight: 500 }}>
                            Soft-skills and aptitude modules structured by day. Unlock days progressively as sessions proceed.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['Soft Skills', 'Aptitude', 'Day-wise'].map(tag => (
                            <span key={tag} style={{
                                padding: '3px 10px', borderRadius: theme.radius.full,
                                background: `${theme.accent.cyan}12`,
                                color: theme.accent.cyan,
                                fontSize: '10px', fontWeight: 700,
                            }}>{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IOPTrainerDashboard;
