import { useState, useEffect, useRef } from 'react';
import { studentAPI } from '../../services/api';
import theme from './theme';
import {
    PageHeader, Card, EmptyState, LoadingSpinner,
    ActionButton, StatCard,
} from './StudentComponents';
import {
    BookOpen, Search, Upload, CheckCircle,
    FileText, FolderOpen, ExternalLink, Briefcase,
    HelpCircle, FileSignature, Star, Send, X, Calendar,
    AlertCircle, Edit2, Award,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
    if (!d) return null;
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return null; }
};

const isOverdue = (d) => d && new Date(d) < new Date();

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

// All files served from DB via /api/files/:id
const fileUrl = (fileId) => `${API_BASE}/api/files/${fileId}`;

// ─── Release type config ───────────────────────────────────────────────────────
const TYPE_META = {
    module_project:             { label: 'Project',            color: theme.accent.blue,   icon: Briefcase,     submittable: true  },
    module_test:                { label: 'Test',               color: theme.accent.yellow, icon: FileSignature, submittable: true  },
    module_feedback:            { label: 'Feedback Form',      color: theme.accent.green,  icon: Star,          submittable: false, fillable: true },
    module_study_material:      { label: 'Study Materials',    color: theme.accent.purple, icon: BookOpen,      submittable: false },
    module_interview_questions: { label: 'Interview Q&A',      color: '#06b6d4',           icon: HelpCircle,    submittable: false },
    capstone_project:           { label: 'Capstone Project',   color: '#f97316',           icon: Award,         submittable: true  },
};

// ─── File link button — opens in new tab ──────────────────────────────────────
const FileLink = ({ file, color }) => (
    <a
        href={fileUrl(file.id)}
        target="_blank"
        rel="noopener noreferrer"
        style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: theme.radius.sm,
            background: `${color || theme.accent.blue}10`,
            border: `1px solid ${color || theme.accent.blue}25`,
            color: color || theme.accent.blue,
            fontSize: '12px', fontWeight: 600, textDecoration: 'none',
            transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
        <ExternalLink size={13} /> {file.original_name}
    </a>
);

// ══════════════════════════════════════════════════════════════════════════════
// SUBMIT MODAL
// ══════════════════════════════════════════════════════════════════════════════
const SubmitModal = ({ release, onClose, onDone }) => {
    const [file, setFile] = useState(null);
    const [link, setLink] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const fileRef = useRef();
    const meta = TYPE_META[release.release_type] || {};
    const Icon = meta.icon || FileText;

    const handleSubmit = async () => {
        if (!file && !link.trim()) return alert('Please upload a file or provide a link');
        setSubmitting(true);
        try {
            const fd = new FormData();
            if (file) fd.append('file', file);
            if (link) fd.append('github_link', link);
            if (notes) fd.append('notes', notes);
            await studentAPI.submitReleaseWork(release.id, fd);
            onDone();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Submission failed');
        } finally { setSubmitting(false); }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300, padding: '16px',
        }} onClick={onClose}>
            <div style={{
                background: theme.bg.card, borderRadius: theme.radius.lg,
                border: `1px solid ${meta.color || theme.accent.blue}30`,
                padding: '28px', width: '100%', maxWidth: '460px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                animation: 'modalIn 0.2s ease-out',
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: theme.radius.md, flexShrink: 0,
                        background: `${meta.color}20`, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: meta.color,
                    }}>
                        <Icon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: theme.text.primary }}>
                            {release.submission_id ? 'Update Submission' : 'Submit Work'}
                        </div>
                        <div style={{ fontSize: '12px', color: theme.text.muted, marginTop: '2px' }}>{release.name}</div>
                        {release.due_date && (
                            <div style={{ fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: isOverdue(release.due_date) ? '#f87171' : theme.text.muted }}>
                                <Calendar size={11} /> Due: {fmtDate(release.due_date)}
                                {isOverdue(release.due_date) && ' · Late submission'}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text.muted }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.text.label, marginBottom: '8px' }}>
                        Upload File (PDF, ZIP, DOCX, etc.)
                    </div>
                    <div onClick={() => fileRef.current?.click()} style={{
                        border: `2px dashed ${file ? `${meta.color}50` : theme.border.subtle}`,
                        borderRadius: theme.radius.md, padding: '20px', textAlign: 'center',
                        cursor: 'pointer', background: file ? `${meta.color}08` : 'transparent',
                    }}>
                        {file ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                <CheckCircle size={16} color={meta.color} />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text.primary }}>{file.name}</span>
                                <button onClick={e => { e.stopPropagation(); setFile(null); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text.muted }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload size={20} color={theme.text.muted} style={{ marginBottom: '8px' }} />
                                <div style={{ fontSize: '13px', color: theme.text.muted }}>Click to choose a file</div>
                            </>
                        )}
                        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                    </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '11px', color: theme.text.muted, margin: '8px 0' }}>— OR —</div>

                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.text.label, marginBottom: '6px' }}>
                        GitHub / Drive / Portfolio Link
                    </div>
                    <input type="url" value={link} onChange={e => setLink(e.target.value)}
                        placeholder="https://github.com/your-repo"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: theme.radius.md, background: theme.bg.input, border: `1px solid ${theme.border.subtle}`, color: theme.text.primary, outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.text.label, marginBottom: '6px' }}>
                        Notes (optional)
                    </div>
                    <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Any notes for your trainer..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: theme.radius.md, background: theme.bg.input, border: `1px solid ${theme.border.subtle}`, color: theme.text.primary, outline: 'none', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
                    <ActionButton onClick={handleSubmit} disabled={submitting || (!file && !link.trim())} icon={<Send size={14} />}>
                        {submitting ? 'Submitting...' : 'Submit'}
                    </ActionButton>
                </div>
            </div>
            <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
    );
};

// ─── Release Card ──────────────────────────────────────────────────────────────
const ReleaseCard = ({ release, onSubmit, onFillFeedback }) => {
    const meta = TYPE_META[release.release_type] || {};
    const Icon = meta.icon || FileText;
    const overdue = isOverdue(release.due_date);
    const submitted = !!release.submission_id;
    const graded = release.submission_status === 'graded';
    const feedbackSubmitted = release.already_submitted;

    return (
        <div style={{
            background: theme.bg.card,
            border: `1px solid ${submitted ? `${theme.accent.green}30` : theme.border.subtle}`,
            borderLeft: `4px solid ${meta.color || theme.accent.blue}`,
            borderRadius: theme.radius.lg, padding: '20px 22px',
            transition: 'box-shadow 0.2s', boxShadow: theme.shadow.card,
        }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = theme.shadow.cardHover}
            onMouseLeave={e => e.currentTarget.style.boxShadow = theme.shadow.card}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                    width: '44px', height: '44px', borderRadius: theme.radius.md, flexShrink: 0,
                    background: `${meta.color || theme.accent.blue}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: meta.color || theme.accent.blue,
                }}>
                    <Icon size={20} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>{release.name}</h3>
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: theme.radius.full, background: `${meta.color}15`, color: meta.color }}>
                            {meta.label}
                        </span>
                        {submitted && (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 10px', borderRadius: theme.radius.full, background: graded ? `${theme.accent.green}15` : `${theme.accent.blue}15`, color: graded ? theme.accent.green : theme.accent.blue, border: `1px solid ${graded ? `${theme.accent.green}30` : `${theme.accent.blue}30`}`, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={9} />
                                {graded ? `Graded · ${release.submission_marks}/100` : 'Submitted · Pending Review'}
                            </span>
                        )}
                    </div>

                    {release.due_date && (
                        <div style={{ fontSize: '12px', color: overdue && !submitted ? '#f87171' : theme.text.muted, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                            <Calendar size={12} /> Due: {fmtDate(release.due_date)}
                            {overdue && !submitted && <span style={{ color: '#f87171', fontWeight: 700 }}> · Overdue!</span>}
                        </div>
                    )}

                    {release.description && (
                        <p style={{ fontSize: '12px', color: theme.text.muted, margin: '0 0 8px', lineHeight: 1.5 }}>{release.description}</p>
                    )}

                    {/* Files — open in new tab via /api/files/:id */}
                    {release.files?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                            {release.files.map(f => <FileLink key={f.id} file={f} color={meta.color} />)}
                        </div>
                    )}

                    {/* External URL links */}
                    {release.material_url && (
                        <a href={release.material_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: theme.radius.sm, background: `${theme.accent.purple}10`, border: `1px solid ${theme.accent.purple}25`, color: theme.accent.purple, fontSize: '12px', fontWeight: 600, textDecoration: 'none', marginBottom: '8px', marginRight: '8px' }}>
                            <ExternalLink size={13} /> Open Study Material
                        </a>
                    )}
                    {release.test_url && (
                        <a href={release.test_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: theme.radius.sm, background: `${theme.accent.yellow}10`, border: `1px solid ${theme.accent.yellow}25`, color: theme.accent.yellow, fontSize: '12px', fontWeight: 600, textDecoration: 'none', marginBottom: '8px', marginRight: '8px' }}>
                            <ExternalLink size={13} /> Take Test
                        </a>
                    )}
                    {release.iq_url && (
                        <a href={release.iq_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: theme.radius.sm, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4', fontSize: '12px', fontWeight: 600, textDecoration: 'none', marginBottom: '8px' }}>
                            <ExternalLink size={13} /> View Interview Questions
                        </a>
                    )}

                    {graded && release.submission_feedback && (
                        <div style={{ background: `${theme.accent.green}08`, border: `1px solid ${theme.accent.green}20`, borderRadius: theme.radius.sm, padding: '10px 12px', fontSize: '12px', color: theme.text.secondary, lineHeight: 1.5 }}>
                            <strong style={{ color: theme.accent.green }}>Trainer feedback: </strong>
                            {release.submission_feedback}
                        </div>
                    )}
                </div>

                {meta.submittable && (
                    <button onClick={() => onSubmit(release)} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                        padding: '8px 16px', borderRadius: theme.radius.md, cursor: 'pointer',
                        fontSize: '12px', fontWeight: 700,
                        border: `1px solid ${submitted ? `${theme.accent.green}40` : `${meta.color}40`}`,
                        background: submitted ? `${theme.accent.green}15` : `${meta.color}15`,
                        color: submitted ? theme.accent.green : meta.color, transition: 'all 0.15s',
                    }}>
                        {submitted ? <><Edit2 size={12} /> Update</> : <><Upload size={12} /> Submit</>}
                    </button>
                )}
                {meta.fillable && (
                    feedbackSubmitted
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, padding: '8px 14px', borderRadius: theme.radius.md, fontSize: '12px', fontWeight: 700, background: `${theme.accent.green}15`, color: theme.accent.green, border: `1px solid ${theme.accent.green}30` }}>
                            <CheckCircle size={12} /> Submitted
                          </span>
                        : <button onClick={() => onFillFeedback(release)} style={{
                            display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                            padding: '8px 16px', borderRadius: theme.radius.md, cursor: 'pointer',
                            fontSize: '12px', fontWeight: 700,
                            border: `1px solid ${theme.accent.green}40`,
                            background: `${theme.accent.green}15`,
                            color: theme.accent.green, transition: 'all 0.15s',
                          }}>
                            <Star size={12} /> Fill Feedback
                          </button>
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export const StudentMaterials = () => {
    const [activeTab, setActiveTab] = useState('released');
    const [modules, setModules] = useState([]);
    const [currLoading, setCurrLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState(null);
    const [search, setSearch] = useState('');
    const [uploading, setUploading] = useState(null);
    const [releases, setReleases] = useState([]);
    const [relLoading, setRelLoading] = useState(true);
    const [submitModal, setSubmitModal] = useState(null);
    const [releaseFilter, setReleaseFilter] = useState('all');
    const [feedbackModal, setFeedbackModal] = useState(null); // { release }
    const [feedbackResponses, setFeedbackResponses] = useState({});
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

    useEffect(() => {
        studentAPI.getCurriculum()
            .then(res => {
                const mods = res.data?.modules || res.data || [];
                setModules(mods);
                const firstUnlocked = mods.find(m => m.is_unlocked !== false && (m.days || []).length > 0);
                if (firstUnlocked) setSelectedModule(firstUnlocked.id);
            })
            .catch(console.error)
            .finally(() => setCurrLoading(false));
    }, []);

    const loadReleases = () => {
        setRelLoading(true);
        studentAPI.getReleases()
            .then(res => setReleases(res.data?.releases || []))
            .catch(console.error)
            .finally(() => setRelLoading(false));
    };

    useEffect(() => { loadReleases(); }, []);

    const handleFileSubmit = async (dayId, file) => {
        if (!file) return;
        setUploading(dayId);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('day_id', dayId);
            await studentAPI.submitWorksheet(fd);
            const res = await studentAPI.getCurriculum();
            setModules(res.data?.modules || res.data || []);
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally { setUploading(null); }
    };

    const totalDays = modules.reduce((a, m) => a + (m.days || []).length, 0);
    const completedDays = modules.reduce((a, m) => a + (m.days || []).filter(d => d.submitted || d.submission_status === 'submitted').length, 0);
    const submittable = releases.filter(r => TYPE_META[r.release_type]?.submittable);
    const submitted = releases.filter(r => r.submission_id);
    const pending = submittable.filter(r => !r.submission_id);

    const filteredModules = modules.filter(m => (m.name || '').toLowerCase().includes(search.toLowerCase()));
    const active = selectedModule ? modules.find(m => m.id === selectedModule) : null;
    const days = active?.days || [];

    const RELEASE_FILTERS = [
        { key: 'all', label: `All (${releases.length})` },
        { key: 'pending', label: `Pending (${pending.length})` },
        { key: 'submitted', label: `Submitted (${submitted.length})` },
        { key: 'module_study_material', label: 'Materials' },
        { key: 'module_test', label: 'Tests' },
        { key: 'module_project', label: 'Projects' },
        { key: 'capstone_project', label: 'Capstone' },
        { key: 'module_interview_questions', label: 'Interview Q&A' },
    ];

    const filteredReleases = releases.filter(r => {
        if (releaseFilter === 'all') return true;
        if (releaseFilter === 'pending') return TYPE_META[r.release_type]?.submittable && !r.submission_id;
        if (releaseFilter === 'submitted') return !!r.submission_id;
        return r.release_type === releaseFilter;
    });

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Course Materials"
                subtitle="Access all resources assigned by your trainer"
                icon={<BookOpen size={24} />}
                accentColor={theme.accent.green}
            />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <StatCard icon={<FolderOpen size={22} />} label="Modules" value={modules.length} accentColor={theme.accent.blue} />
                <StatCard icon={<FileText size={22} />} label="Sessions" value={totalDays} accentColor={theme.accent.cyan} />
                <StatCard icon={<CheckCircle size={22} />} label="Worksheets Done" value={completedDays} accentColor={theme.accent.green} />
                <StatCard icon={<AlertCircle size={22} />} label="Pending Tasks" value={pending.length} accentColor={theme.accent.yellow} />
                <StatCard icon={<Send size={22} />} label="Submitted" value={submitted.length} accentColor={theme.accent.purple} />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: theme.bg.input, border: `1px solid ${theme.border.subtle}`, borderRadius: theme.radius.lg, padding: '5px', width: 'fit-content' }}>
                {[
                    { id: 'released', label: 'Assigned by Trainer', icon: Send },
                    { id: 'daily', label: 'Daily Content & Worksheets', icon: BookOpen },
                ].map(t => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '9px 20px', borderRadius: theme.radius.md, border: 'none',
                            cursor: 'pointer', fontSize: '13px', fontWeight: isActive ? 700 : 500,
                            background: isActive ? theme.bg.card : 'transparent',
                            color: isActive ? theme.text.primary : theme.text.muted,
                            boxShadow: isActive ? theme.shadow.card : 'none', transition: 'all 0.15s',
                        }}>
                            <Icon size={15} /> {t.label}
                            {t.id === 'released' && pending.length > 0 && (
                                <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: theme.radius.full, background: `${theme.accent.yellow}20`, color: theme.accent.yellow }}>
                                    {pending.length} pending
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ══ TAB: ASSIGNED BY TRAINER ══ */}
            {activeTab === 'released' && (
                <div>
                    {relLoading ? <LoadingSpinner label="Loading assigned content..." /> :
                    releases.length === 0 ? (
                        <EmptyState icon={<Send size={32} />} title="Nothing assigned yet" message="Your trainer hasn't released any content yet. Check back soon." />
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                {RELEASE_FILTERS.map(f => (
                                    <button key={f.key} onClick={() => setReleaseFilter(f.key)} style={{
                                        padding: '6px 14px', borderRadius: theme.radius.full,
                                        border: `1px solid ${releaseFilter === f.key ? theme.accent.blue : theme.border.subtle}`,
                                        background: releaseFilter === f.key ? `${theme.accent.blue}15` : 'transparent',
                                        color: releaseFilter === f.key ? theme.accent.blue : theme.text.muted,
                                        cursor: 'pointer', fontSize: '11px', fontWeight: 700, transition: 'all 0.15s',
                                    }}>{f.label}</button>
                                ))}
                            </div>
                            {filteredReleases.length === 0 ? (
                                <EmptyState icon={<CheckCircle size={32} />} title="All caught up!" message="No items in this category." />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {filteredReleases.map(r => <ReleaseCard key={r.id} release={r} onSubmit={setSubmitModal} onFillFeedback={r2 => { setFeedbackModal(r2); setFeedbackResponses({}); }} />)}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ══ TAB: DAILY CONTENT ══ */}
            {activeTab === 'daily' && (
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
                    {/* Module sidebar */}
                    <div>
                        <div style={{ position: 'relative', marginBottom: '14px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.text.muted }} />
                            <input placeholder="Search modules..." value={search} onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', padding: '11px 14px 11px 40px', background: theme.bg.card, border: `1px solid ${theme.border.subtle}`, borderRadius: theme.radius.md, color: theme.text.primary, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        {currLoading ? <LoadingSpinner label="Loading..." /> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {filteredModules.map((mod, idx) => {
                                    const modDays = mod.days || [];
                                    const done = modDays.filter(d => d.submitted || d.submission_status === 'submitted').length;
                                    const isAct = selectedModule === mod.id;
                                    const progress = modDays.length ? Math.round((done / modDays.length) * 100) : 0;
                                    return (
                                        <button key={mod.id} onClick={() => setSelectedModule(isAct ? null : mod.id)} style={{
                                            width: '100%', textAlign: 'left', cursor: 'pointer',
                                            background: isAct ? `${theme.accent.green}10` : theme.bg.card,
                                            border: `1px solid ${isAct ? theme.accent.green + '40' : theme.border.subtle}`,
                                            borderRadius: theme.radius.md, padding: '14px 16px', transition: 'all 0.2s',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.muted }}>Module {idx + 1}</span>
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: progress === 100 ? theme.accent.green : theme.text.muted }}>{done}/{modDays.length}</span>
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: isAct ? theme.accent.green : theme.text.primary, marginBottom: '10px' }}>{mod.name}</div>
                                            <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
                                                <div style={{ height: '100%', borderRadius: '2px', width: `${progress}%`, background: progress === 100 ? theme.accent.green : theme.accent.blue, transition: 'width 0.3s' }} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Day content */}
                    <div>
                        {!active ? (
                            <EmptyState icon={<BookOpen size={32} />} title="Select a Module" message="Choose a module to view sessions and submit worksheets." />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Module-level resources */}
                                {(active.study_material_url || active.files?.length > 0 || active.interview_questions_url || active.test_url) && (
                                    <Card style={{ borderTop: `3px solid ${theme.accent.cyan}` }}>
                                        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '14px' }}>Module Resources</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {active.study_material_url && (
                                                <a href={active.study_material_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: theme.radius.sm, background: `${theme.accent.cyan}10`, border: `1px solid ${theme.accent.cyan}30`, color: theme.accent.cyan, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                                    <ExternalLink size={13} /> Study Material
                                                </a>
                                            )}
                                            {active.test_url && (
                                                <a href={active.test_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: theme.radius.sm, background: `${theme.accent.yellow}10`, border: `1px solid ${theme.accent.yellow}30`, color: theme.accent.yellow, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                                    <ExternalLink size={13} /> Take Test
                                                </a>
                                            )}
                                            {active.interview_questions_url && (
                                                <a href={active.interview_questions_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: theme.radius.sm, background: `${theme.accent.purple}10`, border: `1px solid ${theme.accent.purple}30`, color: theme.accent.purple, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                                    <ExternalLink size={13} /> Interview Qs
                                                </a>
                                            )}
                                            {/* Module files via /api/files/:id */}
                                            {(active.files || []).map(f => <FileLink key={f.id} file={f} color={theme.accent.cyan} />)}
                                        </div>
                                    </Card>
                                )}

                                {/* Days */}
                                {days.length === 0 ? (
                                    <EmptyState icon={<FileText size={32} />} title="No sessions yet" message="Sessions will appear here once your trainer unlocks them." />
                                ) : days.map((day, idx) => {
                                    const isSubmitted = day.submitted || day.submission_status === 'submitted';
                                    const files = day.content_files || [];

                                    return (
                                        <Card key={day.id} noPadding>
                                            <div style={{ height: '3px', background: isSubmitted ? theme.accent.green : theme.accent.blue }} />
                                            <div style={{ padding: '18px 22px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <span style={{ width: '34px', height: '34px', borderRadius: theme.radius.sm, flexShrink: 0, background: isSubmitted ? `${theme.accent.green}15` : `${theme.accent.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: isSubmitted ? theme.accent.green : theme.accent.blue }}>
                                                            {day.day_number || idx + 1}
                                                        </span>
                                                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>
                                                            {day.topic_name || `Day ${day.day_number || idx + 1}`}
                                                        </h4>
                                                    </div>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: theme.radius.full, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: isSubmitted ? `${theme.accent.green}15` : `${theme.accent.yellow}15`, color: isSubmitted ? theme.accent.green : theme.accent.yellow }}>
                                                        {isSubmitted ? <><CheckCircle size={12} /> Submitted</> : 'Pending'}
                                                    </span>
                                                </div>

                                                {/* Day files — use /api/files/:id for uploaded files, url for legacy */}
                                                {files.length > 0 && (
                                                    <div style={{ marginBottom: '12px' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '8px' }}>Materials</div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                            {files.map((f, fi) => (
                                                                f.id ? (
                                                                    <FileLink key={f.id} file={f} color={theme.accent.cyan} />
                                                                ) : f.url ? (
                                                                    <a key={fi} href={f.url} target="_blank" rel="noreferrer"
                                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: theme.radius.sm, background: `${theme.accent.cyan}10`, border: `1px solid ${theme.accent.cyan}25`, color: theme.accent.cyan, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                                                        <ExternalLink size={13} /> {f.original_name || f.name}
                                                                    </a>
                                                                ) : null
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {!isSubmitted && (
                                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: theme.radius.md, border: `1px dashed ${theme.border.light}`, cursor: 'pointer', color: theme.text.muted, fontSize: '12px', fontWeight: 600 }}>
                                                        {uploading === day.id ? (
                                                            <span style={{ color: theme.accent.blue }}>Uploading...</span>
                                                        ) : (
                                                            <>
                                                                <Upload size={14} /> Submit Worksheet
                                                                <input type="file" style={{ display: 'none' }} onChange={e => handleFileSubmit(day.id, e.target.files[0])} />
                                                            </>
                                                        )}
                                                    </label>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {submitModal && (
                <SubmitModal release={submitModal} onClose={() => setSubmitModal(null)} onDone={loadReleases} />
            )}

            {/* ── Inline Feedback Form Modal ── */}
            {feedbackModal && (() => {
                const questions = feedbackModal.form_questions || [];
                const handleFbSubmit = async () => {
                    setFeedbackSubmitting(true);
                    try {
                        await studentAPI.submitFeedback({
                            feedback_form_id: feedbackModal.entity_id,
                            release_id: feedbackModal.id,
                            responses: feedbackResponses,
                        });
                        setFeedbackModal(null);
                        setFeedbackResponses({});
                        loadReleases();
                    } catch (err) {
                        alert('Error: ' + (err.response?.data?.message || err.message));
                    } finally { setFeedbackSubmitting(false); }
                };
                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,17,32,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div style={{ background: theme.bg.card, borderRadius: theme.radius.lg, border: `1px solid ${theme.border.light}`, width: '100%', maxWidth: '620px', maxHeight: '85vh', overflowY: 'auto' }}>
                            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.accent.green, background: `${theme.accent.green}12`, padding: '3px 10px', borderRadius: '4px' }}>Feedback Form</span>
                                    <h2 style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 800, color: theme.text.primary }}>{feedbackModal.name}</h2>
                                </div>
                                <button onClick={() => setFeedbackModal(null)} style={{ background: 'none', border: 'none', color: theme.text.muted, cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {questions.length === 0 ? (
                                    <p style={{ color: theme.text.muted, fontSize: '13px', textAlign: 'center', padding: '20px' }}>No questions found in this form.</p>
                                ) : questions.map((q, idx) => {
                                    const qid = q.id || idx;
                                    const val = feedbackResponses[qid];
                                    return (
                                        <div key={qid} style={{ background: theme.bg.input, borderRadius: theme.radius.md, padding: '16px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text.primary, marginBottom: '10px' }}>
                                                <span style={{ color: theme.accent.blue, fontWeight: 800, marginRight: '8px' }}>{idx + 1}.</span>
                                                {q.question || q.label}
                                                {q.required && <span style={{ color: theme.accent.red, marginLeft: '4px' }}>*</span>}
                                            </div>
                                            {q.type === 'star_rating' && (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    {[1,2,3,4,5].map(s => (
                                                        <button key={s} type="button" onClick={() => setFeedbackResponses(p => ({ ...p, [qid]: s }))}
                                                            style={{ width: '40px', height: '40px', borderRadius: theme.radius.sm, border: `1px solid ${(val||0)>=s ? theme.accent.yellow : theme.border.subtle}`, background: (val||0)>=s ? `${theme.accent.yellow}20` : 'transparent', color: (val||0)>=s ? theme.accent.yellow : theme.text.muted, cursor: 'pointer', fontSize: '18px' }}>★</button>
                                                    ))}
                                                </div>
                                            )}
                                            {q.type === 'text' && (
                                                <textarea rows={3} placeholder="Type your answer..." value={val || ''} onChange={e => setFeedbackResponses(p => ({ ...p, [qid]: e.target.value }))}
                                                    style={{ width: '100%', padding: '10px 12px', borderRadius: theme.radius.sm, background: theme.bg.card, border: `1px solid ${theme.border.light}`, color: theme.text.primary, fontSize: '13px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                                            )}
                                            {(q.type === 'radio' || q.type === 'dropdown') && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {(q.options || []).map((opt, oi) => (
                                                        <button key={oi} onClick={() => setFeedbackResponses(p => ({ ...p, [qid]: opt }))}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: theme.radius.sm, border: `1px solid ${val===opt ? theme.accent.blue : theme.border.subtle}`, background: val===opt ? `${theme.accent.blue}12` : 'transparent', color: val===opt ? theme.accent.blue : theme.text.secondary, cursor: 'pointer', fontSize: '13px', fontWeight: val===opt ? 700 : 500, textAlign: 'left' }}>
                                                            <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${val===opt ? theme.accent.blue : theme.border.light}`, background: val===opt ? theme.accent.blue : 'transparent', flexShrink: 0 }} />
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {q.type === 'checkbox' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {(q.options || []).map((opt, oi) => {
                                                        const vals = val || [];
                                                        const checked = vals.includes(opt);
                                                        return (
                                                            <button key={oi} onClick={() => setFeedbackResponses(p => ({ ...p, [qid]: checked ? vals.filter(v => v !== opt) : [...vals, opt] }))}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: theme.radius.sm, border: `1px solid ${checked ? theme.accent.blue : theme.border.subtle}`, background: checked ? `${theme.accent.blue}12` : 'transparent', color: checked ? theme.accent.blue : theme.text.secondary, cursor: 'pointer', fontSize: '13px', fontWeight: checked ? 700 : 500, textAlign: 'left' }}>
                                                                <span style={{ width: '14px', height: '14px', borderRadius: '4px', border: `2px solid ${checked ? theme.accent.blue : theme.border.light}`, background: checked ? theme.accent.blue : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff' }}>{checked && '✓'}</span>
                                                                {opt}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button onClick={() => setFeedbackModal(null)} style={{ padding: '9px 20px', borderRadius: theme.radius.md, border: `1px solid ${theme.border.light}`, background: 'transparent', color: theme.text.secondary, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
                                <button onClick={handleFbSubmit} disabled={feedbackSubmitting} style={{ padding: '9px 20px', borderRadius: theme.radius.md, border: 'none', background: feedbackSubmitting ? theme.text.muted : theme.accent.green, color: '#fff', cursor: feedbackSubmitting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Send size={13} /> {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default StudentMaterials;