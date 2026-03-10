import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import theme from './theme';
import {
    PageHeader, StatCard, Card, FilterTabs, EmptyState,
    LoadingSpinner, ActionButton, StatusBadge, StripeBar,
    FormField, inputStyle, STATUS_PRESETS,
} from './StudentComponents';
import {
    Calendar, CheckCircle, XCircle, Clock,
    Plus, Send, UserCheck, AlertCircle, ArrowRight, X
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export const StudentLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ start_date: '', end_date: '', reason: '' });
    const [filter, setFilter] = useState('all');

    const fetchLeaves = async () => {
        try { const res = await studentAPI.getLeaves(); setLeaves(res.data || []); }
        catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const dashRes = await studentAPI.getDashboardStats();
            const batchId = dashRes.data.activeBatch?.id;
            await studentAPI.applyForLeave({ ...formData, batch_id: batchId });
            setFormData({ start_date: '', end_date: '', reason: '' });
            setShowForm(false);
            fetchLeaves();
        } catch (err) {
            alert("Failed: " + (err.response?.data?.message || err.message));
        } finally { setSubmitting(false); }
    };

    const leaveStats = {
        total: leaves.length,
        approved: leaves.filter(l => l.status === 'approved').length,
        pending: leaves.filter(l => l.status === 'pending').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };

    const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

    if (loading) return <LoadingSpinner label="Loading leaves..." />;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {/* Header */}
            <PageHeader
                title="Leave Management"
                subtitle="Apply for absence and track approvals"
                icon={<Calendar size={24} />}
                accentColor={theme.accent.cyan}
                action={
                    <ActionButton onClick={() => setShowForm(!showForm)} icon={showForm ? <X size={16} /> : <Plus size={16} />}>
                        {showForm ? 'Cancel' : 'Apply for Leave'}
                    </ActionButton>
                }
            />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <StatCard icon={<Calendar size={22} />} label="Total Leaves" value={leaveStats.total} accentColor={theme.accent.cyan} />
                <StatCard icon={<Clock size={22} />} label="Pending" value={leaveStats.pending} accentColor={theme.accent.yellow} />
                <StatCard icon={<CheckCircle size={22} />} label="Approved" value={leaveStats.approved} accentColor={theme.accent.green} />
                <StatCard icon={<XCircle size={22} />} label="Rejected" value={leaveStats.rejected} accentColor={theme.accent.red} />
            </div>

            {/* Application Form */}
            {showForm && (
                <Card style={{ marginBottom: '24px', padding: 0, border: `1px solid ${theme.accent.cyan}30` }}>
                    <div style={{
                        padding: '16px 20px', borderBottom: `1px solid ${theme.accent.cyan}15`,
                        background: `${theme.accent.cyan}08`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: theme.radius.sm,
                                background: `${theme.accent.cyan}15`, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', color: theme.accent.cyan,
                            }}>
                                <Calendar size={16} />
                            </div>
                            <span style={{ fontSize: theme.font.size.base, fontWeight: 700, color: theme.text.primary }}>
                                New Leave Application
                            </span>
                        </div>
                        <button onClick={() => setShowForm(false)} style={{
                            background: 'none', border: 'none', color: theme.text.muted,
                            cursor: 'pointer', padding: '6px',
                        }}>
                            <X size={18} />
                        </button>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <FormField label="Start Date" required>
                                    <input type="date" required style={inputStyle}
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="End Date" required>
                                    <input type="date" required style={inputStyle}
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </FormField>
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <ActionButton onClick={handleSubmit} disabled={submitting} icon={<Send size={14} />}
                                        style={{ width: '100%', justifyContent: 'center' }}>
                                        {submitting ? 'Submitting...' : 'Submit'}
                                    </ActionButton>
                                </div>
                            </div>
                            <FormField label="Reason for Leave" required>
                                <textarea rows="3" required placeholder="Briefly explain your reason for leave..."
                                    style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </FormField>
                        </form>
                    </div>
                </Card>
            )}

            {/* Filters + List */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: theme.font.size.md, fontWeight: 700, color: theme.text.primary, margin: 0 }}>My Applications</h3>
                <FilterTabs
                    filters={['All', 'Pending', 'Approved', 'Rejected']}
                    active={filter} onChange={setFilter}
                    accentColor={theme.accent.cyan}
                />
            </div>

            {/* Leave Cards */}
            {filtered.length === 0 ? (
                <EmptyState
                    icon={<Calendar size={32} />}
                    title="No applications"
                    message={filter === 'all' ? "You haven't applied for any leaves yet." : `No ${filter} applications found.`}
                    action={filter === 'all' && (
                        <ActionButton onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
                            Apply for Leave
                        </ActionButton>
                    )}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filtered.map(leave => {
                        const statusColor = leave.status === 'approved' ? theme.accent.green
                            : leave.status === 'rejected' ? theme.accent.red : theme.accent.yellow;
                        const start = new Date(leave.start_date);
                        const end = new Date(leave.end_date);
                        const days = Math.max(1, differenceInDays(end, start) + 1);

                        return (
                            <Card key={leave.id} noPadding hoverable>
                                <StripeBar color={statusColor} />
                                <div style={{ padding: '20px 24px' }}>
                                    {/* Status Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '38px', height: '38px', borderRadius: theme.radius.sm,
                                                background: `${statusColor}15`, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', color: statusColor,
                                            }}>
                                                {leave.status === 'approved' ? <CheckCircle size={18} /> :
                                                    leave.status === 'rejected' ? <XCircle size={18} /> : <Clock size={18} />}
                                            </div>
                                            <div>
                                                <StatusBadge status={leave.status} />
                                                <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '4px' }}>
                                                    {format(new Date(leave.created_at || leave.start_date), 'MMM d, yyyy · h:mm a')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date Range */}
                                    <div style={{
                                        background: theme.bg.input, border: `1px solid ${theme.border.subtle}`,
                                        borderRadius: theme.radius.md, padding: '16px 20px', marginBottom: '12px',
                                    }}>
                                        <div style={{
                                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                            letterSpacing: '0.1em', color: theme.text.label, marginBottom: '12px',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                        }}>
                                            <Calendar size={12} /> Leave Period
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>From</div>
                                                <div style={{ fontSize: '16px', fontWeight: 700, color: theme.text.primary }}>{format(start, 'MMM d, yyyy')}</div>
                                            </div>
                                            <ArrowRight size={18} style={{ color: theme.text.muted }} />
                                            <div>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>To</div>
                                                <div style={{ fontSize: '16px', fontWeight: 700, color: theme.text.primary }}>{format(end, 'MMM d, yyyy')}</div>
                                            </div>
                                            <div style={{
                                                marginLeft: 'auto', background: `${theme.accent.cyan}12`,
                                                border: `1px solid ${theme.accent.cyan}20`, borderRadius: theme.radius.md,
                                                padding: '8px 16px', textAlign: 'center',
                                            }}>
                                                <div style={{ fontSize: '22px', fontWeight: 800, color: theme.accent.cyan, lineHeight: 1 }}>{days}</div>
                                                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.muted, marginTop: '4px' }}>
                                                    Day{days > 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div style={{
                                        background: theme.bg.input, border: `1px solid ${theme.border.subtle}`,
                                        borderRadius: theme.radius.md, padding: '14px 18px',
                                    }}>
                                        <div style={{
                                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                            letterSpacing: '0.1em', color: theme.text.label, marginBottom: '8px',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                        }}>
                                            <UserCheck size={12} /> Reason
                                        </div>
                                        <p style={{ fontSize: theme.font.size.sm, color: theme.text.secondary, lineHeight: 1.6, margin: 0 }}>{leave.reason}</p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Policy Footer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: theme.radius.sm,
                            background: `${theme.accent.cyan}12`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: theme.accent.cyan,
                        }}>
                            <UserCheck size={18} />
                        </div>
                        <span style={{ fontSize: theme.font.size.md, fontWeight: 700, color: theme.text.primary }}>Attendance Policy</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {['Maintain 85% attendance for placement eligibility.',
                            'Inform your trainer 24 hours in advance.',
                            'Medical leaves require official documentation.',
                        ].map((rule, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{
                                    width: '22px', height: '22px', borderRadius: '6px',
                                    background: `${theme.accent.cyan}12`, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    fontSize: '10px', fontWeight: 700, color: theme.accent.cyan,
                                }}>{i + 1}</span>
                                <span style={{ fontSize: theme.font.size.sm, color: theme.text.secondary, lineHeight: 1.5 }}>{rule}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card style={{ background: `${theme.accent.yellow}08`, border: `1px solid ${theme.accent.yellow}15` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: theme.radius.sm,
                            background: `${theme.accent.yellow}15`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            color: theme.accent.yellow,
                        }}>
                            <AlertCircle size={18} />
                        </div>
                        <div>
                            <span style={{ fontSize: theme.font.size.md, fontWeight: 700, color: theme.text.primary, display: 'block', marginBottom: '8px' }}>Important Notice</span>
                            <p style={{ fontSize: theme.font.size.sm, color: theme.text.secondary, lineHeight: 1.6, margin: 0 }}>
                                Approved leaves still count toward your attendance calculation. Check your attendance record regularly and plan your leaves wisely to maintain eligibility.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export default StudentLeaves;