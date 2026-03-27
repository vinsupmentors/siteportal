import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { Send, Megaphone, BarChart2, Users, CheckCircle, AlertCircle, BellRing } from 'lucide-react';

const tabStyle = (active) => ({
    padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? 'white' : 'var(--text-muted)',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
    transition: 'all 0.15s',
});

export const SAAnnouncements = () => {
    const [activeTab, setActiveTab] = useState('announcements');

    // ── Announcements state ──────────────────────────────────────────────────
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [target, setTarget] = useState('all');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');

    // ── Absence alert state ──────────────────────────────────────────────────
    const [triggeringAbsence, setTriggeringAbsence] = useState(false);
    const [absenceResult, setAbsenceResult] = useState(null);

    // ── Progress emails state ────────────────────────────────────────────────
    const [emailTarget, setEmailTarget] = useState('all');
    const [emailBatchId, setEmailBatchId] = useState('');
    const [emailProgramType, setEmailProgramType] = useState('JRP');
    const [customMessage, setCustomMessage] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailResult, setEmailResult] = useState(null);

    const fetchData = async () => {
        try {
            const [annRes, batchRes] = await Promise.all([
                superAdminAPI.getAnnouncements(),
                superAdminAPI.getBatches()
            ]);
            setHistory(annRes.data.announcements);
            setBatches(batchRes.data.batches.filter(b => b.status !== 'completed'));
        } catch (err) { console.error(err); }
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
            const res = await superAdminAPI.broadcastAnnouncement({ title, message, target: finalTarget, expires_at: expiresAt || null });
            alert(res.data.message);
            setTitle(''); setMessage(''); setExpiresAt(''); setTarget('all'); setSelectedBatchId('');
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error broadcasting'); }
        finally { setSending(false); }
    };

    const handleTriggerAbsenceEmails = async () => {
        setAbsenceResult(null);
        setTriggeringAbsence(true);
        try {
            const res = await superAdminAPI.triggerAbsenceEmails();
            setAbsenceResult({ success: true, message: res.data.message, count: res.data.count });
        } catch (err) {
            setAbsenceResult({ success: false, message: err.response?.data?.message || 'Failed to trigger absence emails' });
        } finally { setTriggeringAbsence(false); }
    };

    const handleSendProgressEmails = async () => {
        setEmailResult(null);
        setSendingEmail(true);
        try {
            const payload = { target: emailTarget, customMessage };
            if (emailTarget === 'batch') payload.batchId = emailBatchId;
            if (emailTarget === 'program') payload.programType = emailProgramType;
            const res = await superAdminAPI.sendProgressEmails(payload);
            setEmailResult({ success: true, ...res.data });
        } catch (err) {
            setEmailResult({ success: false, message: err.response?.data?.message || 'Failed to send emails' });
        } finally { setSendingEmail(false); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem' }}>Communications</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={tabStyle(activeTab === 'announcements')} onClick={() => setActiveTab('announcements')}>
                        <Megaphone size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Announcements
                    </button>
                    <button style={tabStyle(activeTab === 'progress')} onClick={() => setActiveTab('progress')}>
                        <BarChart2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Progress Reports
                    </button>
                    <button style={tabStyle(activeTab === 'absence')} onClick={() => setActiveTab('absence')}>
                        <BellRing size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Absence Alerts
                    </button>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 1 — ANNOUNCEMENTS                                           */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'announcements' && (
                <>
                    <div className="glass-card">
                        <h3 style={{ color: 'var(--text-accent)', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Megaphone size={18} /> New Announcement
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="text" placeholder="Announcement Title" value={title} onChange={e => setTitle(e.target.value)}
                                style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                            <textarea rows={4} placeholder="Write your announcement message..." value={message} onChange={e => setMessage(e.target.value)}
                                style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', resize: 'vertical', fontSize: '0.95rem' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Expires On (optional):</label>
                                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target:</span>
                                    {[{ val: 'all', label: 'All Users' }, { val: '3', label: 'Trainers' }, { val: '4', label: 'Students' }, { val: 'batch', label: 'Specific Batch' }].map(t => (
                                        <button key={t.val} onClick={() => setTarget(t.val)}
                                            style={{ padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', background: target === t.val ? 'var(--primary)' : 'transparent', color: target === t.val ? 'white' : 'var(--text-muted)', border: `1px solid ${target === t.val ? 'var(--primary)' : 'var(--border-color)'}` }}>
                                            {t.label}
                                        </button>
                                    ))}
                                    {target === 'batch' && (
                                        <select className="input-field" value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', width: '150px' }}>
                                            <option value="">Select Batch...</option>
                                            {Object.entries(batches.reduce((acc, b) => { if (!acc[b.batch_name]) acc[b.batch_name] = []; acc[b.batch_name].push(b); return acc; }, {})).map(([bn, cs]) => (
                                                <optgroup key={bn} label={bn}>{cs.map(b => <option key={b.id} value={b.id}>{b.course_name}</option>)}</optgroup>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <button onClick={handleBroadcast} disabled={sending}
                                    style={{ padding: '10px 24px', borderRadius: '8px', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1, background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
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
                                    {ann.expires_at && (
                                        <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: new Date(ann.expires_at) < new Date() ? '#ef4444' : '#f59e0b' }}>
                                            {new Date(ann.expires_at) < new Date() ? '⛔ Expired' : '⏳ Expires'}: {new Date(ann.expires_at).toLocaleDateString()}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Target: {ann.target_role === 'all' ? 'All' : ann.target_role === '3' ? 'Trainers' : ann.target_role === '4' ? 'Students' : ann.target_batch_name}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: ann.acknowledged_count === ann.total_target_audience && ann.total_target_audience > 0 ? '#10b981' : 'var(--primary)' }}>
                                            <div style={{ height: '6px', width: '60px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', background: 'currentColor', width: ann.total_target_audience > 0 ? ((ann.acknowledged_count / ann.total_target_audience) * 100) + '%' : '0%' }}></div>
                                            </div>
                                            <strong>{ann.acknowledged_count} / {ann.total_target_audience}</strong> Acknowledged
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 2 — PROGRESS REPORT EMAILS                                  */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'progress' && (
                <>
                    <div className="glass-card">
                        <h3 style={{ color: 'var(--text-accent)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart2 size={18} /> Send Progress Report Emails
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                            Each student receives a personalized email with their attendance %, module marks, pending submissions, trainer remarks, and module reviews.
                        </p>

                        {/* Target selector */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Target</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                {[{ val: 'all', label: 'All Active Students' }, { val: 'batch', label: 'Specific Batch' }, { val: 'program', label: 'By Program (JRP/IOP)' }].map(t => (
                                    <button key={t.val} onClick={() => setEmailTarget(t.val)}
                                        style={{ padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', background: emailTarget === t.val ? 'var(--primary)' : 'transparent', color: emailTarget === t.val ? 'white' : 'var(--text-muted)', border: `1px solid ${emailTarget === t.val ? 'var(--primary)' : 'var(--border-color)'}` }}>
                                        {t.label}
                                    </button>
                                ))}

                                {emailTarget === 'batch' && (
                                    <select className="input-field" value={emailBatchId} onChange={e => setEmailBatchId(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', width: '180px' }}>
                                        <option value="">Select Batch...</option>
                                        {Object.entries(batches.reduce((acc, b) => { if (!acc[b.batch_name]) acc[b.batch_name] = []; acc[b.batch_name].push(b); return acc; }, {})).map(([bn, cs]) => (
                                            <optgroup key={bn} label={bn}>{cs.map(b => <option key={b.id} value={b.id}>{b.course_name}</option>)}</optgroup>
                                        ))}
                                    </select>
                                )}

                                {emailTarget === 'program' && (
                                    <select className="input-field" value={emailProgramType} onChange={e => setEmailProgramType(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', width: '120px' }}>
                                        <option value="JRP">JRP Students</option>
                                        <option value="IOP">IOP Students</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Custom message */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                Custom Message (Optional)
                            </label>
                            <textarea rows={3} placeholder="Add a personal message from admin that will appear at the bottom of each student's email..."
                                value={customMessage} onChange={e => setCustomMessage(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', resize: 'vertical', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                        </div>

                        {/* What's included info */}
                        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <strong style={{ color: 'var(--text-accent)' }}>Each email includes:</strong>
                            <span style={{ marginLeft: '8px' }}>Attendance % bar · Module marks table · Pending submission alert · Trainer module reviews · Positive remarks · Your custom message</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handleSendProgressEmails}
                                disabled={sendingEmail || (emailTarget === 'batch' && !emailBatchId)}
                                style={{ padding: '10px 28px', borderRadius: '8px', cursor: sendingEmail ? 'not-allowed' : 'pointer', opacity: sendingEmail ? 0.6 : 1, background: '#10b981', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
                                <Send size={16} /> {sendingEmail ? 'Sending Emails...' : 'Send Progress Emails'}
                            </button>
                        </div>

                        {/* Result banner */}
                        {emailResult && (
                            <div style={{ marginTop: '1rem', padding: '14px 16px', borderRadius: '8px', background: emailResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${emailResult.success ? '#10b981' : '#ef4444'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {emailResult.success
                                    ? <CheckCircle size={18} color="#10b981" />
                                    : <AlertCircle size={18} color="#ef4444" />}
                                <div>
                                    {emailResult.success
                                        ? <><strong style={{ color: '#10b981' }}>Emails sent!</strong> <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{emailResult.sent} sent, {emailResult.failed} failed out of {emailResult.total} students.</span></>
                                        : <span style={{ color: '#ef4444' }}>{emailResult.message}</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info card */}
                    <div className="glass-card">
                        <h3 style={{ color: 'var(--text-accent)', fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={18} /> How it works
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { step: '1', text: 'Select your target — all active students, a specific batch, or JRP/IOP program type.' },
                                { step: '2', text: 'Add an optional custom message that will appear at the bottom of every student\'s email.' },
                                { step: '3', text: 'The system compiles each student\'s data (attendance, marks, pending submissions, trainer reviews) and sends a personalized email.' },
                                { step: '4', text: 'Trainer report card reviews (from Student Profile → Report Card tab) are included if the trainer has filled them in.' },
                            ].map(({ step, text }) => (
                                <div key={step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary)' }}>{step}</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB 3 — ABSENCE ALERTS                                          */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'absence' && (
                <>
                    <div className="glass-card">
                        <h3 style={{ color: 'var(--text-accent)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BellRing size={18} /> Manual Absence Alert Trigger
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            This runs the same job that fires automatically every day at 6:00 PM. Students with 2+ absences in the last 7 days receive a warning email. Students with 3+ consecutive absences also alert management.
                        </p>

                        <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <strong style={{ color: '#ef4444' }}>Who gets emailed:</strong>
                            <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: 1.8 }}>
                                <li><strong>2+ absences in last 7 days</strong> — student receives a yellow warning email</li>
                                <li><strong>3+ consecutive absences</strong> — student gets a red critical alert + management notified at <code>v7032vinsup@gmail.com</code> &amp; <code>productionvinsup@gmail.com</code></li>
                            </ul>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handleTriggerAbsenceEmails} disabled={triggeringAbsence}
                                style={{ padding: '10px 28px', borderRadius: '8px', cursor: triggeringAbsence ? 'not-allowed' : 'pointer', opacity: triggeringAbsence ? 0.6 : 1, background: '#ef4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
                                <BellRing size={16} /> {triggeringAbsence ? 'Sending Alerts...' : 'Send Absence Alerts Now'}
                            </button>
                        </div>

                        {absenceResult && (
                            <div style={{ marginTop: '1rem', padding: '14px 16px', borderRadius: '8px', background: absenceResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${absenceResult.success ? '#10b981' : '#ef4444'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {absenceResult.success
                                    ? <CheckCircle size={18} color="#10b981" />
                                    : <AlertCircle size={18} color="#ef4444" />}
                                <span style={{ fontSize: '0.9rem', color: absenceResult.success ? '#10b981' : '#ef4444' }}>{absenceResult.message}</span>
                            </div>
                        )}
                    </div>

                    <div className="glass-card">
                        <h3 style={{ color: 'var(--text-accent)', fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={18} /> Automatic Schedule
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { label: 'Daily at 6:00 PM', desc: 'Absence alerts run automatically every evening — no action needed.' },
                                { label: 'Manual trigger above', desc: 'Use this button any time to send alerts immediately without waiting for the cron.' },
                                { label: 'Management emails', desc: 'Only 3+ consecutive day absences alert management. 2-day warnings go to the student only.' },
                            ].map(({ label, desc }) => (
                                <div key={label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', marginTop: '5px', flexShrink: 0 }} />
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}><strong style={{ color: 'var(--text-main)' }}>{label}:</strong> {desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
