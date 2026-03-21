import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, Card, StatCard, FilterTabs, ActionButton, StatusBadge, EmptyState, LoadingSpinner, FormField, inputStyle, SectionTitle, theme,
} from './TrainerComponents';
import { User, Mail, Calendar, ClipboardList, MessageSquare, Plus, Trash2, CheckCircle, Percent, BookOpen, Award, Save, ArrowLeft } from 'lucide-react';

const GRADES = ['A', 'B', 'C', 'D', 'F'];

const gradeColor = (g) => {
    if (g === 'A') return theme.accent.green;
    if (g === 'B') return theme.accent.cyan;
    if (g === 'C') return theme.accent.yellow;
    if (g === 'D') return '#f97316';
    return theme.accent.red;
};

const marksColor = (m) => m == null ? theme.text.muted : m >= 80 ? theme.accent.green : m >= 60 ? theme.accent.yellow : theme.accent.red;

export const TrainerStudentProfile = () => {
    const { batchId, studentId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [remarks, setRemarks] = useState([]);
    const [reportModules, setReportModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('submissions');

    // Remark form
    const [remarkForm, setRemarkForm] = useState({ remark_text: '', remark_type: 'general' });
    const [submittingRemark, setSubmittingRemark] = useState(false);

    // Per-module review forms: { [moduleId]: { overall_marks, grade, strengths, improvements, overall_comment, saving, saved } }
    const [reviewForms, setReviewForms] = useState({});

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [perfRes, remRes, rcRes] = await Promise.all([
                    trainerAPI.getStudentPerformance(batchId, studentId),
                    trainerAPI.getStudentRemarks(batchId, studentId),
                    trainerAPI.getStudentReportCard(batchId, studentId),
                ]);
                setData(perfRes.data);
                setRemarks(remRes.data);
                const modules = rcRes.data.modules || [];
                setReportModules(modules);
                // Pre-fill forms from existing reviews
                const forms = {};
                modules.forEach(m => {
                    forms[m.id] = {
                        overall_marks: m.review?.overall_marks ?? '',
                        grade: m.review?.grade ?? '',
                        strengths: m.review?.strengths ?? '',
                        improvements: m.review?.improvements ?? '',
                        overall_comment: m.review?.overall_comment ?? '',
                        saving: false,
                        saved: !!m.review,
                    };
                });
                setReviewForms(forms);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, [batchId, studentId]);

    const handleAddRemark = async () => {
        if (!remarkForm.remark_text.trim()) return;
        setSubmittingRemark(true);
        try {
            await trainerAPI.addStudentRemark(batchId, studentId, remarkForm);
            const remRes = await trainerAPI.getStudentRemarks(batchId, studentId);
            setRemarks(remRes.data);
            setRemarkForm({ remark_text: '', remark_type: 'general' });
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setSubmittingRemark(false); }
    };

    const handleDeleteRemark = async (id) => {
        if (!confirm("Delete this remark?")) return;
        try {
            await trainerAPI.deleteStudentRemark(id);
            setRemarks(prev => prev.filter(r => r.id !== id));
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const setReviewField = (moduleId, field, value) => {
        setReviewForms(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], [field]: value, saved: false } }));
    };

    const handleSaveReview = async (moduleId) => {
        const form = reviewForms[moduleId];
        if (!form) return;
        setReviewForms(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], saving: true } }));
        try {
            await trainerAPI.upsertModuleReview(batchId, studentId, {
                module_id: moduleId,
                overall_marks: form.overall_marks !== '' ? form.overall_marks : null,
                grade: form.grade || null,
                strengths: form.strengths || null,
                improvements: form.improvements || null,
                overall_comment: form.overall_comment || null,
            });
            setReviewForms(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], saving: false, saved: true } }));
        } catch (err) {
            setReviewForms(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], saving: false } }));
            alert(err.response?.data?.message || 'Error saving review');
        }
    };

    if (loading) return <LoadingSpinner label="Loading student profile..." />;
    if (!data) return <EmptyState title="Student not found" icon={<User size={40} />} />;

    const tabs = [
        { value: 'submissions', label: 'Submissions' },
        { value: 'reportcard', label: 'Report Card' },
        { value: 'remarks', label: 'Remarks' },
    ];

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {/* Back button */}
            <button
                onClick={() => navigate('/trainer/batches')}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    marginBottom: '18px', padding: '8px 16px',
                    background: 'transparent',
                    border: `1.5px solid ${theme.border.subtle}`,
                    borderRadius: theme.radius.full,
                    color: theme.text.secondary, fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent.purple; e.currentTarget.style.color = theme.accent.purple; e.currentTarget.style.background = `${theme.accent.purple}08`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border.subtle; e.currentTarget.style.color = theme.text.secondary; e.currentTarget.style.background = 'transparent'; }}
            >
                <ArrowLeft size={14} />
                Back to My Batches
            </button>

            <PageHeader
                title={`${data.student.first_name} ${data.student.last_name}`}
                subtitle="Student Performance Dashboard & Remarks"
                icon={<User size={24} />}
                accentColor={theme.accent.blue}
            />

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <StatCard label="Attendance" value={`${Math.round(data.attendance.percentage)}%`} icon={<Percent size={18} />} accentColor={theme.accent.green} />
                <StatCard label="Submissions" value={data.submissions.length} icon={<ClipboardList size={18} />} accentColor={theme.accent.purple} />
                <StatCard label="Evaluated" value={data.submissions.filter(s => s.marks != null).length} icon={<CheckCircle size={18} />} accentColor={theme.accent.cyan} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
                {/* Left: Info & Add Remark */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Card>
                        <SectionTitle>Student Information</SectionTitle>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Mail size={14} color={theme.text.muted} />
                                <span style={{ fontSize: '13px', color: theme.text.secondary }}>{data.student.email}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Calendar size={14} color={theme.text.muted} />
                                <span style={{ fontSize: '13px', color: theme.text.secondary }}>{data.attendance.present} / {data.attendance.total} Sessions Present</span>
                            </div>
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme.border.subtle}` }}>
                                <label style={{ fontSize: '12px', color: theme.text.muted, fontWeight: 600, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Academic Status</label>
                                <select
                                    style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px', width: '100%', cursor: 'pointer' }}
                                    value={data.student.student_status || 'Regular'}
                                    onChange={async (e) => {
                                        if (e.target.value === 'Batch Transfer') return;
                                        try {
                                            await trainerAPI.updateStudentStatus(studentId, { student_status: e.target.value });
                                            setData(prev => ({ ...prev, student: { ...prev.student, student_status: e.target.value } }));
                                        } catch (err) { alert('Error updating status'); }
                                    }}
                                >
                                    <option value="Regular">Regular</option>
                                    <option value="Irregular">Irregular</option>
                                    <option value="Dropout">Dropout</option>
                                    <option value="Batch Transfer" disabled>Batch Transfer (Admins Only)</option>
                                    <option value="Course Completed">Course Completed</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <SectionTitle>Add New Remark</SectionTitle>
                        <FormField label="Remark Type">
                            <select style={inputStyle} value={remarkForm.remark_type} onChange={e => setRemarkForm(f => ({ ...f, remark_type: e.target.value }))}>
                                <option value="general">General</option>
                                <option value="academic">Academic Performance</option>
                                <option value="behavioral">Behavioral</option>
                                <option value="attendance">Attendance Related</option>
                            </select>
                        </FormField>
                        <FormField label="Remark Text">
                            <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Type your observation here..."
                                value={remarkForm.remark_text} onChange={e => setRemarkForm(f => ({ ...f, remark_text: e.target.value }))} />
                        </FormField>
                        <ActionButton onClick={handleAddRemark} icon={<Plus size={16} />} style={{ width: '100%', justifyContent: 'center' }}
                            disabled={submittingRemark || !remarkForm.remark_text.trim()}>
                            {submittingRemark ? 'Adding...' : 'Add Remark'}
                        </ActionButton>
                    </Card>
                </div>

                {/* Right: Tabs */}
                <Card noPadding>
                    <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.border.subtle}` }}>
                        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
                    </div>

                    <div style={{ padding: '24px' }}>

                        {/* ── SUBMISSIONS TAB ─────────────────────────────── */}
                        {activeTab === 'submissions' && (
                            data.submissions.length === 0
                                ? <EmptyState title="No submissions yet" icon={<BookOpen size={24} />} />
                                : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {data.submissions.map(sub => (
                                        <div key={sub.id} style={{ padding: '16px', borderRadius: theme.radius.md, background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <StatusBadge status={sub.submission_type === 'worksheet' ? 'pending' : 'active'} label={sub.submission_type?.replace('_', ' ') || ''} />
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary }}>{sub.module_name || `Day ${sub.day_number}`}</span>
                                                </div>
                                                <p style={{ fontSize: '11px', color: theme.text.muted, margin: 0 }}>Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</p>
                                                {sub.feedback && <p style={{ fontSize: '12px', color: theme.text.secondary, marginTop: '8px', fontStyle: 'italic' }}>"{sub.feedback}"</p>}
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {sub.marks != null
                                                    ? <span style={{ fontSize: '18px', fontWeight: 800, color: theme.accent.green }}>{sub.marks}<span style={{ fontSize: '12px', color: theme.text.muted }}>/100</span></span>
                                                    : <StatusBadge status="pending" label="Ungraded" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                        )}

                        {/* ── REPORT CARD TAB ──────────────────────────────── */}
                        {activeTab === 'reportcard' && (
                            reportModules.length === 0
                                ? <EmptyState title="No modules in this course" icon={<Award size={24} />} />
                                : <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {reportModules.map((m, idx) => {
                                        const form = reviewForms[m.id] || {};
                                        return (
                                            <div key={m.id} style={{ border: `1px solid ${theme.border.subtle}`, borderRadius: theme.radius.lg, overflow: 'hidden' }}>
                                                {/* Module header */}
                                                <div style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${theme.accent.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <span style={{ fontSize: '11px', fontWeight: 800, color: theme.accent.blue }}>{idx + 1}</span>
                                                        </div>
                                                        <span style={{ fontSize: '14px', fontWeight: 700, color: theme.text.primary }}>{m.name}</span>
                                                        {form.saved && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: `${theme.accent.green}15`, color: theme.accent.green, fontWeight: 700 }}>✓ Saved</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                        {m.test_marks != null && (
                                                            <div style={{ textAlign: 'center' }}>
                                                                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: theme.text.label, marginBottom: '2px' }}>Test</div>
                                                                <div style={{ fontSize: '16px', fontWeight: 800, color: marksColor(m.test_marks) }}>{m.test_marks}<span style={{ fontSize: '10px', color: theme.text.muted }}>/100</span></div>
                                                            </div>
                                                        )}
                                                        {m.project_marks != null && (
                                                            <div style={{ textAlign: 'center' }}>
                                                                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: theme.text.label, marginBottom: '2px' }}>Project{m.project_count > 1 ? ' (avg)' : ''}</div>
                                                                <div style={{ fontSize: '16px', fontWeight: 800, color: marksColor(m.project_marks) }}>{m.project_marks}<span style={{ fontSize: '10px', color: theme.text.muted }}>/100</span></div>
                                                            </div>
                                                        )}
                                                        {m.test_marks == null && m.project_marks == null && (
                                                            <span style={{ fontSize: '12px', color: theme.text.muted, fontStyle: 'italic' }}>No graded submissions yet</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Review form */}
                                                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                                        <div>
                                                            <label style={{ fontSize: '11px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Overall Marks (0–100)</label>
                                                            <input type="number" min="0" max="100" style={{ ...inputStyle, padding: '8px 12px' }}
                                                                placeholder="e.g. 82"
                                                                value={form.overall_marks}
                                                                onChange={e => setReviewField(m.id, 'overall_marks', e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '11px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Grade</label>
                                                            <select style={{ ...inputStyle, padding: '8px 12px' }}
                                                                value={form.grade}
                                                                onChange={e => setReviewField(m.id, 'grade', e.target.value)}>
                                                                <option value="">— Select —</option>
                                                                {GRADES.map(g => (
                                                                    <option key={g} value={g} style={{ color: gradeColor(g) }}>{g}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Strengths</label>
                                                        <textarea rows={2} style={{ ...inputStyle, resize: 'vertical', padding: '8px 12px' }}
                                                            placeholder="What the student did well..."
                                                            value={form.strengths}
                                                            onChange={e => setReviewField(m.id, 'strengths', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Areas for Improvement</label>
                                                        <textarea rows={2} style={{ ...inputStyle, resize: 'vertical', padding: '8px 12px' }}
                                                            placeholder="What needs improvement..."
                                                            value={form.improvements}
                                                            onChange={e => setReviewField(m.id, 'improvements', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Overall Comment</label>
                                                        <textarea rows={2} style={{ ...inputStyle, resize: 'vertical', padding: '8px 12px' }}
                                                            placeholder="General observation about this module..."
                                                            value={form.overall_comment}
                                                            onChange={e => setReviewField(m.id, 'overall_comment', e.target.value)} />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <ActionButton
                                                            onClick={() => handleSaveReview(m.id)}
                                                            icon={form.saving ? null : <Save size={14} />}
                                                            disabled={form.saving}
                                                            variant={form.saved ? 'ghost' : 'primary'}
                                                        >
                                                            {form.saving ? 'Saving...' : form.saved ? '✓ Saved' : 'Save Review'}
                                                        </ActionButton>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                        )}

                        {/* ── REMARKS TAB ──────────────────────────────────── */}
                        {activeTab === 'remarks' && (
                            remarks.length === 0
                                ? <EmptyState title="No remarks recorded" icon={<MessageSquare size={24} />} subtitle="Use the form on the left to add your first remark for this student." />
                                : <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {remarks.map(rem => (
                                        <div key={rem.id} style={{ padding: '16px', borderRadius: theme.radius.md, background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border.subtle}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: rem.remark_type === 'academic' ? `${theme.accent.blue}20` : rem.remark_type === 'behavioral' ? `${theme.accent.yellow}20` : `${theme.accent.purple}20`, color: rem.remark_type === 'academic' ? theme.accent.blue : rem.remark_type === 'behavioral' ? theme.accent.yellow : theme.accent.purple }}>
                                                        {rem.remark_type}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: theme.text.muted }}>{new Date(rem.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <button onClick={() => handleDeleteRemark(rem.id)} style={{ background: 'none', border: 'none', color: theme.text.muted, cursor: 'pointer', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = theme.accent.red} onMouseLeave={e => e.currentTarget.style.color = theme.text.muted}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <p style={{ fontSize: '13px', color: theme.text.primary, margin: 0, lineHeight: 1.5 }}>{rem.remark_text}</p>
                                            <p style={{ fontSize: '10px', color: theme.text.muted, marginTop: '8px', textAlign: 'right' }}>— {rem.trainer_name}</p>
                                        </div>
                                    ))}
                                </div>
                        )}
                    </div>
                </Card>
            </div>

            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
