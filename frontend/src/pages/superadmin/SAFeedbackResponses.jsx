import { useState, useEffect, useCallback } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Star, Users, BarChart3, FileText, ChevronDown, ChevronRight,
    RefreshCw, Filter, MessageSquare, CheckSquare, AlignLeft,
    List, Search, X, BookOpen, Layers, User
} from 'lucide-react';

/* ── Theme ──────────────────────────────────────────────────────────────── */
const T = {
    bg:     { page: '#0f1117', card: '#161b27', input: '#1c2333', hover: '#1e2636', deep: '#121520' },
    border: { subtle: 'rgba(255,255,255,0.07)', light: 'rgba(255,255,255,0.12)' },
    text:   { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b', label: '#475569' },
    accent: { blue: '#3b82f6', green: '#22c55e', yellow: '#f59e0b', red: '#ef4444', purple: '#a855f7', cyan: '#06b6d4', orange: '#f97316' },
    radius: { sm: '8px', md: '10px', lg: '14px', full: '9999px' },
};

/* ── Micro components ────────────────────────────────────────────────────── */
const Card = ({ children, style = {}, noPadding }) => (
    <div style={{ background: T.bg.card, border: `1px solid ${T.border.subtle}`, borderRadius: T.radius.lg, padding: noPadding ? 0 : '20px', ...style }}>
        {children}
    </div>
);

const Pill = ({ children, color }) => (
    <span style={{ padding: '2px 10px', borderRadius: T.radius.full, background: `${color}15`, color, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
        {children}
    </span>
);

const Stat = ({ icon, label, value, color }) => (
    <Card style={{ flex: 1, minWidth: '140px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: T.radius.md, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: T.text.primary, lineHeight: 1 }}>{value ?? '—'}</div>
                <div style={{ fontSize: '11px', color: T.text.muted, marginTop: '3px', fontWeight: 600 }}>{label}</div>
            </div>
        </div>
    </Card>
);

const Sel = ({ label, value, onChange, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.text.label }}>{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: T.radius.md, background: T.bg.input, border: `1px solid ${T.border.light}`, color: T.text.primary, fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer', minWidth: '190px' }}>
            {children}
        </select>
    </div>
);

/* ── Star display ─────────────────────────────────────────────────────────── */
const StarDisplay = ({ value }) => {
    const n = parseInt(value, 10) || 0;
    return (
        <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
            {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: '15px', color: s <= n ? '#f59e0b' : T.text.label }}>★</span>
            ))}
            <span style={{ marginLeft: '5px', fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>{n}/5</span>
        </span>
    );
};

/* ── QA row inside expanded student response ─────────────────────────────── */
const iconMap = {
    star: <Star size={12} />, star_rating: <Star size={12} />,
    short: <AlignLeft size={12} />, paragraph: <AlignLeft size={12} />, text: <AlignLeft size={12} />,
    radio: <List size={12} />, dropdown: <List size={12} />,
    checkbox: <CheckSquare size={12} />,
};

const QARow = ({ field, answer, isLast }) => {
    const type = field.type;
    let answerEl;
    if (answer === undefined || answer === null || answer === '') {
        answerEl = <span style={{ color: T.text.muted, fontStyle: 'italic', fontSize: '12px' }}>No answer</span>;
    } else if (type === 'star' || type === 'star_rating') {
        answerEl = <StarDisplay value={answer} />;
    } else if (type === 'checkbox') {
        const items = Array.isArray(answer) ? answer : [answer];
        answerEl = (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {items.map((v, i) => <Pill key={i} color={T.accent.blue}>{v}</Pill>)}
            </div>
        );
    } else {
        answerEl = <span style={{ fontSize: '13px', color: T.text.primary, lineHeight: 1.5 }}>{String(answer)}</span>;
    }

    return (
        <div style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: isLast ? 'none' : `1px solid ${T.border.subtle}` }}>
            <div style={{ width: '18px', color: T.text.muted, flexShrink: 0, paddingTop: '2px' }}>
                {iconMap[type] || <MessageSquare size={12} />}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: T.text.secondary, marginBottom: '5px' }}>{field.label || field.question}</div>
                {answerEl}
            </div>
        </div>
    );
};

/* ── Student row — expandable ────────────────────────────────────────────── */
const StudentRow = ({ report, idx, isLast }) => {
    const [open, setOpen] = useState(false);
    const name = `${report.first_name ?? ''} ${report.last_name ?? ''}`.trim() || report.email;
    const date = new Date(report.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = new Date(report.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    let fields = [];
    try {
        const fj = typeof report.form_json === 'string' ? JSON.parse(report.form_json) : report.form_json;
        fields = fj?.fields || [];
    } catch (_) {}

    let responses = {};
    try {
        responses = typeof report.response_json === 'string' ? JSON.parse(report.response_json) : (report.response_json || {});
    } catch (_) {}

    const starFields = fields.filter(f => f.type === 'star' || f.type === 'star_rating');
    const avgStar = starFields.length
        ? (starFields.reduce((s, f) => s + (parseInt(responses[f.id ?? f.label], 10) || 0), 0) / starFields.length).toFixed(1)
        : null;

    return (
        <>
            {/* Student row */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr auto auto auto',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '11px 16px',
                    cursor: 'pointer',
                    borderBottom: (!isLast || open) ? `1px solid ${T.border.subtle}` : 'none',
                    background: open ? `${T.accent.blue}06` : 'transparent',
                    transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!open) e.currentTarget.style.background = T.bg.hover; }}
                onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
            >
                {/* Avatar */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${T.accent.blue}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent.blue, flexShrink: 0 }}>
                    <User size={14} />
                </div>
                {/* Name + email */}
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: T.text.primary }}>{name}</div>
                    <div style={{ fontSize: '11px', color: T.text.muted }}>{report.email}</div>
                </div>
                {/* Avg star */}
                <div>
                    {avgStar
                        ? <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>★ {avgStar}</span>
                        : <span style={{ fontSize: '11px', color: T.text.muted }}>—</span>
                    }
                </div>
                {/* Date */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: T.text.muted }}>{date}</div>
                    <div style={{ fontSize: '10px', color: T.text.label }}>{time}</div>
                </div>
                {/* Toggle */}
                <div style={{ color: T.accent.blue }}>
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            </div>

            {/* Expanded QA */}
            {open && (
                <div style={{
                    padding: '14px 20px 14px 60px',
                    borderBottom: isLast ? 'none' : `1px solid ${T.border.subtle}`,
                    background: T.bg.deep,
                }}>
                    {fields.length === 0
                        ? <p style={{ margin: 0, color: T.text.muted, fontSize: '12px' }}>No form schema available.</p>
                        : fields.map((f, fi) => {
                            const key = f.id ?? fi;
                            return <QARow key={key} field={f} answer={responses[key]} isLast={fi === fields.length - 1} />;
                        })
                    }
                </div>
            )}
        </>
    );
};

/* ── Module block ─────────────────────────────────────────────────────────── */
const ModuleBlock = ({ moduleName, formTitle, reports }) => {
    const [open, setOpen] = useState(true);

    const starVals = [];
    reports.forEach(r => {
        let fields = [], responses = {};
        try { const fj = typeof r.form_json === 'string' ? JSON.parse(r.form_json) : r.form_json; fields = fj?.fields || []; } catch(_) {}
        try { responses = typeof r.response_json === 'string' ? JSON.parse(r.response_json) : (r.response_json || {}); } catch(_) {}
        fields.filter(f => f.type === 'star' || f.type === 'star_rating').forEach(f => {
            const v = parseInt(responses[f.id ?? f.label], 10);
            if (v) starVals.push(v);
        });
    });
    const avgStar = starVals.length ? (starVals.reduce((a, b) => a + b, 0) / starVals.length).toFixed(1) : null;

    return (
        <div style={{ borderBottom: `1px solid ${T.border.subtle}` }}>
            {/* Module header */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '11px 16px 11px 32px',
                    cursor: 'pointer', background: `${T.accent.purple}06`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${T.accent.purple}10`}
                onMouseLeave={e => e.currentTarget.style.background = `${T.accent.purple}06`}
            >
                <Layers size={13} color={T.accent.purple} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: T.accent.purple, flex: 1 }}>
                    {moduleName || 'Unassigned Module'}
                </span>
                {formTitle && (
                    <span style={{ fontSize: '11px', color: T.text.muted }}>Form: {formTitle}</span>
                )}
                {avgStar && (
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', marginLeft: '10px' }}>★ {avgStar} avg</span>
                )}
                <Pill color={T.accent.purple}>{reports.length} {reports.length === 1 ? 'student' : 'students'}</Pill>
                <span style={{ color: T.accent.purple, marginLeft: '4px' }}>
                    {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
            </div>

            {/* Students */}
            {open && (
                <div>
                    {reports.map((r, i) => (
                        <StudentRow key={r.id} report={r} idx={i} isLast={i === reports.length - 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Course block ─────────────────────────────────────────────────────────── */
const CourseBlock = ({ courseName, reports }) => {
    const [open, setOpen] = useState(true);

    // Group by module (use module_name + form_id as key to separate forms within same module)
    const byModule = {};
    reports.forEach(r => {
        const key = `${r.module_name || 'no-module'}__${r.form_id}`;
        if (!byModule[key]) byModule[key] = { moduleName: r.module_name, formTitle: r.form_title, reports: [] };
        byModule[key].reports.push(r);
    });

    return (
        <div style={{ borderBottom: `1px solid ${T.border.subtle}` }}>
            {/* Course header */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 16px 12px 16px',
                    cursor: 'pointer', background: `${T.accent.cyan}05`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${T.accent.cyan}10`}
                onMouseLeave={e => e.currentTarget.style.background = `${T.accent.cyan}05`}
            >
                <BookOpen size={14} color={T.accent.cyan} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: T.accent.cyan, flex: 1 }}>
                    {courseName || 'No Course'}
                </span>
                <Pill color={T.accent.cyan}>{Object.keys(byModule).length} {Object.keys(byModule).length === 1 ? 'module' : 'modules'}</Pill>
                <Pill color={T.accent.green}>{reports.length} {reports.length === 1 ? 'response' : 'responses'}</Pill>
                <span style={{ color: T.accent.cyan, marginLeft: '4px' }}>
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
            </div>

            {/* Modules */}
            {open && Object.entries(byModule).map(([key, group]) => (
                <ModuleBlock key={key} moduleName={group.moduleName} formTitle={group.formTitle} reports={group.reports} />
            ))}
        </div>
    );
};

/* ── Batch block ─────────────────────────────────────────────────────────── */
const BatchBlock = ({ batchName, reports }) => {
    const [open, setOpen] = useState(true);

    // Group by course
    const byCourse = {};
    reports.forEach(r => {
        const key = r.course_name || 'No Course';
        if (!byCourse[key]) byCourse[key] = [];
        byCourse[key].push(r);
    });

    const totalStudents = new Set(reports.map(r => r.student_id)).size;

    return (
        <Card noPadding style={{ marginBottom: '14px' }}>
            {/* Batch header */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '15px 20px',
                    cursor: 'pointer',
                    borderBottom: open ? `1px solid ${T.border.light}` : 'none',
                    borderRadius: open ? `${T.radius.lg} ${T.radius.lg} 0 0` : T.radius.lg,
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg.hover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <div style={{ width: 36, height: 36, borderRadius: T.radius.md, background: `${T.accent.blue}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent.blue, flexShrink: 0 }}>
                    <Users size={16} />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 800, color: T.text.primary, flex: 1 }}>{batchName}</span>
                <Pill color={T.accent.blue}>{Object.keys(byCourse).length} {Object.keys(byCourse).length === 1 ? 'course' : 'courses'}</Pill>
                <Pill color={T.accent.green}>{totalStudents} {totalStudents === 1 ? 'student' : 'students'}</Pill>
                <Pill color={T.accent.yellow}>{reports.length} {reports.length === 1 ? 'response' : 'responses'}</Pill>
                <span style={{ color: T.text.muted, marginLeft: '6px' }}>
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
            </div>

            {/* Courses */}
            {open && Object.entries(byCourse).map(([courseName, courseReports]) => (
                <CourseBlock key={courseName} courseName={courseName} reports={courseReports} />
            ))}
        </Card>
    );
};

/* ── Main Page ───────────────────────────────────────────────────────────── */
export const SAFeedbackResponses = () => {
    const [loading, setLoading]         = useState(true);
    const [reports, setReports]         = useState([]);
    const [batches, setBatches]         = useState([]);
    const [forms, setForms]             = useState([]);
    const [stats, setStats]             = useState({});
    const [filterBatch, setFilterBatch] = useState('');
    const [filterForm, setFilterForm]   = useState('');
    const [search, setSearch]           = useState('');

    const load = useCallback(async (batchId, formId) => {
        setLoading(true);
        try {
            const params = {};
            if (batchId) params.batch_id = batchId;
            if (formId)  params.form_id  = formId;
            const res = await superAdminAPI.getFeedbackReports(params);
            setReports(res.data.reports || []);
            setBatches(res.data.batches || []);
            setForms(res.data.forms || []);
            setStats(res.data.stats || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load('', ''); }, [load]);

    const handleBatchChange = (v) => { setFilterBatch(v); setFilterForm(''); load(v, ''); };
    const handleFormChange  = (v) => { setFilterForm(v); load(filterBatch, v); };
    const clearFilters      = ()  => { setFilterBatch(''); setFilterForm(''); setSearch(''); load('', ''); };

    // Client-side search
    const filtered = reports.filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            `${r.first_name ?? ''} ${r.last_name ?? ''}`.toLowerCase().includes(q) ||
            r.email?.toLowerCase().includes(q) ||
            r.batch_name?.toLowerCase().includes(q) ||
            r.course_name?.toLowerCase().includes(q) ||
            r.module_name?.toLowerCase().includes(q) ||
            r.form_title?.toLowerCase().includes(q)
        );
    });

    // Group: Batch → Course → Module (done inside child components)
    const byBatch = {};
    filtered.forEach(r => {
        const key = r.batch_name || 'Unknown Batch';
        if (!byBatch[key]) byBatch[key] = [];
        byBatch[key].push(r);
    });

    const hasFilters = filterBatch || filterForm || search;

    return (
        <div style={{ padding: '28px', background: T.bg.page, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: T.text.primary }}>Feedback Responses</h1>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: T.text.muted }}>
                        Grouped by Batch → Course → Module → Student
                    </p>
                </div>
                <button onClick={() => load(filterBatch, filterForm)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: T.radius.md, border: `1px solid ${T.border.light}`, background: 'transparent', color: T.text.secondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <Stat icon={<MessageSquare size={18} />} label="Total Responses"  value={stats.total_responses}  color={T.accent.blue} />
                <Stat icon={<Users size={18} />}         label="Unique Students"  value={stats.unique_students}  color={T.accent.green} />
                <Stat icon={<BarChart3 size={18} />}     label="Batches"          value={stats.total_batches}    color={T.accent.yellow} />
                <Stat icon={<FileText size={18} />}      label="Forms Used"       value={stats.total_forms}      color={T.accent.purple} />
            </div>

            {/* Filters */}
            <Card style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap' }}>
                    <Filter size={15} color={T.text.muted} style={{ marginBottom: '2px', flexShrink: 0 }} />
                    <Sel label="Batch" value={filterBatch} onChange={handleBatchChange}>
                        <option value="">All Batches</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}{b.course_name ? ` — ${b.course_name}` : ''}</option>)}
                    </Sel>
                    <Sel label="Form / Module" value={filterForm} onChange={handleFormChange}>
                        <option value="">All Forms</option>
                        {forms.map(f => <option key={f.id} value={f.id}>{f.title}{f.module_name ? ` (${f.module_name})` : ''}</option>)}
                    </Sel>
                    {/* Search */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '200px' }}>
                        <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.text.label }}>Search</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: T.text.muted }} />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Student name, email, batch, module…"
                                style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: T.radius.md, background: T.bg.input, border: `1px solid ${T.border.light}`, color: T.text.primary, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                    {hasFilters && (
                        <button onClick={clearFilters}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 14px', borderRadius: T.radius.md, border: `1px solid ${T.accent.red}30`, background: `${T.accent.red}08`, color: T.accent.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' }}>
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>
            </Card>

            {/* Hierarchy legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[
                    { icon: <Users size={12} />,    label: 'Batch',   color: T.accent.blue },
                    { icon: '→' },
                    { icon: <BookOpen size={12} />, label: 'Course',  color: T.accent.cyan },
                    { icon: '→' },
                    { icon: <Layers size={12} />,   label: 'Module',  color: T.accent.purple },
                    { icon: '→' },
                    { icon: <User size={12} />,     label: 'Student', color: T.accent.green },
                ].map((item, i) => item.icon === '→'
                    ? <span key={i} style={{ color: T.text.label, fontSize: '12px' }}>→</span>
                    : (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: item.color }}>
                            {item.icon} {item.label}
                        </span>
                    )
                )}
                {!loading && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: T.text.muted, fontWeight: 600 }}>
                        {filtered.length} {filtered.length === 1 ? 'response' : 'responses'} · {Object.keys(byBatch).length} {Object.keys(byBatch).length === 1 ? 'batch' : 'batches'}
                    </span>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <Card style={{ textAlign: 'center', padding: '52px', color: T.text.muted }}>
                    <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite', marginBottom: '14px' }} />
                    <div style={{ fontSize: '14px' }}>Loading feedback responses…</div>
                </Card>
            ) : filtered.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '52px' }}>
                    <MessageSquare size={32} color={T.text.muted} style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '15px', fontWeight: 700, color: T.text.primary, marginBottom: '6px' }}>No responses found</div>
                    <div style={{ fontSize: '13px', color: T.text.muted }}>
                        {hasFilters ? 'Try adjusting your filters.' : 'No students have submitted feedback yet.'}
                    </div>
                </Card>
            ) : (
                Object.entries(byBatch).map(([batchName, batchReports]) => (
                    <BatchBlock key={batchName} batchName={batchName} reports={batchReports} />
                ))
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
