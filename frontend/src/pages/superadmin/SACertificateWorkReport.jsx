import { useState, useEffect, useCallback } from 'react';
import { reportsAPI } from '../../services/api';
import {
    Award, Briefcase, ChevronDown, ChevronRight, CheckCircle2,
    XCircle, Clock, ExternalLink, FileText, Users,
    BarChart3, GraduationCap, Filter, RefreshCw, Link2, Star,
    AlertCircle, Package, TrendingUp, Layers, BookOpen
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Badge = ({ children, color, bg }) => (
    <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: bg, color,
    }}>{children}</span>
);

const StatCard = ({ icon: Icon, label, value, sub, gradient }) => (
    <div className="glass-card" style={{
        padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
        background: `linear-gradient(135deg, ${gradient[0]}08, ${gradient[1]}08)`,
        borderColor: `${gradient[0]}20`,
    }}>
        <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
            <Icon size={20} />
        </div>
        <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
            {sub && <div style={{ fontSize: '0.7rem', color: gradient[0], fontWeight: 600, marginTop: 2 }}>{sub}</div>}
        </div>
    </div>
);

const PctBar = ({ pct, color = '#51cf66' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s' }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color, width: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
);

// Batch status section header
const BatchStatusSection = ({ label, count, color, bg, children }) => (
    <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem',
            padding: '8px 14px', borderRadius: 8,
            background: bg, border: `1px solid ${color}30`,
        }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color, fontSize: 13 }}>{label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color, fontWeight: 600, background: `${color}20`, padding: '2px 10px', borderRadius: 20 }}>{count} batch{count !== 1 ? 'es' : ''}</span>
        </div>
        {children}
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// CERTIFICATE REPORT TAB
// ══════════════════════════════════════════════════════════════════════════════
const CertificateReport = ({ selectedBatch, selectedCourse, selectedBatchStatus }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [filter, setFilter] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedBatch)       params.batch_id     = selectedBatch;
            if (selectedCourse)      params.course_id    = selectedCourse;
            if (selectedBatchStatus) params.batch_status = selectedBatchStatus;
            const res = await reportsAPI.getCertificateReport(params);
            setData(res.data);
            const initExp = {};
            res.data.batches.forEach(b => { initExp[b.batch_id] = true; });
            setExpanded(initExp);
        } catch (err) {
            console.error(err);
        } finally { setLoading(false); }
    }, [selectedBatch, selectedCourse, selectedBatchStatus]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}><RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>;
    if (!data) return null;

    const { stats, batches } = data;

    const certColor = (c) => {
        if (c === 'obtained')     return { color: '#51cf66', bg: 'rgba(81,207,102,0.12)' };
        if (c === 'eligible')     return { color: '#339af0', bg: 'rgba(51,154,240,0.12)' };
        if (c === 'not_eligible') return { color: '#fa5252', bg: 'rgba(250,82,82,0.10)' };
        return { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)' };
    };

    const getCS = s => s.completion_cert_at ? 'obtained' : s.completion_eligible ? 'eligible' : 'not_eligible';
    const getIS = s => s.internship_cert_at  ? 'obtained' : s.internship_eligible ? 'eligible' : 'not_eligible';

    const filterFn = s => {
        if (filter === 'eligible_completion')  return s.completion_eligible && !s.completion_cert_at;
        if (filter === 'obtained_completion')  return !!s.completion_cert_at;
        if (filter === 'eligible_internship')  return s.internship_eligible && !s.internship_cert_at;
        if (filter === 'obtained_internship')  return !!s.internship_cert_at;
        return true;
    };

    // Separate active vs completed/inactive batches
    const activeBatches   = batches.filter(b => b.batch_status === 'active');
    const completedBatches = batches.filter(b => b.batch_status !== 'active');

    const BatchTable = ({ batch }) => {
        const students = batch.students.filter(filterFn);
        if (!students.length) return null;
        const open = expanded[batch.batch_id];
        return (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '0.75rem' }}>
                {/* Batch header */}
                <div onClick={() => setExpanded(e => ({ ...e, [batch.batch_id]: !open }))}
                    style={{
                        padding: '0.85rem 1.25rem', cursor: 'pointer', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        borderBottom: open ? '1px solid var(--border-color)' : 'none',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {open ? <ChevronDown size={15} color="var(--primary)" /> : <ChevronRight size={15} color="var(--primary)" />}
                        <div>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{batch.batch_name}</span>
                            <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-muted)' }}>{batch.course_name}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Badge color="#51cf66" bg="rgba(81,207,102,0.12)">{students.filter(s => !!s.completion_cert_at).length} completion</Badge>
                        <Badge color="#fcc419" bg="rgba(252,196,25,0.12)">{students.filter(s => !!s.internship_cert_at).length} internship</Badge>
                        <Badge color="var(--text-muted)" bg="rgba(255,255,255,0.05)">{students.length} students</Badge>
                    </div>
                </div>

                {open && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    {['Student', 'Roll #', 'Attendance', 'Proj Avg', 'Tests', 'Feedback', 'Portfolio', 'Completion', 'Internship'].map(h => (
                                        <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => {
                                    const cs = getCS(s), is = getIS(s);
                                    return (
                                        <tr key={s.student_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '0.7rem 1rem' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.student_name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.email}</div>
                                            </td>
                                            <td style={{ padding: '0.7rem 1rem', color: 'var(--text-muted)', fontSize: 12 }}>{s.roll_number || '—'}</td>
                                            <td style={{ padding: '0.7rem 1rem', minWidth: 100 }}>
                                                <PctBar pct={s.att_pct} color={s.att_pct >= 80 ? '#51cf66' : s.att_pct >= 75 ? '#fcc419' : '#fa5252'} />
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.att_present}/{s.att_total} days</div>
                                            </td>
                                            <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: s.proj_avg != null && s.proj_avg >= 75 ? '#51cf66' : s.proj_avg != null ? '#fa5252' : 'var(--text-muted)', fontSize: 14 }}>
                                                {s.proj_avg != null ? `${s.proj_avg}%` : '—'}
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>{s.proj_submitted}/{s.proj_released}</div>
                                            </td>
                                            <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: s.tests_released === 0 || s.test_pct === 100 ? '#51cf66' : '#fa5252', fontSize: 13 }}>
                                                {s.tests_submitted}/{s.tests_released}
                                            </td>
                                            <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: s.fb_released === 0 || s.fb_pct === 100 ? '#51cf66' : '#fa5252', fontSize: 13 }}>
                                                {s.fb_submitted}/{s.fb_released}
                                            </td>
                                            <td style={{ padding: '0.7rem 1rem' }}>
                                                {s.portfolio_approved
                                                    ? <Badge color="#51cf66" bg="rgba(81,207,102,0.12)">Approved</Badge>
                                                    : <Badge color="#fa5252" bg="rgba(250,82,82,0.10)">{s.portfolio_status || 'None'}</Badge>}
                                            </td>
                                            <td style={{ padding: '0.7rem 1rem' }}>
                                                <Badge {...certColor(cs)}>
                                                    {cs === 'obtained' ? <CheckCircle2 size={11} /> : cs === 'eligible' ? <Clock size={11} /> : <XCircle size={11} />}
                                                    {cs === 'obtained' ? fmtDate(s.completion_cert_at) : cs === 'eligible' ? 'Eligible' : 'Not Yet'}
                                                </Badge>
                                            </td>
                                            <td style={{ padding: '0.7rem 1rem' }}>
                                                <Badge {...certColor(is)}>
                                                    {is === 'obtained' ? <CheckCircle2 size={11} /> : is === 'eligible' ? <Clock size={11} /> : <XCircle size={11} />}
                                                    {is === 'obtained' ? fmtDate(s.internship_cert_at) : is === 'eligible' ? 'Eligible' : 'Not Yet'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <StatCard icon={Users}         label="Total Students"        value={stats.total_students}      gradient={['#4c6ef5','#748ffc']} />
                <StatCard icon={CheckCircle2}  label="Eligible Completion"   value={stats.completion_eligible}
                          sub={`${stats.completion_obtained} obtained`}      gradient={['#2f9e44','#40c057']} />
                <StatCard icon={Award}         label="Completion Certs"      value={stats.completion_obtained}
                          sub={`${stats.total_students ? Math.round(stats.completion_obtained/stats.total_students*100) : 0}% of students`}
                          gradient={['#51cf66','#8ce99a']} />
                <StatCard icon={GraduationCap} label="Eligible Internship"   value={stats.internship_eligible}
                          sub={`${stats.internship_obtained} obtained`}      gradient={['#e67700','#fd7e14']} />
                <StatCard icon={Star}          label="Internship Certs"      value={stats.internship_obtained}
                          sub={`${stats.total_students ? Math.round(stats.internship_obtained/stats.total_students*100) : 0}% of students`}
                          gradient={['#f59f00','#fcc419']} />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {[
                    { key: 'all', label: 'All Students' },
                    { key: 'eligible_completion',  label: 'Eligible — Completion' },
                    { key: 'obtained_completion',  label: 'Got Completion Cert' },
                    { key: 'eligible_internship',  label: 'Eligible — Internship' },
                    { key: 'obtained_internship',  label: 'Got Internship Cert' },
                ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                        background: filter === f.key ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                        color:      filter === f.key ? '#fff' : 'var(--text-muted)', transition: '0.2s',
                    }}>{f.label}</button>
                ))}
            </div>

            {/* Active Batches */}
            {activeBatches.length > 0 && (
                <BatchStatusSection label="Active Batches" count={activeBatches.filter(b => b.students.some(filterFn)).length} color="#51cf66" bg="rgba(81,207,102,0.06)">
                    {activeBatches.map(b => <BatchTable key={b.batch_id} batch={b} />)}
                </BatchStatusSection>
            )}

            {/* Completed / Inactive Batches */}
            {completedBatches.length > 0 && (
                <BatchStatusSection label="Completed / Inactive Batches" count={completedBatches.filter(b => b.students.some(filterFn)).length} color="#748ffc" bg="rgba(116,143,252,0.06)">
                    {completedBatches.map(b => <BatchTable key={b.batch_id} batch={b} />)}
                </BatchStatusSection>
            )}

            {batches.every(b => !b.students.some(filterFn)) && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Award size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <p>No students match this filter.</p>
                </div>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT WORK REPORT TAB
// ══════════════════════════════════════════════════════════════════════════════
const StudentWorkReport = ({ selectedBatch, selectedCourse, selectedBatchStatus }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedBatch, setExpandedBatch] = useState({});
    const [expandedStudent, setExpandedStudent] = useState({});
    const [filter, setFilter] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedBatch)       params.batch_id     = selectedBatch;
            if (selectedCourse)      params.course_id    = selectedCourse;
            if (selectedBatchStatus) params.batch_status = selectedBatchStatus;
            const res = await reportsAPI.getStudentWorkReport(params);
            setData(res.data);
            const initBatch = {};
            res.data.batches.forEach(b => { initBatch[b.batch_id] = true; });
            setExpandedBatch(initBatch);
        } catch (err) {
            console.error(err);
        } finally { setLoading(false); }
    }, [selectedBatch, selectedCourse, selectedBatchStatus]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}><RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>;
    if (!data) return null;

    const { stats, batches } = data;

    const statusBadge = status => {
        if (status === 'graded')    return <Badge color="#51cf66" bg="rgba(81,207,102,0.12)"><CheckCircle2 size={10} />Graded</Badge>;
        if (status === 'submitted') return <Badge color="#339af0" bg="rgba(51,154,240,0.12)"><Clock size={10} />Submitted</Badge>;
        return <Badge color="#868e96" bg="rgba(255,255,255,0.05)"><AlertCircle size={10} />Pending</Badge>;
    };

    const filterStudents = students => {
        if (filter === 'all') return students;
        return students.filter(s => {
            if (filter === 'submitted')     return s.submitted_count > 0;
            if (filter === 'graded')        return s.graded_count > 0;
            if (filter === 'with_link')     return s.projects.some(p => !!p.github_link);
            if (filter === 'not_submitted') return s.submitted_count < s.total_assigned;
            return true;
        });
    };

    const activeBatches    = batches.filter(b => b.batch_status === 'active');
    const completedBatches = batches.filter(b => b.batch_status !== 'active');

    const BatchSection = ({ batch }) => {
        const students = filterStudents(batch.students);
        if (!students.length) return null;
        const bOpen = expandedBatch[batch.batch_id];
        return (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div onClick={() => setExpandedBatch(e => ({ ...e, [batch.batch_id]: !bOpen }))}
                    style={{ padding: '0.85rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: bOpen ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {bOpen ? <ChevronDown size={15} color="var(--primary)" /> : <ChevronRight size={15} color="var(--primary)" />}
                        <div>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{batch.batch_name}</span>
                            <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-muted)' }}>{batch.course_name}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Badge color="#339af0" bg="rgba(51,154,240,0.12)">{students.reduce((a,s)=>a+s.submitted_count,0)} submitted</Badge>
                        <Badge color="#51cf66" bg="rgba(81,207,102,0.12)">{students.reduce((a,s)=>a+s.graded_count,0)} graded</Badge>
                        <Badge color="var(--text-muted)" bg="rgba(255,255,255,0.05)">{students.length} students</Badge>
                    </div>
                </div>

                {bOpen && (
                    <div style={{ padding: '0.5rem 0' }}>
                        {students.map(student => {
                            const sKey  = `${batch.batch_id}_${student.student_id}`;
                            const sOpen = expandedStudent[sKey];
                            const projPct = student.total_assigned > 0 ? Math.round(student.submitted_count / student.total_assigned * 100) : 0;
                            return (
                                <div key={student.student_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div onClick={() => setExpandedStudent(e => ({ ...e, [sKey]: !sOpen }))}
                                        style={{ padding: '0.75rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: sOpen ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                        {sOpen ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 13 }}>{student.student_name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{student.email}{student.roll_number ? ` · #${student.roll_number}` : ''}</div>
                                        </div>
                                        <div style={{ width: 200 }}>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Projects</span><span>{student.submitted_count}/{student.total_assigned}</span>
                                            </div>
                                            <PctBar pct={projPct} color={projPct === 100 ? '#51cf66' : projPct > 50 ? '#fcc419' : '#fa5252'} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <Badge color="#0ca678" bg="rgba(12,166,120,0.12)">{student.graded_count} graded</Badge>
                                            {student.projects.some(p => p.github_link) && <Badge color="#ae3ec9" bg="rgba(174,62,201,0.12)"><Link2 size={10} />Links</Badge>}
                                        </div>
                                    </div>

                                    {sOpen && (
                                        <div style={{ padding: '0 1.25rem 0.75rem 3rem' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        {['Project', 'Module', 'Type', 'Status', 'Marks', 'GitHub / File', 'Submitted', 'Feedback'].map(h => (
                                                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {student.projects.length === 0 && (
                                                        <tr><td colSpan={8} style={{ padding: '12px 10px', color: 'var(--text-muted)', textAlign: 'center' }}>No projects released yet</td></tr>
                                                    )}
                                                    {student.projects.map((p, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                            <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-main)' }}>{p.project_name}</td>
                                                            <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{p.module_name || '—'}</td>
                                                            <td style={{ padding: '8px 10px' }}>
                                                                <Badge color={p.release_type === 'capstone_project' ? '#f59f00' : '#748ffc'}
                                                                       bg={p.release_type === 'capstone_project' ? 'rgba(245,159,0,0.12)' : 'rgba(116,143,252,0.12)'}>
                                                                    {p.release_type === 'capstone_project' ? 'Capstone' : 'Module'}
                                                                </Badge>
                                                            </td>
                                                            <td style={{ padding: '8px 10px' }}>{statusBadge(p.status)}</td>
                                                            <td style={{ padding: '8px 10px', fontWeight: 700, color: p.marks != null ? (p.marks >= 75 ? '#51cf66' : '#fa5252') : 'var(--text-muted)' }}>
                                                                {p.marks != null ? `${p.marks}%` : '—'}
                                                            </td>
                                                            <td style={{ padding: '8px 10px' }}>
                                                                {p.github_link ? (
                                                                    <a href={p.github_link} target="_blank" rel="noreferrer"
                                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#339af0', fontWeight: 600, textDecoration: 'none', fontSize: 12 }}
                                                                        onClick={e => e.stopPropagation()}>
                                                                        <Link2 size={11} /> View Link <ExternalLink size={9} />
                                                                    </a>
                                                                ) : p.file_name ? (
                                                                    <span style={{ color: '#748ffc', fontSize: 12 }}><FileText size={11} style={{ marginRight: 4 }} />{p.file_name}</span>
                                                                ) : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                                                            </td>
                                                            <td style={{ padding: '8px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(p.submitted_at)}</td>
                                                            <td style={{ padding: '8px 10px', color: 'var(--text-muted)', maxWidth: 200 }}>
                                                                {p.feedback ? <span title={p.feedback}>{p.feedback.slice(0,40)}{p.feedback.length>40?'…':''}</span> : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
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

    return (
        <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <StatCard icon={Package}      label="Total Projects"   value={stats.total_projects}  gradient={['#4c6ef5','#748ffc']} />
                <StatCard icon={FileText}     label="Submitted"        value={stats.submitted}
                          sub={`${stats.total_projects ? Math.round(stats.submitted/stats.total_projects*100) : 0}% completion`}
                          gradient={['#0ca678','#20c997']} />
                <StatCard icon={CheckCircle2} label="Graded"           value={stats.graded}
                          sub={`${stats.submitted ? Math.round(stats.graded/stats.submitted*100) : 0}% of submitted`}
                          gradient={['#2f9e44','#40c057']} />
                <StatCard icon={Link2}        label="With GitHub Link" value={stats.with_link}       gradient={['#ae3ec9','#cc5de8']} />
                <StatCard icon={TrendingUp}   label="Avg Marks"        value={stats.avg_marks + '%'} gradient={['#e67700','#fd7e14']} />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {[
                    { key: 'all',           label: 'All Students' },
                    { key: 'submitted',     label: 'Has Submissions' },
                    { key: 'graded',        label: 'Has Graded' },
                    { key: 'with_link',     label: 'Has GitHub Link' },
                    { key: 'not_submitted', label: 'Pending Submission' },
                ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                        background: filter === f.key ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                        color:      filter === f.key ? '#fff' : 'var(--text-muted)', transition: '0.2s',
                    }}>{f.label}</button>
                ))}
            </div>

            {activeBatches.length > 0 && (
                <BatchStatusSection label="Active Batches" count={activeBatches.filter(b => filterStudents(b.students).length > 0).length} color="#51cf66" bg="rgba(81,207,102,0.06)">
                    {activeBatches.map(b => <BatchSection key={b.batch_id} batch={b} />)}
                </BatchStatusSection>
            )}
            {completedBatches.length > 0 && (
                <BatchStatusSection label="Completed / Inactive Batches" count={completedBatches.filter(b => filterStudents(b.students).length > 0).length} color="#748ffc" bg="rgba(116,143,252,0.06)">
                    {completedBatches.map(b => <BatchSection key={b.batch_id} batch={b} />)}
                </BatchStatusSection>
            )}

            {batches.every(b => !filterStudents(b.students).length) && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Package size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <p>No submissions found for this filter.</p>
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — dual filter dropdowns + tabs
// ══════════════════════════════════════════════════════════════════════════════
const selectStyle = {
    padding: '8px 12px', borderRadius: 8,
    background: 'var(--bg-dark)', border: '1px solid var(--border-color)',
    color: 'var(--text-main)', fontSize: 13, outline: 'none', cursor: 'pointer',
    minWidth: 160,
};

export const SACertificateWorkReport = () => {
    const [tab, setTab]                   = useState('certificates');
    const [allBatches, setAllBatches]     = useState([]);
    const [courses, setCourses]           = useState([]);
    const [selectedCourse,      setSelectedCourse]      = useState('');
    const [selectedBatch,       setSelectedBatch]       = useState('');
    const [selectedBatchStatus, setSelectedBatchStatus] = useState('');

    useEffect(() => {
        reportsAPI.getBatches()
            .then(r => {
                setAllBatches(r.data.batches || []);
                setCourses(r.data.courses    || []);
            })
            .catch(() => {});
    }, []);

    // When course changes, reset batch + status filters
    const handleCourseChange = (e) => {
        setSelectedCourse(e.target.value);
        setSelectedBatch('');
    };

    // Batches visible in the batch dropdown = filtered by course AND status
    const visibleBatches = allBatches
        .filter(b => !selectedCourse      || String(b.course_id) === String(selectedCourse))
        .filter(b => !selectedBatchStatus || b.status === selectedBatchStatus);

    // If multiple batches share the same name, show course name to disambiguate
    const batchNameCount = visibleBatches.reduce((acc, b) => {
        acc[b.batch_name] = (acc[b.batch_name] || 0) + 1;
        return acc;
    }, {});
    const batchLabel = b => batchNameCount[b.batch_name] > 1
        ? `${b.batch_name} · ${b.course_name}`
        : b.batch_name;

    const tabs = [
        { key: 'certificates', label: 'Certificate & Eligibility Report', icon: Award },
        { key: 'student-work', label: 'Student Work & Projects Report',   icon: Briefcase },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header + Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                        <BarChart3 color="var(--primary)" /> Reports Hub
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
                        Deep-dive analytics — Batch → Course → Student
                    </p>
                </div>

                {/* Triple filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Filter size={14} color="var(--text-muted)" />

                    {/* Course filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Course</label>
                        <select value={selectedCourse} onChange={handleCourseChange} style={selectStyle}>
                            <option value="">All Courses</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Batch Status filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Status</label>
                        <select value={selectedBatchStatus} onChange={e => { setSelectedBatchStatus(e.target.value); setSelectedBatch(''); }} style={selectStyle}>
                            <option value="">All Status</option>
                            <option value="active">Ongoing</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    {/* Batch filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Batch</label>
                        <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} style={selectStyle}>
                            <option value="">All Batches</option>
                            {visibleBatches.map(b => (
                                <option key={b.id} value={b.id}>{batchLabel(b)}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)' }}>
                {tabs.map(t => {
                    const Icon = t.icon;
                    const active = tab === t.key;
                    return (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{
                            padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                            borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: 7,
                            background: active ? 'var(--primary)' : 'transparent',
                            color:      active ? '#fff' : 'var(--text-muted)',
                            borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                            transition: '0.2s',
                        }}>
                            <Icon size={15} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            {tab === 'certificates' && <CertificateReport selectedBatch={selectedBatch} selectedCourse={selectedCourse} selectedBatchStatus={selectedBatchStatus} />}
            {tab === 'student-work' && <StudentWorkReport selectedBatch={selectedBatch} selectedCourse={selectedCourse} selectedBatchStatus={selectedBatchStatus} />}
        </div>
    );
};

export default SACertificateWorkReport;
