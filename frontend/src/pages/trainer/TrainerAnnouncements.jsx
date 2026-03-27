import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, Card, ActionButton, FormField, inputStyle, EmptyState, LoadingSpinner, SectionTitle, theme,
} from './TrainerComponents';
import { Send, Megaphone } from 'lucide-react';

export const TrainerAnnouncements = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [batches, setBatches] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const fetchData = async () => {
        try {
            const [annRes, batchRes] = await Promise.all([
                trainerAPI.getAnnouncements(),
                trainerAPI.getMyCalendar(new Date().getMonth() + 1, new Date().getFullYear()),
            ]);
            setHistory(annRes.data.announcements || []);
            if (batchRes.data.batches) setBatches(batchRes.data.batches.filter(b => b.status !== 'completed'));
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleBroadcast = async () => {
        if (!title.trim() || !message.trim() || !selectedBatchId) return alert('Please fill all fields and select a batch.');
        setSending(true);
        try {
            await trainerAPI.broadcastAnnouncement({ title, message, batch_id: selectedBatchId, expires_at: expiresAt || null });
            setTitle(''); setMessage(''); setExpiresAt(''); setSelectedBatchId('');
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error'); } finally { setSending(false); }
    };

    if (loading) return <LoadingSpinner label="Loading announcements..." />;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader title="Batch Announcements" subtitle="Broadcast messages to your students" icon={<Megaphone size={24} />} accentColor={theme.accent.yellow} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Broadcast Form */}
                <Card accentTop={theme.accent.yellow}>
                    <SectionTitle>New Broadcast</SectionTitle>
                    {batches.length === 0 ? (
                        <div style={{ padding: '16px', borderRadius: theme.radius.sm, background: `${theme.accent.red}10`, color: theme.accent.red, fontSize: '12px', fontWeight: 600 }}>
                            No active batches to broadcast to.
                        </div>
                    ) : (
                        <>
                            <FormField label="Target Batch">
                                <select style={{ ...inputStyle, cursor: 'pointer' }} value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}>
                                    <option value="">— Select batch —</option>
                                    {Object.entries(batches.reduce((acc, b) => { if (!acc[b.batch_name]) acc[b.batch_name] = []; acc[b.batch_name].push(b); return acc; }, {})).map(([bn, cs]) => (
                                        <optgroup key={bn} label={bn}>{cs.map(b => <option key={b.id} value={b.id}>{b.course_name}</option>)}</optgroup>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Title">
                                <input style={inputStyle} placeholder="Announcement title..." value={title} onChange={e => setTitle(e.target.value)} />
                            </FormField>
                            <FormField label="Message">
                                <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Write your message..." value={message} onChange={e => setMessage(e.target.value)} />
                            </FormField>
                            <FormField label="Expires On (optional)">
                                <input type="date" style={inputStyle} value={expiresAt} onChange={e => setExpiresAt(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                            </FormField>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <ActionButton onClick={handleBroadcast} disabled={sending} icon={<Send size={14} />}>
                                    {sending ? 'Sending...' : 'Broadcast'}
                                </ActionButton>
                            </div>
                        </>
                    )}
                </Card>

                {/* History */}
                <Card>
                    <SectionTitle count={history.length}>Broadcast History</SectionTitle>
                    {history.length === 0 ? (
                        <EmptyState icon={<Megaphone size={24} />} title="No announcements yet" subtitle="Your broadcast history will appear here." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                            {history.map((ann, i) => {
                                const pct = ann.total_target_audience > 0 ? (ann.acknowledged_count / ann.total_target_audience) * 100 : 0;
                                return (
                                    <div key={i} style={{
                                        padding: '14px 16px', borderRadius: theme.radius.sm,
                                        border: `1px solid ${theme.border.subtle}`, background: 'rgba(255,255,255,0.02)',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>{ann.title}</h4>
                                            <span style={{ fontSize: '10px', color: theme.text.muted }}>{new Date(ann.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: theme.text.muted, margin: '0 0 10px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{ann.message}</p>
                                        {ann.expires_at && (
                                            <div style={{ fontSize: '10px', fontWeight: 600, marginBottom: '8px', color: new Date(ann.expires_at) < new Date() ? theme.accent.red : theme.accent.yellow }}>
                                                {new Date(ann.expires_at) < new Date() ? '⛔ Expired' : '⏳ Expires'}: {new Date(ann.expires_at).toLocaleDateString()}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', color: theme.text.label }}>To: {ann.target_batch_name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ height: '4px', width: '50px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', background: pct === 100 ? theme.accent.green : theme.accent.blue, width: `${pct}%`, borderRadius: '2px' }} />
                                                </div>
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: pct === 100 ? theme.accent.green : theme.accent.blue }}>
                                                    {ann.acknowledged_count}/{ann.total_target_audience}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
