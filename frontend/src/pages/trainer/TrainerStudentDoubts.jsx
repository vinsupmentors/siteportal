import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, Card, StatCard, FilterTabs, ActionButton, StatusBadge, EmptyState, LoadingSpinner, FormField, inputStyle, theme,
} from './TrainerComponents';
import { MessageSquare, Clock, CheckCircle, Send, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrainerStudentDoubts = () => {
    const [doubts, setDoubts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [batchFilter, setBatchFilter] = useState('');
    const [batches, setBatches] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expanded, setExpanded] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [resolving, setResolving] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const calRes = await trainerAPI.getMyCalendar();
                setBatches(calRes.data.batches || []);
            } catch (err) { console.error(err); }
        })();
    }, []);

    const fetchDoubts = async () => {
        setLoading(true);
        try {
            const res = await trainerAPI.getStudentDoubts({
                batch_id: batchFilter,
                status: statusFilter === 'all' ? '' : statusFilter,
                page,
                limit: 10
            });
            setDoubts(res.data.doubts || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchDoubts(); }, [batchFilter, statusFilter, page]);

    const handleResolve = async (id) => {
        if (!responseText.trim()) return;
        setResolving(true);
        try {
            await trainerAPI.resolveDoubt(id, { response_text: responseText });
            setDoubts(prev => prev.map(d => d.id === id ? { ...d, status: 'resolved', response_text: responseText } : d));
            setExpanded(null);
            setResponseText('');
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setResolving(false); }
    };

    if (loading && page === 1) return <LoadingSpinner label="Loading doubts..." />;

    const tabs = [
        { value: 'all', label: `All` },
        { value: 'pending', label: `Pending` },
        { value: 'resolved', label: `Resolved` },
    ];

    const getTimeSince = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const hrs = Math.floor(diff / 3600000);
        if (hrs < 1) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const filteredDoubts = doubts.filter(d => !search || d.query_text.toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader title="Student Doubts" subtitle="Resolve technical questions batch-wise" icon={<MessageSquare size={24} />} accentColor={theme.accent.cyan} />

            <Card noPadding>
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <FilterTabs tabs={tabs} active={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
                        <select
                            style={{ ...inputStyle, width: '180px', padding: '6px 10px' }}
                            value={batchFilter}
                            onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">All Batches</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: theme.radius.md, padding: '0 12px' }}>
                        <MessageSquare size={14} color={theme.text.muted} />
                        <input type="text" placeholder="Search queries..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: theme.text.primary, fontSize: '12px', fontWeight: 500, outline: 'none', padding: '8px 0', width: '160px' }} />
                    </div>
                </div>

                {filteredDoubts.length === 0 ? (
                    <EmptyState icon={<MessageSquare size={24} />} title="No doubts found" subtitle="Try a different filter or batch." />
                ) : (
                    <div>
                        {filteredDoubts.map(doubt => {
                            const isExpanded = expanded === doubt.id;
                            return (
                                <div key={doubt.id} style={{ borderBottom: `1px solid ${theme.border.subtle}` }}>
                                    <div style={{
                                        padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                        cursor: 'pointer', transition: 'background 0.15s',
                                    }}
                                        onClick={() => { setExpanded(isExpanded ? null : doubt.id); setResponseText(''); }}
                                        onMouseEnter={e => e.currentTarget.style.background = theme.bg.cardHover}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${theme.accent.purple}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <User size={12} color={theme.accent.purple} />
                                                </div>
                                                <Link to={`/trainer/student-profile/${doubt.batch_id}/${doubt.student_id}`} style={{ textDecoration: 'none' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary }} onMouseEnter={e => e.currentTarget.style.color = theme.accent.blue} onMouseLeave={e => e.currentTarget.style.color = theme.text.primary}>{doubt.student_name}</span>
                                                </Link>
                                                <span style={{ fontSize: '10px', color: theme.text.muted }}>·</span>
                                                <span style={{ fontSize: '10px', color: theme.text.label }}>{doubt.batch_name} ({doubt.batch_timing})</span>
                                                <span style={{ fontSize: '10px', color: theme.text.muted }}>·</span>
                                                <span style={{ fontSize: '10px', color: theme.text.muted }}>{getTimeSince(doubt.created_at)}</span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: theme.text.secondary, margin: 0, lineHeight: 1.5 }}>{doubt.query_text}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '16px' }}>
                                            <StatusBadge status={doubt.status} />
                                            {isExpanded ? <ChevronUp size={14} color={theme.text.muted} /> : <ChevronDown size={14} color={theme.text.muted} />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ padding: '0 24px 16px', background: 'rgba(255,255,255,0.01)' }}>
                                            {doubt.status === 'resolved' && doubt.response_text ? (
                                                <div style={{
                                                    padding: '12px 16px', borderRadius: theme.radius.sm,
                                                    background: `${theme.accent.green}08`, border: `1px solid ${theme.accent.green}20`,
                                                }}>
                                                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.accent.green, marginBottom: '6px', display: 'block' }}>Your Response</span>
                                                    <p style={{ fontSize: '13px', color: theme.text.primary, margin: 0, lineHeight: 1.5 }}>{doubt.response_text}</p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <textarea rows={2} style={{ ...inputStyle, resize: 'vertical', flex: 1 }} placeholder="Type your response..."
                                                        value={responseText} onChange={e => setResponseText(e.target.value)} onClick={e => e.stopPropagation()} />
                                                    <ActionButton onClick={() => handleResolve(doubt.id)} disabled={resolving || !responseText.trim()} variant="success" icon={<Send size={14} />}
                                                        style={{ alignSelf: 'flex-end' }}>
                                                        {resolving ? '...' : 'Resolve'}
                                                    </ActionButton>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            style={{ background: 'none', border: 'none', color: page === 1 ? theme.text.muted : theme.accent.blue, cursor: page === 1 ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700 }}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '13px', color: theme.text.muted }}>Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            style={{ background: 'none', border: 'none', color: page === totalPages ? theme.text.muted : theme.accent.blue, cursor: page === totalPages ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700 }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </Card>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
