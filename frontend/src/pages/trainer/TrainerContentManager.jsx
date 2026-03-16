import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import { useSearchParams } from 'react-router-dom';
import {
    PageHeader, Card, ActionButton, EmptyState, LoadingSpinner, StatusBadge, SectionTitle, FormField, inputStyle, theme,
} from './TrainerComponents';
import {
    ChevronRight, ChevronDown, CheckCircle, Lock, Unlock, Clock, Calendar,
    BookOpen, BookOpenCheck, FileSignature, Briefcase, MessageSquare,
    HelpCircle, Download, ExternalLink, FileText, Info, GraduationCap
} from 'lucide-react';

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

    // Fetch trainer's batches on mount
    useEffect(() => {
        (async () => {
            try {
                const res = await trainerAPI.getMyCalendar();
                const activeBatches = (res.data.batches || []).filter(b => b.status === 'active' || b.status === 'upcoming');
                setBatches(activeBatches);
                if (preselectedBatch && activeBatches.find(b => String(b.id) === preselectedBatch)) {
                    loadCurriculum(preselectedBatch);
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

    const handleBatchChange = (batchId) => {
        setSelectedBatchId(batchId);
        setExpandedModule(null);
        loadCurriculum(batchId);
    };

    const handleUnlockModule = async (moduleId, config) => {
        setActionLoading(moduleId);
        try {
            // config can be a number (upToDay) or an object with granular flags
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
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={selectedBatchId}
                        onChange={e => handleBatchChange(e.target.value)}>
                        <option value="">— Choose a batch —</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name} ({b.course_name})</option>)}
                    </select>
                </FormField>
            </Card>

            {!selectedBatchId && (
                <EmptyState icon={<GraduationCap size={28} />} title="Select a Batch" subtitle="Pick a batch above to manage its curriculum access." />
            )}

            {currLoading && <LoadingSpinner label="Loading curriculum..." />}

            {curriculum && !currLoading && (
                <div>
                    <SectionTitle count={curriculum.modules?.length}>
                        {curriculum.course} — Modules
                    </SectionTitle>

                    {curriculum.modules?.length === 0 ? (
                        <EmptyState icon={<Layers size={24} />} title="No modules found" subtitle="This course has no modules configured yet." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {curriculum.modules.map(mod => {
                                const isExpanded = expandedModule === mod.id;
                                const isLoading = actionLoading === mod.id;
                                const unlockedDays = mod.is_unlocked ? (mod.unlocked_up_to_day === -1 ? mod.total_days : mod.unlocked_up_to_day) : 0;

                                return (
                                    <Card key={mod.id} noPadding style={{ overflow: 'hidden' }}>
                                        {/* Module Header */}
                                        <div style={{
                                            padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            cursor: 'pointer', transition: 'background 0.2s',
                                        }}
                                            onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                                            onMouseEnter={e => e.currentTarget.style.background = theme.bg.cardHover}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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
                                                        <StatusBadge status={mod.is_unlocked ? 'Unlocked' : 'Locked'} color={mod.is_unlocked ? theme.accent.green : theme.text.muted} />
                                                    </div>
                                                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: theme.text.primary, margin: '2px 0 0' }}>{mod.name}</h4>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                {mod.total_days > 0 && (
                                                    <span style={{ fontSize: '11px', color: theme.text.muted, fontWeight: 600 }}>
                                                        {unlockedDays}/{mod.total_days} days
                                                    </span>
                                                )}
                                                {/* Quick toggle */}
                                                {mod.is_unlocked ? (
                                                    <button onClick={e => { e.stopPropagation(); handleLockModule(mod.id); }} disabled={isLoading}
                                                        style={{
                                                            padding: '7px 14px', borderRadius: theme.radius.md, border: `1px solid ${theme.accent.red}30`,
                                                            background: `${theme.accent.red}10`, color: theme.accent.red, cursor: 'pointer',
                                                            fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px',
                                                            opacity: isLoading ? 0.5 : 1,
                                                        }}>
                                                        <Lock size={12} /> {isLoading ? '...' : 'Lock'}
                                                    </button>
                                                ) : (
                                                    <button onClick={e => { e.stopPropagation(); handleUnlockModule(mod.id, -1); }} disabled={isLoading}
                                                        style={{
                                                            padding: '7px 14px', borderRadius: theme.radius.md, border: 'none',
                                                            background: theme.accent.green, color: '#fff', cursor: 'pointer',
                                                            fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px',
                                                            opacity: isLoading ? 0.5 : 1,
                                                        }}>
                                                        <Unlock size={12} /> {isLoading ? '...' : 'Unlock All'}
                                                    </button>
                                                )}
                                                {isExpanded ? <ChevronDown size={16} color={theme.text.muted} /> : <ChevronRight size={16} color={theme.text.muted} />}
                                            </div>
                                        </div>

                                        {/* Expanded Days */}
                                        {isExpanded && mod.days && (
                                            <div style={{ borderTop: `1px solid ${theme.border.subtle}`, padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>
                                                        Day-Level Access Control
                                                    </span>
                                                    {mod.is_unlocked && mod.total_days > 0 && (
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {Array.from({ length: mod.total_days }, (_, i) => i + 1).map(n => (
                                                                <button key={n} onClick={() => handleUnlockModule(mod.id, n)} disabled={isLoading}
                                                                    style={{
                                                                        padding: '5px 10px', borderRadius: theme.radius.sm, border: `1px solid ${theme.border.subtle}`,
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

                                                {/* Granular Component Release */}
                                                {mod.is_unlocked && (
                                                    <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: theme.radius.md, border: `1px solid ${theme.border.subtle}` }}>
                                                        <p style={{ fontSize: '10px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', marginBottom: '10px' }}>Component Release Control</p>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            {[
                                                                { id: 'is_projects_released', label: 'Projects', icon: <Briefcase size={12} /> },
                                                                { id: 'is_test_released', label: 'Tests', icon: <FileSignature size={12} /> },
                                                                { id: 'is_feedback_released', label: 'Feedback', icon: <MessageSquare size={12} /> },
                                                                { id: 'is_study_materials_released', label: 'Materials', icon: <BookOpenCheck size={12} /> },
                                                                { id: 'is_interview_questions_released', label: 'Interview Qs', icon: <HelpCircle size={12} /> },
                                                            ].map(comp => (
                                                                <button
                                                                    key={comp.id}
                                                                    onClick={() => handleUnlockModule(mod.id, { [comp.id]: !mod[comp.id] })}
                                                                    disabled={isLoading}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: theme.radius.sm,
                                                                        border: `1px solid ${mod[comp.id] ? theme.accent.blue : theme.border.subtle}`,
                                                                        background: mod[comp.id] ? `${theme.accent.blue}15` : 'transparent',
                                                                        color: mod[comp.id] ? theme.accent.blue : theme.text.muted,
                                                                        cursor: 'pointer', fontSize: '10px', fontWeight: 700, transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    {comp.icon} {comp.label} {mod[comp.id] ? <CheckCircle size={10} style={{ marginLeft: '4px' }} /> : ''}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Content Links and Projects Display */}
                                                {mod.is_unlocked && (
                                                    <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {/* Resource Links */}
                                                        {(mod.study_material_url || mod.test_url || mod.interview_questions_url || (mod.files && mod.files.length > 0)) && (
                                                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: theme.radius.md, border: `1px solid ${theme.border.subtle}` }}>
                                                                <p style={{ fontSize: '10px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', marginBottom: '8px' }}>Module Resources</p>
                                                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                                    {mod.study_material_url && (
                                                                        <a href={mod.study_material_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: theme.accent.blue, textDecoration: 'none' }}>
                                                                            <BookOpen size={14} /> Material <ExternalLink size={10} />
                                                                        </a>
                                                                    )}
                                                                    {mod.test_url && (
                                                                        <a href={mod.test_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: theme.accent.blue, textDecoration: 'none' }}>
                                                                            <FileSignature size={14} /> Test Link <ExternalLink size={10} />
                                                                        </a>
                                                                    )}
                                                                    {mod.interview_questions_url && (
                                                                        <a href={mod.interview_questions_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: theme.accent.blue, textDecoration: 'none' }}>
                                                                            <HelpCircle size={14} /> Interview Qs <ExternalLink size={10} />
                                                                        </a>
                                                                    )}
                                                                    {mod.files?.map(file => (
                                                                        <a key={file.id} href={`/uploads/content/${file.stored_name}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: theme.text.secondary, textDecoration: 'none' }}>
                                                                            <FileText size={14} /> {file.original_name} <Download size={10} />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Projects Display */}
                                                        {(mod.module_project_details || (mod.projects && mod.projects.length > 0)) && (
                                                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: theme.radius.md, border: `1px solid ${theme.border.subtle}` }}>
                                                                <p style={{ fontSize: '10px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', marginBottom: '8px' }}>Project Details</p>
                                                                {mod.module_project_details && (
                                                                    <div style={{ fontSize: '12px', color: theme.text.muted, marginBottom: '10px', padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                                                        <Info size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                                        {mod.module_project_details}
                                                                    </div>
                                                                )}
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {mod.projects?.map(proj => (
                                                                        <div key={proj.id} style={{ padding: '8px', borderLeft: `2px solid ${theme.accent.blue}`, background: 'rgba(255,255,255,0.02)' }}>
                                                                            <p style={{ fontSize: '13px', fontWeight: 600, color: theme.text.primary, marginBottom: '4px' }}>{proj.name}</p>
                                                                            <p style={{ fontSize: '12px', color: theme.text.muted, marginBottom: '6px' }}>{proj.description}</p>
                                                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                                                {proj.files?.map(f => (
                                                                                    <a key={f.id} href={`/uploads/content/${f.stored_name}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: theme.accent.blue, textDecoration: 'none' }}>
                                                                                        <Download size={12} /> {f.original_name}
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {mod.days.length === 0 ? (
                                                    <p style={{ fontSize: '12px', color: theme.text.muted, textAlign: 'center', padding: '16px 0' }}>No days configured for this module.</p>
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
                                                                    <span style={{ fontSize: '9px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Day {day.day_number}</span>
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
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};
