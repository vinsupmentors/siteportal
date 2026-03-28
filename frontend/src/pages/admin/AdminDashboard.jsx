import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Users, GraduationCap, Layers, Briefcase, BookOpen, UserCheck,
    MessageSquare, AlertTriangle, Megaphone, CheckCircle, Clock, Video,
    Hexagon, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        superAdminAPI.getDashboardStats()
            .then(res => setStats(res.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading || !stats) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    const pipelineStages = [
        { key: 'Joined', label: 'Joined', color: '#868e96' },
        { key: 'Technical', label: 'Technical', color: '#4dabf7' },
        { key: 'Internship', label: 'Internship', color: '#fab005' },
        { key: 'Soft Skills', label: 'Soft Skills', color: '#ae3ec9' },
        { key: 'Certificate', label: 'Cert Prep', color: '#fd7e14' },
        { key: 'Completed', label: 'Completed', color: '#40c057' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>

            {/* 1. Core Overviews */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                <div className="glass-card stat-card">
                    <div>
                        <p className="stat-label">Active Students</p>
                        <p className="stat-value">{stats.core.totalStudents}</p>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(21, 170, 191, 0.1)' }}>
                        <GraduationCap size={28} color="#15aabf" />
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div>
                        <p className="stat-label">Active Trainers</p>
                        <p className="stat-value">{stats.core.activeTrainers}</p>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 212, 59, 0.1)' }}>
                        <Users size={28} color="#ffd43b" />
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div>
                        <p className="stat-label">Active Batches</p>
                        <p className="stat-value">{stats.core.activeBatches}</p>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(76, 110, 245, 0.1)' }}>
                        <Hexagon size={28} color="#4c6ef5" />
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div>
                        <p className="stat-label">Technical Doubts</p>
                        <p className="stat-value">{stats.health.doubts.open}</p>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(77, 171, 247, 0.1)' }}>
                        <MessageSquare size={28} color="#4dabf7" />
                    </div>
                </div>
            </div>

            {/* 2. Enrollment Pipeline */}
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--text-accent)' }}>Student Lifecycle Pipeline</h3>
                    <Link to="/admin/student-hub" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>View Detailed Hub →</Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'stretch', height: '50px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-dark)' }}>
                    {pipelineStages.map((stage, idx) => {
                        const count = stats.pipeline[stage.key] || 0;
                        const percentage = stats.core.totalStudents > 0 ? (count / stats.core.totalStudents) * 100 : 0;
                        return (
                            <div key={stage.key} style={{
                                width: `${percentage}%`,
                                minWidth: count > 0 ? '30px' : '0px',
                                background: stage.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                borderRight: idx < pipelineStages.length - 1 && count > 0 ? '1px solid var(--bg-surface)' : 'none',
                                position: 'relative'
                            }} title={`${stage.label}: ${count}`}>
                                {count > 1 && count}
                            </div>
                        )
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                    {pipelineStages.map(stage => (
                        <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                            {stage.label} ({stats.pipeline[stage.key] || 0})
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* 3. Action Center */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} color="var(--primary)" /> Action Center
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Portfolios</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: stats.actionCenter.pendingPortfolios > 0 ? '#ff6b6b' : 'var(--text-main)' }}>{stats.actionCenter.pendingPortfolios}</p>
                                </div>
                                <Briefcase size={22} color={stats.actionCenter.pendingPortfolios > 0 ? '#ff6b6b' : 'var(--text-muted)'} />
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tasks Review</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: stats.actionCenter.reviewTasks > 0 ? '#fab005' : 'var(--text-main)' }}>{stats.actionCenter.reviewTasks}</p>
                                </div>
                                <CheckCircle size={22} color={stats.actionCenter.reviewTasks > 0 ? '#fab005' : 'var(--text-muted)'} />
                            </div>
                        </div>
                    </div>

                    {/* 4. Support Health */}
                    <div className="glass-card">
                        <h3 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                            <MessageSquare size={18} color="#4dabf7" /> Support Health
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1.25rem', background: 'var(--bg-dark)', borderRadius: '12px', borderLeft: '4px solid #4dabf7' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tech Queries (Open)</p>
                                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.health.doubts.open > 0 ? '#4dabf7' : 'var(--text-main)', marginTop: '4px' }}>{stats.health.doubts.open}</p>
                            </div>
                            <div style={{ padding: '1.25rem', background: 'var(--bg-dark)', borderRadius: '12px', borderLeft: '4px solid #ff6b6b' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Escalations (Open)</p>
                                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.health.issues.open > 0 ? '#ff6b6b' : 'var(--text-main)', marginTop: '4px' }}>{stats.health.issues.open}</p>
                            </div>
                        </div>
                    </div>

                    {/* 5. Comms Tracker */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                                <Megaphone size={16} color="#ae3ec9" /> Announcements Tracker
                            </h3>
                            <Link to="/admin/announcements" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>Broadcast New →</Link>
                        </div>
                        {stats.health.latestAnnouncement ? (
                            <div style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>{stats.health.latestAnnouncement.title}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                    <div style={{ height: '6px', flex: 1, background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            background: '#ae3ec9',
                                            width: stats.health.latestAnnouncement.total_target_audience > 0
                                                ? `${(stats.health.latestAnnouncement.acknowledged_count / stats.health.latestAnnouncement.total_target_audience) * 100}%`
                                                : '0%'
                                        }}></div>
                                    </div>
                                    <span style={{ color: 'var(--text-muted)' }}>{stats.health.latestAnnouncement.acknowledged_count} Reads</span>
                                </div>
                            </div>
                        ) : <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recent broadcasts.</p>}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* 6. Deliverables Watchlist */}
                    <div className="glass-card">
                        <h3 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', marginBottom: '1rem' }}>
                            <AlertTriangle size={16} color="#fab005" /> Deliverables Watchlist
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-dark)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>0 Projects Submitted</span>
                                <span style={{ fontWeight: 700, color: stats.deliverables.zeroProjects > 0 ? '#ff6b6b' : '#51cf66' }}>{stats.deliverables.zeroProjects}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-dark)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Portfolios (Ready)</span>
                                <span style={{ fontWeight: 700, color: '#51cf66' }}>{stats.deliverables.readyPortfolios}</span>
                            </div>
                        </div>
                    </div>

                    {/* 7. Attendance Status */}
                    <div className="glass-card">
                        <h3 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', marginBottom: '1rem' }}>
                            <UserCheck size={16} color="#51cf66" /> Operational Attendance
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Trainers</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#51cf66' }}>{stats.attendance.trainer_present_today} <span style={{ opacity: 0.5 }}>/ {stats.attendance.trainer_expected}</span></p>
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Students</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#51cf66' }}>{stats.attendance.student_present_today} <span style={{ opacity: 0.5 }}>/ {stats.attendance.student_expected}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* 8. Live Activity Log */}
                    <div className="glass-card" style={{ flex: 1 }}>
                        <h3 style={{ color: 'var(--text-accent)', fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} color="#fab005" /> Audit Log (Live)
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {stats.recentActivity.slice(0, 5).map((a, i) => (
                                <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0
                                    }}>
                                        {(a.first_name || '?')[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                                            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{a.first_name}</span>
                                            {` ${a.action.replace(/_/g, ' ').toLowerCase()} `}
                                            <span style={{ color: 'var(--text-muted)' }}>{a.table_name}</span>
                                        </p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(a.created_at).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
