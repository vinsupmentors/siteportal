import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import theme from './theme';
import {
    PageHeader, StatCard, Card, FilterTabs, EmptyState,
    LoadingSpinner, ActionButton, StatusBadge, StripeBar,
    FormField, inputStyle,
} from './StudentComponents';
import {
    MessageSquare, Clock, CheckCircle, Plus, XCircle,
    Send, HelpCircle, User, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';

export const StudentDoubts = () => {
    const [doubts, setDoubts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [batchId, setBatchId] = useState('');
    const [batchName, setBatchName] = useState('');
    const [queryText, setQueryText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('all');
    const [expanded, setExpanded] = useState({});

    useEffect(() => { fetchDoubts(); fetchBatch(); }, []);

    const fetchBatch = async () => {
        try {
            const res = await studentAPI.getDashboardStats();
            if (res.data.activeBatch) {
                setBatchId(res.data.activeBatch.id);
                setBatchName(res.data.activeBatch.batch_name);
            }
        } catch { }
    };

    const fetchDoubts = async () => {
        try { const res = await studentAPI.getDoubts(); setDoubts(res.data || []); }
        catch { } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!batchId || !queryText) return;
        setSubmitting(true);
        try {
            await studentAPI.raiseDoubt({ batch_id: batchId, query_text: queryText });
            setQueryText(''); setShowForm(false); fetchDoubts();
        } catch (err) {
            alert('Error submitting doubt: ' + (err.response?.data?.message || err.message));
        } finally { setSubmitting(false); }
    };

    const pending = doubts.filter(d => d.status !== 'resolved').length;
    const resolved = doubts.filter(d => d.status === 'resolved').length;
    const filtered = filter === 'all' ? doubts
        : filter === 'resolved' ? doubts.filter(d => d.status === 'resolved')
            : doubts.filter(d => d.status !== 'resolved');

    if (loading) return <LoadingSpinner label="Loading queries..." />;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Queries & Doubts"
                subtitle="Get answers from your trainer"
                icon={<HelpCircle size={24} />}
                accentColor={theme.accent.blue}
                action={
                    <ActionButton
                        onClick={() => setShowForm(!showForm)}
                        variant={showForm ? 'secondary' : 'primary'}
                        icon={showForm ? <XCircle size={16} /> : <Plus size={16} />}
                    >
                        {showForm ? 'Cancel' : 'Ask a Doubt'}
                    </ActionButton>
                }
            />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                <StatCard icon={<HelpCircle size={22} />} label="Total Queries" value={doubts.length} accentColor={theme.accent.cyan} />
                <StatCard icon={<Clock size={22} />} label="Pending" value={pending} accentColor={theme.accent.yellow} />
                <StatCard icon={<CheckCircle size={22} />} label="Resolved" value={resolved} accentColor={theme.accent.green} />
            </div>

            {/* Ask Form */}
            {showForm && (
                <Card style={{ marginBottom: '24px', padding: 0, border: `1px solid ${theme.accent.blue}30` }}>
                    <div style={{
                        padding: '16px 20px', borderBottom: `1px solid ${theme.accent.blue}15`,
                        background: `${theme.accent.blue}08`,
                        display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: theme.radius.sm,
                            background: theme.accent.blue, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <HelpCircle size={16} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize: theme.font.size.base, fontWeight: 700, color: theme.text.primary }}>New Doubt</div>
                            <div style={{ fontSize: '12px', color: theme.text.muted, marginTop: '2px' }}>{batchName || 'Loading batch...'}</div>
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <FormField label="Describe your doubt in detail">
                            <textarea value={queryText} onChange={(e) => setQueryText(e.target.value)}
                                rows="5" placeholder="What topic are you stuck on? What have you already tried?..."
                                required style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                            />
                        </FormField>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                            <ActionButton variant="secondary" onClick={() => { setShowForm(false); setQueryText(''); }}
                                style={{ flex: 1, justifyContent: 'center' }}>Cancel</ActionButton>
                            <ActionButton onClick={handleSubmit} disabled={submitting || !batchId}
                                icon={<Send size={14} />} style={{ flex: 1, justifyContent: 'center' }}>
                                {submitting ? 'Posting...' : 'Submit Query'}
                            </ActionButton>
                        </div>
                    </div>
                </Card>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: theme.font.size.base, fontWeight: 700, color: theme.text.primary }}>My Queries</span>
                <FilterTabs
                    filters={[
                        { key: 'all', label: 'All' },
                        { key: 'pending', label: pending > 0 ? `Pending · ${pending}` : 'Pending' },
                        { key: 'resolved', label: 'Resolved' },
                    ]}
                    active={filter} onChange={setFilter}
                />
            </div>

            {/* Doubt List */}
            {filtered.length === 0 ? (
                <EmptyState
                    icon={<HelpCircle size={32} />}
                    title="No queries yet!"
                    message={filter === 'all' ? "Stuck on something? Click 'Ask a Doubt' to post your first question." : `No ${filter} queries found.`}
                    action={filter === 'all' && (
                        <ActionButton onClick={() => setShowForm(true)} icon={<Plus size={14} />}>Ask First Doubt</ActionButton>
                    )}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map((doubt, idx) => {
                        const isResolved = doubt.status === 'resolved';
                        const isExpanded = expanded[doubt.id] !== false;
                        const statusColor = isResolved ? theme.accent.green : theme.accent.yellow;

                        return (
                            <Card key={doubt.id} noPadding hoverable>
                                <StripeBar color={statusColor} />
                                <div style={{ padding: '18px 20px' }}>
                                    {/* Top Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: isExpanded ? '14px' : 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: theme.radius.sm,
                                                background: `${statusColor}15`, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', color: statusColor, flexShrink: 0,
                                            }}>
                                                {isResolved ? <CheckCircle size={18} /> : <Clock size={18} />}
                                            </div>
                                            <div>
                                                <StatusBadge status={isResolved ? 'resolved' : 'pending'}
                                                    config={{ color: statusColor, label: isResolved ? '✓ Resolved' : 'Awaiting Response' }}
                                                />
                                                <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '4px' }}>
                                                    {format(new Date(doubt.created_at), 'MMM d, yyyy · h:mm a')}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                padding: '3px 8px', background: 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${theme.border.subtle}`, borderRadius: '6px',
                                                fontSize: '11px', fontWeight: 700, color: theme.text.muted,
                                            }}>#{String(filtered.length - idx).padStart(2, '0')}</span>
                                            <button onClick={() => setExpanded(p => ({ ...p, [doubt.id]: !isExpanded }))}
                                                style={{
                                                    padding: '5px', background: 'rgba(255,255,255,0.04)',
                                                    border: `1px solid ${theme.border.subtle}`, borderRadius: '6px',
                                                    color: theme.text.muted, cursor: 'pointer', display: 'flex',
                                                }}>
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <>
                                            {/* Question */}
                                            <div style={{
                                                background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border.subtle}`,
                                                borderRadius: theme.radius.md, padding: '14px 16px', marginBottom: '10px',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <div style={{
                                                        width: '22px', height: '22px', background: `${theme.accent.purple}25`,
                                                        borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <User size={12} color={theme.accent.purple} />
                                                    </div>
                                                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.text.muted }}>Your Question</span>
                                                </div>
                                                <p style={{ fontSize: '13px', color: theme.text.secondary, lineHeight: 1.6, margin: 0 }}>{doubt.query_text}</p>
                                            </div>

                                            {/* Response or Waiting */}
                                            {doubt.response_text ? (
                                                <div style={{
                                                    background: `${theme.accent.blue}08`, border: `1px solid ${theme.accent.blue}20`,
                                                    borderRadius: theme.radius.md, padding: '14px 16px', marginBottom: '10px',
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{
                                                                width: '22px', height: '22px', background: `${theme.accent.blue}30`,
                                                                borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            }}>
                                                                <MessageSquare size={12} color={theme.accent.blue} />
                                                            </div>
                                                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.accent.blue }}>
                                                                {doubt.trainer_name || 'Trainer'}'s Response
                                                            </span>
                                                        </div>
                                                        {doubt.resolved_at && (
                                                            <span style={{ fontSize: '10px', color: theme.text.muted }}>{format(new Date(doubt.resolved_at), 'MMM d, yyyy')}</span>
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: '13px', color: '#93c5fd', lineHeight: 1.6, margin: 0 }}>{doubt.response_text}</p>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    background: `${theme.accent.yellow}08`, border: `1px solid ${theme.accent.yellow}15`,
                                                    borderRadius: theme.radius.md, padding: '12px 16px',
                                                    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px',
                                                }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', background: `${theme.accent.yellow}15`,
                                                        borderRadius: theme.radius.sm, display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                    }}>
                                                        <Clock size={15} color={theme.accent.yellow} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: 700, color: theme.accent.yellow }}>Waiting for trainer response</div>
                                                        <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '2px' }}>Typically replied within 24 hours</div>
                                                    </div>
                                                </div>
                                            )}

                                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: theme.text.muted, textTransform: 'uppercase' }}>
                                                Batch · <span style={{ fontWeight: 500, textTransform: 'none' }}>{doubt.batch_name}</span>
                                            </span>
                                        </>
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