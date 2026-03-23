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
    Send, X, Calendar, AlertCircle, Edit2, Star, Layers, Plus, Minus
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
    if (!d) return null;
    const datePart = String(d).split('T')[0].split(' ')[0]; // strip time if present
    return new Date(datePart + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
};

const isOverdue = (d) => {
    if (!d) return false;
    const datePart = String(d).split('T')[0].split(' ')[0];
    return new Date(datePart + 'T23:59:59') < new Date();
};

// ─── Resource type config ──────────────────────────────────────────────────────
const RESOURCE_CONFIG = {
    module_project:             { label: 'Project',             needsDueDate: true,  color: theme.accent.blue,   icon: Briefcase     },
    module_test:                { label: 'Test',                needsDueDate: true,  color: theme.accent.yellow, icon: FileSignature },
    module_feedback:            { label: 'Feedback Form',       needsDueDate: true,  color: theme.accent.green,  icon: Star          },
    module_study_material:      { label: 'Study Materials',     needsDueDate: false, color: theme.accent.purple, icon: BookOpen      },
    module_interview_questions: { label: 'Interview Questions', needsDueDate: false, color: '#06b6d4',           icon: HelpCircle    },
};

// ══════════════════════════════════════════════════════════════════════════════
// UNIFIED ASSIGN MODAL
// ══════════════════════════════════════════════════════════════════════════════
const AssignModal = ({ item, batchId, existingRelease, onClose, onDone }) => {
    const config = RESOURCE_CONFIG[item.release_type] || {};
    const needsDueDate = config.needsDueDate;
    const [dueDate, setDueDate] = useState(existingRelease?.due_date?.split('T')[0] || '');
    const [saving, setSaving] = useState(false);
    const Icon = config.icon || Briefcase;

    const handleConfirm = async () => {
        if (needsDueDate && !dueDate) return alert('Please select a due date');
        setSaving(true);
        try {
            await trainerAPI.releaseItem(batchId, {
                release_type: item.release_type,
                entity_id: item.entity_id,
                module_id: item.module_id,
                due_date: needsDueDate ? dueDate : null,
            });
            onDone();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Error assigning');
        } finally {
            setSaving(false);
        }
    };

    const handleUnassign = async () => {
        if (!window.confirm('Remove this assignment? Students will lose access.')) return;
        setSaving(true);
        try {
            await trainerAPI.unreleaseItem(batchId, existingRelease.id);
            onDone();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Error removing');
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
                border: `1px solid ${config.color || theme.accent.blue}30`,
                padding: '28px', width: '100%', maxWidth: '420px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                animation: 'modalIn 0.2s ease-out',
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: theme.radius.md,
                            background: `${config.color || theme.accent.blue}20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: config.color || theme.accent.blue, flexShrink: 0,
                        }}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: theme.text.primary }}>
                                {existingRelease ? `Update ${config.label}` : `Assign ${config.label}`}
                            </div>
                            <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '2px' }}>
                                {item.name}
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
                        Currently assigned
                        {existingRelease.due_date && ` — due ${fmtDate(existingRelease.due_date)}`}.
                    </div>
                )}

                {/* Due date or immediate release notice */}
                {needsDueDate ? (
                    <FormField label="Due Date (appears on student calendar)">
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            style={{ ...inputStyle, colorScheme: 'dark' }}
                        />
                    </FormField>
                ) : (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: `${config.color}10`, border: `1px solid ${config.color}20`,
                        borderRadius: theme.radius.md, padding: '10px 14px', marginBottom: '16px',
                        fontSize: '11px', color: config.color,
                    }}>
                        <CheckCircle size={14} />
                        This will be released immediately with no due date.
                    </div>
                )}

                {/* Info box */}
                <div style={{
                    background: `${theme.accent.blue}08`, border: `1px solid ${theme.accent.blue}15`,
                    borderRadius: theme.radius.md, padding: '10px 14px', marginBottom: '20px',
                    fontSize: '11px', color: theme.text.muted, lineHeight: 1.6,
                }}>
                    <strong style={{ color: theme.text.secondary }}>After assigning:</strong> Students
                    in this batch will see this in their portal.
                    {needsDueDate && ' The due date will appear on their calendar.'}
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
                        disabled={saving || (needsDueDate && !dueDate)}
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

// ─── Reusable assign button ────────────────────────────────────────────────────
const AssignBtn = ({ releaseType, entityId, moduleId, name, releaseMap, onOpen }) => {
    const key = `${releaseType}_${entityId}`;
    const existing = releaseMap[key] || null;
    const config = RESOURCE_CONFIG[releaseType] || {};
    const isAssigned = !!existing;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {isAssigned && (
                <span style={{
                    fontSize: '10px', fontWeight: 700,
                    padding: '2px 8px', borderRadius: theme.radius.full,
                    background: `${theme.accent.green}15`, color: theme.accent.green,
                    border: `1px solid ${theme.accent.green}30`,
                    display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap',
                }}>
                    <CheckCircle size={9} />
                    {existing.due_date ? `Due ${fmtDate(existing.due_date)}` : 'Released'}
                    {existing.due_date && isOverdue(existing.due_date) && ' ⚠'}
                </span>
            )}
            <button
                onClick={() => onOpen({ release_type: releaseType, entity_id: entityId, module_id: moduleId, name }, existing)}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', borderRadius: theme.radius.md,
                    cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                    border: `1px solid ${isAssigned ? `${theme.accent.green}40` : `${config.color || theme.accent.blue}40`}`,
                    background: isAssigned ? `${theme.accent.green}15` : `${config.color || theme.accent.blue}15`,
                    color: isAssigned ? theme.accent.green : config.color || theme.accent.blue,
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
            >
                {isAssigned ? <><Edit2 size={10} /> Update</> : <><Send size={10} /> Assign</>}
            </button>
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
    const [releaseMap, setReleaseMap] = useState({});
    const [assignModal, setAssignModal] = useState(null);

    // IOP Training state
    const [iopBatches, setIopBatches] = useState([]);
    const [iopCurriculum, setIopCurriculum] = useState(null);
    const [iopCurrLoading, setIopCurrLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('curriculum'); // 'curriculum' | 'iop'
    const [iopTypeFilter, setIopTypeFilter] = useState('soft_skills');
    const [iopUnlockLoading, setIopUnlockLoading] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const [calRes, iopRes] = await Promise.all([
                    trainerAPI.getMyCalendar(),
                    trainerAPI.getMyIOPBatches().catch(() => ({ data: { batches: [] } })),
                ]);
                const activeBatches = (calRes.data.batches || []).filter(
                    b => b.status === 'active' || b.status === 'upcoming'
                );
                setBatches(activeBatches);
                setIopBatches(iopRes.data.batches || []);
                if (preselectedBatch && activeBatches.find(b => String(b.id) === preselectedBatch)) {
                    loadCurriculum(preselectedBatch);
                    loadReleases(preselectedBatch);
                    loadIOPCurriculum(preselectedBatch);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        })();
    }, []);

    const loadCurriculum = async (batchId) => {
        if (!batchId) { setCurriculum(null); return; }
        setCurrLoading(true);
        try {
            const res = await trainerAPI.getBatchCurriculum(batchId);
            setCurriculum(res.data);
        } catch (err) { console.error(err); setCurriculum(null); }
        finally { setCurrLoading(false); }
    };

    const loadIOPCurriculum = async (batchId) => {
        if (!batchId) { setIopCurriculum(null); return; }
        setIopCurrLoading(true);
        try {
            const res = await trainerAPI.getIOPCurriculum(batchId);
            setIopCurriculum(res.data);
        } catch {
            setIopCurriculum(null); // 403 = not IOP trainer for this batch — hide tab silently
        } finally { setIopCurrLoading(false); }
    };

    const loadReleases = async (batchId) => {
        if (!batchId) return;
        try {
            const res = await trainerAPI.getReleaseStatus(batchId);
            const map = {};
            res.data.modules?.forEach(mod => {
                mod.projects?.forEach(p => {
                    if (p.release) map[`module_project_${p.id}`] = p.release;
                });
                if (mod.test?.release)                  map[`module_test_${mod.id}`]                = mod.test.release;
                if (mod.study_material?.release)         map[`module_study_material_${mod.id}`]      = mod.study_material.release;
                if (mod.interview_questions?.release)    map[`module_interview_questions_${mod.id}`] = mod.interview_questions.release;
                if (mod.feedback?.release)               map[`module_feedback_${mod.feedback.id}`]   = mod.feedback.release;
            });
            setReleaseMap(map);
        } catch (err) {
            console.error('Could not load release status', err);
        }
    };

    const handleBatchChange = (batchId) => {
        setSelectedBatchId(batchId);
        setExpandedModule(null);
        setReleaseMap({});
        setActiveTab('curriculum');
        setIopCurriculum(null);
        setIopTypeFilter('soft_skills');
        loadCurriculum(batchId);
        loadReleases(batchId);
        loadIOPCurriculum(batchId);
    };

    const handleIOPUnlock = async (moduleId, newDay) => {
        setIopUnlockLoading(moduleId);
        try {
            await trainerAPI.unlockIOPModule(selectedBatchId, { module_id: moduleId, unlocked_up_to_day: newDay });
            await loadIOPCurriculum(selectedBatchId);
        } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)); }
        finally { setIopUnlockLoading(null); }
    };

    const handleIOPFileDownload = async (fileId, fileName) => {
        try {
            const r = await trainerAPI.downloadIOPModuleFile(fileId);
            const url = window.URL.createObjectURL(new Blob([r.data]));
            const a = document.createElement('a');
            a.href = url; a.download = fileName; a.click();
            window.URL.revokeObjectURL(url);
        } catch { alert('Download failed'); }
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

    const openAssignModal = (item, existingRelease) => {
        setAssignModal({ item, existingRelease });
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
                        {batches.length > 0 && Object.entries(batches.reduce((acc, b) => { if (!acc[b.batch_name]) acc[b.batch_name] = []; acc[b.batch_name].push(b); return acc; }, {})).map(([bn, cs]) => (
                            <optgroup key={bn} label={bn}>{cs.map(b => <option key={b.id} value={b.id}>{b.course_name}</option>)}</optgroup>
                        ))}
                        {iopBatches.filter(ib => !batches.find(b => b.id === ib.id)).length > 0 && Object.entries(
                            iopBatches.filter(ib => !batches.find(b => b.id === ib.id))
                                .reduce((acc, b) => { if (!acc[b.batch_name]) acc[b.batch_name] = []; acc[b.batch_name].push(b); return acc; }, {})
                        ).map(([bn, cs]) => (
                            <optgroup key={`iop-${bn}`} label={`${bn} — IOP Trainer`}>{cs.map(b => <option key={b.id} value={b.id}>{b.course_name} [IOP only]</option>)}</optgroup>
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

            {/* ── Tab switcher (shown only when both tech + IOP curriculum are available) ── */}
            {selectedBatchId && iopCurriculum && (
                <div style={{
                    display: 'flex', gap: '4px', marginBottom: '20px',
                    background: theme.bg.input, border: `1px solid ${theme.border.subtle}`,
                    borderRadius: theme.radius.lg, padding: '5px', width: 'fit-content',
                }}>
                    <button onClick={() => setActiveTab('curriculum')} style={{
                        padding: '9px 20px', borderRadius: theme.radius.md, border: 'none',
                        cursor: 'pointer', fontSize: '13px',
                        fontWeight: activeTab === 'curriculum' ? 700 : 500,
                        background: activeTab === 'curriculum' ? theme.bg.card : 'transparent',
                        color: activeTab === 'curriculum' ? theme.text.primary : theme.text.muted,
                        boxShadow: activeTab === 'curriculum' ? theme.shadow.card : 'none',
                        transition: 'all 0.15s',
                    }}>Curriculum</button>
                    <button onClick={() => setActiveTab('iop')} style={{
                        padding: '9px 20px', borderRadius: theme.radius.md, border: 'none',
                        cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                        fontWeight: activeTab === 'iop' ? 700 : 500,
                        background: activeTab === 'iop' ? theme.bg.card : 'transparent',
                        color: activeTab === 'iop' ? '#10b981' : theme.text.muted,
                        boxShadow: activeTab === 'iop' ? theme.shadow.card : 'none',
                        transition: 'all 0.15s',
                    }}><Layers size={14} /> IOP Training
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: theme.radius.full, background: activeTab === 'iop' ? 'rgba(16,185,129,0.15)' : theme.bg.input, color: activeTab === 'iop' ? '#10b981' : theme.text.muted, fontWeight: 800 }}>
                            {iopCurriculum.iop_student_count} IOP
                        </span>
                    </button>
                </div>
            )}

            {currLoading && activeTab === 'curriculum' && <LoadingSpinner label="Loading curriculum..." />}

            {curriculum && !currLoading && activeTab === 'curriculum' && (
                <div>
                    <SectionTitle count={curriculum.modules?.length}>
                        {curriculum.course} — Modules
                    </SectionTitle>

                    {curriculum.modules?.length === 0 ? (
                        <EmptyState icon={<BookOpen size={24} />} title="No modules found" subtitle="This course has no modules configured yet." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {curriculum.modules.map(mod => {
                                const isExpanded = expandedModule === mod.id;
                                const isLoading = actionLoading === mod.id;
                                const unlockedDays = mod.is_unlocked
                                    ? (mod.unlocked_up_to_day === -1 ? mod.total_days : mod.unlocked_up_to_day)
                                    : 0;

                                // Feedback from curriculum data
                                const feedbackForm = mod.feedback_form || mod.feedback || null;

                                // Collect test files
                                const testFiles = mod.files?.filter(f => f.category === 'test') || [];
                                const studyFiles = mod.files?.filter(f => f.category === 'study_material' || !f.category) || [];
                                const iqFiles = mod.files?.filter(f => f.category === 'interview_questions') || [];

                                const hasTest = mod.test_url || testFiles.length > 0;
                                const hasStudy = mod.study_material_url || studyFiles.length > 0;
                                const hasIQ = mod.interview_questions_url || iqFiles.length > 0;

                                return (
                                    <Card key={mod.id} noPadding style={{ overflow: 'hidden' }}>

                                        {/* Module Header */}
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
                                                    <button onClick={e => { e.stopPropagation(); handleLockModule(mod.id); }} disabled={isLoading}
                                                        style={{
                                                            padding: '7px 14px', borderRadius: theme.radius.md,
                                                            border: `1px solid ${theme.accent.red}30`,
                                                            background: `${theme.accent.red}10`, color: theme.accent.red,
                                                            cursor: 'pointer', fontSize: '10px', fontWeight: 700,
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            opacity: isLoading ? 0.5 : 1,
                                                        }}>
                                                        <Lock size={12} /> {isLoading ? '...' : 'Lock'}
                                                    </button>
                                                ) : (
                                                    <button onClick={e => { e.stopPropagation(); handleUnlockModule(mod.id, -1); }} disabled={isLoading}
                                                        style={{
                                                            padding: '7px 14px', borderRadius: theme.radius.md,
                                                            border: 'none', background: theme.accent.green,
                                                            color: '#fff', cursor: 'pointer',
                                                            fontSize: '10px', fontWeight: 700,
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            opacity: isLoading ? 0.5 : 1,
                                                        }}>
                                                        <Unlock size={12} /> {isLoading ? '...' : 'Unlock All'}
                                                    </button>
                                                )}
                                                {isExpanded ? <ChevronDown size={16} color={theme.text.muted} /> : <ChevronRight size={16} color={theme.text.muted} />}
                                            </div>
                                        </div>

                                        {/* Expanded */}
                                        {isExpanded && mod.days && (
                                            <div style={{ borderTop: `1px solid ${theme.border.subtle}`, padding: '16px 24px' }}>

                                                {/* Day controls */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>
                                                        Day-Level Access Control
                                                    </span>
                                                    {mod.is_unlocked && mod.total_days > 0 && (
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {Array.from({ length: mod.total_days }, (_, i) => i + 1).map(n => (
                                                                <button key={n} onClick={() => handleUnlockModule(mod.id, n)} disabled={isLoading}
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

                                                {/* Component toggles */}
                                                {mod.is_unlocked && (
                                                    <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: theme.radius.md, border: `1px solid ${theme.border.subtle}` }}>
                                                        <p style={{ fontSize: '10px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', marginBottom: '10px' }}>
                                                            Component Release Control
                                                        </p>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            {[
                                                                { id: 'is_projects_released',            label: 'Projects',     icon: <Briefcase size={12} />     },
                                                                { id: 'is_test_released',                label: 'Tests',        icon: <FileSignature size={12} /> },
                                                                { id: 'is_feedback_released',            label: 'Feedback',     icon: <MessageSquare size={12} /> },
                                                                { id: 'is_study_materials_released',     label: 'Materials',    icon: <BookOpenCheck size={12} /> },
                                                                { id: 'is_interview_questions_released', label: 'Interview Qs', icon: <HelpCircle size={12} />    },
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
                                                                    }}>
                                                                    {comp.icon} {comp.label}
                                                                    {mod[comp.id] && <CheckCircle size={10} style={{ marginLeft: '4px' }} />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── Resources section with Assign buttons ── */}
                                                {mod.is_unlocked && (hasStudy || hasTest || hasIQ || feedbackForm || mod.projects?.length > 0) && (
                                                    <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

                                                        <p style={{ fontSize: '10px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', marginBottom: '4px' }}>
                                                            Module Resources — Assign to Students
                                                        </p>

                                                        {/* Study Materials */}
                                                        {hasStudy && (
                                                            <div style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                                                                padding: '10px 14px', borderRadius: theme.radius.sm,
                                                                background: releaseMap[`module_study_material_${mod.id}`] ? `${theme.accent.purple}08` : 'rgba(255,255,255,0.02)',
                                                                border: `1px solid ${releaseMap[`module_study_material_${mod.id}`] ? `${theme.accent.purple}25` : theme.border.subtle}`,
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                                                                    <BookOpen size={14} color={theme.accent.purple} style={{ flexShrink: 0 }} />
                                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text.primary }}>Study Materials</span>
                                                                    {mod.study_material_url && (
                                                                        <a href={mod.study_material_url} target="_blank" rel="noopener noreferrer"
                                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: theme.accent.purple, textDecoration: 'none' }}>
                                                                            <ExternalLink size={10} /> Link
                                                                        </a>
                                                                    )}
                                                                    {studyFiles.map(f => (
                                                                        <a key={f.id} href={`/uploads/content/${f.stored_name}`} target="_blank" rel="noopener noreferrer"
                                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: theme.text.secondary, textDecoration: 'none' }}>
                                                                            <Download size={10} /> {f.original_name}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                                <AssignBtn releaseType="module_study_material" entityId={mod.id} moduleId={mod.id}
                                                                    name={`${mod.name} — Study Materials`} releaseMap={releaseMap} onOpen={openAssignModal} />
                                                            </div>
                                                        )}

                                                        {/* Module Test */}
                                                        {hasTest && (
                                                            <div style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                                                                padding: '10px 14px', borderRadius: theme.radius.sm,
                                                                background: releaseMap[`module_test_${mod.id}`] ? `${theme.accent.yellow}08` : 'rgba(255,255,255,0.02)',
                                                                border: `1px solid ${releaseMap[`module_test_${mod.id}`] ? `${theme.accent.yellow}25` : theme.border.subtle}`,
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                                                                    <FileSignature size={14} color={theme.accent.yellow} style={{ flexShrink: 0 }} />
                                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text.primary }}>Module Test</span>
                                                                    {mod.test_url && (
                                                                        <a href={mod.test_url} target="_blank" rel="noopener noreferrer"
                                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: theme.accent.yellow, textDecoration: 'none' }}>
                                                                            <ExternalLink size={10} /> View
                                                                        </a>
                                                                    )}
                                                                    {testFiles.map(f => (
                                                                        <a key={f.id} href={`/uploads/content/${f.stored_name}`} target="_blank" rel="noopener noreferrer"
                                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: theme.accent.yellow, textDecoration: 'none' }}>
                                                                            <Download size={10} /> {f.original_name}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                                <AssignBtn releaseType="module_test" entityId={mod.id} moduleId={mod.id}
                                                                    name={`${mod.name} — Test`} releaseMap={releaseMap} onOpen={openAssignModal} />
                                                            </div>
                                                        )}

                                                        {/* Interview Questions */}
                                                        {hasIQ && (
                                                            <div style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                                                                padding: '10px 14px', borderRadius: theme.radius.sm,
                                                                background: releaseMap[`module_interview_questions_${mod.id}`] ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.02)',
                                                                border: `1px solid ${releaseMap[`module_interview_questions_${mod.id}`] ? 'rgba(6,182,212,0.25)' : theme.border.subtle}`,
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                                                                    <HelpCircle size={14} color="#06b6d4" style={{ flexShrink: 0 }} />
                                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text.primary }}>Interview Questions</span>
                                                                    {mod.interview_questions_url && (
                                                                        <a href={mod.interview_questions_url} target="_blank" rel="noopener noreferrer"
                                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#06b6d4', textDecoration: 'none' }}>
                                                                            <ExternalLink size={10} /> Link
                                                                        </a>
                                                                    )}
                                                                    {iqFiles.map(f => (
                                                                        <a key={f.id} href={`/uploads/content/${f.stored_name}`} target="_blank" rel="noopener noreferrer"
                                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#06b6d4', textDecoration: 'none' }}>
                                                                            <Download size={10} /> {f.original_name}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                                <AssignBtn releaseType="module_interview_questions" entityId={mod.id} moduleId={mod.id}
                                                                    name={`${mod.name} — Interview Questions`} releaseMap={releaseMap} onOpen={openAssignModal} />
                                                            </div>
                                                        )}

                                                        {/* Feedback Form */}
                                                        {feedbackForm && (
                                                            <div style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                                                                padding: '10px 14px', borderRadius: theme.radius.sm,
                                                                background: releaseMap[`module_feedback_${feedbackForm.id}`] ? `${theme.accent.green}08` : 'rgba(255,255,255,0.02)',
                                                                border: `1px solid ${releaseMap[`module_feedback_${feedbackForm.id}`] ? `${theme.accent.green}25` : theme.border.subtle}`,
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                                                    <Star size={14} color={theme.accent.green} style={{ flexShrink: 0 }} />
                                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text.primary }}>
                                                                        {feedbackForm.title || 'Feedback Form'}
                                                                    </span>
                                                                </div>
                                                                <AssignBtn releaseType="module_feedback" entityId={feedbackForm.id} moduleId={mod.id}
                                                                    name={feedbackForm.title || 'Feedback Form'} releaseMap={releaseMap} onOpen={openAssignModal} />
                                                            </div>
                                                        )}

                                                        {/* Projects — one at a time */}
                                                        {mod.projects?.length > 0 && (
                                                            <div style={{ marginTop: '4px' }}>
                                                                <p style={{ fontSize: '10px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', marginBottom: '8px' }}>
                                                                    Projects — Assign One at a Time
                                                                </p>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {mod.projects.map((proj, idx) => {
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
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                                                            <span style={{
                                                                                                fontSize: '10px', fontWeight: 800, color: theme.accent.blue,
                                                                                                background: `${theme.accent.blue}15`, padding: '1px 6px',
                                                                                                borderRadius: theme.radius.sm,
                                                                                            }}>P{idx + 1}</span>
                                                                                            <p style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>
                                                                                                {proj.name}
                                                                                            </p>
                                                                                            {isAssigned && (
                                                                                                <span style={{
                                                                                                    fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: theme.radius.full,
                                                                                                    background: `${theme.accent.green}15`, color: theme.accent.green,
                                                                                                    border: `1px solid ${theme.accent.green}30`,
                                                                                                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                                                                                                }}>
                                                                                                    <CheckCircle size={9} /> Assigned
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        {proj.description && (
                                                                                            <p style={{ fontSize: '12px', color: theme.text.muted, margin: '0 0 8px', lineHeight: 1.5 }}>
                                                                                                {proj.description}
                                                                                            </p>
                                                                                        )}
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
                                                                                        {proj.files?.length > 0 ? (
                                                                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                                                {proj.files.map(f => (
                                                                                                    <a key={f.id} href={`/uploads/content/${f.stored_name}`} target="_blank" rel="noopener noreferrer"
                                                                                                        style={{
                                                                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                                            fontSize: '11px', color: theme.accent.blue, textDecoration: 'none',
                                                                                                            padding: '3px 8px', background: `${theme.accent.blue}10`,
                                                                                                            borderRadius: theme.radius.sm, border: `1px solid ${theme.accent.blue}20`,
                                                                                                        }}>
                                                                                                        <Download size={11} /> {f.original_name}
                                                                                                    </a>
                                                                                                ))}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div style={{
                                                                                                display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px',
                                                                                                color: theme.text.muted, padding: '3px 8px', borderRadius: theme.radius.sm,
                                                                                                background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border.subtle}`,
                                                                                            }}>
                                                                                                <AlertCircle size={10} /> No files uploaded
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => openAssignModal(
                                                                                            { release_type: 'module_project', entity_id: proj.id, module_id: mod.id, name: proj.name },
                                                                                            existingRelease
                                                                                        )}
                                                                                        style={{
                                                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                                                            padding: '7px 14px', borderRadius: theme.radius.md,
                                                                                            cursor: 'pointer', fontSize: '11px', fontWeight: 700, flexShrink: 0,
                                                                                            border: `1px solid ${isAssigned ? `${theme.accent.green}40` : `${theme.accent.blue}40`}`,
                                                                                            background: isAssigned ? `${theme.accent.green}15` : `${theme.accent.blue}15`,
                                                                                            color: isAssigned ? theme.accent.green : theme.accent.blue,
                                                                                            transition: 'all 0.15s',
                                                                                        }}>
                                                                                        {isAssigned ? <><Edit2 size={11} /> Update</> : <><Send size={11} /> Assign</>}
                                                                                    </button>
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

            {/* ── IOP Training Section ── */}
            {iopCurrLoading && activeTab === 'iop' && <LoadingSpinner label="Loading IOP curriculum..." />}

            {iopCurriculum && !iopCurrLoading && activeTab === 'iop' && (
                <div>
                    {/* Type filter pills */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        {[
                            { key: 'soft_skills', label: 'Soft Skills', color: '#10b981' },
                            { key: 'aptitude',    label: 'Aptitude',    color: '#fb923c' },
                        ].map(t => (
                            <button key={t.key} onClick={() => setIopTypeFilter(t.key)} style={{
                                padding: '7px 18px', borderRadius: '24px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all .2s',
                                background: iopTypeFilter === t.key ? `rgba(${t.key === 'soft_skills' ? '16,185,129' : '251,146,60'},0.12)` : 'transparent',
                                color: iopTypeFilter === t.key ? t.color : theme.text.muted,
                                border: `1.5px solid ${iopTypeFilter === t.key ? t.color : theme.border.subtle}`,
                            }}>{t.label}</button>
                        ))}
                    </div>

                    {iopCurriculum.modules.filter(m => m.type === iopTypeFilter).length === 0 ? (
                        <EmptyState icon={<Layers size={24} />} title="No modules" subtitle={`No ${iopTypeFilter === 'soft_skills' ? 'Soft Skills' : 'Aptitude'} modules configured yet.`} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {iopCurriculum.modules.filter(m => m.type === iopTypeFilter).map(mod => {
                                const totalTopics = mod.topics.length;
                                const unlockedDay = mod.unlocked_up_to_day || 0;
                                const typeColor = iopTypeFilter === 'soft_skills' ? '#10b981' : '#fb923c';
                                const isLoading = iopUnlockLoading === mod.id;
                                return (
                                    <Card key={mod.id}>
                                        {/* Module header + controls */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: totalTopics > 0 ? '14px' : 0 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: '14px', color: theme.text.primary }}>
                                                    {mod.sequence_order}. {mod.title}
                                                </div>
                                                <div style={{ fontSize: '12px', color: theme.text.muted, marginTop: '2px' }}>
                                                    {totalTopics} topic{totalTopics !== 1 ? 's' : ''} — Unlocked: Day {unlockedDay} / {totalTopics}
                                                </div>
                                            </div>
                                            {/* +/- Day controls */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                <button
                                                    disabled={unlockedDay <= 0 || isLoading}
                                                    onClick={() => handleIOPUnlock(mod.id, Math.max(0, unlockedDay - 1))}
                                                    title="Lock previous day"
                                                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${theme.border.subtle}`, background: 'transparent', color: theme.text.muted, cursor: unlockedDay <= 0 || isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: unlockedDay <= 0 ? 0.35 : 1 }}>
                                                    <Minus size={12} />
                                                </button>
                                                <span style={{ minWidth: '72px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: typeColor }}>
                                                    Day {unlockedDay} / {totalTopics}
                                                </span>
                                                <button
                                                    disabled={unlockedDay >= totalTopics || isLoading}
                                                    onClick={() => handleIOPUnlock(mod.id, Math.min(totalTopics, unlockedDay + 1))}
                                                    title="Unlock next day"
                                                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${theme.border.subtle}`, background: 'transparent', color: theme.text.muted, cursor: unlockedDay >= totalTopics || isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: unlockedDay >= totalTopics ? 0.35 : 1 }}>
                                                    <Plus size={12} />
                                                </button>
                                                {unlockedDay < totalTopics && (
                                                    <ActionButton disabled={isLoading} variant="success" onClick={() => handleIOPUnlock(mod.id, totalTopics)}>
                                                        {isLoading ? '…' : 'Unlock All'}
                                                    </ActionButton>
                                                )}
                                                {unlockedDay > 0 && (
                                                    <ActionButton disabled={isLoading} variant="danger" onClick={() => handleIOPUnlock(mod.id, 0)}>
                                                        {isLoading ? '…' : 'Lock'}
                                                    </ActionButton>
                                                )}
                                            </div>
                                        </div>

                                        {/* Topic rows */}
                                        {totalTopics > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: `1px solid ${theme.border.subtle}`, paddingTop: '12px' }}>
                                                {mod.topics.map(t => (
                                                    <div key={t.id} style={{
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        padding: '8px 10px', borderRadius: '6px',
                                                        background: t.is_unlocked ? `rgba(16,185,129,0.05)` : 'transparent',
                                                        border: `1px solid ${t.is_unlocked ? 'rgba(16,185,129,0.14)' : 'transparent'}`,
                                                    }}>
                                                        {t.is_unlocked
                                                            ? <CheckCircle size={13} color={typeColor} />
                                                            : <Lock size={13} color={theme.text.muted} style={{ opacity: 0.35 }} />}
                                                        <span style={{ fontSize: '11px', fontWeight: 700, color: typeColor, minWidth: '48px' }}>Day {t.day_number}</span>
                                                        <span style={{ fontSize: '13px', color: t.is_unlocked ? theme.text.primary : theme.text.muted, flex: 1 }}>{t.topic_name}</span>
                                                        {t.notes && <span style={{ fontSize: '11px', color: theme.text.muted, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Module file downloads */}
                                        {(() => {
                                            const FILE_SLOTS = [
                                                { key: 'concepts',        label: 'Concepts',        color: '#3b82f6' },
                                                { key: 'sample_problems', label: 'Sample Problems', color: '#8b5cf6' },
                                                { key: 'worksheet',       label: 'Worksheets',      color: '#f59e0b' },
                                            ];
                                            const hasFiles = mod.files && Object.keys(mod.files).length > 0;
                                            if (!hasFiles) return null;
                                            return (
                                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme.border.subtle}` }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: theme.text.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Module Files</div>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {FILE_SLOTS.map(slot => {
                                                            const f = mod.files?.[slot.key];
                                                            if (!f) return null;
                                                            return (
                                                                <button key={slot.key} onClick={() => handleIOPFileDownload(f.id, f.file_name)}
                                                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', border: `1px solid ${slot.color}`, background: `${slot.color}12`, color: slot.color, cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                                                                    <Download size={11} /> {slot.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {assignModal && (
                <AssignModal
                    item={assignModal.item}
                    batchId={selectedBatchId}
                    existingRelease={assignModal.existingRelease}
                    onClose={() => setAssignModal(null)}
                    onDone={() => loadReleases(selectedBatchId)}
                />
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
};