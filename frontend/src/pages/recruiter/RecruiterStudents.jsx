import React, { useState, useEffect, useCallback } from 'react';
import { recruiterAPI } from '../../services/api';
import {
    Search, Users, Clock, CheckCircle, Calendar, X, AlertTriangle,
    ChevronRight, BookOpen, Layers, Phone, Mail, Hash, Award,
    Briefcase, FileText, BarChart3, ChevronLeft, Download, Rocket
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const PAGE_SIZE = 15;

// ─── Status colour map ────────────────────────────────────────────────────────
const IV_COLORS = {
    scheduled:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', label: 'Scheduled'   },
    in_progress: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'In Progress'  },
    placed:      { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Placed'       },
    rejected:    { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Rejected'     },
};

// ─── IOPStudentReportModal ────────────────────────────────────────────────────
const IOPStudentReportModal = ({ student, onClose, onSaved }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scheduleForm, setScheduleForm] = useState({ interview_number: 1, company_name: '', scheduled_date: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('overview'); // overview | interviews | portfolio | performance

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const r = await recruiterAPI.getStudentFullReport(student.id);
            setReport(r.data);
        } catch (e) {
            setError('Failed to load student report');
        } finally {
            setLoading(false);
        }
    }, [student.id]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const handleSchedule = async () => {
        if (!scheduleForm.company_name) { setError('Company name is required'); return; }
        setSaving(true); setError('');
        try {
            await recruiterAPI.scheduleInterview({
                student_id: student.id,
                batch_id: student.batch_id,
                interview_number: Number(scheduleForm.interview_number),
                company_name: scheduleForm.company_name,
                scheduled_date: scheduleForm.scheduled_date || null,
                notes: scheduleForm.notes || null,
            });
            setScheduleForm({ interview_number: 1, company_name: '', scheduled_date: '', notes: '' });
            fetchReport();
            onSaved?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to schedule interview');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateStatus = async (interviewId, status) => {
        try {
            await recruiterAPI.updateInterview(interviewId, { status });
            fetchReport();
            onSaved?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update');
        }
    };

    const inp = { padding: '9px 12px', borderRadius: 8, background: '#0d1424', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', width: '100%', fontSize: 13 };

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'interviews', label: 'Interviews' },
        { id: 'portfolio', label: 'Portfolio & Certs' },
        { id: 'performance', label: 'Performance' },
    ];

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '24px 16px', overflowY: 'auto' }}>
            <div style={{ background: '#141d2f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 24 }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{student.first_name} {student.last_name}</div>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>IOP</span>
                            {report?.isPlaced && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>✓ Placed</span>}
                            {report?.window90?.crossed90Days && !report?.isPlaced && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>⚠ Overdue</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#5a6478' }}>{student.batch_name} · {student.course_name}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a6478', padding: 4 }}><X size={20} /></button>
                </div>

                {/* Tab Bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px' }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: tab === t.id ? '#3b82f6' : '#5a6478', borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent', transition: 'all 0.15s' }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {loading && <div style={{ textAlign: 'center', color: '#5a6478', padding: 40, fontSize: 13 }}>Loading student report...</div>}
                    {error && <div style={{ fontSize: 12, color: '#ef4444', padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)' }}>{error}</div>}

                    {!loading && report && (
                        <>
                            {/* ── OVERVIEW TAB ── */}
                            {tab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Profile details */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        {[
                                            { icon: Hash, label: 'Roll Number', val: report.profile.roll_number || '—' },
                                            { icon: Mail, label: 'Email', val: report.profile.email },
                                            { icon: Phone, label: 'Phone', val: report.profile.phone || '—' },
                                            { icon: Calendar, label: 'Joining Date', val: report.profile.joining_date ? new Date(report.profile.joining_date).toLocaleDateString('en-IN') : '—' },
                                            { icon: Layers, label: 'Batch', val: report.profile.batch_name },
                                            { icon: BookOpen, label: 'Course', val: report.profile.course_name },
                                            { icon: Users, label: 'Trainer', val: report.profile.trainer_name || '—' },
                                        ].map(({ icon: Icon, label, val }) => (
                                            <div key={label} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                                    <Icon size={12} color="#5a6478" />
                                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5a6478' }}>{label}</span>
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{val}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 90-day window */}
                                    {report.profile.ready_for_interview ? (
                                        <div style={{ padding: '14px 18px', borderRadius: 10, background: report.window90.crossed90Days ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.07)', border: `1px solid ${report.window90.crossed90Days ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.2)'}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                                            {report.window90.crossed90Days ? <AlertTriangle size={18} color="#ef4444" /> : <Rocket size={18} color="#3b82f6" />}
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: report.window90.crossed90Days ? '#ef4444' : '#3b82f6' }}>
                                                    {report.window90.crossed90Days
                                                        ? `${Math.max(0, (report.window90.daysSinceCompletion || 0) - 90)} days overdue — 90-day window has expired`
                                                        : `${report.window90.daysRemaining} days remaining in 90-day interview window`}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#8892a4', marginTop: 2 }}>
                                                    Course completed: {new Date(report.profile.course_completion_date).toLocaleDateString('en-IN')}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
                                            <Clock size={14} style={{ display: 'inline', marginRight: 6 }} />Not yet marked ready for interview
                                        </div>
                                    )}

                                    {/* Attendance quick stat */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                        {[
                                            { label: 'Attendance', val: `${report.attendance.percentage}%`, color: report.attendance.percentage >= 80 ? '#10b981' : '#ef4444' },
                                            { label: 'Present', val: report.attendance.present_count, color: '#10b981' },
                                            { label: 'Absent', val: report.attendance.absent_count, color: '#ef4444' },
                                            { label: 'Leave', val: report.attendance.leave_count, color: '#f59e0b' },
                                        ].map(({ label, val, color }) => (
                                            <div key={label} style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                                                <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
                                                <div style={{ fontSize: 10, color: '#5a6478', fontWeight: 600, marginTop: 2 }}>{label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── INTERVIEWS TAB ── */}
                            {tab === 'interviews' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5a6478' }}>Interview Pipeline</div>
                                    {[0, 1, 2].map(i => {
                                        const iv = report.interviews[i];
                                        const meta = iv ? (IV_COLORS[iv.status] || IV_COLORS.scheduled) : null;
                                        return (
                                            <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: iv ? meta.bg : 'rgba(255,255,255,0.02)', border: `1px solid ${iv ? meta.color + '30' : 'rgba(255,255,255,0.06)'}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ fontSize: 11, fontWeight: 800, color: iv ? meta.color : '#5a6478', marginBottom: 4 }}>Interview {i + 1}</div>
                                                        {iv ? (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                                                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{iv.company_name || 'TBD'}</span>
                                                                {iv.scheduled_date && <span style={{ fontSize: 11, color: '#8892a4' }}>{new Date(iv.scheduled_date).toLocaleDateString('en-IN')}</span>}
                                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: meta.bg, color: meta.color }}>{meta.label}</span>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: 12, color: '#5a6478', fontStyle: 'italic' }}>Not yet scheduled</span>
                                                        )}
                                                        {iv?.notes && <div style={{ fontSize: 11, color: '#8892a4', marginTop: 6 }}>📝 {iv.notes}</div>}
                                                    </div>
                                                    {iv && iv.status !== 'placed' && (
                                                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                                            {iv.status !== 'placed' && <button onClick={() => handleUpdateStatus(iv.id, 'placed')} style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>✓ Placed</button>}
                                                            {iv.status !== 'rejected' && <button onClick={() => handleUpdateStatus(iv.id, 'rejected')} style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>✗ Rejected</button>}
                                                            {iv.status === 'scheduled' && <button onClick={() => handleUpdateStatus(iv.id, 'in_progress')} style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>In Progress</button>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Schedule new interview */}
                                    {(() => {
                                        const availableSlots = [1, 2, 3].filter(n => !report.interviews[n - 1]);
                                        return availableSlots.length > 0 && (
                                            <div style={{ marginTop: 8, padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5a6478', marginBottom: 12 }}>Schedule New Interview</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    <select value={scheduleForm.interview_number} onChange={e => setScheduleForm({ ...scheduleForm, interview_number: e.target.value })} style={inp}>
                                                        {availableSlots.map(n => <option key={n} value={n}>Interview {n}</option>)}
                                                    </select>
                                                    <input placeholder="Company Name *" value={scheduleForm.company_name} onChange={e => setScheduleForm({ ...scheduleForm, company_name: e.target.value })} style={inp} />
                                                    <input type="date" value={scheduleForm.scheduled_date} onChange={e => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })} style={inp} />
                                                    <textarea placeholder="Notes (optional)" value={scheduleForm.notes} onChange={e => setScheduleForm({ ...scheduleForm, notes: e.target.value })} rows={2} style={{ ...inp, resize: 'none' }} />
                                                    {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}
                                                    <button onClick={handleSchedule} disabled={saving} style={{ padding: 11, borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, opacity: saving ? 0.6 : 1 }}>
                                                        {saving ? 'Scheduling...' : 'Schedule Interview'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* ── PORTFOLIO & CERTS TAB ── */}
                            {tab === 'portfolio' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Portfolio */}
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5a6478', marginBottom: 10 }}>Portfolio</div>
                                        {report.portfolio ? (
                                            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: report.portfolio.description ? 8 : 0 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: report.portfolio.status === 'approved' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: report.portfolio.status === 'approved' ? '#10b981' : '#f59e0b' }}>
                                                        {report.portfolio.status === 'approved' ? '✓ Approved' : report.portfolio.status === 'pending' ? '⏳ Pending Review' : report.portfolio.status}
                                                    </span>
                                                    {report.portfolio.project_url && (
                                                        <a href={report.portfolio.project_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>View Project →</a>
                                                    )}
                                                </div>
                                                {report.portfolio.description && <div style={{ fontSize: 12, color: '#8892a4', marginTop: 6 }}>{report.portfolio.description}</div>}
                                                {report.portfolio.github_url && (
                                                    <a href={report.portfolio.github_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#8892a4', textDecoration: 'none', marginTop: 4, display: 'block' }}>GitHub: {report.portfolio.github_url}</a>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: '#5a6478', fontStyle: 'italic' }}>No portfolio submitted yet</div>
                                        )}
                                    </div>

                                    {/* Certificates */}
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5a6478', marginBottom: 10 }}>Certificates</div>
                                        {report.certificates.length === 0 ? (
                                            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: '#5a6478', fontStyle: 'italic' }}>No certificates generated yet</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {report.certificates.map(cert => (
                                                    <div key={cert.id} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <Award size={16} color="#10b981" />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                                                                {cert.cert_type === 'completion' ? 'Course Completion' : 'Internship'} Certificate
                                                                {cert.program_type && ` (${cert.program_type})`}
                                                            </div>
                                                            {cert.generated_at && <div style={{ fontSize: 11, color: '#8892a4', marginTop: 2 }}>Generated: {new Date(cert.generated_at).toLocaleDateString('en-IN')}</div>}
                                                        </div>
                                                        {cert.reset_by_admin ? <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>Reset</span> : null}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Capstone */}
                                    {report.capstone && (
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5a6478', marginBottom: 10 }}>Capstone Project</div>
                                            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{report.capstone.title || 'Capstone'}</div>
                                                <div style={{ fontSize: 12, color: report.capstone.status === 'approved' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>Status: {report.capstone.status}</div>
                                                {report.capstone.submitted_at && <div style={{ fontSize: 11, color: '#5a6478', marginTop: 4 }}>Submitted: {new Date(report.capstone.submitted_at).toLocaleDateString('en-IN')}</div>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── PERFORMANCE TAB ── */}
                            {tab === 'performance' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Module projects */}
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5a6478', marginBottom: 10 }}>Module Projects</div>
                                        {report.moduleProjects.length === 0 ? (
                                            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: '#5a6478', fontStyle: 'italic' }}>No module project data available</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {report.moduleProjects.map((mp, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                        <span style={{ fontSize: 13, color: '#e2e8f0' }}>{mp.module_name}</span>
                                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                            {mp.score !== null && <span style={{ fontSize: 13, fontWeight: 800, color: mp.score >= 75 ? '#10b981' : mp.score >= 50 ? '#f59e0b' : '#ef4444' }}>{mp.score}%</span>}
                                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: mp.status === 'approved' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: mp.status === 'approved' ? '#10b981' : '#f59e0b' }}>{mp.status}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Job applications */}
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5a6478', marginBottom: 10 }}>Job Portal Applications</div>
                                        {report.jobApplications.length === 0 ? (
                                            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: '#5a6478', fontStyle: 'italic' }}>No job applications yet</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {report.jobApplications.map((ja, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                        <div>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{ja.job_title}</div>
                                                            <div style={{ fontSize: 11, color: '#5a6478' }}>{ja.company_name}</div>
                                                        </div>
                                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: ja.status === 'hired' ? 'rgba(16,185,129,0.12)' : ja.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)', color: ja.status === 'hired' ? '#10b981' : ja.status === 'rejected' ? '#ef4444' : '#3b82f6' }}>{ja.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main RecruiterStudents Component ────────────────────────────────────────
const RecruiterStudents = () => {
    const [searchParams] = useSearchParams();

    // View state: 'batches' = batch-level overview, 'students' = drilled into a batch
    const [viewMode, setViewMode] = useState('batches');
    const [selectedBatch, setSelectedBatch] = useState(null); // { batch_id, batch_name, course_name }

    // Data
    const [batchList, setBatchList] = useState([]);      // from dashboard
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & filter (student view)
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [page, setPage] = useState(1);

    // Modal
    const [modal, setModal] = useState(null); // student object

    // ── Fetch batch overview ────────────────────────────────────────────────
    const fetchBatches = useCallback(async () => {
        setLoading(true);
        try {
            const r = await recruiterAPI.getDashboard();
            setBatchList(r.data.batches || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Fetch students for selected batch ──────────────────────────────────
    const fetchStudents = useCallback(async () => {
        if (!selectedBatch) return;
        setLoading(true);
        try {
            const params = { batch_id: selectedBatch.batch_id };
            if (statusFilter) params.status = statusFilter;
            const r = await recruiterAPI.getIopStudents(params);
            setStudents(r.data.students || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [selectedBatch, statusFilter]);

    useEffect(() => {
        if (viewMode === 'batches') fetchBatches();
        else fetchStudents();
    }, [viewMode, fetchBatches, fetchStudents]);

    // ── Navigate into a batch ──────────────────────────────────────────────
    const handleBatchClick = (batch) => {
        setSelectedBatch({ batch_id: batch.batch_id, batch_name: batch.batch_name, course_name: batch.course_name });
        setViewMode('students');
        setSearch('');
        setPage(1);
    };

    const handleBack = () => {
        setViewMode('batches');
        setSelectedBatch(null);
        setStudents([]);
        setPage(1);
    };

    // ── Multi-field search filter ──────────────────────────────────────────
    const filtered = students.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
            (s.roll_number || '').toLowerCase().includes(q) ||
            (s.phone || '').toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const sel = { padding: '9px 12px', borderRadius: 8, background: '#141d2f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, cursor: 'pointer' };

    // ══════════════════════════════════════════════════════════════════════
    //  BATCH VIEW
    // ══════════════════════════════════════════════════════════════════════
    if (viewMode === 'batches') {
        return (
            <div className="p-6 flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-main">IOP Students</h1>
                    <p className="text-secondary text-sm mt-1">Interview Opportunity Program — select a batch to view students</p>
                </div>

                {loading ? (
                    <div className="text-secondary text-sm">Loading batches...</div>
                ) : batchList.length === 0 ? (
                    <div className="card text-center p-20">
                        <Layers size={48} className="mx-auto text-muted mb-4" />
                        <div className="text-xl font-bold text-secondary">No batches found</div>
                    </div>
                ) : (
                    /* Group batch cards by batch_name */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {Object.entries(
                            batchList.reduce((acc, b) => {
                                if (!acc[b.batch_name]) acc[b.batch_name] = [];
                                acc[b.batch_name].push(b);
                                return acc;
                            }, {})
                        ).map(([batchName, courses]) => {
                            const totalIop = courses.reduce((s, c) => s + Number(c.iop_count || 0), 0);
                            return (
                                <div key={batchName}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <Layers size={16} color="#3b82f6" />
                                        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{batchName}</span>
                                        <span style={{ fontSize: 11, color: '#5a6478', fontWeight: 600 }}>
                                            {courses.length} course{courses.length !== 1 ? 's' : ''} · {totalIop} IOP
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                        {courses.map(batch => {
                                            const iopCount = Number(batch.iop_count || 0);
                                            const readyCount = Number(batch.iop_ready || 0);
                                            const placedCount = Number(batch.placed_count || 0);
                                            return (
                                                <div
                                                    key={batch.batch_id}
                                                    onClick={() => handleBatchClick(batch)}
                                                    style={{ padding: '18px', borderRadius: 12, background: '#141d2f', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'}
                                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5a6478' }}>
                                                            <BookOpen size={12} /> {batch.course_name}
                                                        </div>
                                                        <ChevronRight size={16} color="#3b82f6" />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                                        {[
                                                            { label: 'IOP', val: iopCount, color: '#3b82f6' },
                                                            { label: 'Ready', val: readyCount, color: '#10b981' },
                                                            { label: 'Placed', val: placedCount, color: '#8b5cf6' },
                                                        ].map(({ label, val, color }) => (
                                                            <div key={label} style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                                                                <div style={{ fontSize: 16, fontWeight: 800, color }}>{val}</div>
                                                                <div style={{ fontSize: 9, color: '#5a6478', fontWeight: 600 }}>{label}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {iopCount > 0 && (
                                                        <div style={{ marginTop: 10, display: 'flex', gap: 3, height: 5, borderRadius: 4, overflow: 'hidden' }}>
                                                            {[
                                                                { val: Number(batch.interviews_0 || 0), color: '#334155' },
                                                                { val: Number(batch.interviews_1 || 0), color: '#3b82f6' },
                                                                { val: Number(batch.interviews_2 || 0), color: '#8b5cf6' },
                                                                { val: Number(batch.interviews_3 || 0), color: '#f59e0b' },
                                                                { val: placedCount, color: '#10b981' },
                                                            ].filter(b => b.val > 0).map((b, i) => (
                                                                <div key={i} style={{ flex: b.val, background: b.color, borderRadius: 3 }} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    //  STUDENT VIEW (drilled into a batch)
    // ══════════════════════════════════════════════════════════════════════
    return (
        <div className="p-6 flex flex-col gap-6">
            {modal && (
                <IOPStudentReportModal
                    student={modal}
                    onClose={() => setModal(null)}
                    onSaved={fetchStudents}
                />
            )}

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8892a4', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <ChevronLeft size={14} /> All Batches
                </button>
                <ChevronRight size={14} color="#5a6478" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{selectedBatch?.batch_name}</span>
                <span style={{ fontSize: 12, color: '#5a6478' }}>· {selectedBatch?.course_name}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-2xl font-bold text-main">IOP Students</h1>
                    <p className="text-secondary text-sm mt-1">{filtered.length} student{filtered.length !== 1 ? 's' : ''} · page {page} of {totalPages}</p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Unified search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#141d2f', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', minWidth: 280, flex: 1, maxWidth: 440 }}>
                    <Search size={15} color="#5a6478" />
                    <input
                        placeholder="Name, roll number, phone or email..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: 13, flex: 1 }}
                    />
                    {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a6478', padding: 0, display: 'flex' }}><X size={14} /></button>}
                </div>

                {/* Status filter */}
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={sel}>
                    <option value="">All Status</option>
                    <option value="ready">Ready for Interview</option>
                    <option value="within_90_days">Within 90-Day Window</option>
                    <option value="crossed_90_days">⚠ Crossed 90 Days</option>
                    <option value="not_started">Ready but 0 Interviews</option>
                    <option value="placed">Placed</option>
                </select>
            </div>

            {/* Crossed 90-day alert banner */}
            {statusFilter === 'crossed_90_days' && paginated.length > 0 && (
                <div style={{ padding: '13px 18px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertTriangle size={18} color="#ef4444" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                        {filtered.length} student{filtered.length > 1 ? 's have' : ' has'} crossed the 90-day interview window. Immediate follow-up required.
                    </span>
                </div>
            )}

            {loading ? (
                <div className="text-secondary text-sm">Loading IOP students...</div>
            ) : filtered.length === 0 ? (
                <div className="card text-center p-20">
                    <Users size={48} className="mx-auto text-muted mb-4" />
                    <div className="text-xl font-bold text-secondary">No IOP students found</div>
                    <div className="text-muted text-sm mt-2">Try adjusting filters or search terms.</div>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                        {paginated.map(s => {
                            const intCount = Number(s.interview_count || 0);
                            const isPlaced = !!s.is_placed;
                            const isReady = !!s.ready_for_interview;
                            const hasCrossed = !!s.crossed_90_days;
                            const daysOverdue = hasCrossed && s.days_since_completion != null ? Math.max(0, Number(s.days_since_completion) - 90) : null;
                            const daysLeft = !hasCrossed && s.days_remaining != null ? Number(s.days_remaining) : null;

                            const borderColor = hasCrossed && !isPlaced ? 'rgba(239,68,68,0.4)' : isPlaced ? 'rgba(16,185,129,0.3)' : isReady ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)';

                            return (
                                <div key={s.id} style={{ padding: '18px', borderRadius: 14, background: '#141d2f', border: `1px solid ${borderColor}`, borderTop: hasCrossed && !isPlaced ? '3px solid #ef4444' : undefined }}>
                                    {/* Name + badges */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{s.first_name} {s.last_name}</div>
                                            {s.roll_number && <div style={{ fontSize: 11, color: '#5a6478', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={10} />{s.roll_number}</div>}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>IOP</span>
                                            {isPlaced && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Placed ✓</span>}
                                            {hasCrossed && !isPlaced && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>⚠ Overdue</span>}
                                        </div>
                                    </div>

                                    {/* Contact info */}
                                    <div style={{ fontSize: 11, color: '#5a6478', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={10} />{s.email}</div>
                                        {s.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={10} />{s.phone}</div>}
                                    </div>

                                    {/* Interview dots */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                        <span style={{ fontSize: 11, color: '#5a6478', fontWeight: 600 }}>Interviews:</span>
                                        {[1, 2, 3].map(n => (
                                            <div key={n} style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: n <= intCount ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: n <= intCount ? '#3b82f6' : '#5a6478', border: `1px solid ${n <= intCount ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                                                {n}
                                            </div>
                                        ))}
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#8892a4', marginLeft: 2 }}>{intCount}/3</span>
                                    </div>

                                    {/* 90-day indicator */}
                                    {isReady && !isPlaced && hasCrossed && daysOverdue !== null && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '6px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, fontWeight: 700, color: '#ef4444' }}>
                                            <AlertTriangle size={11} /> {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                                        </div>
                                    )}
                                    {isReady && !isPlaced && !hasCrossed && daysLeft !== null && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 11, fontWeight: 700, color: daysLeft < 15 ? '#ef4444' : daysLeft < 30 ? '#f59e0b' : '#3b82f6' }}>
                                            <Clock size={12} /> {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in window
                                        </div>
                                    )}

                                    {!isReady && (
                                        <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Clock size={11} /> Not ready for interview
                                        </div>
                                    )}

                                    {/* Action button */}
                                    {isPlaced ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 12, fontWeight: 700 }}>
                                            <CheckCircle size={13} /> Placed — View Full Report
                                        </div>
                                    ) : null}

                                    <button
                                        onClick={() => setModal(s)}
                                        style={{ width: '100%', marginTop: isPlaced ? 8 : 0, padding: '9px', borderRadius: 8, background: hasCrossed && !isPlaced ? 'rgba(239,68,68,0.12)' : '#3b82f6', color: hasCrossed && !isPlaced ? '#ef4444' : '#fff', border: hasCrossed && !isPlaced ? '1px solid rgba(239,68,68,0.3)' : 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <FileText size={13} /> View Full Report
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 8 }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 14px', borderRadius: 8, background: page === 1 ? 'rgba(255,255,255,0.03)' : '#3b82f6', color: page === 1 ? '#5a6478' : '#fff', border: 'none', cursor: page === 1 ? 'default' : 'pointer', fontWeight: 700, fontSize: 13 }}>← Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages).map((p, i, arr) => (
                                <React.Fragment key={p}>
                                    {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: '#5a6478' }}>…</span>}
                                    <button onClick={() => setPage(p)} style={{ width: 36, height: 36, borderRadius: 8, background: p === page ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: p === page ? '#fff' : '#8892a4', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>{p}</button>
                                </React.Fragment>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '7px 14px', borderRadius: 8, background: page === totalPages ? 'rgba(255,255,255,0.03)' : '#3b82f6', color: page === totalPages ? '#5a6478' : '#fff', border: 'none', cursor: page === totalPages ? 'default' : 'pointer', fontWeight: 700, fontSize: 13 }}>Next →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RecruiterStudents;
