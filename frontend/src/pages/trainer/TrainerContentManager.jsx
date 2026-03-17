import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import { useSearchParams } from 'react-router-dom';
import {
    PageHeader, Card, ActionButton, EmptyState, LoadingSpinner, StatusBadge,
    SectionTitle, FormField, inputStyle, theme,
} from './TrainerComponents';
import {
    ChevronRight, ChevronDown, CheckCircle, Lock, Unlock,
    BookOpen, BookOpenCheck, FileSignature, Briefcase, MessageSquare,
    HelpCircle, Download, ExternalLink, FileText, Info, GraduationCap,
    Send, X, Calendar, AlertCircle, Edit2
} from 'lucide-react';

// ─── Helper ────────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    }) : null;

const isOverdue = (d) => d && new Date(d) < new Date();

// ─── Assign Modal ──────────────────────────────────────────────────────────────
const AssignModal = ({ project, batchId, existingRelease, onClose, onDone }) => {
    const [dueDate, setDueDate] = useState(existingRelease?.due_date?.split('T')[0] || '');
    const [saving, setSaving] = useState(false);

    const handleConfirm = async () => {
        if (!dueDate) return alert('Please select a due date');
        setSaving(true);
        try {
            await trainerAPI.releaseItem(batchId, {
                release_type: 'module_project',
                entity_id: project.id,
                module_id: project.module_id,
                due_date: dueDate,
            });
            onDone();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Error assigning project');
        } finally {
            setSaving(false);
        }
    };

    const handleUnassign = async () => {
        if (!window.confirm('Remove this project assignment? Students will lose access.')) return;
        setSaving(true);
        try {
            await trainerAPI.unreleaseItem(batchId, existingRelease.id);
            onDone();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Error removing assignment');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300, padding: '16px',
        }} onClick={onClose}>
            <div style={{
                background: theme.bg.card, borderRadius: theme.radius.lg,
                border: `1px solid ${theme.accent.blue}30`,
                padding: '28px', width: '100%', maxWidth: '420px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                animation: 'modalIn 0.2s ease-out',
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: theme.radius.md,
                            background: `${theme.accent.blue}20`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: theme.accent.blue,
                            flexShrink: 0,
                        }}>
                            <Briefcase size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: theme.text.primary }}>
                                {existingRelease ? 'Update Assignment' : 'Assign Project'}
                            </div>
                            <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '2px' }}>
                                {project.name}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: theme.text.muted, padding: '2px',
                    }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Already assigned notice */}
                {existingRelease && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: `${theme.accent.green}10`, border: `1px solid ${theme.accent.green}25`,
                        borderRadius: theme.radius.md, padding: '10px 14px', marginBottom: '16px',
                        fontSize: '11px', color: theme.accent.green,
                    }}>
                        <CheckCircle size={14} />
                        Currently assigned — due {fmtDate(existingRelease.due_date)}. You can update the due date or remove it.
                    </div>
                )}

                {/* Due date */}
                <FormField label="Due Date (appears on student calendar)">
                    <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        style={{ ...inputStyle, colorScheme: 'dark' }}
                    />
                </FormField>

                {/* Info */}
                <div style={{
                    background: `${theme.accent.blue}08`, border: `1px solid ${theme.accent.blue}15`,
                    borderRadius: theme.radius.md, padding: '10px 14px', marginBottom: '20px',
                    fontSize: '11px', color: theme.text.muted, lineHeight: 1.6,
                }}>
                    <strong style={{ color: theme.text.secondary }}>After assigning:</strong> Students
                    will see this project in their portal and the due date will appear on their calendar.
                    Students can upload their submission file or share a GitHub link.
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {existingRelease && (
                        <button onClick={handleUnassign} disabled={saving} style={{
                            padding: '8px 14px', borderRadius: theme.radius.md, cursor: 'pointer',
                            background: 'rgba(239,68,68,0.1)', color: '#f87171',
                            border: '1px solid rgba(239,68,68,0.3)', fontSize: '12px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '6px',
                            opacity: saving ? 0.6 : 1,
                        }}>
                            <Lock size={12} /> Remove
                        </button>
                    )}
                    <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
                    <ActionButton
                        onClick={handleConfirm}
                        disabled={saving || !dueDate}
                        icon={<Send size={13} />}
                    >
                        {saving ? 'Saving...' : (existingRelease ? 'Update' : 'Assign to Students')}
                    </ActionButton>
                </div>
            </div>
            <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export const TrainerContentManager = () => {
    const [searchParams] = useSearchParams();
    const preselectedBatch = searchParams.get('batch');

    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState(preselectedBatch || '');
    const [curriculum, setCurriculum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currLoading, setCurrLoading] = useState(false);
    const [expandedModule, setExpandedModule] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // Release map: key = `module_project_${projectId}` → release object
    const [releaseMap, setReleaseMap] = useState({});

    // Assign modal state
    const [assignModal, setAssignModal] = useState(null); // { project, existingRelease }

    // ── Fetch batches ──────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const res = await trainerAPI.getMyCalendar();
                const activeBatches = (res.data.batches || []).filter(
                    b => b.status === 'active' || b.status === 'upcoming'
                );
                setBatches(activeBatches);
                if (preselectedBatch && activeBatches.find(b => String(b.id) === preselectedBatch)) {
                    loadCurriculum(preselectedBatch);
                    loadReleases(preselectedBatch);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        })();
    }, []);

    // ── Load curriculum ────────────────────────────────────────────────────────
    const loadCurriculum = async (batchId) => {
        if (!batchId) { setCurriculum(null); return; }
        setCurrLoading(true);
        try {
            const res = await trainerAPI.getBatchCurriculum(batchId);
            setCurriculum(res.data);
        } catch (err) { console.error(err); setCurriculum(null); }
        finally { setCurrLoading(false); }
    };

    // ── Load release status (which projects are already assigned) ──────────────
    const loadReleases = async (batchId) => {
        if (!batchId) return;
        try {
            const res = await trainerAPI.getReleaseStatus(batchId);
            const map = {};
            // Build map from all module project releases
            res.data.modules?.forEach(mod => {
                mod.projects?.forEach(p => {
                    if (p.release) {
                        map[`module_project_${p.id}`] = p.release;
                    }
                });
            });
            setReleaseMap(map);
        } catch (err) {
            // Non-critical — silently fail, assign buttons still work
            console.error('Could not load release status', err);
        }
    };

    const handleBatchChange = (batchId) => {
        setSelectedBatchId(batchId);
        setExpandedModule(null);
        setReleaseMap({});
        loadCurriculum(batchId);
        loadReleases(batchId);
    };

    const handleUnlockModule = async (moduleId, config) => {
        setActionLoading(moduleId);
        try {
            const payload = typeof config === 'number'
                ? { module_id: moduleId, unlocked_up_to_day: config }
                : { module_id: moduleId, ...config };
            await trainerAPI.unlockModule(selectedBatchId, payload);
            await loadCurriculum(selectedBatchId);
        } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)); }
        finally { setActionLoading(null); }
    };

    const handleLockModule = async (moduleId) => {
        setActionLoading(moduleId);
        try {
            await trainerAPI.lockModule(selectedBatchId, moduleId);
            await loadCurriculum(selectedBatchId);
        } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)); }
        finally { setActionLoading(null); }
    };

    // Called after assign modal saves — refresh releases
    const handleAssignDone = () => {
        loadReleases(selectedBatchId);
    };

    if (loading) return <LoadingSpinner label="Loading batches..." />;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Content Manager"
                subtitle="Control which modules and days are available to students in each batch"
                icon={<BookOpenCheck size={24} />}
                accentColor={theme.accent.cyan}
            />

            {/* Batch Selector */}
            <Card style={{ marginBottom: '24px' }}>
                <FormField label="Select Batch">
                    <select
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        value={selectedBatchId}
                        onChange={e => handleBatchChange(e.target.value)}
                    >
                        <option value="">— Choose a batch —</option>
                        {batches.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.batch_name} ({b.course_name})
                            </option>
                        ))}
                    </select>
                </FormField>
            </Card>

            {!selectedBatchId && (
                <EmptyState
                    icon={<GraduationCap size={28} />}
                    title="Select a Batch"
                    subtitle="Pick a batch above to manage its curriculum access."
                />
            )}

            {currLoading && <LoadingSpinner label="Loading curriculum..." />}

            {curriculum && !currLoading && (
                <div>
                    <SectionTitle count={curriculum.modules?.length}>
                        {curriculum.course} — Modules
                    </SectionTitle>

                    {curriculum.modules?.length === 0 ? (
                        <EmptyState
                            icon={<BookOpen size={24} />}
                            title="No modules found"
                            subtitle="This course has no modules configured yet."
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {curriculum.modules.map(mod => {
                                const isExpanded = expandedModule === mod.id;
                                const isLoading = actionLoading === mod.id;
                                const unlockedDays = mod.is_unlocked
                                    ? (mod.unlocked_up_to_day === -1 ? mod.total_days : mod.unlocked_up_to_day)
                                    : 0;

                                return (
                                    <Card key={mod.id} noPadding style={{ overflow: 'hidden' }}>

                                        {/* ── Module Header ── */}
                                        <div style={{
                                            padding: '18px 24px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            cursor: 'pointer', transition: 'background 0.2s',
                                        }}
                                            onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                                            onMouseEnter={e => e.currentTarget.style.background = theme.bg.cardHover}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: theme.radius.sm,
                                                    background: mod.is_unlocked ? `${theme.accent.green}15` : `${theme.accent.red}10`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: mod.is_unlocked ? theme.accent.green : theme.text.muted,
                                                }}>
                                                    {mod.is_unlocked ? <Unlock size={16} /> : <Lock size={16} />}
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>
                                                            Module {mod.sequence_order}
                                                        </span>
                                                        <StatusBadge
                                                            status={mod.is_unlocked ? 'Unlocked' : 'Locked'}
                                                            color={mod.is_unlocked ? theme.accent.green : theme.text.muted}
                                                        />
                                                    </div>
                                                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: theme.text.primary, margin: '2px 0 0' }}>
                                                        {mod.name}
                                                    </h4>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                {mod.total_days > 0 && (
                                                    <span style={{ fontSize: '11px', color: theme.text.muted, fontWeight: 600 }}>
                                                        {unlockedDays}/{mod.total_days} days
                                                    </span>
                                                )}
                                                {mod.is_unlocked ? (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleLockModule(mod.id); }}
                                                        disabled={isLoading}
                                                        style={{
                                                            padding: '7px 14px', borderRadius: theme.radius.md,
                                                            border: `1px solid ${theme.accent.red}30`,
                                                            background: `${theme.accent.red}10`, color: theme.accent.red,
                                                            cursor: 'pointer', fontSize: '10px', fontWeight: 700,
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            opacity: isLoading ? 0.5 : 1,
                                                        }}
                                                    >
                                                        <Lock size={12} /> {isLoading ? '...' : 'Lock'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleUnlockModule(mod.id, -1); }}
                                                        disabled={isLoading}
                                                        style={{
                                                            padding: '7px 14px', borderRadius: theme.radius.md,
                                                            border: 'none', background: theme.accent.green,
                                                            color: '#fff', cursor: 'pointer',
                                                            fontSize: '10px', fontWeight: 700,
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            opacity: isLoading ? 0.5 : 1,
                                                        }}
                                                    >
                                                        <Unlock size={12} /> {isLoading ? '...' : 'Unlock All'}
                                                    </button>
                                                )}
                                                {isExpanded
                                                    ? <ChevronDown size={16} color={theme.text.muted} />
                                                    : <ChevronRight size={16} color={theme.text.muted} />}
                                            </div>
                                        </div>

                                        {/* ── Expanded Content ── */}
                                        {isExpanded && mod.days && (
                                            <div style={{ borderTop: `1px solid ${theme.border.subtle}`, padding: '16px 24px' }}>

                                                {/* Day-level buttons */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>
                                                        Day-Level Access Control
                                                    </span>
                                                    {mod.is_unlocked && mod.total_days > 0 && (
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {Array.from({ length: mod.total_days }, (_, i) => i + 1).map(n => (
                                                                <button key={n}
                                                                    onClick={() => handleUnlockModule(mod.id, n)}
                                                                    disabled={isLoading}
                                                                    style={{
                                                                        padding: '5px 10px', borderRadius: theme.radius.sm,
                                                                        border: `1px solid ${mod.unlocked_up_to_day === n ? theme.accent.blue : theme.border.subtle}`,
                                                                        background: mod.unlocked_up_to_day === n ? `${theme.accent.blue}20` : 'transparent',
                                                                        color: mod.unlocked_up_to_day === n ? theme.accent.blue : theme.text.muted,
                                                                        cursor: 'pointer', fontSize: '10px', fontWeight: 700,
                                                                    }}>
                                                                    {n === mod.total_days ? 'All' : `${n}d`}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Component Release toggles */}
                                                {mod.is_unlocked && (
                                                    <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: theme.radius.md, border: `1px solid ${theme.border.subtle}` }}>
                                                        <p style={{ fontSize: '10px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', marginBottom: '10px' }}>
                                                            Component Release Control
                                                        </p>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            {[
                                                                { id: 'is_projects_released', label: 'Projects', icon: <Briefcase size={12} /> },
                                                                { id: 'is_test_released', label: 'Tests', icon: <FileSignature size={12} /> },
                                                                { id: 'is_feedback_released', label: 'Feedback', icon: <MessageSquare size={12} /> },
                                                                { id: 'is_study_materials_released', label: 'Materials', icon: <BookOpenCheck size={12} /> },
                                                                { id: 'is_interview_questions_released', label: 'Interview Qs', icon: <HelpCircle size={12} /> },
                                                            ].map(comp => (
                                                                <button key={comp.id}
                                                                    onClick={() => handleUnlockModule(mod.id, { [comp.id]: !mod[comp.id] })}
                                                                    disabled={isLoading}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                                        padding: '6px 12px', borderRadius: theme.radius.sm,
                                                                        border: `1px solid ${mod[comp.id] ? theme.accent.blue : theme.border.subtle}`,
                                                                        background: mod[comp.id] ? `${theme.accent.blue}15` : 'transparent',
                                                                        color: mod[comp.id] ? theme.accent.blue : theme.text.muted,
                                                                        cursor: 'pointer', fontSize: '10px', fontWeight: 700, transition: 'all 0.2s',
                                                                    }}
                                                                >
                                                                    {comp.icon} {comp.label}
                                                                    {mod[comp.id] && <CheckCircle size={10} style={{ marginLeft: '4px' }} />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Module Resources */}
                                                {mod.is_unlocked && (
                                                    <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                                        {/* Resource links */}
                                                        {(mod.study_material_url || mod.test_url || mod.interview_questions_url || mod.files?.length > 0) && (
                                                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: theme.radius.md, border: `1px solid ${theme.border.subtle}` }}>
                                                                <p style={{ fontSize: '10px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', marginBottom: '8px' }}>
                                                                    Module Resources
                                                                </p>
                                                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                                    {mod.study_material_url && (
                                                                        <a href={mod.study_material_url} target="_blank" rel="noopener noreferrer"
                                                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: theme.accent.blue, textDecoration: 'none' }}>
                                                                            <BookOpen size={14} /> Material <ExternalLink size={10} />
                                                                        </a>
                                                                    )}
                                                                    {mod.test_url && (
                                                                        <a href={mod.test_url} target="_blank" rel="noopener noreferrer"
                                                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: theme.accent.blue, textDecoration: 'none' }}>
                                                                            <FileSignature size={14} /> Test Link <ExternalLink size={10} />
                                                                        </a>
                                                                    )}
                                                                    {mod.interview_questions_url && (
                                                                        <a href={mod.interview_questions_url} target="_blank" rel="noopener noreferrer"
                                                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: theme.accent.blue, textDecoration: 'none' }}>
                                                                            <HelpCircle size={14} /> Interview Qs <ExternalLink size={10} />
                                                                        </a>
                                                                    )}
                                                                    {mod.files?.map(file => (
                                                                        <a key={file.id}
                                                                            href={`/uploads/content/${file.stored_name}`}
                                                                            target="_blank" rel="noopener noreferrer"
                                                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: theme.text.secondary, textDecoration: 'none' }}>
                                                                            <FileText size={14} /> {file.original_name} <Download size={10} />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* ── Projects with Assign buttons ── */}
                                                        {(mod.module_project_details || mod.projects?.length > 0) && (
                                                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: theme.radius.md, border: `1px solid ${theme.border.subtle}` }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                                    <p style={{ fontSize: '10px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', margin: 0 }}>
                                                                        Project Details
                                                                    </p>
                                                                    <span style={{ fontSize: '10px', color: theme.text.muted }}>
                                                                        {mod.projects?.length || 0} project{mod.projects?.length !== 1 ? 's' : ''}
                                                                    </span>
                                                                </div>

                                                                {mod.module_project_details && (
                                                                    <div style={{ fontSize: '12px', color: theme.text.muted, marginBottom: '10px', padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                                                        <Info size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                                        {mod.module_project_details}
                                                                    </div>
                                                                )}

                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                    {mod.projects?.map((proj, idx) => {
                                                                        const releaseKey = `module_project_${proj.id}`;
                                                                        const existingRelease = releaseMap[releaseKey] || null;
                                                                        const isAssigned = !!existingRelease;
                                                                        const overdue = isOverdue(existingRelease?.due_date);

                                                                        return (
                                                                            <div key={proj.id} style={{
                                                                                padding: '12px 14px',
                                                                                borderLeft: `3px solid ${isAssigned ? theme.accent.green : theme.accent.blue}`,
                                                                                background: isAssigned ? `${theme.accent.green}05` : 'rgba(255,255,255,0.02)',
                                                                                borderRadius: '0 6px 6px 0',
                                                                                border: `1px solid ${isAssigned ? `${theme.accent.green}20` : theme.border.subtle}`,
                                                                                borderLeft: `3px solid ${isAssigned ? theme.accent.green : theme.accent.blue}`,
                                                                            }}>
                                                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                                        {/* Project name + assigned badge */}
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                                                            <span style={{
                                                                                                fontSize: '10px', fontWeight: 800, color: theme.accent.blue,
                                                                                                background: `${theme.accent.blue}15`, padding: '1px 6px',
                                                                                                borderRadius: theme.radius.sm,
                                                                                            }}>
                                                                                                P{idx + 1}
                                                                                            </span>
                                                                                            <p style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>
                                                                                                {proj.name}
                                                                                            </p>
                                                                                            {isAssigned && (
                                                                                                <span style={{
                                                                                                    fontSize: '10px', fontWeight: 700,
                                                                                                    padding: '2px 8px', borderRadius: theme.radius.full,
                                                                                                    background: `${theme.accent.green}15`,
                                                                                                    color: theme.accent.green,
                                                                                                    border: `1px solid ${theme.accent.green}30`,
                                                                                                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                                                                                                }}>
                                                                                                    <CheckCircle size={9} /> Assigned
                                                                                                </span>
                                                                                            )}
                                                                                        </div>

                                                                                        {/* Description */}
                                                                                        {proj.description && (
                                                                                            <p style={{ fontSize: '12px', color: theme.text.muted, margin: '0 0 8px', lineHeight: 1.5 }}>
                                                                                                {proj.description}
                                                                                            </p>
                                                                                        )}

                                                                                        {/* Due date if assigned */}
                                                                                        {isAssigned && existingRelease.due_date && (
                                                                                            <div style={{
                                                                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                                fontSize: '11px', marginBottom: '8px',
                                                                                                color: overdue ? '#f87171' : theme.text.muted,
                                                                                            }}>
                                                                                                <Calendar size={11} />
                                                                                                Due: {fmtDate(existingRelease.due_date)}
                                                                                                {overdue && ' · Overdue'}
                                                                                            </div>
                                                                                        )}

                                                                                        {/* Project files */}
                                                                                        {proj.files?.length > 0 && (
                                                                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                                                {proj.files.map(f => (
                                                                                                    <a key={f.id}
                                                                                                        href={`/uploads/content/${f.stored_name}`}
                                                                                                        target="_blank" rel="noopener noreferrer"
                                                                                                        style={{
                                                                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                                            fontSize: '11px', color: theme.accent.blue,
                                                                                                            textDecoration: 'none', padding: '3px 8px',
                                                                                                            background: `${theme.accent.blue}10`,
                                                                                                            borderRadius: theme.radius.sm,
                                                                                                            border: `1px solid ${theme.accent.blue}20`,
                                                                                                        }}>
                                                                                                        <Download size={11} /> {f.original_name}
                                                                                                    </a>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}

                                                                                        {/* No files notice */}
                                                                                        {(!proj.files || proj.files.length === 0) && (
                                                                                            <div style={{
                                                                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                                fontSize: '10px', color: theme.text.muted,
                                                                                                padding: '3px 8px', borderRadius: theme.radius.sm,
                                                                                                background: 'rgba(255,255,255,0.03)',
                                                                                                border: `1px solid ${theme.border.subtle}`,
                                                                                            }}>
                                                                                                <AlertCircle size={10} /> No files uploaded
                                                                                            </div>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Assign / Update button */}
                                                                                    <div style={{ flexShrink: 0 }}>
                                                                                        <button
                                                                                            onClick={() => setAssignModal({
                                                                                                project: { ...proj, module_id: mod.id },
                                                                                                existingRelease,
                                                                                            })}
                                                                                            style={{
                                                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                                                padding: '7px 14px', borderRadius: theme.radius.md,
                                                                                                cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                                                                                                border: `1px solid ${isAssigned ? `${theme.accent.green}40` : `${theme.accent.blue}40`}`,
                                                                                                background: isAssigned ? `${theme.accent.green}15` : `${theme.accent.blue}15`,
                                                                                                color: isAssigned ? theme.accent.green : theme.accent.blue,
                                                                                                transition: 'all 0.15s',
                                                                                            }}
                                                                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                                                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                                                                        >
                                                                                            {isAssigned
                                                                                                ? <><Edit2 size={11} /> Update</>
                                                                                                : <><Send size={11} /> Assign</>
                                                                                            }
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Days grid */}
                                                {mod.days.length === 0 ? (
                                                    <p style={{ fontSize: '12px', color: theme.text.muted, textAlign: 'center', padding: '16px 0' }}>
                                                        No days configured for this module.
                                                    </p>
                                                ) : (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                                                        {mod.days.map(day => (
                                                            <div key={day.id} style={{
                                                                padding: '12px 14px', borderRadius: theme.radius.sm,
                                                                background: day.is_unlocked ? `${theme.accent.green}08` : 'rgba(255,255,255,0.02)',
                                                                border: `1px solid ${day.is_unlocked ? `${theme.accent.green}20` : theme.border.subtle}`,
                                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                            }}>
                                                                <div style={{
                                                                    width: '28px', height: '28px', borderRadius: theme.radius.sm,
                                                                    background: day.is_unlocked ? `${theme.accent.green}15` : 'rgba(255,255,255,0.04)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                                }}>
                                                                    {day.is_unlocked
                                                                        ? <Unlock size={12} color={theme.accent.green} />
                                                                        : <Lock size={12} color={theme.text.muted} />}
                                                                </div>
                                                                <div style={{ minWidth: 0 }}>
                                                                    <span style={{ fontSize: '9px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                                        Day {day.day_number}
                                                                    </span>
                                                                    <p style={{ fontSize: '12px', fontWeight: 600, color: theme.text.primary, margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {day.topic_name || 'Untitled'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Assign Modal */}
            {assignModal && (
                <AssignModal
                    project={assignModal.project}
                    batchId={selectedBatchId}
                    existingRelease={assignModal.existingRelease}
                    onClose={() => setAssignModal(null)}
                    onDone={handleAssignDone}
                />
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
};