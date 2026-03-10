import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Users, GraduationCap, Layers, Briefcase, BookOpen, UserCheck,
    MessageSquare, AlertTriangle, Megaphone, CheckCircle, Clock, Video
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SADashboard = () => {
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
        { key: 'Internship', label: 'Internship (Projects)', color: '#fab005' },
        { key: 'Soft Skills', label: 'Soft Skills', color: '#ae3ec9' },
        { key: 'Certificate', label: 'Certificate Prep', color: '#fd7e14' },
        { key: 'Completed', label: 'Completed', color: '#40c057' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>

            {/* 1. Core Overviews */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                <div className="glass-card stat-card">
                    <div>
                        <p className="stat-label">Total Students</p>
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
                        <Layers size={28} color="#4c6ef5" />
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div>
                        <p className="stat-label">Total Courses</p>
                        <p className="stat-value">{stats.core.totalCourses}</p>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(174, 62, 201, 0.1)' }}>
                        <BookOpen size={28} color="#ae3ec9" />
                    </div>
                </div>
            </div>

            {/* 2. Student Funnel Pipeline */}
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--text-accent)' }}>Student Phase Pipeline</h3>
                    <Link to="/superadmin/students" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>Manage Students →</Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'stretch', height: '60px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-dark)' }}>
                    {pipelineStages.map((stage, idx) => {
                        const count = stats.pipeline[stage.key] || 0;
                        const percentage = stats.core.totalStudents > 0 ? (count / stats.core.totalStudents) * 100 : 0;
                        return (
                            <div key={stage.key} style={{
                                width: `${percentage}%`,
                                minWidth: count > 0 ? '40px' : '0px',
                                background: stage.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                transition: 'all 0.3s ease',
                                borderRight: idx < pipelineStages.length - 1 && count > 0 ? '2px solid var(--bg-surface)' : 'none',
                                position: 'relative',
                                cursor: 'pointer'
                            }} title={`${stage.label}: ${count} students`}>
                                {count > 0 && count}
                            </div>
                        )
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                    {pipelineStages.map(stage => (
                        <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color }} />
                            {stage.label} ({stats.pipeline[stage.key] || 0})
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>

                {/* 3. Action Center & Approvals */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={18} color="var(--primary)" /> Action Center
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending Portfolios</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: stats.actionCenter.pendingPortfolios > 0 ? '#ff6b6b' : 'var(--text-main)' }}>{stats.actionCenter.pendingPortfolios}</p>
                            </div>
                            <Briefcase size={24} color={stats.actionCenter.pendingPortfolios > 0 ? '#ff6b6b' : 'var(--text-muted)'} />
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trainer Tasks to Review</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: stats.actionCenter.reviewTasks > 0 ? '#fab005' : 'var(--text-main)' }}>{stats.actionCenter.reviewTasks}</p>
                            </div>
                            <CheckCircle size={24} color={stats.actionCenter.reviewTasks > 0 ? '#fab005' : 'var(--text-muted)'} />
                        </div>
                    </div>
                </div>

                {/* 4. Support Health */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={18} color="#4dabf7" /> Support Health
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid rgba(77, 171, 247, 0.2)', borderLeft: '4px solid #4dabf7' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tech Queries (Open)</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 600, color: stats.health.doubts.open > 0 ? '#4dabf7' : 'var(--text-main)' }}>{stats.health.doubts.open}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {stats.health.doubts.total} total</span>
                            </div>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid rgba(255, 107, 107, 0.2)', borderLeft: '4px solid #ff6b6b' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Escalations (Open)</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 600, color: stats.health.issues.open > 0 ? '#ff6b6b' : 'var(--text-main)' }}>{stats.health.issues.open}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {stats.health.issues.total} total</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>

                {/* 5. Comms & Deliverables */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Comms Tracker */}
                    {stats.health.latestAnnouncement && (
                        <div className="glass-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                                    <Megaphone size={16} color="#ae3ec9" /> Latest Broadcast
                                </h3>
                                <Link to="/superadmin/announcements" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>View All</Link>
                            </div>
                            <p style={{ fontWeight: 500, marginBottom: '12px' }}>{stats.health.latestAnnouncement.title}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <div style={{ height: '8px', flex: 1, background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        background: '#ae3ec9',
                                        width: stats.health.latestAnnouncement.total_target_audience > 0
                                            ? ((stats.health.latestAnnouncement.acknowledged_count / stats.health.latestAnnouncement.total_target_audience) * 100) + '%'
                                            : '0%'
                                    }}></div>
                                </div>
                                <strong>{stats.health.latestAnnouncement.acknowledged_count} / {stats.health.latestAnnouncement.total_target_audience}</strong> Read
                            </div>
                        </div>
                    )}

                    {/* Deliverables Warnings */}
                    <div className="glass-card">
                        <h3 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', marginBottom: '1rem' }}>
                            <AlertTriangle size={16} color="#fab005" /> Deliverables Watchlist
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Students with 0 Projects Submitted</span>
                                <span style={{ fontWeight: 600, color: stats.deliverables.zeroProjects > 0 ? '#ff6b6b' : '#51cf66' }}>{stats.deliverables.zeroProjects}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Portfolios Ready (Approved)</span>
                                <span style={{ fontWeight: 600, color: '#51cf66' }}>{stats.deliverables.readyPortfolios}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. Today's Attendance & Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card">
                        <h3 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', marginBottom: '1rem' }}>
                            <UserCheck size={16} color="#51cf66" /> Today's Attendance
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1, padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid rgba(81, 207, 102, 0.2)', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Trainers Present</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#51cf66' }}>{stats.attendance.trainer_present_today} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {stats.attendance.trainer_expected}</span></p>
                            </div>
                            <div style={{ flex: 1, padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid rgba(81, 207, 102, 0.2)', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Students Present</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#51cf66' }}>{stats.attendance.student_present_today} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {stats.attendance.student_expected}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ flex: 1 }}>
                        <h3 style={{ color: 'var(--text-accent)', fontSize: '1rem', marginBottom: '1rem' }}>Live Activity Log</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {stats.recentActivity.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No activity today.</p>
                            ) : (
                                stats.recentActivity.slice(0, 5).map((a, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fab005', flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{a.first_name}</span> {a.action.replace(/_/g, ' ').toLowerCase()}
                                                {a.table_name && <span style={{ color: 'var(--text-muted)' }}> on {a.table_name}</span>}
                                            </p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
