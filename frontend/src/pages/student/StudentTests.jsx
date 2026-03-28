import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import theme from './theme';
import {
    PageHeader, StatCard, Card, FilterTabs, EmptyState,
    LoadingSpinner, StatusBadge,
} from './StudentComponents';
import {
    FileText, CheckCircle, Clock, Lock, AlertTriangle,
    Award, TrendingUp, Target, BarChart3, ExternalLink,
} from 'lucide-react';

export const StudentTests = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchTests = async () => {
            try { const res = await studentAPI.getTests(); setTests(res.data?.tests || res.data || []); }
            catch { } finally { setLoading(false); }
        };
        fetchTests();
    }, []);

    const stats = {
        total: tests.length,
        completed: tests.filter(t => t.status === 'completed').length,
        active: tests.filter(t => t.status === 'active').length,
        pending: tests.filter(t => t.status === 'pending_review').length,
        avgScore: tests.filter(t => t.score != null).length
            ? Math.round(tests.filter(t => t.score != null).reduce((a, t) => a + (parseFloat(t.score) || 0), 0) / tests.filter(t => t.score != null).length)
            : null,
    };

    const filtered = filter === 'all' ? tests : tests.filter(t => t.status === filter);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'completed': return { icon: CheckCircle, color: theme.accent.green, label: 'Completed' };
            case 'pending_review': return { icon: Clock, color: theme.accent.yellow, label: 'Pending Review' };
            case 'active': return { icon: TrendingUp, color: theme.accent.blue, label: 'Active' };
            case 'locked': return { icon: Lock, color: theme.text.muted, label: 'Locked' };
            default: return { icon: FileText, color: theme.text.muted, label: status };
        }
    };

    if (loading) return <LoadingSpinner label="Loading tests..." />;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Tests & Assessments"
                subtitle="Track your exam performance and upcoming tests"
                icon={<FileText size={24} />}
                accentColor={theme.accent.yellow}
            />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <StatCard icon={<FileText size={22} />} label="Total Tests" value={stats.total} accentColor={theme.accent.cyan} />
                <StatCard icon={<TrendingUp size={22} />} label="Active" value={stats.active} accentColor={theme.accent.blue} />
                <StatCard icon={<CheckCircle size={22} />} label="Completed" value={stats.completed} accentColor={theme.accent.green} />
                <StatCard icon={<Clock size={22} />} label="Pending Review" value={stats.pending} accentColor={theme.accent.yellow} />
                <StatCard icon={<BarChart3 size={22} />} label="Avg Score"
                    value={stats.avgScore != null ? `${stats.avgScore}%` : '—'} accentColor={theme.accent.purple} />
            </div>

            {/* Filters + List */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: theme.font.size.base, fontWeight: 700, color: theme.text.primary }}>All Tests</span>
                <FilterTabs
                    filters={[
                        { key: 'all', label: 'All' },
                        { key: 'active', label: 'Active' },
                        { key: 'pending_review', label: 'Pending Review' },
                        { key: 'completed', label: 'Completed' },
                        { key: 'locked', label: 'Locked' },
                    ]}
                    active={filter} onChange={setFilter} accentColor={theme.accent.yellow}
                />
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={<FileText size={32} />}
                    title="No tests found"
                    message={filter === 'all' ? 'Tests will appear here once assigned by your trainer.' : `No ${filter} tests at the moment.`}
                />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
                    {filtered.map(test => {
                        const cfg = getStatusConfig(test.status);
                        const Icon = cfg.icon;
                        const scoreColor = test.score == null ? theme.text.muted : parseFloat(test.score) >= 80 ? theme.accent.green : parseFloat(test.score) >= 50 ? theme.accent.yellow : theme.accent.red;

                        return (
                            <Card key={test.id} hoverable noPadding>
                                <div style={{ height: '3px', background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}66)` }} />
                                <div style={{ padding: '22px 24px' }}>
                                    {/* Header Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '42px', height: '42px', borderRadius: theme.radius.sm,
                                                background: `${cfg.color}15`, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', color: cfg.color,
                                            }}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '15px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>
                                                    {test.title || test.test_name || 'Test'}
                                                </h4>
                                                <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '2px' }}>
                                                    {test.module_name || test.module || 'Module'}
                                                </div>
                                            </div>
                                        </div>
                                        <StatusBadge status={test.status} config={{ color: cfg.color, label: cfg.label }} />
                                    </div>

                                    {/* Score / Info */}
                                    <div style={{
                                        background: theme.bg.input, border: `1px solid ${theme.border.subtle}`,
                                        borderRadius: theme.radius.md, padding: '14px 16px',
                                        display: 'grid', gridTemplateColumns: test.score != null ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px',
                                    }}>
                                        {test.score != null && (
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '4px' }}>Score</div>
                                                <div style={{ fontSize: '24px', fontWeight: 800, color: scoreColor }}>{test.score}%</div>
                                            </div>
                                        )}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '4px' }}>Attempts</div>
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: theme.text.primary }}>
                                                {test.attempts || 0}/{test.max_attempts || '∞'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '4px' }}>
                                                {test.status === 'completed' ? 'Result' : 'Duration'}
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: theme.text.primary }}>
                                                {test.status === 'completed'
                                                    ? (test.score >= (test.passing_score || 50) ? '✅ Pass' : '❌ Fail')
                                                    : (test.duration || '—')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Awaiting Review Notice */}
                                    {test.status === 'pending_review' && (
                                        <div style={{ marginTop: '14px', padding: '10px 16px', borderRadius: theme.radius.md, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: theme.accent.yellow, fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                                            ⏳ Submitted — Awaiting grading by trainer
                                        </div>
                                    )}

                                    {/* Take Test Button */}
                                    {test.status === 'active' && test.test_url && (
                                        <a href={test.test_url} target="_blank" rel="noopener noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                marginTop: '14px', padding: '10px 16px', borderRadius: theme.radius.md,
                                                background: theme.accent.blue, color: '#fff', textDecoration: 'none',
                                                fontSize: '13px', fontWeight: 700, transition: 'opacity 0.2s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        >
                                            <ExternalLink size={14} /> Take Test
                                        </a>
                                    )}

                                    {/* Date / Footer */}
                                    {test.date && (
                                        <div style={{
                                            fontSize: '11px', color: theme.text.muted, marginTop: '12px',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                        }}>
                                            <Clock size={12} /> {test.date}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export default StudentTests;