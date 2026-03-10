import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import theme from './theme';
import {
    PageHeader, StatCard, Card, FilterTabs, EmptyState,
    LoadingSpinner, ActionButton, StatusBadge, StripeBar,
    FormField, inputStyle,
} from './StudentComponents';
import {
    HelpCircle, AlertTriangle, Clock, CheckCircle,
    Plus, Send, MessageSquare, XCircle, X, Shield,
} from 'lucide-react';
import { format } from 'date-fns';

const ISSUE_TYPES = [
    { value: 'trainer_misconduct', label: 'Trainer Misconduct', icon: AlertTriangle, color: theme.accent.red },
    { value: 'payment_issue', label: 'Payment Issue', icon: Shield, color: theme.accent.yellow },
    { value: 'technical_issue', label: 'Technical Issue', icon: HelpCircle, color: theme.accent.cyan },
    { value: 'schedule_conflict', label: 'Schedule Conflict', icon: Clock, color: theme.accent.purple },
    { value: 'other', label: 'Other', icon: MessageSquare, color: theme.text.muted },
];

export const StudentHelpdesk = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ issue_type: '', description: '' });

    useEffect(() => { fetchIssues(); }, []);

    const fetchIssues = async () => {
        try { const res = await studentAPI.getIssues(); setIssues(res.data || []); }
        catch { } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.issue_type || !formData.description) return;
        setSubmitting(true);
        try {
            await studentAPI.raiseIssue(formData);
            setFormData({ issue_type: '', description: '' });
            setShowForm(false);
            fetchIssues();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || err.message));
        } finally { setSubmitting(false); }
    };

    const stats = {
        total: issues.length,
        open: issues.filter(i => i.status === 'open').length,
        in_progress: issues.filter(i => i.status === 'in_progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
    };

    const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter);

    const getIssueConfig = (type) => ISSUE_TYPES.find(t => t.value === type) || ISSUE_TYPES[4];
    const getStatusColor = (s) => s === 'resolved' ? theme.accent.green : s === 'in_progress' ? theme.accent.blue : theme.accent.yellow;

    if (loading) return <LoadingSpinner label="Loading issues..." />;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Help & Support"
                subtitle="Report issues and track resolutions"
                icon={<HelpCircle size={24} />}
                accentColor={theme.accent.purple}
                action={
                    <ActionButton onClick={() => setShowForm(!showForm)}
                        variant={showForm ? 'secondary' : 'primary'}
                        icon={showForm ? <X size={16} /> : <Plus size={16} />}>
                        {showForm ? 'Cancel' : 'Report Issue'}
                    </ActionButton>
                }
            />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <StatCard icon={<HelpCircle size={22} />} label="Total Issues" value={stats.total} accentColor={theme.accent.purple} />
                <StatCard icon={<AlertTriangle size={22} />} label="Open" value={stats.open} accentColor={theme.accent.yellow} />
                <StatCard icon={<Clock size={22} />} label="In Progress" value={stats.in_progress} accentColor={theme.accent.blue} />
                <StatCard icon={<CheckCircle size={22} />} label="Resolved" value={stats.resolved} accentColor={theme.accent.green} />
            </div>

            {/* Report Form */}
            {showForm && (
                <Card style={{ marginBottom: '24px', padding: 0, border: `1px solid ${theme.accent.purple}30` }}>
                    <div style={{
                        padding: '16px 20px', borderBottom: `1px solid ${theme.accent.purple}15`,
                        background: `${theme.accent.purple}08`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '34px', height: '34px', borderRadius: theme.radius.sm,
                                background: theme.accent.purple, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <AlertTriangle size={16} color="#fff" />
                            </div>
                            <span style={{ fontSize: theme.font.size.base, fontWeight: 700, color: theme.text.primary }}>Report New Issue</span>
                        </div>
                        <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: theme.text.muted, cursor: 'pointer', padding: '6px' }}>
                            <X size={18} />
                        </button>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <FormField label="Issue Category" required>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                                {ISSUE_TYPES.map(type => {
                                    const Icon = type.icon;
                                    const isSelected = formData.issue_type === type.value;
                                    return (
                                        <button key={type.value} onClick={() => setFormData({ ...formData, issue_type: type.value })}
                                            style={{
                                                padding: '14px', borderRadius: theme.radius.md, cursor: 'pointer',
                                                border: `1px solid ${isSelected ? type.color : theme.border.subtle}`,
                                                background: isSelected ? `${type.color}12` : theme.bg.input,
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                color: isSelected ? type.color : theme.text.secondary,
                                                transition: 'all 0.2s', textAlign: 'left',
                                            }}
                                        >
                                            <Icon size={16} />
                                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{type.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </FormField>
                        <FormField label="Describe the issue in detail" required>
                            <textarea rows="5" required
                                placeholder="Please describe the issue. Include dates, names, and any relevant details. This information will be handled confidentially."
                                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </FormField>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontSize: '11px', color: theme.accent.green, fontWeight: 600,
                            }}>
                                <Shield size={14} /> All reports are confidential
                            </div>
                            <ActionButton onClick={handleSubmit} disabled={submitting || !formData.issue_type || !formData.description}
                                icon={<Send size={14} />}>
                                {submitting ? 'Submitting...' : 'Submit Issue'}
                            </ActionButton>
                        </div>
                    </div>
                </Card>
            )}

            {/* Filter + List */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: theme.font.size.base, fontWeight: 700, color: theme.text.primary }}>My Issues</span>
                <FilterTabs
                    filters={[
                        { key: 'all', label: 'All' },
                        { key: 'open', label: 'Open' },
                        { key: 'in_progress', label: 'In Progress' },
                        { key: 'resolved', label: 'Resolved' },
                    ]}
                    active={filter} onChange={setFilter} accentColor={theme.accent.purple}
                />
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={<CheckCircle size={32} />}
                    title={filter === 'all' ? 'No issues reported' : `No ${filter.replace('_', ' ')} issues`}
                    message={filter === 'all' ? "All clear! Submit a report if you face any problems." : 'Try selecting a different filter.'}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map(issue => {
                        const cfg = getIssueConfig(issue.issue_type);
                        const Icon = cfg.icon;
                        const statusColor = getStatusColor(issue.status);

                        return (
                            <Card key={issue.id} noPadding hoverable>
                                <StripeBar color={statusColor} />
                                <div style={{ padding: '18px 20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '38px', height: '38px', borderRadius: theme.radius.sm,
                                                background: `${cfg.color}15`, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', color: cfg.color,
                                            }}>
                                                <Icon size={18} />
                                            </div>
                                            <div>
                                                <span style={{
                                                    display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
                                                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                    letterSpacing: '0.08em', background: `${cfg.color}12`, color: cfg.color,
                                                }}>
                                                    {cfg.label}
                                                </span>
                                                <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '4px' }}>
                                                    {format(new Date(issue.created_at), 'MMM d, yyyy · h:mm a')}
                                                </div>
                                            </div>
                                        </div>
                                        <StatusBadge status={issue.status} />
                                    </div>

                                    <div style={{
                                        background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border.subtle}`,
                                        borderRadius: theme.radius.md, padding: '14px 16px', marginBottom: '10px',
                                    }}>
                                        <p style={{ fontSize: '13px', color: theme.text.secondary, lineHeight: 1.7, margin: 0 }}>{issue.description}</p>
                                    </div>

                                    {issue.admin_response && (
                                        <div style={{
                                            background: `${theme.accent.green}08`, border: `1px solid ${theme.accent.green}20`,
                                            borderRadius: theme.radius.md, padding: '14px 16px',
                                        }}>
                                            <div style={{
                                                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                letterSpacing: '0.08em', color: theme.accent.green, marginBottom: '6px',
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                            }}>
                                                <MessageSquare size={12} /> Admin Response
                                            </div>
                                            <p style={{ fontSize: '13px', color: '#86efac', lineHeight: 1.6, margin: 0 }}>{issue.admin_response}</p>
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

export default StudentHelpdesk;