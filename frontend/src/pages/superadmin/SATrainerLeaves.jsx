import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { Calendar, Clock, CheckCircle, XCircle, User, Briefcase, Filter, Info, MessageSquare, RefreshCw } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

// ── Theme tokens (matches SA dark theme) ─────────────────────────────────────
const t = {
    bg: { main: '#0b1120', card: '#141d2f', input: '#0d1424' },
    border: { subtle: 'rgba(255,255,255,0.06)', light: 'rgba(255,255,255,0.1)' },
    text: { primary: '#fff', secondary: '#8892a4', muted: '#5a6478', label: '#6b7a90' },
    accent: {
        blue: '#3b82f6', green: '#10b981', yellow: '#f59e0b',
        red: '#ef4444', purple: '#8b5cf6', cyan: '#06b6d4',
    },
    radius: { sm: '8px', md: '12px', lg: '16px', full: '9999px' },
};

const StatCard = ({ label, value, icon, color }) => (
    <div style={{
        background: t.bg.card, border: `1px solid ${t.border.subtle}`,
        borderRadius: t.radius.lg, padding: '20px 24px',
        borderLeft: `3px solid ${color}`,
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ margin: '0 0 6px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: t.text.label }}>{label}</p>
                <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: t.text.primary }}>{value}</h3>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: t.radius.md, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
        </div>
    </div>
);

const StatusPill = ({ status }) => {
    const map = {
        pending:  { color: t.accent.yellow, label: 'Pending' },
        approved: { color: t.accent.green,  label: 'Approved' },
        rejected: { color: t.accent.red,    label: 'Rejected' },
    };
    const s = map[status] || map.pending;
    return (
        <span style={{
            padding: '3px 10px', borderRadius: t.radius.full,
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            background: `${s.color}15`, color: s.color,
            border: `1px solid ${s.color}25`,
        }}>{s.label}</span>
    );
};

const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: t.radius.sm,
    background: t.bg.input, border: `1px solid ${t.border.light}`,
    color: t.text.primary, fontSize: '13px', outline: 'none', resize: 'vertical',
    boxSizing: 'border-box',
};

export const SATrainerLeaves = () => {
    const [leaves, setLeaves]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [filter, setFilter]           = useState('pending');
    const [processingId, setProcessingId] = useState(null);
    const [actionReason, setActionReason] = useState('');
    const [submitting, setSubmitting]   = useState(false);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await superAdminAPI.getAllTrainerLeaves();
            setLeaves(res.data || []);
        } catch (err) {
            console.error('Failed to fetch trainer leaves:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleAction = async (id, status) => {
        if (status === 'rejected' && !actionReason.trim()) {
            alert('Please provide a reason for rejection.');
            return;
        }
        setSubmitting(true);
        try {
            await superAdminAPI.updateTrainerLeaveStatus(id, { status, rejection_reason: actionReason });
            setProcessingId(null);
            setActionReason('');
            fetchLeaves();
        } catch (err) {
            alert('Error updating leave request.');
        } finally {
            setSubmitting(false);
        }
    };

    const stats = leaves.reduce(
        (acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; },
        { pending: 0, approved: 0, rejected: 0 }
    );

    const filteredLeaves = leaves.filter(l => filter === 'all' || l.status === filter);

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: t.radius.lg, background: `${t.accent.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent.blue }}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: t.text.primary }}>Trainer Leave Management</h1>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: t.text.muted }}>Review and process leave applications from the training team</p>
                    </div>
                </div>
                <button onClick={fetchLeaves} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 16px', borderRadius: t.radius.md,
                    border: `1px solid ${t.border.light}`, background: 'transparent',
                    color: t.text.secondary, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}>
                    <RefreshCw size={15} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatCard label="Pending Requests"  value={stats.pending}  icon={<Clock size={18} />}        color={t.accent.yellow} />
                <StatCard label="Approved"           value={stats.approved} icon={<CheckCircle size={18} />} color={t.accent.green}  />
                <StatCard label="Rejected"           value={stats.rejected} icon={<XCircle size={18} />}     color={t.accent.red}    />
            </div>

            {/* Filter pills */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: t.radius.md,
                background: t.bg.card, border: `1px solid ${t.border.subtle}`,
                marginBottom: '20px', flexWrap: 'wrap', gap: '10px',
            }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {['all', 'pending', 'approved', 'rejected'].map(s => (
                        <button key={s} onClick={() => setFilter(s)} style={{
                            padding: '6px 16px', borderRadius: t.radius.full,
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            border: 'none', textTransform: 'capitalize',
                            background: filter === s ? t.accent.blue : 'transparent',
                            color: filter === s ? '#fff' : t.text.secondary,
                            transition: '0.15s',
                        }}>{s}</button>
                    ))}
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: t.text.muted }}>
                    <Filter size={12} /> {filteredLeaves.length} request{filteredLeaves.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: t.text.muted, fontSize: '14px' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: t.accent.blue, marginBottom: '12px' }} />
                    <p>Loading leave applications...</p>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
            ) : filteredLeaves.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: t.bg.card, borderRadius: t.radius.lg, border: `1px solid ${t.border.subtle}` }}>
                    <Calendar size={40} style={{ color: t.text.muted, marginBottom: '12px' }} />
                    <p style={{ color: t.text.muted, margin: 0, fontSize: '14px' }}>
                        No {filter !== 'all' ? filter : ''} leave requests found.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredLeaves.map(leave => {
                        const start = new Date(leave.start_date);
                        const end   = new Date(leave.end_date);
                        const days  = differenceInDays(end, start) + 1;
                        const isPending = leave.status === 'pending';
                        const accentColor = leave.status === 'approved' ? t.accent.green
                            : leave.status === 'rejected' ? t.accent.red : t.accent.yellow;

                        return (
                            <div key={leave.id} style={{
                                background: t.bg.card, border: `1px solid ${t.border.subtle}`,
                                borderRadius: t.radius.lg, overflow: 'hidden',
                            }}>
                                {/* color bar */}
                                <div style={{ height: '3px', background: accentColor }} />

                                <div style={{ padding: '18px 24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>

                                        {/* Left: date block + info */}
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{
                                                minWidth: '60px', height: '60px', borderRadius: t.radius.md,
                                                background: `${accentColor}15`, display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center', color: accentColor,
                                            }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{format(start, 'MMM')}</span>
                                                <span style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1 }}>{format(start, 'dd')}</span>
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '16px', fontWeight: 800, color: t.text.primary }}>{leave.trainer_name}</span>
                                                    <StatusPill status={leave.status} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: t.text.muted, flexWrap: 'wrap' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <User size={11} /> Trainer
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: t.accent.blue, fontWeight: 700 }}>
                                                        <Briefcase size={11} />
                                                        {leave.leave_type?.toUpperCase()}
                                                        {leave.session !== 'full_day' && ` (${leave.session === 'morning' ? 'Morning' : 'Evening'})`}
                                                    </span>
                                                    <span style={{ fontWeight: 700, color: accentColor }}>
                                                        {leave.session === 'full_day' ? `${days} day${days > 1 ? 's' : ''}` : '0.5 day'}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    marginTop: '10px', padding: '8px 12px',
                                                    background: 'rgba(255,255,255,0.03)', borderRadius: t.radius.sm,
                                                    border: `1px solid ${t.border.subtle}`, fontSize: '12px', color: t.text.secondary,
                                                }}>
                                                    <Info size={11} style={{ verticalAlign: 'middle', marginRight: '4px', color: t.accent.blue }} />
                                                    {leave.reason}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: date + actions */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '200px' }}>
                                            <span style={{ fontSize: '11px', color: t.text.muted }}>
                                                Applied {format(new Date(leave.created_at), 'MMM d, yyyy')}
                                            </span>
                                            <span style={{ fontSize: '11px', color: t.text.muted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={11} />
                                                {format(start, 'MMM d')} — {format(end, 'MMM d, yyyy')}
                                            </span>

                                            {!isPending && leave.reviewed_by_name && (
                                                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: t.radius.sm, border: `1px solid ${t.border.subtle}`, fontSize: '11px', color: t.text.muted, textAlign: 'right' }}>
                                                    Processed by: {leave.reviewed_by_name}
                                                    {leave.rejection_reason && (
                                                        <div style={{ color: t.accent.red, marginTop: '4px' }}>
                                                            Note: {leave.rejection_reason}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {isPending && processingId !== leave.id && (
                                                <button onClick={() => setProcessingId(leave.id)} style={{
                                                    padding: '8px 16px', borderRadius: t.radius.md,
                                                    background: t.accent.blue, color: '#fff', border: 'none',
                                                    fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                                }}>
                                                    Take Action
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action panel */}
                                    {isPending && processingId === leave.id && (
                                        <div style={{
                                            marginTop: '16px', padding: '16px',
                                            background: `${t.accent.blue}06`,
                                            border: `1px solid ${t.accent.blue}20`,
                                            borderRadius: t.radius.md,
                                        }}>
                                            <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: t.text.label, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <MessageSquare size={12} /> Leave Decision
                                            </p>
                                            <textarea
                                                style={{ ...inputStyle, minHeight: '64px', marginBottom: '12px' }}
                                                placeholder="Add a comment or rejection reason (required for rejection)..."
                                                value={actionReason}
                                                onChange={e => setActionReason(e.target.value)}
                                            />
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => { setProcessingId(null); setActionReason(''); }} style={{
                                                    padding: '8px 14px', borderRadius: t.radius.md,
                                                    background: 'transparent', border: `1px solid ${t.border.light}`,
                                                    color: t.text.secondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                                }}>Cancel</button>
                                                <button onClick={() => handleAction(leave.id, 'rejected')} disabled={submitting} style={{
                                                    padding: '8px 18px', borderRadius: t.radius.md,
                                                    background: `${t.accent.red}12`, border: `1.5px solid ${t.accent.red}40`,
                                                    color: t.accent.red, fontSize: '12px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '5px', opacity: submitting ? 0.6 : 1,
                                                }}>
                                                    <XCircle size={13} /> Reject
                                                </button>
                                                <button onClick={() => handleAction(leave.id, 'approved')} disabled={submitting} style={{
                                                    padding: '8px 18px', borderRadius: t.radius.md,
                                                    background: t.accent.green, border: 'none',
                                                    color: '#fff', fontSize: '12px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '5px', opacity: submitting ? 0.6 : 1,
                                                }}>
                                                    <CheckCircle size={13} /> {submitting ? 'Saving…' : 'Approve'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SATrainerLeaves;
