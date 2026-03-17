import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import {
    PageHeader, Card, StatCard, FilterTabs, ActionButton,
    EmptyState, LoadingSpinner, SectionTitle, FormField, inputStyle, theme,
} from './TrainerComponents';
import {
    Unlock, Lock, ChevronDown, ChevronRight, CheckCircle, Clock,
    BookOpen, FileText, MessageSquare, Briefcase, Star, AlertCircle,
    X, Calendar, Send, Eye, Package, Layers, Users,
    Award, RefreshCw, Edit2
} from 'lucide-react';

const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const isOverdue = (d) => d && new Date(d) < new Date();

const RELEASE_TYPE_META = {
    module_project:             { label: 'Project',           color: theme.accent.blue,   icon: Briefcase },
    module_test:                { label: 'Module Test',       color: theme.accent.yellow, icon: FileText },
    module_feedback:            { label: 'Feedback Form',     color: theme.accent.green,  icon: Star },
    module_study_material:      { label: 'Study Materials',   color: theme.accent.purple, icon: BookOpen },
    module_interview_questions: { label: 'Interview Q&A',     color: '#06b6d4',           icon: MessageSquare },
    capstone_project:           { label: 'Capstone Project',  color: '#f97316',           icon: Award },
};

const ReleaseBadge = ({ release }) => {
    if (!release) return (
        <span style={{
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '3px 10px', borderRadius: theme.radius.full,
            background: 'rgba(255,255,255,0.05)', color: theme.text.muted,
            border: `1px solid ${theme.border.subtle}`,
        }}>Not Released</span>
    );
    return (
        <span style={{
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '3px 10px', borderRadius: theme.radius.full,
            background: `${theme.accent.green}15`, color: theme.accent.green,
            border: `1px solid ${theme.accent.green}30`,
            display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
            <CheckCircle size={10} />
            Released{release.due_date && ` · Due ${fmtDate(release.due_date)}`}
        </span>
    );
};

const ResourceCard = ({ title, icon: Icon, fileCount, release, accentColor, onRelease, onUnrelease, showDueDate = true }) => (
    <div style={{
        background: theme.bg.input,
        border: `1px solid ${release ? `${accentColor}30` : theme.border.subtle}`,
        borderRadius: theme.radius.md,
        padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        transition: 'border-color 0.2s',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '34px', height: '34px', borderRadius: theme.radius.sm,
                    background: `${accentColor}15`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: accentColor, flexShrink: 0,
                }}>
                    <Icon size={16} />
                </div>
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary }}>{title}</div>
                    <div style={{ fontSize: '11px', color: theme.text.muted }}>
                        {fileCount !== undefined ? `${fileCount} file${fileCount !== 1 ? 's' : ''}` : 'Toggleable release'}
                    </div>
                </div>
            </div>
            <ReleaseBadge release={release} />
        </div>

        {release?.due_date && (
            <div style={{
                fontSize: '11px', color: isOverdue(release.due_date) ? '#f87171' : theme.text.muted,
                display: 'flex', alignItems: 'center', gap: '4px',
            }}>
                <Calendar size={10} />
                Due: {fmtDate(release.due_date)}
                {isOverdue(release.due_date) && ' (Overdue)'}
            </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
            {!release ? (
                <ActionButton
                    onClick={onRelease}
                    icon={<Unlock size={12} />}
                    style={{ fontSize: '11px', padding: '6px 14px' }}
                >
                    {showDueDate ? 'Release with Due Date' : 'Release'}
                </ActionButton>
            ) : (
                <>
                    <ActionButton
                        onClick={onRelease}
                        variant="secondary"
                        icon={<Edit2 size={12} />}
                        style={{ fontSize: '11px', padding: '6px 12px' }}
                    >
                        Update Due Date
                    </ActionButton>
                    <ActionButton
                        onClick={onUnrelease}
                        icon={<Lock size={12} />}
                        style={{ fontSize: '11px', padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                        Un-release
                    </ActionButton>
                </>
            )}
        </div>
    </div>
);

const ProjectReleaseRow = ({ project, index, onRelease, onUnrelease }) => {
    const release = project.release;
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '14px 18px',
            background: release ? `${theme.accent.blue}08` : theme.bg.input,
            border: `1px solid ${release ? `${theme.accent.blue}25` : theme.border.subtle}`,
            borderRadius: theme.radius.md,
        }}>
            <div style={{
                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                background: `${theme.accent.blue}15`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 800, fontSize: '12px', color: theme.accent.blue,
            }}>
                P{index + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text.primary }}>{project.name}</div>
                {project.description && (
                    <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {project.description}
                    </div>
                )}
                <div style={{ fontSize: '10px', color: theme.text.label, marginTop: '3px' }}>
                    {project.file_count} file{project.file_count !== 1 ? 's' : ''}
                    {release?.due_date && (
                        <span style={{ marginLeft: '10px', color: isOverdue(release.due_date) ? '#f87171' : theme.text.muted }}>
                            · Due {fmtDate(release.due_date)}
                        </span>
                    )}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <ReleaseBadge release={release} />
                {!release ? (
                    <ActionButton
                        onClick={onRelease}
                        icon={<Unlock size={12} />}
                        style={{ fontSize: '11px', padding: '6px 12px' }}
                    >
                        Release
                    </ActionButton>
                ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <ActionButton
                            onClick={onRelease}
                            variant="secondary"
                            icon={<Edit2 size={12} />}
                            style={{ fontSize: '11px', padding: '5px 10px' }}
                        />
                        <ActionButton
                            onClick={onUnrelease}
                            icon={<Lock size={12} />}
                            style={{ fontSize: '11px', padding: '5px 10px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const ReleaseModal = ({ modal, dueDate, setDueDate, onConfirm, onClose, releasing }) => {
    if (!modal) return null;
    const meta = RELEASE_TYPE_META[modal.type] || {};
    const Icon = meta.icon || Unlock;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={onClose}>
            <div style={{
                background: theme.bg.card, borderRadius: theme.radius.lg,
                border: `1px solid ${meta.color || theme.border.light}40`,
                padding: '32px', width: '100%', maxWidth: '440px',
                boxShadow: `0 24px 64px rgba(0,0,0,0.5)`,
                animation: 'modalIn 0.2s ease-out',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: theme.radius.md,
                        background: `${meta.color || theme.accent.blue}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: meta.color || theme.accent.blue,
                    }}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: theme.text.primary }}>
                            Release {meta.label || 'Content'}
                        </div>
                        <div style={{ fontSize: '12px', color: theme.text.muted, marginTop: '2px' }}>
                            {modal.name}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                        color: theme.text.muted, padding: '4px',
                    }}>
                        <X size={18} />
                    </button>
                </div>

                {modal.needsDate ? (
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
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: `${theme.accent.green}08`, border: `1px solid ${theme.accent.green}20`,
                        borderRadius: theme.radius.md, padding: '12px 14px', marginBottom: '16px',
                    }}>
                        <CheckCircle size={16} color={theme.accent.green} />
                        <span style={{ fontSize: '12px', color: theme.text.secondary }}>
                            This content will be released immediately with no due date.
                        </span>
                    </div>
                )}

                <div style={{
                    background: `${theme.accent.blue}08`, border: `1px solid ${theme.accent.blue}15`,
                    borderRadius: theme.radius.md, padding: '10px 14px', marginBottom: '20px',
                    fontSize: '11px', color: theme.text.muted, lineHeight: 1.6,
                }}>
                    <strong style={{ color: theme.text.secondary }}>After releasing:</strong> Students in this batch will see this content in their portal.
                    {modal.needsDate && ' The due date will appear on their calendar.'}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
                    <ActionButton
                        onClick={onConfirm}
                        disabled={releasing || (modal.needsDate && !dueDate)}
                        icon={<Send size={14} />}
                    >
                        {releasing ? 'Releasing...' : 'Confirm Release'}
                    </ActionButton>
                </div>
            </div>
            <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
    );
};

export const TrainerReleaseManager = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [releaseData, setReleaseData] = useState(null);
    const [batchLoading, setBatchLoading] = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('days');
    const [expandedModules, setExpandedModules] = useState({});
    const [modal, setModal] = useState(null);
    const [dueDate, setDueDate] = useState('');
    const [releasing, setReleasing] = useState(false);
    const [dayReleasing, setDayReleasing] = useState(null);

    useEffect(() => {
        trainerAPI.getMyBatches()
            .then(res => {
                const active = (res.data.batches || []).filter(b => b.status === 'active');
                setBatches(active);
                if (active.length === 1) setSelectedBatch(active[0]);
            })
            .catch(console.error)
            .finally(() => setBatchLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedBatch) return;
        setStatusLoading(true);
        setReleaseData(null);
        trainerAPI.getReleaseStatus(selectedBatch.id)
            .then(res => setReleaseData(res.data))
            .catch(console.error)
            .finally(() => setStatusLoading(false));
    }, [selectedBatch]);

    const refreshStatus = async () => {
        if (!selectedBatch) return;
        const res = await trainerAPI.getReleaseStatus(selectedBatch.id);
        setReleaseData(res.data);
    };

    const handleReleaseDay = async (moduleId, dayNumber) => {
        setDayReleasing(`${moduleId}_${dayNumber}`);
        try {
            await trainerAPI.releaseDay(selectedBatch.id, { module_id: moduleId, day_number: dayNumber });
            await refreshStatus();
        } catch (err) {
            alert(err.response?.data?.message || 'Error releasing day');
        } finally {
            setDayReleasing(null);
        }
    };

    const openModal = (type, entityId, moduleId, name, needsDate = true) => {
        setModal({ type, entity_id: entityId, module_id: moduleId, name, needsDate });
        setDueDate('');
    };

    const handleConfirmRelease = async () => {
        if (!modal) return;
        if (modal.needsDate && !dueDate) return alert('Please select a due date');
        setReleasing(true);
        try {
            await trainerAPI.releaseItem(selectedBatch.id, {
                release_type: modal.type,
                entity_id: modal.entity_id,
                module_id: modal.module_id,
                due_date: modal.needsDate ? dueDate : null,
            });
            await refreshStatus();
            setModal(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Release failed');
        } finally {
            setReleasing(false);
        }
    };

    const handleUnrelease = async (releaseId) => {
        if (!window.confirm('Un-release this item? Students will lose access immediately.')) return;
        try {
            await trainerAPI.unreleaseItem(selectedBatch.id, releaseId);
            await refreshStatus();
        } catch (err) {
            alert(err.response?.data?.message || 'Error');
        }
    };

    const toggleModule = (id) => setExpandedModules(p => ({ ...p, [id]: !p[id] }));

    const stats = (() => {
        if (!releaseData) return { days: 0, dayTotal: 0, items: 0, itemTotal: 0 };
        let releasedDays = 0, totalDays = 0, releasedItems = 0, totalItems = 0;
        releaseData.modules.forEach(m => {
            totalDays += m.days.length;
            releasedDays += m.days.filter(d => d.released).length;
            m.projects.forEach(p => { totalItems++; if (p.release) releasedItems++; });
            if (m.test.file_count > 0) { totalItems++; if (m.test.release) releasedItems++; }
            if (m.feedback) { totalItems++; if (m.feedback.release) releasedItems++; }
            if (m.study_material.file_count > 0) { totalItems++; if (m.study_material.release) releasedItems++; }
            if (m.interview_questions.file_count > 0) { totalItems++; if (m.interview_questions.release) releasedItems++; }
        });
        releaseData.capstones.forEach(c => { totalItems++; if (c.release) releasedItems++; });
        return { days: releasedDays, dayTotal: totalDays, items: releasedItems, itemTotal: totalItems };
    })();

    if (batchLoading) return <LoadingSpinner label="Loading your batches..." />;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Release Manager"
                subtitle="Control what content students can access, with due dates for assessments"
                icon={<Unlock size={24} />}
                accentColor={theme.accent.blue}
            />

            {/* Batch Selector */}
            <Card style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label, marginBottom: '8px' }}>
                            Select Batch
                        </div>
                        <select
                            value={selectedBatch?.id || ''}
                            onChange={e => {
                                const b = batches.find(b => b.id === parseInt(e.target.value));
                                setSelectedBatch(b || null);
                                setExpandedModules({});
                                setActiveTab('days');
                            }}
                            style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                        >
                            <option value="">— Choose an active batch —</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.batch_name} · {b.course_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedBatch && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {[
                                { label: 'Days Released', value: `${stats.days} / ${stats.dayTotal}`, color: theme.accent.blue },
                                { label: 'Items Released', value: `${stats.items} / ${stats.itemTotal}`, color: theme.accent.green },
                                { label: 'Capstones', value: releaseData?.capstones.length || 0, color: '#f97316' },
                            ].map(s => (
                                <div key={s.label} style={{
                                    textAlign: 'center', padding: '10px 20px',
                                    background: `${s.color}08`, border: `1px solid ${s.color}20`,
                                    borderRadius: theme.radius.md,
                                }}>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: '10px', color: theme.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {batches.length === 0 && (
                <EmptyState icon={<Users size={24} />} title="No active batches" subtitle="You have no active batches assigned to you." />
            )}

            {selectedBatch && statusLoading && <LoadingSpinner label="Loading release status..." />}

            {selectedBatch && releaseData && !statusLoading && (
                <>
                    {/* Tab Bar */}
                    <div style={{
                        display: 'flex', gap: '4px',
                        background: theme.bg.input, border: `1px solid ${theme.border.subtle}`,
                        borderRadius: theme.radius.lg, padding: '5px', marginBottom: '20px',
                        width: 'fit-content',
                    }}>
                        {[
                            { id: 'days',     label: 'Daily Content',      icon: BookOpen },
                            { id: 'module',   label: 'Module Resources',   icon: Layers },
                            { id: 'capstone', label: 'Capstone Projects',  icon: Award },
                        ].map(t => {
                            const Icon = t.icon;
                            const active = activeTab === t.id;
                            return (
                                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '9px 18px', borderRadius: theme.radius.md,
                                    border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: active ? 700 : 500,
                                    background: active ? theme.bg.card : 'transparent',
                                    color: active ? theme.text.primary : theme.text.muted,
                                    boxShadow: active ? theme.shadow.card : 'none',
                                    transition: 'all 0.15s',
                                }}>
                                    <Icon size={15} /> {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── TAB: DAILY CONTENT ── */}
                    {activeTab === 'days' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {releaseData.modules.length === 0 && (
                                <EmptyState icon={<BookOpen size={24} />} title="No modules found" subtitle="This course has no modules yet." />
                            )}
                            {releaseData.modules.map(mod => {
                                const expanded = expandedModules[mod.id] !== false;
                                const releasedCount = mod.days.filter(d => d.released).length;
                                return (
                                    <Card key={mod.id} noPadding>
                                        <button
                                            onClick={() => toggleModule(mod.id)}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                                                padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
                                                color: theme.text.primary, textAlign: 'left',
                                            }}
                                        >
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: theme.radius.sm,
                                                background: `${theme.accent.blue}15`, display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontWeight: 800, fontSize: '12px',
                                                color: theme.accent.blue, flexShrink: 0,
                                            }}>
                                                M{mod.sequence_order}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text.primary }}>{mod.name}</div>
                                                <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '2px' }}>
                                                    {releasedCount} / {mod.days.length} days released
                                                </div>
                                            </div>
                                            <div style={{ width: '100px', height: '4px', background: theme.border.subtle, borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: '2px', background: theme.accent.blue,
                                                    width: mod.days.length > 0 ? `${(releasedCount / mod.days.length) * 100}%` : '0%',
                                                    transition: 'width 0.4s',
                                                }} />
                                            </div>
                                            {expanded ? <ChevronDown size={18} color={theme.text.muted} /> : <ChevronRight size={18} color={theme.text.muted} />}
                                        </button>

                                        {expanded && (
                                            <div style={{ borderTop: `1px solid ${theme.border.subtle}` }}>
                                                {mod.days.length === 0 ? (
                                                    <div style={{ padding: '24px', textAlign: 'center', color: theme.text.muted, fontSize: '13px' }}>
                                                        No days in this module
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{
                                                            display: 'grid', gridTemplateColumns: '60px 1fr 100px 110px 80px 100px',
                                                            padding: '10px 20px', gap: '12px',
                                                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                            letterSpacing: '0.08em', color: theme.text.label,
                                                            borderBottom: `1px solid ${theme.border.subtle}`,
                                                        }}>
                                                            <div>Day</div>
                                                            <div>Topic</div>
                                                            <div style={{ textAlign: 'center' }}>Materials</div>
                                                            <div style={{ textAlign: 'center' }}>Worksheets</div>
                                                            <div style={{ textAlign: 'center' }}>Status</div>
                                                            <div style={{ textAlign: 'center' }}>Action</div>
                                                        </div>
                                                        {mod.days.map(day => {
                                                            const dayKey = `${mod.id}_${day.day_number}`;
                                                            const isReleasing = dayReleasing === dayKey;
                                                            return (
                                                                <div key={day.id} style={{
                                                                    display: 'grid', gridTemplateColumns: '60px 1fr 100px 110px 80px 100px',
                                                                    padding: '12px 20px', gap: '12px', alignItems: 'center',
                                                                    borderBottom: `1px solid ${theme.border.subtle}`,
                                                                    background: day.released ? `${theme.accent.green}05` : 'transparent',
                                                                }}>
                                                                    <div style={{
                                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                                        background: day.released ? `${theme.accent.green}15` : `${theme.accent.blue}10`,
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontWeight: 800, fontSize: '12px',
                                                                        color: day.released ? theme.accent.green : theme.accent.blue,
                                                                    }}>
                                                                        {day.day_number}
                                                                    </div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text.primary }}>
                                                                        {day.topic_name || `Day ${day.day_number}`}
                                                                    </div>
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        <span style={{
                                                                            fontSize: '11px', padding: '3px 8px', borderRadius: theme.radius.sm,
                                                                            background: day.material_count > 0 ? `${theme.accent.blue}15` : theme.bg.input,
                                                                            color: day.material_count > 0 ? theme.accent.blue : theme.text.muted,
                                                                        }}>{day.material_count} file{day.material_count !== 1 ? 's' : ''}</span>
                                                                    </div>
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        <span style={{
                                                                            fontSize: '11px', padding: '3px 8px', borderRadius: theme.radius.sm,
                                                                            background: day.worksheet_count > 0 ? `${theme.accent.yellow}15` : theme.bg.input,
                                                                            color: day.worksheet_count > 0 ? theme.accent.yellow : theme.text.muted,
                                                                        }}>{day.worksheet_count} file{day.worksheet_count !== 1 ? 's' : ''}</span>
                                                                    </div>
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        {day.released ? (
                                                                            <span style={{ fontSize: '10px', fontWeight: 700, color: theme.accent.green, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                                                                <CheckCircle size={12} /> Live
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{ fontSize: '10px', color: theme.text.muted }}>Locked</span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        {!day.released && (
                                                                            <ActionButton
                                                                                onClick={() => handleReleaseDay(mod.id, day.day_number)}
                                                                                disabled={isReleasing}
                                                                                icon={isReleasing ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Unlock size={11} />}
                                                                                style={{ fontSize: '11px', padding: '5px 12px' }}
                                                                            >
                                                                                {isReleasing ? '...' : 'Release'}
                                                                            </ActionButton>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* ── TAB: MODULE RESOURCES ── */}
                    {activeTab === 'module' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {releaseData.modules.map(mod => {
                                const expanded = expandedModules[`mod_${mod.id}`];
                                const hasResources = mod.projects.length > 0 || mod.test.file_count > 0 ||
                                    mod.feedback || mod.study_material.file_count > 0 || mod.interview_questions.file_count > 0;

                                return (
                                    <Card key={mod.id} noPadding>
                                        <button
                                            onClick={() => toggleModule(`mod_${mod.id}`)}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                                                padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
                                                color: theme.text.primary, textAlign: 'left',
                                            }}
                                        >
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: theme.radius.sm,
                                                background: `${theme.accent.purple}15`, display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontWeight: 800, fontSize: '12px',
                                                color: theme.accent.purple, flexShrink: 0,
                                            }}>
                                                M{mod.sequence_order}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text.primary }}>{mod.name}</div>
                                                <div style={{ fontSize: '11px', color: theme.text.muted, marginTop: '2px' }}>
                                                    {[
                                                        mod.projects.length && `${mod.projects.length} project${mod.projects.length !== 1 ? 's' : ''}`,
                                                        mod.test.file_count && 'Test',
                                                        mod.feedback && 'Feedback',
                                                        mod.study_material.file_count && 'Study Material',
                                                        mod.interview_questions.file_count && 'Interview Q&A',
                                                    ].filter(Boolean).join(' · ') || 'No resources added yet'}
                                                </div>
                                            </div>
                                            {expanded ? <ChevronDown size={18} color={theme.text.muted} /> : <ChevronRight size={18} color={theme.text.muted} />}
                                        </button>

                                        {expanded && (
                                            <div style={{ borderTop: `1px solid ${theme.border.subtle}`, padding: '20px' }}>
                                                {!hasResources ? (
                                                    <div style={{ textAlign: 'center', padding: '24px', color: theme.text.muted, fontSize: '13px' }}>
                                                        No resources uploaded for this module yet.
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                                        {(mod.study_material.file_count > 0 || mod.interview_questions.file_count > 0) && (
                                                            <div>
                                                                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label, marginBottom: '12px' }}>
                                                                    Direct Release (No Due Date)
                                                                </div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                                                                    {mod.study_material.file_count > 0 && (
                                                                        <ResourceCard
                                                                            title="Study Materials"
                                                                            icon={BookOpen}
                                                                            fileCount={mod.study_material.file_count}
                                                                            accentColor={theme.accent.purple}
                                                                            release={mod.study_material.release}
                                                                            showDueDate={false}
                                                                            onRelease={() => openModal('module_study_material', mod.id, mod.id, `${mod.name} — Study Materials`, false)}
                                                                            onUnrelease={() => handleUnrelease(mod.study_material.release?.id)}
                                                                        />
                                                                    )}
                                                                    {mod.interview_questions.file_count > 0 && (
                                                                        <ResourceCard
                                                                            title="Interview Q&A"
                                                                            icon={MessageSquare}
                                                                            fileCount={mod.interview_questions.file_count}
                                                                            accentColor="#06b6d4"
                                                                            release={mod.interview_questions.release}
                                                                            showDueDate={false}
                                                                            onRelease={() => openModal('module_interview_questions', mod.id, mod.id, `${mod.name} — Interview Questions`, false)}
                                                                            onUnrelease={() => handleUnrelease(mod.interview_questions.release?.id)}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {(mod.test.file_count > 0 || mod.feedback) && (
                                                            <div>
                                                                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label, marginBottom: '12px' }}>
                                                                    Assessed (Due Date Required)
                                                                </div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                                                                    {mod.test.file_count > 0 && (
                                                                        <ResourceCard
                                                                            title="Module Test"
                                                                            icon={FileText}
                                                                            fileCount={mod.test.file_count}
                                                                            accentColor={theme.accent.yellow}
                                                                            release={mod.test.release}
                                                                            onRelease={() => openModal('module_test', mod.id, mod.id, `${mod.name} — Test`)}
                                                                            onUnrelease={() => handleUnrelease(mod.test.release?.id)}
                                                                        />
                                                                    )}
                                                                    {mod.feedback && (
                                                                        <ResourceCard
                                                                            title={mod.feedback.title}
                                                                            icon={Star}
                                                                            accentColor={theme.accent.green}
                                                                            release={mod.feedback.release}
                                                                            onRelease={() => openModal('module_feedback', mod.feedback.id, mod.id, mod.feedback.title)}
                                                                            onUnrelease={() => handleUnrelease(mod.feedback.release?.id)}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {mod.projects.length > 0 && (
                                                            <div>
                                                                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.text.label, marginBottom: '12px' }}>
                                                                    Module Projects ({mod.projects.length}) — Release One at a Time
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {mod.projects.map((p, idx) => (
                                                                        <ProjectReleaseRow
                                                                            key={p.id}
                                                                            project={p}
                                                                            index={idx}
                                                                            onRelease={() => openModal('module_project', p.id, mod.id, p.name)}
                                                                            onUnrelease={() => handleUnrelease(p.release?.id)}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* ── TAB: CAPSTONE PROJECTS ── */}
                    {activeTab === 'capstone' && (
                        <div>
                            {releaseData.capstones.length === 0 ? (
                                <EmptyState
                                    icon={<Award size={24} />}
                                    title="No capstone projects"
                                    subtitle="Ask your Super Admin to add capstone projects to this course."
                                />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{
                                        background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)',
                                        borderRadius: theme.radius.md, padding: '14px 18px',
                                        fontSize: '12px', color: '#fdba74', lineHeight: 1.6,
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                    }}>
                                        <AlertCircle size={16} color="#f97316" style={{ flexShrink: 0 }} />
                                        <span>
                                            <strong>Release capstone projects one at a time.</strong> Each project needs a due date and will appear on all students' calendars.
                                        </span>
                                    </div>

                                    {releaseData.capstones.map((cap, idx) => (
                                        <Card key={cap.id} style={{ borderTop: `3px solid ${cap.release ? '#f97316' : theme.border.subtle}` }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                                <div style={{
                                                    width: '50px', height: '50px', borderRadius: theme.radius.md, flexShrink: 0,
                                                    background: `rgba(249,115,22,${cap.release ? 0.2 : 0.1})`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 800, fontSize: '18px', color: '#f97316',
                                                }}>
                                                    C{idx + 1}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>{cap.name}</h3>
                                                        <ReleaseBadge release={cap.release} />
                                                    </div>
                                                    {cap.description && (
                                                        <p style={{ fontSize: '13px', color: theme.text.muted, margin: '0 0 10px', lineHeight: 1.5 }}>{cap.description}</p>
                                                    )}
                                                    <div style={{ fontSize: '11px', color: theme.text.label }}>
                                                        {cap.file_count} resource file{cap.file_count !== 1 ? 's' : ''}
                                                        {cap.release?.due_date && (
                                                            <span style={{ marginLeft: '12px', color: isOverdue(cap.release.due_date) ? '#f87171' : theme.text.muted }}>
                                                                · Due: {fmtDate(cap.release.due_date)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                    {!cap.release ? (
                                                        <ActionButton
                                                            onClick={() => openModal('capstone_project', cap.id, null, cap.name)}
                                                            icon={<Unlock size={13} />}
                                                        >
                                                            Release to Batch
                                                        </ActionButton>
                                                    ) : (
                                                        <>
                                                            <ActionButton
                                                                variant="secondary"
                                                                onClick={() => openModal('capstone_project', cap.id, null, cap.name)}
                                                                icon={<Edit2 size={13} />}
                                                            >
                                                                Update Due Date
                                                            </ActionButton>
                                                            <ActionButton
                                                                onClick={() => handleUnrelease(cap.release.id)}
                                                                icon={<Lock size={13} />}
                                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                                                            >
                                                                Un-release
                                                            </ActionButton>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <ReleaseModal
                modal={modal}
                dueDate={dueDate}
                setDueDate={setDueDate}
                onConfirm={handleConfirmRelease}
                onClose={() => setModal(null)}
                releasing={releasing}
            />

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default TrainerReleaseManager;