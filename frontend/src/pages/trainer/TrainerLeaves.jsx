import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, StatCard, Card, FilterTabs, EmptyState,
    LoadingSpinner, ActionButton, StatusBadge, FormField,
    inputStyle, theme, SectionTitle
} from './TrainerComponents';
import {
    Calendar, CheckCircle, XCircle, Clock,
    Plus, Send, UserCheck, AlertCircle, ArrowRight, X,
    Briefcase, Bookmark
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export const TrainerLeaves = () => {
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
        } catch (err) {
            console.error('Error fetching leaves:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

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
        } catch (err) {
            alert("Failed: " + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const leaveStats = {
        total: leaves.length,
        approved: leaves.filter(l => l.status === 'approved').length,
        pending: leaves.filter(l => l.status === 'pending').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };

    const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

    if (loading) return <LoadingSpinner label="Loading your leaves..." />;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out', paddingBottom: '40px' }}>
            <PageHeader
                title="Leave Requests"
                subtitle="Apply for leave and track approval status"
                icon={<Calendar size={24} />}
                accentColor={theme.accent.purple}
                actions={
                    <ActionButton onClick={() => setShowForm(!showForm)} icon={showForm ? <X size={16} /> : <Plus size={16} />} variant={showForm ? 'secondary' : 'primary'}>
                        {showForm ? 'Cancel' : 'New Leave Request'}
                    </ActionButton>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatCard label="Total Requests" value={leaveStats.total} icon={<Bookmark size={20} />} accentColor={theme.accent.purple} />
                <StatCard label="Pending Approval" value={leaveStats.pending} icon={<Clock size={20} />} accentColor={theme.accent.yellow} />
                <StatCard label="Approved Leaves" value={leaveStats.approved} icon={<CheckCircle size={20} />} accentColor={theme.accent.green} />
                <StatCard label="Rejected" value={leaveStats.rejected} icon={<XCircle size={20} />} accentColor={theme.accent.red} />
            </div>

            {showForm && (
                <Card style={{ marginBottom: '24px', border: `1px solid ${theme.accent.purple}30` }}>
                    <SectionTitle>Apply for Leave</SectionTitle>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <FormField label="Leave Type">
                                <select
                                    style={inputStyle}
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                >
                                    <option value="casual">Casual Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="emergency">Emergency</option>
                                </select>
                            </FormField>
                            <FormField label="Duration">
                                <select
                                    style={inputStyle}
                                    value={formData.session}
                                    onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                                >
                                    <option value="full_day">Full Day</option>
                                    <option value="morning">Morning Half-Day</option>
                                    <option value="evening">Evening Half-Day</option>
                                </select>
                            </FormField>
                            <FormField label="Start Date">
                                <input
                                    type="date"
                                    style={inputStyle}
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </FormField>
                            <FormField label="End Date">
                                <input
                                    type="date"
                                    style={inputStyle}
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    required
                                />
                            </FormField>
                        </div>
                        <FormField label="Reason & Details">
                            <textarea
                                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                                placeholder="Please provide a clear reason for your leave request..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                required
                            />
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
                <SectionTitle
                    actions={
                        <FilterTabs
                            tabs={['all', 'pending', 'approved', 'rejected']}
                            active={filter}
                            onChange={setFilter}
                        />
                    }
                >
                    Leave History
                </SectionTitle>
            </div>

            {filtered.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<Calendar size={32} />}
                        title="No leave requests found"
                        subtitle={filter === 'all' ? "You haven't submitted any leave requests yet." : `No ${filter} requests to display.`}
                    />
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filtered.map(leave => {
                        const start = new Date(leave.start_date);
                        const end = new Date(leave.end_date);
                        const days = differenceInDays(end, start) + 1;

                        return (
                            <Card key={leave.id} style={{ transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: theme.radius.md,
                                            background: `${theme.accent.purple}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent.purple
                                        }}>
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
                                                    <Calendar size={12} /> {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
                                                </div>
                                                <div style={{ fontWeight: 600, color: theme.accent.purple }}>
                                                    {leave.session === 'full_day' ? `${days} ${days === 1 ? 'Day' : 'Days'}` : '0.5 Day'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: theme.text.muted }}>
                                        Applied on {format(new Date(leave.created_at), 'MMM d, yyyy')}
                                    </div>
                                </div>
                                <div style={{
                                    marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)',
                                    borderRadius: theme.radius.md, border: `1px solid ${theme.border.subtle}`
                                }}>
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

            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export default TrainerLeaves;
