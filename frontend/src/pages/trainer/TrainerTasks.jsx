import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, Card, StatCard, FilterTabs, ActionButton, StatusBadge, EmptyState, LoadingSpinner, SectionTitle, FormField, inputStyle, theme,
} from './TrainerComponents';
import {
    CheckCircle, Clock, AlertCircle, Send, Search, BookOpen, RotateCcw,
} from 'lucide-react';

export const TrainerTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        (async () => {
            try { const res = await trainerAPI.getMyTasks(); setTasks(res.data.tasks || []); }
            catch (err) { console.error(err); } finally { setLoading(false); }
        })();
    }, []);

    const handleStatusUpdate = async (taskId, status) => {
        try {
            await trainerAPI.updateTaskStatus(taskId, { status });
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const handleSubmitReview = async () => {
        if (!reviewModal) return;
        setSubmitting(true);
        try {
            await trainerAPI.submitTaskForReview(reviewModal, { review_notes: reviewNotes });
            setTasks(prev => prev.map(t => t.id === reviewModal ? { ...t, status: 'review' } : t));
            setReviewModal(null);
            setReviewNotes('');
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <LoadingSpinner label="Loading tasks..." />;

    const counts = { all: tasks.length, assigned: 0, 'in-progress': 0, review: 0, complete: 0 };
    tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

    const filtered = tasks.filter(t => {
        if (filter !== 'all' && t.status !== filter) return false;
        if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const tabs = [
        { value: 'all', label: `All (${counts.all})` },
        { value: 'assigned', label: `Assigned (${counts.assigned})` },
        { value: 'in-progress', label: `In Progress (${counts['in-progress']})` },
        { value: 'review', label: `Review (${counts.review})` },
        { value: 'complete', label: `Done (${counts.complete})` },
    ];

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader title="My Tasks" subtitle="Track and manage your assigned tasks" icon={<BookOpen size={24} />} accentColor={theme.accent.yellow} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <StatCard label="Assigned" value={counts.assigned} icon={<AlertCircle size={18} />} accentColor={theme.accent.yellow} />
                <StatCard label="In Progress" value={counts['in-progress']} icon={<Clock size={18} />} accentColor={theme.accent.blue} />
                <StatCard label="In Review" value={counts.review} icon={<Send size={18} />} accentColor={theme.accent.purple} />
                <StatCard label="Completed" value={counts.complete} icon={<CheckCircle size={18} />} accentColor={theme.accent.green} />
            </div>

            <Card noPadding>
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <FilterTabs tabs={tabs} active={filter} onChange={setFilter} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: theme.radius.md, padding: '0 12px' }}>
                        <Search size={14} color={theme.text.muted} />
                        <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: theme.text.primary, fontSize: '12px', fontWeight: 500, outline: 'none', padding: '8px 0' }} />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState icon={<BookOpen size={24} />} title="No tasks found" subtitle="Try a different filter." />
                ) : (
                    <div>
                        {filtered.map(task => (
                            <div key={task.id} style={{
                                padding: '18px 24px', borderBottom: `1px solid ${theme.border.subtle}`,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = theme.bg.cardHover}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: theme.text.primary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</h4>
                                        <StatusBadge status={task.status} />
                                    </div>
                                    {task.description && <p style={{ fontSize: '12px', color: theme.text.muted, margin: 0, lineHeight: 1.5 }}>{task.description}</p>}
                                    {task.due_date && (
                                        <span style={{ fontSize: '10px', color: theme.text.label, marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={10} /> Due: {new Date(task.due_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '16px' }}>
                                    {task.status === 'assigned' && (
                                        <ActionButton variant="secondary" onClick={() => handleStatusUpdate(task.id, 'in-progress')} style={{ padding: '6px 12px', fontSize: '10px' }}>
                                            Start
                                        </ActionButton>
                                    )}
                                    {task.status === 'in-progress' && (
                                        <ActionButton onClick={() => setReviewModal(task.id)} icon={<Send size={12} />} style={{ padding: '6px 12px', fontSize: '10px' }}>
                                            Submit
                                        </ActionButton>
                                    )}
                                    {task.status === 'return' && (
                                        <ActionButton variant="secondary" onClick={() => handleStatusUpdate(task.id, 'in-progress')} icon={<RotateCcw size={12} />} style={{ padding: '6px 12px', fontSize: '10px' }}>
                                            Rework
                                        </ActionButton>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Review Modal */}
            {reviewModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                }} onClick={() => setReviewModal(null)}>
                    <div style={{
                        background: theme.bg.card, borderRadius: theme.radius.lg, border: `1px solid ${theme.border.subtle}`,
                        padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                    }} onClick={e => e.stopPropagation()}>
                        <SectionTitle>Submit for Review</SectionTitle>
                        <FormField label="Review Notes">
                            <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Add any notes for the reviewer..."
                                value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} />
                        </FormField>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <ActionButton variant="secondary" onClick={() => setReviewModal(null)}>Cancel</ActionButton>
                            <ActionButton onClick={handleSubmitReview} disabled={submitting} icon={<Send size={14} />}>
                                {submitting ? 'Submitting...' : 'Submit'}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
