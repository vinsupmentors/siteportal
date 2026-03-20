import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { Send, Megaphone } from 'lucide-react';

export const SAAnnouncements = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('all');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');

    const fetchData = async () => {
        try {
            const [annRes, batchRes] = await Promise.all([
                superAdminAPI.getAnnouncements(),
                superAdminAPI.getBatches()
            ]);
            setHistory(annRes.data.announcements);
            setBatches(batchRes.data.batches.filter(b => b.status === 'active' || b.status === 'upcoming'));
        }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleBroadcast = async () => {
        if (!title.trim() || !message.trim()) return;

        let finalTarget = target;
        if (target === 'batch') {
            if (!selectedBatchId) return alert("Please select a target batch");
            finalTarget = `batch_${selectedBatchId}`;
        }

        setSending(true);
        try {
            const res = await superAdminAPI.broadcastAnnouncement({ title, message, target: finalTarget });
            alert(res.data.message);
            setTitle(''); setMessage(''); setTarget('all'); setSelectedBatchId('');
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error broadcasting'); }
        finally { setSending(false); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Broadcast Announcements</h2>

            <div className="glass-card">
                <h3 style={{ color: 'var(--text-accent)', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Megaphone size={18} /> New Announcement
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input type="text" placeholder="Announcement Title" value={title} onChange={e => setTitle(e.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                    <textarea rows={4} placeholder="Write your announcement message..." value={message} onChange={e => setMessage(e.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', resize: 'vertical', fontSize: '0.95rem' }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target:</span>
                            {[{ val: 'all', label: 'All Users' }, { val: '3', label: 'Trainers' }, { val: '4', label: 'Students' }, { val: 'batch', label: 'Specific Batch' }].map(t => (
                                <button key={t.val} onClick={() => setTarget(t.val)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem',
                                        background: target === t.val ? 'var(--primary)' : 'transparent',
                                        color: target === t.val ? 'white' : 'var(--text-muted)',
                                        border: `1px solid ${target === t.val ? 'var(--primary)' : 'var(--border-color)'}`
                                    }}>
                                    {t.label}
                                </button>
                            ))}
                            {target === 'batch' && (
                                <select
                                    className="input-field"
                                    value={selectedBatchId}
                                    onChange={(e) => setSelectedBatchId(e.target.value)}
                                    style={{ padding: '6px', fontSize: '0.8rem', width: '150px' }}
                                >
                                    <option value="">Select Batch...</option>
                                    {Object.entries(batches.reduce((acc, b) => { if (!acc[b.batch_name]) acc[b.batch_name] = []; acc[b.batch_name].push(b); return acc; }, {})).map(([bn, cs]) => (
                                        <optgroup key={bn} label={bn}>{cs.map(b => <option key={b.id} value={b.id}>{b.course_name}</option>)}</optgroup>
                                    ))}
                                </select>
                            )}
                        </div>
                        <button onClick={handleBroadcast} disabled={sending}
                            style={{
                                padding: '10px 24px', borderRadius: '8px', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1,
                                background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600
                            }}>
                            <Send size={16} /> {sending ? 'Sending...' : 'Broadcast'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="glass-card">
                <h3 style={{ color: 'var(--text-accent)', fontSize: '1rem', marginBottom: '1rem' }}>Broadcast History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {history.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No announcements sent yet.</p>
                    ) : history.map((ann, i) => (
                        <div key={i} style={{ padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <h4 style={{ fontWeight: 600 }}>{ann.title}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(ann.created_at).toLocaleDateString()}</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px', whiteSpace: 'pre-wrap' }}>{ann.message}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Target: {ann.target_role === 'all' ? 'All' : ann.target_role === '3' ? 'Trainers' : ann.target_role === '4' ? 'Students' : ann.target_batch_name}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: ann.acknowledged_count === ann.total_target_audience && ann.total_target_audience > 0 ? '#10b981' : 'var(--primary)' }}>
                                    <div style={{ height: '6px', width: '60px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            background: 'currentColor',
                                            width: ann.total_target_audience > 0 ? ((ann.acknowledged_count / ann.total_target_audience) * 100) + '%' : '0%'
                                        }}></div>
                                    </div>
                                    <strong>{ann.acknowledged_count} / {ann.total_target_audience}</strong> Acknowledged
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};
