import { useState, useEffect, useCallback } from 'react';
import { trainerReportsAPI } from '../../services/api';
import {
    Award, Briefcase, ChevronDown, ChevronRight, CheckCircle2,
    XCircle, Clock, FileText, Users, BarChart3, GraduationCap,
    Filter, RefreshCw, Link2, AlertCircle, Package, TrendingUp, Star
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

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div style={{
        padding: '1rem', borderRadius: 12, border: '1px solid var(--border-color)',
        background: `${color}08`, display: 'flex', alignItems: 'center', gap: '0.75rem',
    }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <Icon size={18} />
        </div>
        <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            {sub && <div style={{ fontSize: '0.68rem', color, fontWeight: 600 }}>{sub}</div>}
        </div>
    </div>
);

const PctBar = ({ pct, color = '#51cf66' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color, width: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// CERTIFICATE TAB
// ══════════════════════════════════════════════════════════════════════════════
const CertTab = ({ selectedBatch }) => {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [filter, setFilter]   = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = selectedBatch ? { batch_id: selectedBatch } : {};
            const res = await trainerReportsAPI.getCertificateReport(params);
            setData(res.data);
            const init = {};
            res.data.batches.forEach(b => { init[b.batch_id] = true; });
            setExpanded(init);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [selectedBatch]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} /></div>;
    if (!data)   return null;

    const { stats, batches } = data;

    const certColor = c => {
        if (c === 'obtained')     return { color: '#51cf66', bg: 'rgba(81,207,102,0.12)' };
        if (c === 'eligible')     return { color: '#339af0', bg: 'rgba(51,154,240,0.12)' };
        return { color: '#fa5252', bg: 'rgba(250,82,82,0.10)' };
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

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <StatCard icon={Users}         label="Total Students"       value={stats.total_students}      color="#4c6ef5" />
                <StatCard icon={CheckCircle2}  label="Eligible Completion"  value={stats.completion_eligible} color="#2f9e44"
                          sub={`${stats.completion_obtained} obtained`} />
                <StatCard icon={Award}         label="Completion Certs"     value={stats.completion_obtained} color="#51cf66" />
                <StatCard icon={GraduationCap} label="Eligible Internship"  value={stats.internship_eligible} color="#e67700"
                          sub={`${stats.internship_obtained} obtained`} />
                <StatCard icon={Star}          label="Internship Certs"     value={stats.internship_obtained} color="#f59f00" />
            </div>

            {/* filter pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
                {[
                    { key: 'all', label: 'All' },
                    { key: 'eligible_completion',  label: 'Eligible Completion' },
                    { key: 'obtained_completion',  label: 'Got Completion' },
                    { key: 'eligible_internship',  label: 'Eligible Internship' },
                    { key: 'obtained_internship',  label: 'Got Internship' },
                ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                        padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                        background: filter === f.key ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                        color:      filter === f.key ? '#fff' : 'var(--text-muted)', transition: '0.2s',
                    }}>{f.label}</button>
                ))}
            </div>

            {batches.map(batch => {
                const students = batch.students.filter(filterFn);
                if (!students.length) return null;
                const open = expanded[batch.batch_id];
                return (
                    <div key={batch.batch_id} style={{ borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden', marginBottom: '0.75rem' }}>
                        <div onClick={() => setExpanded(e => ({ ...e, [batch.batch_id]: !open }))}
                            style={{ padding: '0.8rem 1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: open ? '1px solid var(--border-color)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {open ? <ChevronDown size={15} color="var(--primary)" /> : <ChevronRight size={15} color="var(--primary)" />}
                                <span style={{ fontWeight: 700 }}>{batch.batch_name}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{batch.course_name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <Badge color="#51cf66" bg="rgba(81,207,102,0.12)">{students.filter(s => !!s.completion_cert_at).length} compl</Badge>
                                <Badge color="#fcc419" bg="rgba(252,196,25,0.12)">{students.filter(s => !!s.internship_cert_at).length} intern</Badge>
                            </div>
                        </div>

                        {open && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            {['Student','Attendance','Projects Avg','Tests','Feedback','Portfolio','Completion','Internship'].map(h => (
                                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(s => {
                                            const cs = getCS(s), is = getIS(s);
                                            return (
                                                <tr key={s.student_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <td style={{ padding: '8px 12px' }}>
                                                        <div style={{ fontWeight: 600 }}>{s.student_name}</div>
                                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.roll_number || s.email}</div>
                                                    </td>
                                                    <td style={{ padding: '8px 12px', minWidth: 90 }}>
                                                        <PctBar pct={s.att_pct} color={s.att_pct >= 80 ? '#51cf66' : s.att_pct >= 75 ? '#fcc419' : '#fa5252'} />
                                                    </td>
                                                    <td style={{ padding: '8px 12px', fontWeight: 700, color: s.proj_avg != null && s.proj_avg >= 75 ? '#51cf66' : '#fa5252' }}>
                                                        {s.proj_avg != null ? `${s.proj_avg}%` : '—'}
                                                    </td>
                                                    <td style={{ padding: '8px 12px', color: s.test_pct === 100 || s.tests_released === 0 ? '#51cf66' : '#fa5252', fontWeight: 600 }}>
                                                        {s.tests_submitted}/{s.tests_released}
                                                    </td>
                                                    <td style={{ padding: '8px 12px', color: s.fb_pct === 100 || s.fb_released === 0 ? '#51cf66' : '#fa5252', fontWeight: 600 }}>
                                                        {s.fb_submitted}/{s.fb_released}
                                                    </td>
                                                    <td style={{ padding: '8px 12px' }}>
                                                        {s.portfolio_approved
                                                            ? <Badge color="#51cf66" bg="rgba(81,207,102,0.12)">Approved</Badge>
                                                            : <Badge color="#fa5252" bg="rgba(250,82,82,0.10)">Pending</Badge>}
                                                    </td>
                                                    <td style={{ padding: '8px 12px' }}>
                                                        <Badge {...certColor(cs)}>
                                                            {cs === 'obtained' ? <CheckCircle2 size={10} /> : cs === 'eligible' ? <Clock size={10} /> : <XCircle size={10} />}
                                                            {cs === 'obtained' ? fmtDate(s.completion_cert_at) : cs === 'eligible' ? 'Eligible' : 'Not Yet'}
                                                        </Badge>
                                                    </td>
                                                    <td style={{ padding: '8px 12px' }}>
                                                        <Badge {...certColor(is)}>
                                                            {is === 'obtained' ? <CheckCircle2 size={10} /> : is === 'eligible' ? <Clock size={10} /> : <XCircle size={10} />}
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
            })}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT WORK TAB
// ══════════════════════════════════════════════════════════════════════════════
const WorkTab = ({ selectedBatch }) => {
    const [data, setData]           = useState(null);
    const [loading, setLoading]     = useState(false);
    const [expandedBatch, setExpandedBatch]     = useState({});
    const [expandedStudent, setExpandedStudent] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = selectedBatch ? { batch_id: selectedBatch } : {};
            const res = await trainerReportsAPI.getStudentWorkReport(params);
            setData(res.data);
            const init = {};
            res.data.batches.forEach(b => { init[b.batch_id] = true; });
            setExpandedBatch(init);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [selectedBatch]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} /></div>;
    if (!data)   return null;

    const { stats, batches } = data;

    const statusBadge = status => {
        if (status === 'graded')    return <Badge color="#51cf66" bg="rgba(81,207,102,0.12)"><CheckCircle2 size={10} />Graded</Badge>;
        if (status === 'submitted') return <Badge color="#339af0" bg="rgba(51,154,240,0.12)"><Clock size={10} />Submitted</Badge>;
        return <Badge color="#868e96" bg="rgba(255,255,255,0.05)"><AlertCircle size={10} />Pending</Badge>;
    };

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <StatCard icon={Package}      label="Total Projects"    value={stats.total_projects}  color="#4c6ef5" />
                <StatCard icon={FileText}     label="Submitted"         value={stats.submitted}
                          sub={`${stats.total_projects ? Math.round(stats.submitted/stats.total_projects*100) : 0}% done`} color="#0ca678" />
                <StatCard icon={CheckCircle2} label="Graded"            value={stats.graded}          color="#2f9e44" />
                <StatCard icon={Link2}        label="GitHub Links"      value={stats.with_link}       color="#ae3ec9" />
                <StatCard icon={TrendingUp}   label="Avg Marks"         value={stats.avg_marks + '%'} color="#e67700" />
            </div>

            {batches.map(batch => {
                const bOpen = expandedBatch[batch.batch_id];
                return (
                    <div key={batch.batch_id} style={{ borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden', marginBottom: '0.75rem' }}>
                        <div onClick={() => setExpandedBatch(e => ({ ...e, [batch.batch_id]: !bOpen }))}
                            style={{ padding: '0.8rem 1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: bOpen ? '1px solid var(--border-color)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {bOpen ? <ChevronDown size={15} color="var(--primary)" /> : <ChevronRight size={15} color="var(--primary)" />}
                                <span style={{ fontWeight: 700 }}>{batch.batch_name}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{batch.course_name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <Badge color="#339af0" bg="rgba(51,154,240,0.12)">{batch.students.reduce((a,s) => a+s.submitted_count,0)} submitted</Badge>
                                <Badge color="#51cf66" bg="rgba(81,207,102,0.12)">{batch.students.reduce((a,s) => a+s.graded_count,0)} graded</Badge>
                            </div>
                        </div>

                        {bOpen && (
                            <div>
                                {batch.students.map(student => {
                                    const sKey  = `${batch.batch_id}_${student.student_id}`;
                                    const sOpen = expandedStudent[sKey];
                                    const pct   = student.total_assigned > 0 ? Math.round(student.submitted_count / student.total_assigned * 100) : 0;

                                    return (
                                        <div key={student.student_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div onClick={() => setExpandedStudent(e => ({ ...e, [sKey]: !sOpen }))}
                                                style={{ padding: '0.65rem 1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: sOpen ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                                {sOpen ? <ChevronDown size={13} color="var(--text-muted)" /> : <ChevronRight size={13} color="var(--text-muted)" />}
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{student.student_name}</span>
                                                    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>{student.roll_number ? `#${student.roll_number}` : student.email}</span>
                                                </div>
                                                <div style={{ width: 160 }}>
                                                    <PctBar pct={pct} color={pct === 100 ? '#51cf66' : pct > 50 ? '#fcc419' : '#fa5252'} />
                                                </div>
                                                <div style={{ display: 'flex', gap: 5 }}>
                                                    <Badge color="#0ca678" bg="rgba(12,166,120,0.12)">{student.submitted_count}/{student.total_assigned}</Badge>
                                                    {student.projects.some(p => p.github_link) && <Badge color="#ae3ec9" bg="rgba(174,62,201,0.12)"><Link2 size={9} />Link</Badge>}
                                                </div>
                                            </div>

                                            {sOpen && (
                                                <div style={{ padding: '0 1.1rem 0.75rem 2.5rem' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                {['Project','Module','Type','Status','Marks','Link / File','Submitted','Feedback'].map(h => (
                                                                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {student.projects.length === 0 && (
                                                                <tr><td colSpan={8} style={{ padding: '10px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>No projects released</td></tr>
                                                            )}
                                                            {student.projects.map((p, i) => (
                                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                                    <td style={{ padding: '7px 8px', fontWeight: 600 }}>{p.project_name}</td>
                                                                    <td style={{ padding: '7px 8px', color: 'var(--text-muted)' }}>{p.module_name || '—'}</td>
                                                                    <td style={{ padding: '7px 8px' }}>
                                                                        <Badge color={p.release_type === 'capstone_project' ? '#f59f00' : '#748ffc'}
                                                                               bg={p.release_type === 'capstone_project' ? 'rgba(245,159,0,0.12)' : 'rgba(116,143,252,0.12)'}>
                                                                            {p.release_type === 'capstone_project' ? 'Capstone' : 'Module'}
                                                                        </Badge>
                                                                    </td>
                                                                    <td style={{ padding: '7px 8px' }}>{statusBadge(p.status)}</td>
                                                                    <td style={{ padding: '7px 8px', fontWeight: 700, color: p.marks != null ? (p.marks >= 75 ? '#51cf66' : '#fa5252') : 'var(--text-muted)' }}>
                                                                        {p.marks != null ? `${p.marks}%` : '—'}
                                                                    </td>
                                                                    <td style={{ padding: '7px 8px' }}>
                                                                        {p.github_link ? (
                                                                            <a href={p.github_link} target="_blank" rel="noreferrer"
                                                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#339af0', fontWeight: 600, textDecoration: 'none' }}
                                                                                onClick={e => e.stopPropagation()}>
                                                                                <Link2 size={11} /> View
                                                                            </a>
                                                                        ) : p.file_name ? (
                                                                            <span style={{ color: '#748ffc' }}>{p.file_name}</span>
                                                                        ) : '—'}
                                                                    </td>
                                                                    <td style={{ padding: '7px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(p.submitted_at)}</td>
                                                                    <td style={{ padding: '7px 8px', color: 'var(--text-muted)', maxWidth: 180 }}>
                                                                        {p.feedback ? p.feedback.slice(0, 40) + (p.feedback.length > 40 ? '…' : '') : '—'}
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
            })}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — TRAINER REPORTS
// ══════════════════════════════════════════════════════════════════════════════
export const TrainerReports = () => {
    const [tab, setTab]             = useState('certificates');
    const [batches, setBatches]     = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');

    useEffect(() => {
        trainerReportsAPI.getBatches().then(r => setBatches(r.data.batches || [])).catch(() => {});
    }, []);

    const tabs = [
        { key: 'certificates', label: 'Certificate & Eligibility', icon: Award },
        { key: 'student-work', label: 'Student Work & Projects',   icon: Briefcase },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BarChart3 size={22} color="var(--primary)" /> My Batch Reports
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 3 }}>Certificates, eligibility & project submissions for your batches</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Filter size={14} color="var(--text-muted)" />
                    <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}
                        style={{ padding: '7px 11px', borderRadius: 8, background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                        <option value="">All My Batches</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)' }}>
                {tabs.map(t => {
                    const Icon = t.icon;
                    const active = tab === t.key;
                    return (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{
                            padding: '9px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                            borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: 6,
                            background: active ? 'var(--primary)' : 'transparent',
                            color:      active ? '#fff' : 'var(--text-muted)',
                            borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                            transition: '0.2s',
                        }}>
                            <Icon size={14} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {tab === 'certificates' && <CertTab  selectedBatch={selectedBatch} />}
            {tab === 'student-work' && <WorkTab  selectedBatch={selectedBatch} />}
        </div>
    );
};

export default TrainerReports;
