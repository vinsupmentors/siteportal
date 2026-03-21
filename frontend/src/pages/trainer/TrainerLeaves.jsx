import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, StatCard, Card, FilterTabs, EmptyState,
    LoadingSpinner, ActionButton, StatusBadge, FormField,
    inputStyle, theme, SectionTitle
} from './TrainerComponents';
import {
    Calendar, CheckCircle, XCircle, Clock,
    Plus, Send, AlertCircle, X,
    Briefcase, Bookmark, Users, ChevronDown, ChevronUp
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

// ─── My Leaves tab ───────────────────────────────────────────────────────────
const MyLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ start_date: '', end_date: '', reason: '', leave_type: 'casual', session: 'full_day' });
    const [filter, setFilter] = useState('all');

    const fetchLeaves = async () => {
        try {
            const res = await trainerAPI.getMyLeaves();
            setLeaves(res.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.start_date || !formData.end_date || !formData.reason) {
            alert('Please fill in all required fields');
            return;
        }
        setSubmitting(true);
        try {
            await trainerAPI.requestLeave(formData);
            setFormData({ start_date: '', end_date: '', reason: '', leave_type: 'casual', session: 'full_day' });
            setShowForm(false);
            fetchLeaves();
            alert('Leave request submitted successfully!');
        } catch (err) { alert("Failed: " + (err.response?.data?.message || err.message)); }
        finally { setSubmitting(false); }
    };

    const stats = {
        total: leaves.length,
        approved: leaves.filter(l => l.status === 'approved').length,
        pending: leaves.filter(l => l.status === 'pending').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };
    const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

    if (loading) return <LoadingSpinner label="Loading your leaves..." />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <ActionButton onClick={() => setShowForm(!showForm)} icon={showForm ? <X size={16} /> : <Plus size={16} />} variant={showForm ? 'secondary' : 'primary'}>
                    {showForm ? 'Cancel' : 'New Leave Request'}
                </ActionButton>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatCard label="Total Requests" value={stats.total} icon={<Bookmark size={20} />} accentColor={theme.accent.purple} />
                <StatCard label="Pending" value={stats.pending} icon={<Clock size={20} />} accentColor={theme.accent.yellow} />
                <StatCard label="Approved" value={stats.approved} icon={<CheckCircle size={20} />} accentColor={theme.accent.green} />
                <StatCard label="Rejected" value={stats.rejected} icon={<XCircle size={20} />} accentColor={theme.accent.red} />
            </div>

            {showForm && (
                <Card style={{ marginBottom: '24px', border: `1px solid ${theme.accent.purple}30` }}>
                    <SectionTitle>Apply for Leave</SectionTitle>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <FormField label="Leave Type">
                                <select style={inputStyle} value={formData.leave_type} onChange={e => setFormData({ ...formData, leave_type: e.target.value })}>
                                    <option value="casual">Casual Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="emergency">Emergency</option>
                                </select>
                            </FormField>
                            <FormField label="Duration">
                                <select style={inputStyle} value={formData.session} onChange={e => setFormData({ ...formData, session: e.target.value })}>
                                    <option value="full_day">Full Day</option>
                                    <option value="morning">Morning Half-Day</option>
                                    <option value="evening">Evening Half-Day</option>
                                </select>
                            </FormField>
                            <FormField label="Start Date">
                                <input type="date" style={inputStyle} value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
                            </FormField>
                            <FormField label="End Date">
                                <input type="date" style={inputStyle} value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} required />
                            </FormField>
                        </div>
                        <FormField label="Reason & Details">
                            <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Please provide a clear reason for your leave request..." value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} required />
                        </FormField>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <ActionButton onClick={handleSubmit} disabled={submitting} icon={<Send size={16} />} variant="primary">
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </ActionButton>
                        </div>
                    </form>
                </Card>
            )}

            <div style={{ marginBottom: '16px' }}>
                <SectionTitle actions={<FilterTabs tabs={['all', 'pending', 'approved', 'rejected']} active={filter} onChange={setFilter} />}>
                    Leave History
                </SectionTitle>
            </div>

            {filtered.length === 0 ? (
                <Card><EmptyState icon={<Calendar size={32} />} title="No leave requests found" subtitle={filter === 'all' ? "You haven't submitted any leave requests yet." : `No ${filter} requests to display.`} /></Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filtered.map(leave => {
                        const start = new Date(leave.start_date);
                        const end = new Date(leave.end_date);
                        const days = differenceInDays(end, start) + 1;
                        return (
                            <Card key={leave.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: theme.radius.md, background: `${theme.accent.purple}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent.purple }}>
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                                    {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)} Leave
                                                    {leave.session !== 'full_day' && ` (${leave.session === 'morning' ? 'Morning Half-Day' : 'Evening Half-Day'})`}
                                                </h4>
                                                <StatusBadge status={leave.status} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: theme.text.muted }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} /> {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}
                                                </div>
                                                <div style={{ fontWeight: 600, color: theme.accent.purple }}>
                                                    {leave.session === 'full_day' ? `${days} ${days === 1 ? 'Day' : 'Days'}` : '0.5 Day'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: theme.text.muted }}>
                                        Applied {format(new Date(leave.created_at), 'MMM d, yyyy')}
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: theme.radius.md, border: `1px solid ${theme.border.subtle}` }}>
                                    <p style={{ margin: 0, fontSize: '13px', color: theme.text.secondary, lineHeight: 1.5 }}>
                                        <strong>Reason:</strong> {leave.reason}
                                    </p>
                                    {leave.status === 'rejected' && leave.rejection_reason && (
                                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: theme.accent.red, fontWeight: 500 }}>
                                            <strong>Rejection Reason:</strong> {leave.rejection_reason}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Student Leaves tab ───────────────────────────────────────────────────────
const StudentLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    // { [leaveId]: { open: bool, note: string, submitting: bool } }
    const [actionPanels, setActionPanels] = useState({});

    const fetchLeaves = async () => {
        try {
            const res = await trainerAPI.getStudentLeaves();
            setLeaves(res.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const togglePanel = (id) => {
        setActionPanels(prev => ({
            ...prev,
            [id]: { open: !prev[id]?.open, note: prev[id]?.note || '', submitting: false },
        }));
    };

    const handleAction = async (leaveId, status) => {
        const panel = actionPanels[leaveId] || {};
        setActionPanels(prev => ({ ...prev, [leaveId]: { ...prev[leaveId], submitting: true } }));
        try {
            await trainerAPI.updateStudentLeaveStatus(leaveId, { status, trainer_note: panel.note || '' });
            // Update locally
            setLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status, trainer_note: panel.note || null } : l));
            setActionPanels(prev => ({ ...prev, [leaveId]: { open: false, note: '', submitting: false } }));
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating leave');
            setActionPanels(prev => ({ ...prev, [leaveId]: { ...prev[leaveId], submitting: false } }));
        }
    };

    const stats = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };
    const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

    if (loading) return <LoadingSpinner label="Loading student leaves..." />;

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatCard label="Total Requests" value={stats.total} icon={<Users size={20} />} accentColor={theme.accent.blue} />
                <StatCard label="Pending Review" value={stats.pending} icon={<Clock size={20} />} accentColor={theme.accent.yellow} />
                <StatCard label="Approved" value={stats.approved} icon={<CheckCircle size={20} />} accentColor={theme.accent.green} />
                <StatCard label="Rejected" value={stats.rejected} icon={<XCircle size={20} />} accentColor={theme.accent.red} />
            </div>

            <div style={{ marginBottom: '16px' }}>
                <SectionTitle actions={<FilterTabs tabs={['all', 'pending', 'approved', 'rejected']} active={filter} onChange={setFilter} />}>
                    Student Leave Requests
                </SectionTitle>
            </div>

            {filtered.length === 0 ? (
                <Card><EmptyState icon={<Users size={32} />} title="No leave requests" subtitle={filter === 'all' ? 'No students have applied for leave yet.' : `No ${filter} student leave requests.`} /></Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filtered.map(leave => {
                        const start = new Date(leave.start_date);
                        const end = new Date(leave.end_date);
                        const days = differenceInDays(end, start) + 1;
                        const panel = actionPanels[leave.id] || {};
                        const isPending = leave.status === 'pending';

                        const statusColor = leave.status === 'approved' ? theme.accent.green
                            : leave.status === 'rejected' ? theme.accent.red
                            : theme.accent.yellow;

                        return (
                            <Card key={leave.id} style={{ borderLeft: `3px solid ${statusColor}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                    {/* Student info */}
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                                            background: `${theme.accent.blue}18`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '13px', fontWeight: 800, color: theme.accent.blue,
                                        }}>
                                            {leave.student_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: theme.text.primary }}>{leave.student_name}</span>
                                                <StatusBadge status={leave.status} />
                                            </div>
                                            <div style={{ fontSize: '11px', color: theme.text.muted }}>{leave.batch_name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '12px', color: theme.text.secondary }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={11} /> {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}
                                                </span>
                                                <span style={{ fontWeight: 700, color: statusColor }}>
                                                    {days} {days === 1 ? 'day' : 'days'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: date + action toggle */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                        <span style={{ fontSize: '11px', color: theme.text.muted }}>
                                            Applied {format(new Date(leave.created_at), 'MMM d, yyyy')}
                                        </span>
                                        {isPending && (
                                            <button
                                                onClick={() => togglePanel(leave.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '5px',
                                                    padding: '6px 12px', fontSize: '11px', fontWeight: 700,
                                                    borderRadius: theme.radius.md, cursor: 'pointer',
                                                    border: `1.5px solid ${theme.accent.blue}40`,
                                                    background: panel.open ? `${theme.accent.blue}15` : `${theme.accent.blue}08`,
                                                    color: theme.accent.blue, transition: 'all 0.15s',
                                                }}
                                            >
                                                Review {panel.open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Reason */}
                                <div style={{ marginTop: '12px', padding: '10px 14px', background: `${theme.bg.card}`, borderRadius: theme.radius.md, border: `1px solid ${theme.border.subtle}` }}>
                                    <p style={{ margin: 0, fontSize: '13px', color: theme.text.secondary, lineHeight: 1.6 }}>
                                        <strong>Reason:</strong> {leave.reason}
                                    </p>
                                    {leave.trainer_note && (
                                        <p style={{ margin: '6px 0 0', fontSize: '12px', color: leave.status === 'rejected' ? theme.accent.red : theme.accent.green }}>
                                            <strong>Your Note:</strong> {leave.trainer_note}
                                        </p>
                                    )}
                                </div>

                                {/* Action panel (only for pending) */}
                                {isPending && panel.open && (
                                    <div style={{
                                        marginTop: '14px', padding: '14px 16px',
                                        background: `${theme.accent.blue}06`,
                                        border: `1px solid ${theme.accent.blue}20`,
                                        borderRadius: theme.radius.md,
                                        animation: 'slideDown 0.18s ease-out',
                                    }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: theme.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                                            Note to student (optional)
                                        </label>
                                        <textarea
                                            style={{ ...inputStyle, minHeight: '64px', resize: 'vertical', width: '100%', boxSizing: 'border-box', marginBottom: '12px' }}
                                            placeholder="Add a reason or note for the student..."
                                            value={panel.note || ''}
                                            onChange={e => setActionPanels(prev => ({ ...prev, [leave.id]: { ...prev[leave.id], note: e.target.value } }))}
                                        />
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleAction(leave.id, 'rejected')}
                                                disabled={panel.submitting}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '8px 18px', fontSize: '12px', fontWeight: 700,
                                                    borderRadius: theme.radius.md, cursor: panel.submitting ? 'not-allowed' : 'pointer',
                                                    border: `1.5px solid ${theme.accent.red}50`,
                                                    background: `${theme.accent.red}10`, color: theme.accent.red,
                                                    opacity: panel.submitting ? 0.6 : 1,
                                                }}
                                            >
                                                <XCircle size={13} /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleAction(leave.id, 'approved')}
                                                disabled={panel.submitting}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '8px 18px', fontSize: '12px', fontWeight: 700,
                                                    borderRadius: theme.radius.md, cursor: panel.submitting ? 'not-allowed' : 'pointer',
                                                    border: 'none',
                                                    background: theme.accent.green, color: '#fff',
                                                    opacity: panel.submitting ? 0.6 : 1,
                                                }}
                                            >
                                                <CheckCircle size={13} /> {panel.submitting ? 'Saving...' : 'Approve'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Main page with two tabs ──────────────────────────────────────────────────
export const TrainerLeaves = () => {
    const [activeTab, setActiveTab] = useState('my');

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out', paddingBottom: '40px' }}>
            <PageHeader
                title="Leave Requests"
                subtitle="Manage your leaves and review student leave applications"
                icon={<Calendar size={24} />}
                accentColor={theme.accent.purple}
            />

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: theme.bg.card, border: `1px solid ${theme.border.subtle}`, borderRadius: theme.radius.lg, padding: '5px', width: 'fit-content' }}>
                {[{ key: 'my', label: 'My Leaves', icon: <Briefcase size={14} /> }, { key: 'students', label: 'Student Leaves', icon: <Users size={14} /> }].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '7px',
                            padding: '9px 22px', fontSize: '13px', fontWeight: 700,
                            borderRadius: theme.radius.md, border: 'none', cursor: 'pointer', transition: 'all 0.18s',
                            background: activeTab === tab.key ? theme.accent.purple : 'transparent',
                            color: activeTab === tab.key ? '#fff' : theme.text.muted,
                        }}
                    >
                        {tab.icon}{tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'my' ? <MyLeaves /> : <StudentLeaves />}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
            `}</style>
        </div>
    );
};

export default TrainerLeaves;
