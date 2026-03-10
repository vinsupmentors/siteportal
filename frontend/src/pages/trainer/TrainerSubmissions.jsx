import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, Card, StatCard, FilterTabs, ActionButton, StatusBadge, EmptyState, LoadingSpinner, FormField, SectionTitle, inputStyle, theme,
} from './TrainerComponents';
import { ClipboardList, Filter, Search, ChevronRight, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrainerSubmissions = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
    const [saving, setSaving] = useState(false);

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
    }, [selectedBatch, typeFilter, page]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await trainerAPI.getBatchSubmissions(selectedBatch, typeFilter === 'all' ? '' : typeFilter, page);
            setSubmissions(res.data.submissions || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleGrade = async () => {
        if (!gradeForm.marks) return;
        setSaving(true);
        try {
            await trainerAPI.gradeSubmission(gradingSubmission.id, gradeForm);
            setSubmissions(prev => prev.map(s => s.id === gradingSubmission.id ? { ...s, marks: gradeForm.marks, feedback: gradeForm.feedback } : s));
            setGradingSubmission(null);
            setGradeForm({ marks: '', feedback: '' });
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setSaving(false); }
    };

    const tabs = [
        { value: 'all', label: 'All' },
        { value: 'worksheet', label: 'Worksheets' },
        { value: 'module_test', label: 'Tests' },
        { value: 'module_project', label: 'Projects' },
    ];

    if (loading && page === 1 && !gradingSubmission) return <LoadingSpinner label="Loading submissions..." />;

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
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <select
                                    style={{ ...inputStyle, width: '200px', padding: '8px 12px' }}
                                    value={selectedBatch}
                                    onChange={(e) => { setSelectedBatch(e.target.value); setPage(1); }}
                                >
                                    <option value="">Select Batch</option>
                                    {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                                </select>
                                <FilterTabs tabs={tabs} active={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} />
                            </div>
                        </div>

                        {submissions.length === 0 ? (
                            <EmptyState icon={<FileText size={40} />} title="No submissions found" subtitle="Select a batch or check back later." />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${theme.border.subtle}` }}>
                                            <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label }}>Student</th>
                                            <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label }}>Type / Topic</th>
                                            <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label }}>Date</th>
                                            <th style={{ padding: '16px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label }}>Marks</th>
                                            <th style={{ padding: '16px 24px', textAlign: 'right' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map(sub => (
                                            <tr key={sub.id} style={{ borderBottom: `1px solid ${theme.border.subtle}`, transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = theme.bg.cardHover}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <Link to={`/trainer/student-profile/${selectedBatch}/${sub.student_id}`} style={{ textDecoration: 'none' }}>
                                                        <p style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>{sub.first_name} {sub.last_name}</p>
                                                        <p style={{ fontSize: '11px', color: theme.text.muted, margin: 0 }}>{sub.email}</p>
                                                    </Link>
                                                </td>
                                                <td style={{ padding: '16px 12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <StatusBadge status={sub.submission_type === 'worksheet' ? 'pending' : sub.submission_type === 'module_test' ? 'active' : 'resolved'} label={sub.submission_type?.replace('_', ' ') || ''} />
                                                        <span style={{ fontSize: '12px', color: theme.text.secondary }}>{sub.module_name || `Day ${sub.day_number}`}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 12px', fontSize: '12px', color: theme.text.muted }}>
                                                    {new Date(sub.submitted_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '16px 12px' }}>
                                                    {sub.marks != null ? (
                                                        <span style={{ fontSize: '13px', fontWeight: 700, color: theme.accent.green }}>{sub.marks}/100</span>
                                                    ) : (
                                                        <span style={{ fontSize: '12px', color: theme.text.label }}>Not Graded</span>
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

                        {totalPages > 1 && (
                            <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border.subtle}`, display: 'flex', justifyContent: 'center', gap: '20px' }}>
                                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ background: 'none', border: 'none', color: page === 1 ? theme.text.muted : theme.accent.blue, cursor: 'pointer', fontWeight: 700 }}>Prev</button>
                                <span style={{ color: theme.text.muted }}>{page} / {totalPages}</span>
                                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ background: 'none', border: 'none', color: page === totalPages ? theme.text.muted : theme.accent.blue, cursor: 'pointer', fontWeight: 700 }}>Next</button>
                            </div>
                        )}
                    </Card>
                </div>

                <div style={{ position: 'sticky', top: '20px' }}>
                    {gradingSubmission ? (
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <SectionTitle>Grading Submission</SectionTitle>
                                <button onClick={() => setGradingSubmission(null)} style={{ background: 'none', border: 'none', color: theme.text.muted, cursor: 'pointer' }}>Cancel</button>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: theme.radius.sm, marginBottom: '20px' }}>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', marginBottom: '4px' }}>Submission File</p>
                                <a href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}/${gradingSubmission.file_path}`} target="_blank" rel="noreferrer" style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: theme.accent.blue, fontSize: '13px', fontWeight: 600
                                }}>
                                    <FileText size={16} />
                                    View Submitted Work
                                </a>
                            </div>

                            <FormField label="Marks (out of 100)">
                                <input
                                    type="number"
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
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${theme.accent.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: theme.accent.blue }}>1</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: theme.text.secondary, margin: 0 }}>Select a batch and submission type from the filters.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${theme.accent.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: theme.accent.blue }}>2</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: theme.text.secondary, margin: 0 }}>Click "Grade" on any submission to view the file and enter marks.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${theme.accent.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: theme.accent.blue }}>3</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: theme.text.secondary, margin: 0 }}>Provide constructive feedback to help students improve.</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
