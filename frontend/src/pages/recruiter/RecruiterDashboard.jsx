import React, { useState, useEffect } from 'react';
import { recruiterAPI } from '../../services/api';
import { Users, Briefcase, TrendingUp, CheckCircle, BarChart3, Rocket, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const MetricCard = ({ label, value, icon, color, sub, alert }) => (
    <div className="card p-5 flex items-center gap-4" style={{ borderTop: alert ? `3px solid ${color}` : undefined }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
            {icon}
        </div>
        <div>
            <div className="text-2xl font-extrabold text-main">{value ?? 0}</div>
            <div className="text-xs text-muted font-semibold uppercase tracking-wider">{label}</div>
            {sub && <div style={{ fontSize: 10, marginTop: 2, color }}>{sub}</div>}
        </div>
    </div>
);

const FunnelBar = ({ label, value, max, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 140, fontSize: 12, color: '#8892a4', fontWeight: 600, flexShrink: 0 }}>{label}</div>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
            <div style={{ height: '100%', borderRadius: 4, background: color, width: max > 0 ? `${Math.min(100, (value / max) * 100)}%` : '0%', transition: 'width 0.6s ease-out' }} />
        </div>
        <div style={{ width: 30, fontSize: 13, fontWeight: 800, color, textAlign: 'right', flexShrink: 0 }}>{value}</div>
    </div>
);

const RecruiterDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        recruiterAPI.getDashboard()
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-6 text-secondary">Loading dashboard...</div>;
    if (!data) return <div className="p-6 text-muted">Failed to load data.</div>;

    const { overall, batches } = data;
    const totalIop       = Number(overall?.total_iop       || 0);
    const totalReady     = Number(overall?.total_ready     || 0);
    const totalPlaced    = Number(overall?.total_placed    || 0);
    const within90Days   = Number(overall?.within_90_days  || 0);
    const crossed90Days  = Number(overall?.crossed_90_days || 0);
    const interviewsStarted = batches.reduce((a, b) => a + Number(b.interviews_1 || 0) + Number(b.interviews_2 || 0) + Number(b.interviews_3 || 0), 0);

    return (
        <div className="p-6 flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-main">Placement Dashboard</h1>
                    <p className="text-secondary text-sm mt-1">IOP student interview pipeline overview</p>
                </div>
                <Link to="/recruiter/students" className="btn btn-primary flex items-center gap-2 text-sm font-bold">
                    <Users size={16} /> Manage IOP Students
                </Link>
            </div>

            {/* Top Metrics — row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total IOP Students"   value={totalIop}          icon={<Rocket size={22} />}        color="#10b981" />
                <MetricCard label="Ready for Interview"  value={totalReady}         icon={<CheckCircle size={22} />}   color="#3b82f6" />
                <MetricCard label="Interviews Started"   value={interviewsStarted}  icon={<Briefcase size={22} />}     color="#f59e0b" />
                <MetricCard label="Placed"               value={totalPlaced}        icon={<TrendingUp size={22} />}    color="#8b5cf6" />
            </div>

            {/* 90-Day Window Metrics — row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard
                    label="Within 90-Day Window"
                    value={within90Days}
                    icon={<Clock size={22} />}
                    color="#3b82f6"
                    sub="Active interview window — action needed"
                />
                <MetricCard
                    label="Crossed 90 Days"
                    value={crossed90Days}
                    icon={<AlertTriangle size={22} />}
                    color="#ef4444"
                    sub={crossed90Days > 0 ? "⚠️ Window expired — follow up required" : "All students within window"}
                    alert={crossed90Days > 0}
                />
            </div>

            {/* Alert banner if any crossed */}
            {crossed90Days > 0 && (
                <div style={{ padding: '14px 18px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertTriangle size={20} color="#ef4444" />
                    <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{crossed90Days} student{crossed90Days > 1 ? 's have' : ' has'} crossed the 90-day interview window.</span>
                        <span style={{ fontSize: 13, color: '#8892a4', marginLeft: 8 }}>Immediate follow-up required.</span>
                    </div>
                    <Link to="/recruiter/students?status=crossed_90_days" style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                        View Students →
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Interview Funnel */}
                <div className="card p-6">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted flex items-center gap-2 mb-6">
                        <BarChart3 size={16} /> Interview Funnel
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <FunnelBar label="IOP Students"    value={totalIop}          max={totalIop} color="#10b981" />
                        <FunnelBar label="Ready"           value={totalReady}         max={totalIop} color="#3b82f6" />
                        <FunnelBar label="Within 90 Days"  value={within90Days}       max={totalIop} color="#06b6d4" />
                        <FunnelBar label="1 Interview"     value={batches.reduce((a, b) => a + Number(b.interviews_1 || 0), 0)} max={totalIop} color="#f59e0b" />
                        <FunnelBar label="2 Interviews"    value={batches.reduce((a, b) => a + Number(b.interviews_2 || 0), 0)} max={totalIop} color="#f97316" />
                        <FunnelBar label="3 Interviews"    value={batches.reduce((a, b) => a + Number(b.interviews_3 || 0), 0)} max={totalIop} color="#ec4899" />
                        <FunnelBar label="Placed"          value={totalPlaced}        max={totalIop} color="#8b5cf6" />
                        {crossed90Days > 0 && (
                            <FunnelBar label="⚠ Crossed 90d" value={crossed90Days}   max={totalIop} color="#ef4444" />
                        )}
                    </div>
                </div>

                {/* Batch Breakdown */}
                <div className="card p-6">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted flex items-center gap-2 mb-4">
                        <Users size={16} /> Batch Breakdown
                    </h3>
                    {batches.length === 0 ? (
                        <div className="text-muted text-center py-8">No active batches with IOP students.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {batches.map(b => (
                                <div key={b.batch_id} style={{ padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{b.batch_name}</div>
                                            <div style={{ fontSize: 11, color: '#5a6478' }}>{b.course_name}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>JRP: {b.jrp_count || 0}</span>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>IOP: {b.iop_count || 0}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {[
                                            { label: 'Ready',   val: b.iop_ready,       color: '#3b82f6' },
                                            { label: '0 Int.',  val: b.interviews_0,    color: '#5a6478' },
                                            { label: '1 Int.',  val: b.interviews_1,    color: '#f59e0b' },
                                            { label: '2 Int.',  val: b.interviews_2,    color: '#f97316' },
                                            { label: '3 Int.',  val: b.interviews_3,    color: '#ec4899' },
                                            { label: 'Placed',  val: b.placed_count,    color: '#10b981' },
                                        ].map(({ label, val, color }) => (
                                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color }}>
                                                <span style={{ fontWeight: 800 }}>{val || 0}</span> {label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecruiterDashboard;
