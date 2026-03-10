import { useState, useEffect } from 'react';
import { trainerAPI } from '../../services/api';
import { useSearchParams } from 'react-router-dom';
import {
    PageHeader, Card, ActionButton, EmptyState, LoadingSpinner, StatusBadge, SectionTitle, FormField, inputStyle, theme,
} from './TrainerComponents';
import {
    BookOpenCheck, Lock, Unlock, ChevronDown, ChevronRight, Layers, FileText, GraduationCap,
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

    const handleUnlockModule = async (moduleId, upToDay) => {
        setActionLoading(moduleId);
        try {
            await trainerAPI.unlockModule(selectedBatchId, { module_id: moduleId, unlocked_up_to_day: upToDay });
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
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            {[1, 3, 5, mod.total_days].filter((v, i, a) => v <= mod.total_days && a.indexOf(v) === i).map(n => (
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
