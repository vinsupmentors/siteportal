import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { Link as LinkIcon, Save, ExternalLink, BookOpen } from 'lucide-react';

export const SAMeetingLinks = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);

    const fetchData = async () => {
        try { const res = await superAdminAPI.getMeetingLinks(); setBatches(res.data.batches); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const updateLink = (id, link) => {
        setBatches(prev => prev.map(b => b.id === id ? { ...b, meeting_link: link } : b));
    };

    const handleSave = async (batch) => {
        setSaving(batch.id);
        try { await superAdminAPI.updateMeetingLink(batch.id, { meeting_link: batch.meeting_link || '' }); }
        catch { alert('Error saving link'); }
        finally { setSaving(null); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    // Group by batch_name
    const batchGroups = Object.entries(
        batches.reduce((acc, b) => {
            if (!acc[b.batch_name]) acc[b.batch_name] = [];
            acc[b.batch_name].push(b);
            return acc;
        }, {})
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <h2 style={{ fontSize: '1.5rem' }}>Online Class Meeting Links</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage meeting links for all active and upcoming batches</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {batchGroups.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No active/upcoming batches found. Create batches first.</p>
                    </div>
                ) : batchGroups.map(([batchName, courses]) => (
                    <div key={batchName} className="glass-card" style={{ overflow: 'hidden' }}>
                        {/* Batch group header */}
                        <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{batchName}</span>
                            <span style={{ marginLeft: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {courses.length} course{courses.length !== 1 ? 's' : ''}
                                {' · '}{courses.filter(c => c.meeting_link).length} / {courses.length} linked
                            </span>
                        </div>
                        {/* Course rows */}
                        {courses.map((b, idx) => (
                            <div key={b.id} style={{
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem',
                                borderTop: idx === 0 ? 'none' : '1px solid var(--border-color)',
                                background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                            }}>
                                <div style={{ width: 34, height: 34, borderRadius: '8px', background: b.meeting_link ? '#51cf6620' : '#ff6b6b20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <LinkIcon size={16} color={b.meeting_link ? '#51cf66' : '#ff6b6b'} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 200 }}>
                                    <BookOpen size={13} color="var(--primary)" />
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{b.course_name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>{b.timing} · {b.schedule_type}</p>
                                    </div>
                                </div>
                                <input type="text" value={b.meeting_link || ''} onChange={e => updateLink(b.id, e.target.value)}
                                    placeholder="Paste meeting link here..."
                                    style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.875rem' }} />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {b.meeting_link && (
                                        <a href={b.meeting_link} target="_blank" rel="noopener noreferrer"
                                            style={{ width: 34, height: 34, borderRadius: '8px', background: '#4c6ef520', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ExternalLink size={15} color="#4c6ef5" />
                                        </a>
                                    )}
                                    <button onClick={() => handleSave(b)} disabled={saving === b.id}
                                        style={{ width: 34, height: 34, borderRadius: '8px', cursor: 'pointer', background: '#51cf6620', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: saving === b.id ? 0.5 : 1 }}>
                                        <Save size={15} color="#51cf66" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
