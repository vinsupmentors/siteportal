import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, Card, FilterTabs, ActionButton, StatusBadge, EmptyState, LoadingSpinner, FormField, SectionTitle, inputStyle, theme,
} from './TrainerComponents';
import { ClipboardList, ChevronRight, FileText, CheckCircle, Download, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrainerSubmissions = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [allSubmissions, setAllSubmissions] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await trainerAPI.getMyCalendar();
                const activeBatches = res.data.batches || [];
                setBatches(activeBatches);
                if (activeBatches.length > 0) setSelectedBatch(activeBatches[activeBatches.length - 1].id);
            } catch (err) { console.error(err); }
        })();
    }, []);

    useEffect(() => {
        if (selectedBatch) fetchSubmissions();
    }, [selectedBatch]);

    // Client-side filter whenever typeFilter or allSubmissions changes
    useEffect(() => {
        if (typeFilter === 'all') {
            setSubmissions(allSubmissions);
        } else {
            setSubmissions(allSubmissions.filter(s => s.release_type === typeFilter));
        }
    }, [typeFilter, allSubmissions]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await trainerAPI.getBatchReleaseSubmissions(selectedBatch);
            setAllSubmissions(res.data.submissions || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleDownloadFile = async (submissionId, fileName) => {
        setDownloading(true);
        try {
            const res = await trainerAPI.downloadReleaseSubmissionFile(submissionId);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'submission';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Could not download file');
        } finally { setDownloading(false); }
    };

    const handleGrade = async () => {
        if (!gradeForm.marks) return;
        setSaving(true);
        try {
            await trainerAPI.gradeReleaseSubmission(gradingSubmission.id, gradeForm);
            setAllSubmissions(prev => prev.map(s =>
                s.id === gradingSubmission.id
                    ? { ...s, marks: gradeForm.marks, feedback: gradeForm.feedback, status: 'graded' }
                    : s
            ));
            setGradingSubmission(null);
            setGradeForm({ marks: '', feedback: '' });
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setSaving(false); }
    };

    const typeLabel = (type) => {
        const labels = {
            module_test: 'Module Test',
            module_project: 'Project',
            capstone_project: 'Capstone',
            module_feedback: 'Feedback',
            module_study_material: 'Study Material',
            module_interview_questions: 'Interview Qs',
        };
        return labels[type] || (type || '').replace(/_/g, ' ');
    };

    const typeBadgeStatus = (type) => {
        if (type === 'module_test') return 'active';
        if (type === 'module_project' || type === 'capstone_project') return 'resolved';
        return 'pending';
    };

    const tabs = [
        { value: 'all', label: 'All' },
        { value: 'module_test', label: 'Tests' },
        { value: 'module_project', label: 'Projects' },
        { value: 'capstone_project', label: 'Capstone' },
    ];

    if (loading) return <LoadingSpinner label="Loading submissions..." />;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Student Submissions"
                subtitle="Review and grade student work submissions"
                icon={<ClipboardList size={24} />}
                accentColor={theme.accent.purple}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Card noPadding>
                        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <select
                                    style={{ ...inputStyle, width: '200px', padding: '8px 12px' }}
                                    value={selectedBatch}
                                    onChange={(e) => setSelectedBatch(e.target.value)}
                                >
                                    <option value="">Select Batch</option>
                                    {Object.entries(batches.reduce((acc, b) => {
                                        if (!acc[b.batch_name]) acc[b.batch_name] = [];
                                        acc[b.batch_name].push(b);
                                        return acc;
                                    }, {})).map(([bn, cs]) => (
                                        <optgroup key={bn} label={bn}>
                                            {cs.map(b => <option key={b.id} value={b.id}>{b.course_name}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                                <FilterTabs tabs={tabs} active={typeFilter} onChange={(v) => setTypeFilter(v)} />
                            </div>
                            <span style={{ fontSize: '12px', color: theme.text.muted }}>
                                {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {submissions.length === 0 ? (
                            <EmptyState icon={<FileText size={40} />} title="No submissions found" subtitle="Select a batch or check back later." />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${theme.border.subtle}` }}>
                                            <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label }}>Student</th>
                                            <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label }}>Type</th>
                                            <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label }}>Submitted</th>
                                            <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label }}>Status</th>
                                            <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label }}>Marks</th>
                                            <th style={{ padding: '16px 24px', textAlign: 'right' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map(sub => (
                                            <tr key={sub.id}
                                                style={{ borderBottom: `1px solid ${theme.border.subtle}`, transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = theme.bg.cardHover}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <Link to={`/trainer/student-profile/${selectedBatch}/${sub.student_id}`} style={{ textDecoration: 'none' }}>
                                                        <p style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>{sub.student_name}</p>
                                                        <p style={{ fontSize: '11px', color: theme.text.muted, margin: 0 }}>{sub.email}</p>
                                                    </Link>
                                                </td>
                                                <td style={{ padding: '16px 12px' }}>
                                                    <StatusBadge status={typeBadgeStatus(sub.release_type)} label={typeLabel(sub.release_type)} />
                                                </td>
                                                <td style={{ padding: '16px 12px', fontSize: '12px', color: theme.text.muted }}>
                                                    {new Date(sub.submitted_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '16px 12px' }}>
                                                    <StatusBadge
                                                        status={sub.status === 'graded' ? 'resolved' : 'pending'}
                                                        label={sub.status || 'submitted'}
                                                    />
                                                </td>
                                                <td style={{ padding: '16px 12px' }}>
                                                    {sub.marks != null ? (
                                                        <span style={{ fontSize: '13px', fontWeight: 700, color: theme.accent.green }}>{sub.marks}/100</span>
                                                    ) : (
                                                        <span style={{ fontSize: '12px', color: theme.text.label }}>Pending</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                    <ActionButton
                                                        variant={sub.marks != null ? 'ghost' : 'success'}
                                                        icon={<ChevronRight size={14} />}
                                                        onClick={() => {
                                                            setGradingSubmission(sub);
                                                            setGradeForm({ marks: sub.marks || '', feedback: sub.feedback || '' });
                                                        }}
                                                    >
                                                        {sub.marks != null ? 'Update' : 'Grade'}
                                                    </ActionButton>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                <div style={{ position: 'sticky', top: '20px' }}>
                    {gradingSubmission ? (
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <SectionTitle>Grading Submission</SectionTitle>
                                <button onClick={() => setGradingSubmission(null)} style={{ background: 'none', border: 'none', color: theme.text.muted, cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                            </div>

                            {/* Student info */}
                            <div style={{ marginBottom: '16px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary, margin: '0 0 2px' }}>{gradingSubmission.student_name}</p>
                                <p style={{ fontSize: '11px', color: theme.text.muted, margin: 0 }}>{typeLabel(gradingSubmission.release_type)}</p>
                            </div>

                            {/* Submitted work */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: theme.radius.sm, marginBottom: '16px' }}>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', marginBottom: '8px' }}>Submitted Work</p>

                                {gradingSubmission.file_name ? (
                                    <button
                                        onClick={() => handleDownloadFile(gradingSubmission.id, gradingSubmission.file_name)}
                                        disabled={downloading}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: theme.accent.blue, fontSize: '13px', fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer', padding: 0, opacity: downloading ? 0.6 : 1 }}
                                    >
                                        <Download size={15} />
                                        {downloading ? 'Downloading...' : gradingSubmission.file_name}
                                    </button>
                                ) : null}

                                {gradingSubmission.github_link ? (
                                    <a
                                        href={gradingSubmission.github_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: theme.accent.blue, fontSize: '13px', fontWeight: 600, marginTop: gradingSubmission.file_name ? '8px' : 0 }}
                                    >
                                        <Link2 size={15} />
                                        View GitHub Link
                                    </a>
                                ) : null}

                                {!gradingSubmission.file_name && !gradingSubmission.github_link ? (
                                    <span style={{ fontSize: '12px', color: theme.text.muted }}>No file or link submitted</span>
                                ) : null}

                                {gradingSubmission.notes ? (
                                    <p style={{ fontSize: '12px', color: theme.text.secondary, marginTop: '10px', borderTop: `1px solid ${theme.border.subtle}`, paddingTop: '8px' }}>
                                        <strong>Note:</strong> {gradingSubmission.notes}
                                    </p>
                                ) : null}
                            </div>

                            <FormField label="Marks (out of 100)">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    style={inputStyle}
                                    placeholder="Enter marks"
                                    value={gradeForm.marks}
                                    onChange={e => setGradeForm(f => ({ ...f, marks: e.target.value }))}
                                />
                            </FormField>

                            <FormField label="Feedback">
                                <textarea
                                    rows={4}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                    placeholder="Provide detailed feedback..."
                                    value={gradeForm.feedback}
                                    onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))}
                                />
                            </FormField>

                            <ActionButton
                                onClick={handleGrade}
                                icon={<CheckCircle size={16} />}
                                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                                disabled={saving || !gradeForm.marks}
                            >
                                {saving ? 'Saving...' : 'Submit Grade'}
                            </ActionButton>
                        </Card>
                    ) : (
                        <Card>
                            <SectionTitle>Instructions</SectionTitle>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    'Select a batch from the dropdown to load submissions.',
                                    'Use the type filter tabs to narrow by test, project, or capstone.',
                                    'Click "Grade" on any row to open the grading panel and download the student\'s file.',
                                ].map((text, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${theme.accent.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: theme.accent.blue }}>{i + 1}</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: theme.text.secondary, margin: 0 }}>{text}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
