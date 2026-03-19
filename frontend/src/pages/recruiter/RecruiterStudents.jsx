import React, { useState, useEffect } from 'react';
import { recruiterAPI, superAdminAPI } from '../../services/api';
import { Search, Users, Clock, Briefcase, Rocket, CheckCircle, Calendar, X } from 'lucide-react';

const STATUS_COLORS = {
    scheduled:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', label: 'Scheduled'   },
    in_progress: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'In Progress'  },
    placed:      { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Placed'       },
    rejected:    { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Rejected'     },
};

const InterviewModal = ({ student, batches, onClose, onSaved }) => {
    const [form, setForm] = useState({ interview_number: 1, company_name: '', scheduled_date: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [interviews, setInterviews] = useState([null, null, null]);

    useEffect(() => {
        recruiterAPI.getStudentInterviews(student.id)
            .then(r => setInterviews(r.data.interviews || [null, null, null]))
            .catch(() => {});
    }, [student.id]);

    const handleSchedule = async () => {
        if (!form.company_name) { setError('Company name is required'); return; }
        setSaving(true); setError('');
        try {
            await recruiterAPI.scheduleInterview({
                student_id: student.id,
                batch_id: student.batch_id,
                interview_number: Number(form.interview_number),
                company_name: form.company_name,
                scheduled_date: form.scheduled_date || null,
                notes: form.notes || null,
            });
            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to schedule');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateStatus = async (interviewId, status) => {
        try {
            await recruiterAPI.updateInterview(interviewId, { status });
            const r = await recruiterAPI.getStudentInterviews(student.id);
            setInterviews(r.data.interviews || [null, null, null]);
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update');
        }
    };

    const availableSlots = [1, 2, 3].filter(n => !interviews[n - 1]);

    const inputStyle = { padding: '10px', borderRadius: 8, background: 'var(--bg-dark, #0d1424)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', width: '100%', fontSize: 13 };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#141d2f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: '100%', maxWidth: 560, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{student.first_name} {student.last_name}</div>
                        <div style={{ fontSize: 12, color: '#8892a4' }}>{student.batch_name} · {student.course_name}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a6478' }}><X size={20} /></button>
                </div>

                {/* Current interviews */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5a6478', marginBottom: 10 }}>Interview Pipeline</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[0, 1, 2].map(i => {
                            const iv = interviews[i];
                            const meta = iv ? (STATUS_COLORS[iv.status] || STATUS_COLORS.scheduled) : null;
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: iv ? meta.bg : 'rgba(255,255,255,0.02)', border: `1px solid ${iv ? meta.color + '40' : 'rgba(255,255,255,0.06)'}` }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: iv ? meta.color : '#5a6478', width: 70, flexShrink: 0 }}>Interview {i + 1}</span>
                                    {iv ? (
                                        <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{iv.company_name || 'TBD'}</span>
                                            {iv.scheduled_date && <span style={{ fontSize: 11, color: '#8892a4' }}>{new Date(iv.scheduled_date).toLocaleDateString('en-IN')}</span>}
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: meta.bg, color: meta.color }}>{meta.label}</span>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: 12, color: '#5a6478', fontStyle: 'italic' }}>Not scheduled</span>
                                    )}
                                    {iv && iv.status !== 'placed' && (
                                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                            {iv.status !== 'placed' && (
                                                <button onClick={() => handleUpdateStatus(iv.id, 'placed')} style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Placed</button>
                                            )}
                                            {iv.status !== 'rejected' && (
                                                <button onClick={() => handleUpdateStatus(iv.id, 'rejected')} style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Rejected</button>
                                            )}
                                            {iv.status === 'scheduled' && (
                                                <button onClick={() => handleUpdateStatus(iv.id, 'in_progress')} style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>In Progress</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Schedule new interview */}
                {availableSlots.length > 0 && (
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5a6478', marginBottom: 10 }}>Schedule New Interview</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <select value={form.interview_number} onChange={e => setForm({ ...form, interview_number: e.target.value })} style={inputStyle}>
                                {availableSlots.map(n => <option key={n} value={n}>Interview {n}</option>)}
                            </select>
                            <input placeholder="Company Name *" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} style={inputStyle} />
                            <input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} style={inputStyle} />
                            <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'none' }} />
                            {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}
                            <button onClick={handleSchedule} disabled={saving} style={{ padding: '11px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, opacity: saving ? 0.6 : 1 }}>
                                {saving ? 'Scheduling...' : 'Schedule Interview'}
                            </button>
                        </div>
                    </div>
                )}

                {availableSlots.length === 0 && (
                    <div style={{ padding: 12, borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, color: '#10b981', fontWeight: 600, textAlign: 'center' }}>
                        All 3 interview slots are scheduled.
                    </div>
                )}
            </div>
        </div>
    );
};

const RecruiterStudents = () => {
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [batchFilter, setBatchFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [modal, setModal] = useState(null);

    const fetchStudents = async () => {
        try {
            const params = {};
            if (batchFilter) params.batch_id = batchFilter;
            if (statusFilter) params.status = statusFilter;
            const [studRes, batchRes] = await Promise.all([
                recruiterAPI.getIopStudents(params),
                superAdminAPI.getBatches().catch(() => ({ data: { batches: [] } })),
            ]);
            setStudents(studRes.data.students || []);
            setBatches(batchRes.data.batches || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStudents(); }, [batchFilter, statusFilter]);

    const filtered = students.filter(s =>
        `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-6 text-secondary">Loading IOP students...</div>;

    const selectStyle = { padding: '9px 12px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, cursor: 'pointer' };

    return (
        <div className="p-6 flex flex-col gap-6">
            {modal && (
                <InterviewModal
                    student={modal}
                    batches={batches}
                    onClose={() => setModal(null)}
                    onSaved={fetchStudents}
                />
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-main">IOP Students</h1>
                    <p className="text-secondary text-sm mt-1">{filtered.length} students in Interview Opportunity Program</p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', minWidth: 250 }}>
                    <Search size={15} color="#5a6478" />
                    <input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: 13, flex: 1 }}
                    />
                </div>
                <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={selectStyle}>
                    <option value="">All Batches</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
                    <option value="">All Status</option>
                    <option value="ready">Ready for Interview</option>
                    <option value="placed">Placed</option>
                    <option value="not_started">Ready but 0 Interviews</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="card text-center p-20">
                    <Users size={48} className="mx-auto text-muted mb-4" />
                    <div className="text-xl font-bold text-secondary">No IOP students found</div>
                    <div className="text-muted text-sm mt-2">Students will appear here when assigned IOP program type.</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                    {filtered.map(s => {
                        const intCount = Number(s.interview_count || 0);
                        const isPlaced = !!s.is_placed;
                        const isReady = !!s.ready_for_interview;

                        return (
                            <div key={s.id} style={{ padding: '18px', borderRadius: 14, background: '#141d2f', border: `1px solid ${isPlaced ? 'rgba(16,185,129,0.3)' : isReady ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{s.first_name} {s.last_name}</div>
                                        <div style={{ fontSize: 11, color: '#5a6478', marginTop: 2 }}>{s.email}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>IOP</span>
                                        {isPlaced && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Placed ✓</span>}
                                    </div>
                                </div>

                                <div style={{ fontSize: 12, color: '#8892a4', marginBottom: 10 }}>
                                    {s.batch_name} · {s.course_name}
                                </div>

                                {/* Interview progress dots */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <span style={{ fontSize: 11, color: '#5a6478', fontWeight: 600 }}>Interviews:</span>
                                    {[1, 2, 3].map(n => (
                                        <div key={n} style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: n <= intCount ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: n <= intCount ? '#3b82f6' : '#5a6478', border: `1px solid ${n <= intCount ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                                            {n}
                                        </div>
                                    ))}
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', marginLeft: 4 }}>{intCount}/3</span>
                                </div>

                                {/* 90-day window */}
                                {s.days_remaining !== null && isReady && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 11, fontWeight: 700, color: s.days_remaining < 30 ? '#ef4444' : '#f59e0b' }}>
                                        <Clock size={13} /> {s.days_remaining} days remaining in 90-day window
                                    </div>
                                )}

                                {/* Status */}
                                {!isReady && (
                                    <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Clock size={12} /> Not yet ready for interview
                                    </div>
                                )}

                                {isReady && !isPlaced && (
                                    <button
                                        onClick={() => setModal(s)}
                                        style={{ width: '100%', padding: '9px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <Calendar size={14} /> Schedule / Manage Interviews
                                    </button>
                                )}
                                {isPlaced && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 12, fontWeight: 700 }}>
                                        <CheckCircle size={14} /> Student has been placed
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RecruiterStudents;
