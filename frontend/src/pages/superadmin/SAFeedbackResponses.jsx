import { useState, useEffect, useCallback } from 'react';
import { superAdminAPI } from '../../services/api';
import {
    Star, Users, BarChart3, FileText, ChevronDown, ChevronRight,
    RefreshCw, Filter, MessageSquare, CheckSquare, AlignLeft,
    List, Search, Download, X
} from 'lucide-react';

/* ── Theme ──────────────────────────────────────────────────────────────── */
const theme = {
    bg:     { page: '#0f1117', card: '#161b27', input: '#1c2333', hover: '#1e2636' },
    border: { subtle: 'rgba(255,255,255,0.07)', light: 'rgba(255,255,255,0.12)' },
    text:   { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b', label: '#475569' },
    accent: { blue: '#3b82f6', green: '#22c55e', yellow: '#f59e0b', red: '#ef4444', purple: '#a855f7', cyan: '#06b6d4' },
    radius: { sm: '8px', md: '10px', lg: '14px', full: '9999px' },
};

/* ── Small helpers ───────────────────────────────────────────────────────── */
const Card = ({ children, style = {}, noPadding }) => (
    <div style={{
        background: theme.bg.card, border: `1px solid ${theme.border.subtle}`,
        borderRadius: theme.radius.lg, padding: noPadding ? 0 : '20px',
        ...style
    }}>{children}</div>
);

const Stat = ({ icon, label, value, color }) => (
    <Card style={{ flex: 1, minWidth: '140px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: theme.radius.md, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: theme.text.primary, lineHeight: 1 }}>{value ?? '—'}</div>
                <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '3px', fontWeight: 600 }}>{label}</div>
            </div>
        </div>
    </Card>
);

const Sel = ({ label, value, onChange, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: theme.radius.md, background: theme.bg.input, border: `1px solid ${theme.border.light}`, color: theme.text.primary, fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer', minWidth: '200px' }}>
            {children}
        </select>
    </div>
);

/* Renders a star row for a star-rating answer */
const StarDisplay = ({ value }) => {
    const n = parseInt(value, 10) || 0;
    return (
        <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
            {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: '16px', color: s <= n ? '#f59e0b' : theme.text.label }}>★</span>
            ))}
            <span style={{ marginLeft: '6px', fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>{n}/5</span>
        </span>
    );
};

/* Renders checkbox array answer */
const CheckList = ({ value }) => {
    const items = Array.isArray(value) ? value : [value];
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {items.map((v, i) => (
                <span key={i} style={{ padding: '2px 9px', borderRadius: theme.radius.full, background: `${theme.accent.blue}15`, color: theme.accent.blue, fontSize: '11px', fontWeight: 600 }}>{v}</span>
            ))}
        </div>
    );
};

/* Render a single question+answer pair */
const QARow = ({ field, answer }) => {
    const type = field.type;
    let answerEl;
    if (answer === undefined || answer === null || answer === '') {
        answerEl = <span style={{ color: theme.text.muted, fontStyle: 'italic', fontSize: '12px' }}>No answer</span>;
    } else if (type === 'star' || type === 'star_rating') {
        answerEl = <StarDisplay value={answer} />;
    } else if (type === 'checkbox') {
        answerEl = <CheckList value={answer} />;
    } else {
        answerEl = <span style={{ fontSize: '13px', color: theme.text.primary }}>{String(answer)}</span>;
    }

    const iconMap = {
        star: <Star size={13} />, star_rating: <Star size={13} />,
        short: <AlignLeft size={13} />, paragraph: <AlignLeft size={13} />, text: <AlignLeft size={13} />,
        radio: <List size={13} />, dropdown: <List size={13} />,
        checkbox: <CheckSquare size={13} />,
    };

    return (
        <div style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${theme.border.subtle}` }}>
            <div style={{ width: '20px', color: theme.text.muted, flexShrink: 0, paddingTop: '2px' }}>{iconMap[type] || <MessageSquare size={13} />}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: theme.text.secondary, marginBottom: '4px' }}>{field.label || field.question}</div>
                {answerEl}
            </div>
        </div>
    );
};

/* ── ResponseRow (expandable) ────────────────────────────────────────────── */
const ResponseRow = ({ report, idx }) => {
    const [open, setOpen] = useState(false);
    const name = `${report.first_name} ${report.last_name}`.trim() || report.email;
    const date = new Date(report.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = new Date(report.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Parse form schema
    let fields = [];
    try {
        const formJson = typeof report.form_json === 'string' ? JSON.parse(report.form_json) : report.form_json;
        fields = formJson?.fields || [];
    } catch (_) {}

    // Parse responses
    let responses = {};
    try {
        responses = typeof report.response_json === 'string' ? JSON.parse(report.response_json) : (report.response_json || {});
    } catch (_) {}

    // Compute avg star rating if any star fields
    const starFields = fields.filter(f => f.type === 'star' || f.type === 'star_rating');
    const avgStar = starFields.length
        ? (starFields.reduce((s, f) => s + (parseInt(responses[f.id ?? f.label], 10) || 0), 0) / starFields.length).toFixed(1)
        : null;

    return (
        <>
            <tr
                onClick={() => setOpen(o => !o)}
                style={{ cursor: 'pointer', background: open ? theme.bg.hover : 'transparent', transition: 'background 0.15s' }}
                onMouseEnter={e => { if (!open) e.currentTarget.style.background = theme.bg.hover; }}
                onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
            >
                <td style={{ padding: '12px 16px', fontSize: '11px', color: theme.text.muted, fontWeight: 600 }}>{idx + 1}</td>
                <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary }}>{name}</div>
                    <div style={{ fontSize: '11px', color: theme.text.muted }}>{report.email}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: theme.text.secondary, fontWeight: 600 }}>{report.batch_name}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: theme.text.secondary }}>{report.module_name || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: theme.text.secondary }}>{report.form_title}</td>
                <td style={{ padding: '12px 16px' }}>
                    {avgStar ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>
                            ★ {avgStar}
                        </span>
                    ) : <span style={{ color: theme.text.muted, fontSize: '12px' }}>—</span>}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '11px', color: theme.text.muted }}>
                    <div>{date}</div><div style={{ opacity: 0.7 }}>{time}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: theme.accent.blue }}>{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
                </td>
            </tr>
            {open && (
                <tr>
                    <td colSpan={8} style={{ padding: '0 16px 16px', background: theme.bg.hover }}>
                        <div style={{ background: theme.bg.input, borderRadius: theme.radius.md, padding: '16px', marginTop: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label, marginBottom: '10px' }}>
                                {report.form_title} — Response by {name}
                            </div>
                            {fields.length === 0
                                ? <p style={{ color: theme.text.muted, fontSize: '13px', margin: 0 }}>No form schema available.</p>
                                : fields.map((f, fi) => {
                                    const key = f.id ?? fi;
                                    return <QARow key={key} field={f} answer={responses[key]} />;
                                })
                            }
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

/* ── Batch Group Accordion ───────────────────────────────────────────────── */
const BatchGroup = ({ batchName, reports }) => {
    const [open, setOpen] = useState(true);

    // Group by form within this batch
    const byForm = {};
    reports.forEach(r => {
        const key = `${r.form_id}`;
        if (!byForm[key]) byForm[key] = { title: r.form_title, module: r.module_name, reports: [] };
        byForm[key].reports.push(r);
    });

    return (
        <Card noPadding style={{ marginBottom: '12px' }}>
            {/* Batch header */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', cursor: 'pointer', borderBottom: open ? `1px solid ${theme.border.subtle}` : 'none',
                    borderRadius: open ? `${theme.radius.lg} ${theme.radius.lg} 0 0` : theme.radius.lg,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={16} color={theme.accent.blue} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: theme.text.primary }}>{batchName}</span>
                    <span style={{ padding: '2px 10px', borderRadius: theme.radius.full, background: `${theme.accent.blue}15`, color: theme.accent.blue, fontSize: '11px', fontWeight: 700 }}>
                        {reports.length} {reports.length === 1 ? 'response' : 'responses'}
                    </span>
                    <span style={{ padding: '2px 10px', borderRadius: theme.radius.full, background: `${theme.accent.purple}15`, color: theme.accent.purple, fontSize: '11px', fontWeight: 700 }}>
                        {Object.keys(byForm).length} {Object.keys(byForm).length === 1 ? 'form' : 'forms'}
                    </span>
                </div>
                {open ? <ChevronDown size={16} color={theme.text.muted} /> : <ChevronRight size={16} color={theme.text.muted} />}
            </div>

            {open && Object.entries(byForm).map(([fid, group], gi) => (
                <div key={fid} style={{ borderBottom: gi < Object.keys(byForm).length - 1 ? `1px solid ${theme.border.subtle}` : 'none' }}>
                    {/* Form sub-header */}
                    <div style={{ padding: '10px 20px', background: `${theme.accent.purple}08`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={13} color={theme.accent.purple} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: theme.accent.purple }}>{group.title}</span>
                        {group.module && (
                            <span style={{ fontSize: '11px', color: theme.text.muted }}>· Module: {group.module}</span>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: theme.text.muted, fontWeight: 600 }}>{group.reports.length} submissions</span>
                    </div>
                    {/* Responses table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: theme.bg.input }}>
                                    {['#', 'Student', 'Batch', 'Module', 'Form', 'Avg ★', 'Submitted', ''].map(h => (
                                        <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {group.reports.map((r, i) => <ResponseRow key={r.id} report={r} idx={i} />)}
                            </tbody>
                        </table>
                    </div>
                </div>
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

    // Client-side search
    const filtered = reports.filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
            r.email?.toLowerCase().includes(q) ||
            r.batch_name?.toLowerCase().includes(q) ||
            r.form_title?.toLowerCase().includes(q) ||
            r.module_name?.toLowerCase().includes(q)
        );
    });

    // Group filtered by batch
    const byBatch = {};
    filtered.forEach(r => {
        if (!byBatch[r.batch_name]) byBatch[r.batch_name] = [];
        byBatch[r.batch_name].push(r);
    });

    return (
        <div style={{ padding: '28px', background: theme.bg.page, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: theme.text.primary }}>Feedback Responses</h1>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: theme.text.muted }}>Module-wise and batch-wise student feedback overview</p>
                </div>
                <button onClick={() => load(filterBatch, filterForm)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: theme.radius.md, border: `1px solid ${theme.border.light}`, background: 'transparent', color: theme.text.secondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <Stat icon={<MessageSquare size={18} />} label="Total Responses"  value={stats.total_responses}  color={theme.accent.blue} />
                <Stat icon={<Users size={18} />}         label="Unique Students"  value={stats.unique_students}  color={theme.accent.green} />
                <Stat icon={<BarChart3 size={18} />}     label="Batches"          value={stats.total_batches}    color={theme.accent.yellow} />
                <Stat icon={<FileText size={18} />}      label="Forms Used"       value={stats.total_forms}      color={theme.accent.purple} />
            </div>

            {/* Filters */}
            <Card style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
                    <Filter size={16} color={theme.text.muted} style={{ marginBottom: '2px' }} />
                    <Sel label="Batch" value={filterBatch} onChange={handleBatchChange}>
                        <option value="">All Batches</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                    </Sel>
                    <Sel label="Form / Module" value={filterForm} onChange={handleFormChange}>
                        <option value="">All Forms</option>
                        {forms.map(f => <option key={f.id} value={f.id}>{f.title}{f.module_name ? ` (${f.module_name})` : ''}</option>)}
                    </Sel>
                    {/* Search */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '200px' }}>
                        <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>Search</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: theme.text.muted }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Student, email, batch, form..."
                                style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: theme.radius.md, background: theme.bg.input, border: `1px solid ${theme.border.light}`, color: theme.text.primary, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                    {(filterBatch || filterForm || search) && (
                        <button onClick={() => { setFilterBatch(''); setFilterForm(''); setSearch(''); load('', ''); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 14px', borderRadius: theme.radius.md, border: `1px solid ${theme.accent.red}30`, background: `${theme.accent.red}08`, color: theme.accent.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '0', alignSelf: 'flex-end' }}>
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>
            </Card>

            {/* Content */}
            {loading ? (
                <Card style={{ textAlign: 'center', padding: '48px', color: theme.text.muted }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
                    <div style={{ fontSize: '14px' }}>Loading feedback responses…</div>
                </Card>
            ) : filtered.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '48px' }}>
                    <MessageSquare size={32} color={theme.text.muted} style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '15px', fontWeight: 700, color: theme.text.primary, marginBottom: '6px' }}>No responses found</div>
                    <div style={{ fontSize: '13px', color: theme.text.muted }}>
                        {search || filterBatch || filterForm ? 'Try adjusting your filters.' : 'No students have submitted feedback yet.'}
                    </div>
                </Card>
            ) : (
                <>
                    <div style={{ marginBottom: '12px', fontSize: '12px', color: theme.text.muted, fontWeight: 600 }}>
                        Showing {filtered.length} {filtered.length === 1 ? 'response' : 'responses'} across {Object.keys(byBatch).length} {Object.keys(byBatch).length === 1 ? 'batch' : 'batches'}
                    </div>
                    {Object.entries(byBatch).map(([batchName, batchReports]) => (
                        <BatchGroup key={batchName} batchName={batchName} reports={batchReports} />
                    ))}
                </>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
