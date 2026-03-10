import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, Card, StatCard, FilterTabs, ActionButton, StatusBadge, EmptyState, LoadingSpinner, FormField, inputStyle, SectionTitle, theme,
} from './TrainerComponents';
import { User, Mail, Calendar, ClipboardList, MessageSquare, Plus, Trash2, CheckCircle, Percent, BookOpen } from 'lucide-react';

export const TrainerStudentProfile = () => {
    const { batchId, studentId } = useParams();
    const [data, setData] = useState(null);
    const [remarks, setRemarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('submissions');

    // Remark form
    const [remarkForm, setRemarkForm] = useState({ remark_text: '', remark_type: 'general' });
    const [submittingRemark, setSubmittingRemark] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [perfRes, remRes] = await Promise.all([
                    trainerAPI.getStudentPerformance(batchId, studentId),
                    trainerAPI.getStudentRemarks(batchId, studentId)
                ]);
                setData(perfRes.data);
                setRemarks(remRes.data);
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

    if (loading) return <LoadingSpinner label="Loading student profile..." />;
    if (!data) return <EmptyState title="Student not found" icon={<User size={40} />} />;

    const tabs = [
        { value: 'submissions', label: 'Submissions' },
        { value: 'remarks', label: 'Remarks' },
    ];

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title={`${data.student.first_name} ${data.student.last_name}`}
                subtitle="Student Performance Dashboard & Remarks"
                icon={<User size={24} />}
                accentColor={theme.accent.blue}
            />

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <StatCard
                    label="Attendance"
                    value={`${Math.round(data.attendance.percentage)}%`}
                    icon={<Percent size={18} />}
                    accentColor={theme.accent.green}
                />
                <StatCard
                    label="Submissions"
                    value={data.submissions.length}
                    icon={<ClipboardList size={18} />}
                    accentColor={theme.accent.purple}
                />
                <StatCard
                    label="Evaluated"
                    value={data.submissions.filter(s => s.marks != null).length}
                    icon={<CheckCircle size={18} />}
                    accentColor={theme.accent.cyan}
                />
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
                            <select
                                style={inputStyle}
                                value={remarkForm.remark_type}
                                onChange={e => setRemarkForm(f => ({ ...f, remark_type: e.target.value }))}
                            >
                                <option value="general">General</option>
                                <option value="academic">Academic Performance</option>
                                <option value="behavioral">Behavioral</option>
                                <option value="attendance">Attendance Related</option>
                            </select>
                        </FormField>
                        <FormField label="Remark Text">
                            <textarea
                                rows={4}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                placeholder="Type your observation here..."
                                value={remarkForm.remark_text}
                                onChange={e => setRemarkForm(f => ({ ...f, remark_text: e.target.value }))}
                            />
                        </FormField>
                        <ActionButton
                            onClick={handleAddRemark}
                            icon={<Plus size={16} />}
                            style={{ width: '100%', justifyContent: 'center' }}
                            disabled={submittingRemark || !remarkForm.remark_text.trim()}
                        >
                            {submittingRemark ? 'Adding...' : 'Add Remark'}
                        </ActionButton>
                    </Card>
                </div>

                {/* Right: Tabs Content */}
                <Card noPadding>
                    <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.border.subtle}` }}>
                        <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
                    </div>

                    <div style={{ padding: '24px' }}>
                        {activeTab === 'submissions' ? (
                            data.submissions.length === 0 ? (
                                <EmptyState title="No submissions yet" icon={<BookOpen size={24} />} />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {data.submissions.map(sub => (
                                        <div key={sub.id} style={{
                                            padding: '16px', borderRadius: theme.radius.md,
                                            background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border.subtle}`,
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <StatusBadge status={sub.submission_type === 'worksheet' ? 'pending' : 'active'} label={sub.submission_type?.replace('_', ' ') || ''} />
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary }}>{sub.module_name || `Day ${sub.day_number}`}</span>
                                                </div>
                                                <p style={{ fontSize: '11px', color: theme.text.muted, margin: 0 }}>Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</p>
                                                {sub.feedback && <p style={{ fontSize: '12px', color: theme.text.secondary, marginTop: '8px', fontStyle: 'italic' }}>"{sub.feedback}"</p>}
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {sub.marks != null ? (
                                                    <span style={{ fontSize: '18px', fontWeight: 800, color: theme.accent.green }}>{sub.marks}<span style={{ fontSize: '12px', color: theme.text.muted }}>/100</span></span>
                                                ) : (
                                                    <StatusBadge status="pending" label="Ungraded" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            remarks.length === 0 ? (
                                <EmptyState title="No remarks recorded" icon={<MessageSquare size={24} />} subtitle="Use the form on the left to add your first remark for this student." />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {remarks.map(rem => (
                                        <div key={rem.id} style={{
                                            padding: '16px', borderRadius: theme.radius.md,
                                            background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border.subtle}`
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
                                                        padding: '2px 6px', borderRadius: '4px',
                                                        background: rem.remark_type === 'academic' ? `${theme.accent.blue}20` : rem.remark_type === 'behavioral' ? `${theme.accent.yellow}20` : `${theme.accent.purple}20`,
                                                        color: rem.remark_type === 'academic' ? theme.accent.blue : rem.remark_type === 'behavioral' ? theme.accent.yellow : theme.accent.purple
                                                    }}>
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
                            )
                        )}
                    </div>
                </Card>
            </div>

            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
