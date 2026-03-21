import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import {
    PageHeader, StatCard, Card, StatusBadge, ActionButton, EmptyState, LoadingSpinner, theme,
} from './TrainerComponents';
import {
    Users, GraduationCap, Clock, Calendar, ExternalLink, CheckCircle, BookOpenCheck,
    ChevronDown, ChevronUp, UserCircle, ClipboardList,
} from 'lucide-react';

export const TrainerBatches = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    // { [batchId]: { open: bool, loading: bool, students: [] } }
    const [studentPanels, setStudentPanels] = useState({});

    useEffect(() => {
        (async () => {
            try {
                const res = await trainerAPI.getMyCalendar();
                setBatches(res.data.batches || []);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        })();
    }, []);

    const toggleStudents = async (batchId) => {
        const panel = studentPanels[batchId] || {};

        // If already open, just close
        if (panel.open) {
            setStudentPanels(prev => ({ ...prev, [batchId]: { ...prev[batchId], open: false } }));
            return;
        }

        // Open and fetch if not yet loaded
        if (panel.students) {
            setStudentPanels(prev => ({ ...prev, [batchId]: { ...prev[batchId], open: true } }));
            return;
        }

        // First time — fetch
        setStudentPanels(prev => ({ ...prev, [batchId]: { open: true, loading: true, students: null } }));
        try {
            const res = await trainerAPI.getBatchStudents(batchId);
            setStudentPanels(prev => ({
                ...prev,
                [batchId]: { open: true, loading: false, students: res.data || [] },
            }));
        } catch (err) {
            console.error(err);
            setStudentPanels(prev => ({
                ...prev,
                [batchId]: { open: true, loading: false, students: [] },
            }));
        }
    };

    if (loading) return <LoadingSpinner label="Loading batches..." />;

    // Group by batch_name
    const batchGroups = Object.entries(
        batches.reduce((acc, b) => {
            if (!acc[b.batch_name]) acc[b.batch_name] = [];
            acc[b.batch_name].push(b);
            return acc;
        }, {})
    );

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Your Active Batches"
                subtitle="Manage attendance, curriculum, and students across your assigned batches"
                icon={<Users size={24} />}
                accentColor={theme.accent.purple}
                actions={
                    <div style={{
                        padding: '8px 18px', borderRadius: theme.radius.full,
                        background: `${theme.accent.blue}12`, color: theme.accent.blue,
                        fontSize: '12px', fontWeight: 700,
                    }}>
                        {batches.length} Total
                    </div>
                }
            />

            {batchGroups.length === 0 ? (
                <EmptyState icon={<Users size={28} />} title="No Active Batches" subtitle="You are currently not assigned to any live batches." />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {batchGroups.map(([batchName, courses]) => (
                        <div key={batchName}>
                            {/* Batch group header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: theme.radius.md, background: `${theme.accent.purple}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent.purple, fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>
                                    {batchName.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: theme.text.primary, margin: 0 }}>{batchName}</h3>
                                    <p style={{ fontSize: '11px', color: theme.text.muted, margin: 0 }}>
                                        {courses.length} course{courses.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Course cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                {courses.map(batch => {
                                    const panel = studentPanels[batch.id] || {};
                                    return (
                                        <div key={batch.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                            <Card noPadding style={{ overflow: 'hidden', transition: 'border-color 0.2s', borderBottomLeftRadius: panel.open ? 0 : undefined, borderBottomRightRadius: panel.open ? 0 : undefined }}>
                                                <div style={{ padding: '20px 24px 0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.muted, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                                            <GraduationCap size={13} /> {batch.course_name}
                                                        </p>
                                                        <StatusBadge status={batch.status} />
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: theme.text.secondary }}>
                                                            <Clock size={13} color={theme.text.muted} />
                                                            {batch.timing} · {batch.schedule_type}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: theme.text.secondary }}>
                                                            <Calendar size={13} color={theme.text.muted} />
                                                            Started {new Date(batch.start_date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action buttons row */}
                                                <div style={{ padding: '14px 24px 20px', borderTop: `1px solid ${theme.border.subtle}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                                                    <Link to={`/trainer/attendance/${batch.id}`} style={{ textDecoration: 'none' }}>
                                                        <ActionButton icon={<CheckCircle size={12} />} style={{ width: '100%', justifyContent: 'center', padding: '9px 4px', fontSize: '10px' }}>
                                                            Attendance
                                                        </ActionButton>
                                                    </Link>
                                                    <Link to={`/trainer/content-manager?batch=${batch.id}`} style={{ textDecoration: 'none' }}>
                                                        <ActionButton variant="secondary" icon={<BookOpenCheck size={12} />} style={{ width: '100%', justifyContent: 'center', padding: '9px 4px', fontSize: '10px' }}>
                                                            Content
                                                        </ActionButton>
                                                    </Link>
                                                    {batch.meeting_link ? (
                                                        <a href={batch.meeting_link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                                            <ActionButton variant="secondary" icon={<ExternalLink size={12} />} style={{ width: '100%', justifyContent: 'center', padding: '9px 4px', fontSize: '10px' }}>
                                                                Classroom
                                                            </ActionButton>
                                                        </a>
                                                    ) : (
                                                        <ActionButton variant="secondary" disabled style={{ width: '100%', justifyContent: 'center', padding: '9px 4px', fontSize: '10px' }}>
                                                            No Link
                                                        </ActionButton>
                                                    )}
                                                    <button
                                                        onClick={() => toggleStudents(batch.id)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                                            width: '100%', padding: '9px 4px', fontSize: '10px', fontWeight: 700,
                                                            borderRadius: theme.radius.md, border: `1.5px solid ${panel.open ? theme.accent.purple : theme.border.subtle}`,
                                                            background: panel.open ? `${theme.accent.purple}10` : 'transparent',
                                                            color: panel.open ? theme.accent.purple : theme.text.secondary,
                                                            cursor: 'pointer', transition: 'all 0.18s',
                                                        }}
                                                    >
                                                        <Users size={12} />
                                                        Students
                                                        {panel.open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                                    </button>
                                                </div>
                                            </Card>

                                            {/* Expandable student list panel */}
                                            {panel.open && (
                                                <div style={{
                                                    background: theme.bg.card,
                                                    border: `1px solid ${theme.border.subtle}`,
                                                    borderTop: 'none',
                                                    borderBottomLeftRadius: theme.radius.lg,
                                                    borderBottomRightRadius: theme.radius.lg,
                                                    overflow: 'hidden',
                                                    animation: 'slideDown 0.2s ease-out',
                                                }}>
                                                    {panel.loading ? (
                                                        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: theme.text.muted, fontSize: '13px' }}>
                                                            <div style={{ width: '14px', height: '14px', border: `2px solid ${theme.accent.purple}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                                            Loading students...
                                                        </div>
                                                    ) : panel.students && panel.students.length === 0 ? (
                                                        <div style={{ padding: '18px 24px', textAlign: 'center', color: theme.text.muted, fontSize: '13px' }}>
                                                            No students enrolled in this batch yet.
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            {/* Header */}
                                                            <div style={{
                                                                padding: '10px 20px',
                                                                background: `${theme.accent.purple}08`,
                                                                borderBottom: `1px solid ${theme.border.subtle}`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: theme.accent.purple, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                                    {panel.students?.length || 0} Student{panel.students?.length !== 1 ? 's' : ''}
                                                                </span>
                                                                <span style={{ fontSize: '10px', color: theme.text.muted }}>
                                                                    Click profile to view Report Card &amp; performance
                                                                </span>
                                                            </div>

                                                            {/* Student rows */}
                                                            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                                                {(panel.students || []).map((student, idx) => (
                                                                    <div
                                                                        key={student.id}
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                            padding: '11px 20px',
                                                                            borderBottom: idx < panel.students.length - 1 ? `1px solid ${theme.border.subtle}` : 'none',
                                                                            transition: 'background 0.15s',
                                                                        }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = `${theme.accent.purple}06`}
                                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                    >
                                                                        {/* Avatar + name */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                                            <div style={{
                                                                                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                                                                background: `${theme.accent.blue}18`,
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                fontSize: '13px', fontWeight: 800, color: theme.accent.blue,
                                                                            }}>
                                                                                {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                                                                            </div>
                                                                            <div style={{ minWidth: 0 }}>
                                                                                <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                    {student.first_name} {student.last_name}
                                                                                </div>
                                                                                <div style={{ fontSize: '11px', color: theme.text.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                    {student.email}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Status badge */}
                                                                        {student.student_status && (
                                                                            <span style={{
                                                                                fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: theme.radius.full,
                                                                                background: student.student_status === 'technical' ? `${theme.accent.blue}15` :
                                                                                            student.student_status === 'project' ? `${theme.accent.purple}15` :
                                                                                            `${theme.accent.green}15`,
                                                                                color: student.student_status === 'technical' ? theme.accent.blue :
                                                                                       student.student_status === 'project' ? theme.accent.purple :
                                                                                       theme.accent.green,
                                                                                textTransform: 'capitalize', marginLeft: '8px', flexShrink: 0,
                                                                            }}>
                                                                                {student.student_status}
                                                                            </span>
                                                                        )}

                                                                        {/* View Profile button */}
                                                                        <Link
                                                                            to={`/trainer/student-profile/${batch.id}/${student.id}`}
                                                                            style={{ textDecoration: 'none', marginLeft: '10px', flexShrink: 0 }}
                                                                        >
                                                                            <button style={{
                                                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                                                padding: '6px 12px', fontSize: '11px', fontWeight: 700,
                                                                                borderRadius: theme.radius.md,
                                                                                border: `1.5px solid ${theme.accent.purple}40`,
                                                                                background: `${theme.accent.purple}08`,
                                                                                color: theme.accent.purple, cursor: 'pointer',
                                                                                transition: 'all 0.15s',
                                                                            }}
                                                                            onMouseEnter={e => { e.currentTarget.style.background = `${theme.accent.purple}18`; e.currentTarget.style.borderColor = theme.accent.purple; }}
                                                                            onMouseLeave={e => { e.currentTarget.style.background = `${theme.accent.purple}08`; e.currentTarget.style.borderColor = `${theme.accent.purple}40`; }}
                                                                            >
                                                                                <ClipboardList size={11} />
                                                                                View Profile
                                                                            </button>
                                                                        </Link>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
                @keyframes spin { to { transform: rotate(360deg) } }
            `}</style>
        </div>
    );
};
