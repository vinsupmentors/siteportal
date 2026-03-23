// IOP Trainer Portal — Groups Management (List → Detail → Attendance)
import { useState, useEffect, useCallback } from 'react';
import {
    Layers, Users, BookOpen, Calendar, ChevronLeft,
    ChevronDown, ChevronRight, CheckCircle, Circle,
    Save, RefreshCw, Clock, Tag,
} from 'lucide-react';
import { iopTrainerAPI } from '../../services/api';
import theme from '../student/theme';
import {
    PageHeader, StatCard, Card, FilterTabs, StatusBadge,
    ActionButton, EmptyState, LoadingSpinner, SectionTitle,
} from '../trainer/TrainerComponents';

/* ─── helpers ─────────────────────────────────────────────── */
const fadeIn = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}
`;

const todayStr = () => new Date().toISOString().slice(0, 10);

const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const moduleTypeColor = (type) => {
    if (!type) return theme.text.muted;
    const t = type.toLowerCase();
    if (t.includes('soft')) return theme.accent.cyan;
    if (t.includes('apt')) return theme.accent.yellow;
    return theme.accent.purple;
};

const moduleTypeLabel = (type) => {
    if (!type) return 'General';
    const t = type.toLowerCase();
    if (t.includes('soft')) return 'Soft Skills';
    if (t.includes('apt')) return 'Aptitude';
    return type;
};

const groupBy = (arr, key) =>
    arr.reduce((acc, item) => {
        const k = item[key] || 'Unknown';
        if (!acc[k]) acc[k] = [];
        acc[k].push(item);
        return acc;
    }, {});

/* ─── sub-components ──────────────────────────────────────── */

// Inline spinner (small)
const Spin = () => (
    <>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
    </>
);

/* ── Attendance status button set ── */
const STATUSES = ['present', 'absent', 'late'];
const statusColors = {
    present: theme.accent.green,
    absent: theme.accent.red,
    late: theme.accent.yellow,
};

const AttStatusBtn = ({ value, active, onClick }) => (
    <button
        onClick={() => onClick(value)}
        style={{
            padding: '6px 14px',
            borderRadius: theme.radius.full,
            border: `1px solid ${active ? statusColors[value] : theme.border.subtle}`,
            background: active ? `${statusColors[value]}18` : 'transparent',
            color: active ? statusColors[value] : theme.text.muted,
            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            textTransform: 'capitalize', transition: 'all 0.15s',
        }}
    >{value}</button>
);

/* ─── Main Component ──────────────────────────────────────── */
export const IOPTrainerGroups = () => {
    /* view state */
    const [view, setView] = useState('list'); // 'list' | 'detail'
    const [activeGroup, setActiveGroup] = useState(null);
    const [activeTab, setActiveTab] = useState('curriculum');

    /* data */
    const [groups, setGroups] = useState([]);
    const [curriculum, setCurriculum] = useState([]);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});          // { studentId: status }
    const [attendanceDate, setAttendanceDate] = useState(todayStr());
    const [attendanceLoaded, setAttendanceLoaded] = useState(false);

    /* ui flags */
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [submittingUnlock, setSubmittingUnlock] = useState({}); // { moduleId: bool }
    const [submittingAttendance, setSubmittingAttendance] = useState(false);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [expandedModules, setExpandedModules] = useState({});  // { moduleId: bool }

    /* per-module unlock value (before saving) */
    const [unlockDraft, setUnlockDraft] = useState({}); // { moduleId: number }

    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    /* ── toast helper ── */
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* ── load groups list ── */
    useEffect(() => {
        const load = async () => {
            try {
                const res = await iopTrainerAPI.getMyGroups();
                setGroups(res.data?.groups ?? res.data ?? []);
            } catch (err) {
                setError(err?.response?.data?.message || 'Could not load groups');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    /* ── open group detail ── */
    const openGroup = async (group) => {
        setActiveGroup(group);
        setView('detail');
        setActiveTab('curriculum');
        setAttendance({});
        setAttendanceDate(todayStr());
        setAttendanceLoaded(false);
        setDetailLoading(true);
        try {
            const [currRes, studRes] = await Promise.all([
                iopTrainerAPI.getGroupCurriculum(group.id),
                iopTrainerAPI.getGroupStudents(group.id),
            ]);
            const mods = currRes.data?.modules ?? currRes.data ?? [];
            setCurriculum(mods);
            // initialise unlock draft from current values
            const draft = {};
            mods.forEach(m => { draft[m.id] = m.unlocked_up_to_day ?? 0; });
            setUnlockDraft(draft);
            setStudents(studRes.data?.students ?? studRes.data ?? []);
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to load group details', 'error');
        } finally {
            setDetailLoading(false);
        }
    };

    /* ── back to list ── */
    const goBack = () => {
        setView('list');
        setActiveGroup(null);
        setCurriculum([]);
        setStudents([]);
    };

    /* ── load attendance for a date ── */
    const loadAttendance = useCallback(async (date) => {
        if (!activeGroup) return;
        setLoadingAttendance(true);
        setAttendanceLoaded(false);
        try {
            const res = await iopTrainerAPI.getGroupAttendance(activeGroup.id, date);
            const records = res.data?.attendance ?? [];
            const map = {};
            records.forEach(r => { map[r.student_id] = r.status; });
            setAttendance(map);
            setAttendanceLoaded(true);
        } catch {
            setAttendance({});
            setAttendanceLoaded(false);
        } finally {
            setLoadingAttendance(false);
        }
    }, [activeGroup]);

    /* auto-load attendance when switching to attendance tab */
    useEffect(() => {
        if (activeTab === 'attendance' && activeGroup && !attendanceLoaded) {
            loadAttendance(attendanceDate);
        }
    }, [activeTab, activeGroup, attendanceLoaded, attendanceDate, loadAttendance]);

    /* ── unlock module ── */
    const handleUnlock = async (moduleId) => {
        if (!activeGroup) return;
        setSubmittingUnlock(prev => ({ ...prev, [moduleId]: true }));
        try {
            await iopTrainerAPI.unlockGroupModule(activeGroup.id, {
                module_id: moduleId,
                unlocked_up_to_day: unlockDraft[moduleId] ?? 0,
            });
            // update local curriculum
            setCurriculum(prev =>
                prev.map(m => m.id === moduleId
                    ? { ...m, unlocked_up_to_day: unlockDraft[moduleId] }
                    : m
                )
            );
            showToast('Module unlock saved successfully');
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to save unlock', 'error');
        } finally {
            setSubmittingUnlock(prev => ({ ...prev, [moduleId]: false }));
        }
    };

    /* ── submit attendance ── */
    const handleSaveAttendance = async () => {
        if (!activeGroup) return;
        const records = students.map(s => ({
            student_id: s.id,
            batch_id: s.batch_id,
            status: attendance[s.id] || 'absent',
        }));
        setSubmittingAttendance(true);
        try {
            await iopTrainerAPI.markGroupAttendance(activeGroup.id, {
                attendance_date: attendanceDate,
                records,
            });
            showToast('Attendance saved successfully');
            setAttendanceLoaded(true);
        } catch (err) {
            showToast(err?.response?.data?.message || 'Failed to save attendance', 'error');
        } finally {
            setSubmittingAttendance(false);
        }
    };

    /* ─────────────────────────────────────────────────────── */
    /*  RENDER                                                  */
    /* ─────────────────────────────────────────────────────── */

    if (loading) return <LoadingSpinner label="Loading IOP Groups…" />;

    const pageWrap = {
        minHeight: '100vh',
        background: theme.bg.main,
        padding: '32px',
        fontFamily: theme.font.family,
        animation: 'fadeIn 0.4s ease',
        position: 'relative',
    };

    return (
        <div style={pageWrap}>
            <style>{fadeIn}</style>

            {/* ── Toast ── */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
                    padding: '13px 20px',
                    borderRadius: theme.radius.md,
                    background: toast.type === 'error' ? `${theme.accent.red}18` : `${theme.accent.green}18`,
                    border: `1px solid ${toast.type === 'error' ? theme.accent.red : theme.accent.green}30`,
                    color: toast.type === 'error' ? theme.accent.red : theme.accent.green,
                    fontSize: '13px', fontWeight: 700,
                    boxShadow: theme.shadow.card,
                    animation: 'fadeIn 0.3s ease',
                    maxWidth: '340px',
                }}>
                    {toast.msg}
                </div>
            )}

            {/* ══════════════════════════════════════════════
                VIEW: LIST
               ══════════════════════════════════════════════ */}
            {view === 'list' && (
                <>
                    <PageHeader
                        title="My IOP Groups"
                        subtitle="Merged batch sessions you manage"
                        icon={<Layers size={22} />}
                        accentColor={theme.accent.purple}
                    />

                    {error && (
                        <div style={{
                            padding: '13px 18px', borderRadius: theme.radius.md, marginBottom: '20px',
                            background: `${theme.accent.red}10`, border: `1px solid ${theme.accent.red}25`,
                            color: theme.accent.red, fontSize: '13px', fontWeight: 600,
                        }}>{error}</div>
                    )}

                    {groups.length === 0 ? (
                        <EmptyState
                            icon={<Layers size={28} />}
                            title="No groups assigned"
                            subtitle="You have not been assigned to any IOP groups yet. Contact the administrator."
                        />
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '16px',
                        }}>
                            {groups.map(g => (
                                <GroupCard key={g.id} group={g} onClick={() => openGroup(g)} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ══════════════════════════════════════════════
                VIEW: DETAIL
               ══════════════════════════════════════════════ */}
            {view === 'detail' && activeGroup && (
                <>
                    {/* Back + heading */}
                    <div style={{ marginBottom: '24px' }}>
                        <button
                            onClick={goBack}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                color: theme.text.muted, fontSize: '13px', fontWeight: 600,
                                padding: '4px 0', marginBottom: '16px',
                            }}
                        >
                            <ChevronLeft size={16} /> Back to Groups
                        </button>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: theme.text.primary, margin: 0 }}>
                                        {activeGroup.name}
                                    </h1>
                                    <StatusBadge status={activeGroup.status ?? 'active'} />
                                </div>
                                {/* meta row */}
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                    {[
                                        { icon: <Layers size={13} />, label: `${activeGroup.batch_count ?? '?'} batch${activeGroup.batch_count !== 1 ? 'es' : ''} merged` },
                                        { icon: <Users size={13} />, label: `${activeGroup.student_count ?? students.length} students` },
                                        { icon: <Calendar size={13} />, label: `${fmtDate(activeGroup.start_date)} – ${fmtDate(activeGroup.end_date)}` },
                                        ...(activeGroup.timing ? [{ icon: <Clock size={13} />, label: activeGroup.timing }] : []),
                                    ].map((item, i) => (
                                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: theme.text.muted, fontWeight: 500 }}>
                                            {item.icon}{item.label}
                                        </span>
                                    ))}
                                </div>
                                {/* batch tags */}
                                {activeGroup.batches && activeGroup.batches.length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        {activeGroup.batches.map((b, i) => (
                                            <span key={i} style={{
                                                padding: '3px 10px', borderRadius: theme.radius.full,
                                                background: `${theme.accent.purple}12`,
                                                color: theme.accent.purple,
                                                fontSize: '10px', fontWeight: 700,
                                            }}>{b}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div style={{ marginBottom: '24px' }}>
                        <FilterTabs
                            tabs={[
                                { value: 'curriculum', label: 'Curriculum' },
                                { value: 'students', label: 'Students' },
                                { value: 'attendance', label: 'Attendance' },
                            ]}
                            active={activeTab}
                            onChange={setActiveTab}
                        />
                    </div>

                    {detailLoading ? (
                        <LoadingSpinner label="Loading group details…" />
                    ) : (
                        <>
                            {/* ── Tab: Curriculum ── */}
                            {activeTab === 'curriculum' && (
                                <CurriculumTab
                                    curriculum={curriculum}
                                    unlockDraft={unlockDraft}
                                    setUnlockDraft={setUnlockDraft}
                                    submittingUnlock={submittingUnlock}
                                    handleUnlock={handleUnlock}
                                    expandedModules={expandedModules}
                                    setExpandedModules={setExpandedModules}
                                />
                            )}

                            {/* ── Tab: Students ── */}
                            {activeTab === 'students' && (
                                <StudentsTab students={students} />
                            )}

                            {/* ── Tab: Attendance ── */}
                            {activeTab === 'attendance' && (
                                <AttendanceTab
                                    students={students}
                                    attendance={attendance}
                                    setAttendance={setAttendance}
                                    attendanceDate={attendanceDate}
                                    setAttendanceDate={(d) => {
                                        setAttendanceDate(d);
                                        setAttendanceLoaded(false);
                                        setAttendance({});
                                        loadAttendance(d);
                                    }}
                                    loadingAttendance={loadingAttendance}
                                    attendanceLoaded={attendanceLoaded}
                                    submittingAttendance={submittingAttendance}
                                    handleSaveAttendance={handleSaveAttendance}
                                    loadAttendance={loadAttendance}
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────── */
/*  Sub-views                                                   */
/* ─────────────────────────────────────────────────────────── */

/* ── Group Card (list view) ── */
const GroupCard = ({ group, onClick }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? theme.bg.cardHover : theme.bg.card,
                border: `1px solid ${theme.border.subtle}`,
                borderRadius: theme.radius.lg,
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: hovered ? 'translateY(-2px)' : 'none',
                boxShadow: hovered ? theme.shadow.cardHover : theme.shadow.card,
                borderTop: `3px solid ${theme.accent.purple}`,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: theme.text.primary, flex: 1, marginRight: '10px' }}>
                    {group.name}
                </h3>
                <StatusBadge status={group.status ?? 'active'} />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {[
                    { label: 'Batches', val: group.batch_count ?? '?' },
                    { label: 'Students', val: group.student_count ?? '?' },
                ].map(item => (
                    <div key={item.label}>
                        <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>{item.label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: theme.text.primary }}>{item.val}</p>
                    </div>
                ))}
            </div>

            {/* batch tags */}
            {group.batches && group.batches.length > 0 && (
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {group.batches.slice(0, 4).map((b, i) => (
                        <span key={i} style={{
                            padding: '2px 8px', borderRadius: theme.radius.full,
                            background: `${theme.accent.purple}12`, color: theme.accent.purple,
                            fontSize: '10px', fontWeight: 700,
                        }}>{b}</span>
                    ))}
                    {group.batches.length > 4 && (
                        <span style={{ padding: '2px 8px', borderRadius: theme.radius.full, background: 'rgba(255,255,255,0.05)', color: theme.text.muted, fontSize: '10px', fontWeight: 700 }}>
                            +{group.batches.length - 4}
                        </span>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '11px', color: theme.text.muted, fontWeight: 500 }}>
                        {fmtDate(group.start_date)} — {fmtDate(group.end_date)}
                    </p>
                    {group.timing && (
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: theme.text.muted, fontWeight: 500 }}>
                            {group.timing}
                        </p>
                    )}
                </div>
                <ChevronRight size={16} color={theme.accent.purple} />
            </div>
        </div>
    );
};

/* ── Curriculum Tab ── */
const CurriculumTab = ({
    curriculum, unlockDraft, setUnlockDraft,
    submittingUnlock, handleUnlock,
    expandedModules, setExpandedModules,
}) => {
    if (curriculum.length === 0) {
        return (
            <EmptyState
                icon={<BookOpen size={28} />}
                title="No curriculum modules"
                subtitle="This group has no IOP curriculum modules assigned yet."
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {curriculum.map(mod => {
                const topics = mod.topics ?? [];
                const maxDay = topics.length > 0
                    ? Math.max(...topics.map(t => t.day_number ?? 0))
                    : 0;
                const currentUnlock = unlockDraft[mod.id] ?? mod.unlocked_up_to_day ?? 0;
                const unlockedCount = topics.filter(t => (t.day_number ?? 0) <= currentUnlock).length;
                const typeColor = moduleTypeColor(mod.type ?? mod.module_type);
                const isExpanded = !!expandedModules[mod.id];
                const isSaving = !!submittingUnlock[mod.id];

                return (
                    <Card key={mod.id} style={{ overflow: 'hidden' }}>
                        {/* Module header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '180px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: theme.text.primary }}>
                                        {mod.title ?? mod.module_title ?? `Module ${mod.id}`}
                                    </h3>
                                    <span style={{
                                        padding: '3px 10px', borderRadius: theme.radius.full,
                                        background: `${typeColor}15`, color: typeColor,
                                        fontSize: '10px', fontWeight: 700,
                                    }}>
                                        {moduleTypeLabel(mod.type ?? mod.module_type)}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '12px', color: theme.text.muted, fontWeight: 500 }}>
                                    {topics.length} topic{topics.length !== 1 ? 's' : ''} total
                                    {maxDay > 0 ? ` · up to Day ${maxDay}` : ''}
                                </p>
                            </div>
                        </div>

                        {/* Unlock progress */}
                        <div style={{
                            background: `${theme.accent.purple}08`,
                            border: `1px solid ${theme.accent.purple}18`,
                            borderRadius: theme.radius.md,
                            padding: '14px 16px',
                            marginBottom: '14px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: theme.text.label, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Unlock Progress
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: theme.accent.purple }}>
                                    {unlockedCount} / {topics.length} topics unlocked
                                </span>
                            </div>

                            {/* Progress bar */}
                            {topics.length > 0 && (
                                <div style={{
                                    height: '6px', borderRadius: '3px',
                                    background: 'rgba(255,255,255,0.06)',
                                    marginBottom: '14px', overflow: 'hidden',
                                }}>
                                    <div style={{
                                        height: '100%', borderRadius: '3px',
                                        background: theme.accent.purple,
                                        width: `${topics.length > 0 ? (unlockedCount / topics.length) * 100 : 0}%`,
                                        transition: 'width 0.3s ease',
                                    }} />
                                </div>
                            )}

                            {/* Unlock control */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '180px' }}>
                                    <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>
                                        Unlock up to Day
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={maxDay || 999}
                                        value={currentUnlock}
                                        onChange={e => setUnlockDraft(prev => ({
                                            ...prev,
                                            [mod.id]: Math.max(0, Math.min(maxDay || 999, Number(e.target.value))),
                                        }))}
                                        style={{
                                            width: '100px', padding: '8px 12px',
                                            borderRadius: theme.radius.md,
                                            background: theme.bg.input,
                                            border: `1px solid ${theme.border.subtle}`,
                                            color: theme.text.primary,
                                            fontSize: '14px', fontWeight: 700,
                                            outline: 'none',
                                        }}
                                    />
                                    {maxDay > 0 && (
                                        <p style={{ margin: 0, fontSize: '10px', color: theme.text.muted }}>Max: Day {maxDay}</p>
                                    )}
                                </div>

                                {/* range slider */}
                                {maxDay > 0 && (
                                    <div style={{ flex: 2, minWidth: '140px' }}>
                                        <input
                                            type="range"
                                            min={0}
                                            max={maxDay}
                                            value={currentUnlock}
                                            onChange={e => setUnlockDraft(prev => ({
                                                ...prev,
                                                [mod.id]: Number(e.target.value),
                                            }))}
                                            style={{ width: '100%', accentColor: theme.accent.purple, cursor: 'pointer' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: theme.text.muted, marginTop: '2px' }}>
                                            <span>Day 0</span>
                                            <span>Day {maxDay}</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleUnlock(mod.id)}
                                    disabled={isSaving}
                                    style={{
                                        padding: '9px 18px', borderRadius: theme.radius.md,
                                        background: isSaving ? 'rgba(255,255,255,0.04)' : theme.accent.purple,
                                        color: isSaving ? theme.text.muted : '#fff',
                                        border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                                        fontSize: '12px', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        transition: 'all 0.2s', flexShrink: 0,
                                    }}
                                >
                                    {isSaving ? <Spin /> : <Save size={14} />}
                                    {isSaving ? 'Saving…' : 'Save Unlock'}
                                </button>
                            </div>
                        </div>

                        {/* Topics collapsible */}
                        {topics.length > 0 && (
                            <>
                                <button
                                    onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !isExpanded }))}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        color: theme.text.muted, fontSize: '12px', fontWeight: 700,
                                        padding: '4px 0',
                                    }}
                                >
                                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                    {isExpanded ? 'Hide' : 'Show'} Topics ({topics.length})
                                </button>

                                {isExpanded && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {topics
                                            .slice()
                                            .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
                                            .map((topic, ti) => {
                                                const isUnlocked = (topic.day_number ?? 0) <= currentUnlock;
                                                return (
                                                    <div key={topic.id ?? ti} style={{
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        padding: '8px 12px',
                                                        borderRadius: theme.radius.sm,
                                                        background: isUnlocked ? `${theme.accent.green}08` : 'rgba(255,255,255,0.02)',
                                                        border: `1px solid ${isUnlocked ? theme.accent.green + '18' : theme.border.subtle}`,
                                                    }}>
                                                        {isUnlocked
                                                            ? <CheckCircle size={14} color={theme.accent.green} style={{ flexShrink: 0 }} />
                                                            : <Circle size={14} color={theme.text.muted} style={{ flexShrink: 0 }} />
                                                        }
                                                        <span style={{ flex: 1, fontSize: '13px', color: isUnlocked ? theme.text.primary : theme.text.muted, fontWeight: 500 }}>
                                                            {topic.title ?? topic.topic_title ?? `Topic ${ti + 1}`}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '10px', fontWeight: 700,
                                                            color: isUnlocked ? theme.accent.green : theme.text.muted,
                                                            padding: '2px 8px', borderRadius: theme.radius.full,
                                                            background: isUnlocked ? `${theme.accent.green}12` : 'rgba(255,255,255,0.04)',
                                                        }}>
                                                            Day {topic.day_number ?? '?'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </>
                        )}
                    </Card>
                );
            })}
        </div>
    );
};

/* ── Students Tab ── */
const StudentsTab = ({ students }) => {
    if (students.length === 0) {
        return (
            <EmptyState
                icon={<Users size={28} />}
                title="No students found"
                subtitle="No students are linked to this group yet."
            />
        );
    }

    const byBatch = groupBy(students, 'batch_name');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.entries(byBatch).map(([batchName, batchStudents]) => (
                <div key={batchName}>
                    <SectionTitle count={batchStudents.length}>{batchName}</SectionTitle>
                    <Card noPadding>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Roll No.', 'Name', 'Email', 'Course', 'Status'].map(h => (
                                        <th key={h} style={{
                                            padding: '11px 16px', textAlign: 'left',
                                            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                                            letterSpacing: '0.1em', color: theme.text.label,
                                            borderBottom: `1px solid ${theme.border.subtle}`,
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {batchStudents.map((s, i) => (
                                    <tr key={s.id ?? i} style={{
                                        borderBottom: i < batchStudents.length - 1 ? `1px solid ${theme.border.subtle}` : 'none',
                                    }}>
                                        <td style={{ padding: '11px 16px', fontSize: '12px', color: theme.text.muted, fontWeight: 600 }}>
                                            {s.roll_number ?? '—'}
                                        </td>
                                        <td style={{ padding: '11px 16px', fontSize: '13px', color: theme.text.primary, fontWeight: 600 }}>
                                            {s.name ?? `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || '—'}
                                        </td>
                                        <td style={{ padding: '11px 16px', fontSize: '12px', color: theme.text.muted, fontWeight: 500 }}>
                                            {s.email ?? '—'}
                                        </td>
                                        <td style={{ padding: '11px 16px', fontSize: '12px', color: theme.text.secondary, fontWeight: 500 }}>
                                            {s.course_name ?? '—'}
                                        </td>
                                        <td style={{ padding: '11px 16px' }}>
                                            <StatusBadge status={s.student_status ?? s.status ?? 'active'} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            ))}
        </div>
    );
};

/* ── Attendance Tab ── */
const AttendanceTab = ({
    students, attendance, setAttendance,
    attendanceDate, setAttendanceDate,
    loadingAttendance, attendanceLoaded,
    submittingAttendance, handleSaveAttendance,
    loadAttendance,
}) => {
    const presentCount = Object.values(attendance).filter(v => v === 'present').length;
    const absentCount = Object.values(attendance).filter(v => v === 'absent').length;
    const lateCount = Object.values(attendance).filter(v => v === 'late').length;

    return (
        <div>
            {/* Date picker + load */}
            <Card style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>
                            Attendance Date
                        </label>
                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={e => setAttendanceDate(e.target.value)}
                            style={{
                                padding: '9px 13px', borderRadius: theme.radius.md,
                                background: theme.bg.input,
                                border: `1px solid ${theme.border.subtle}`,
                                color: theme.text.primary, fontSize: '13px', fontWeight: 600,
                                outline: 'none', cursor: 'pointer',
                            }}
                        />
                    </div>
                    <ActionButton
                        icon={loadingAttendance ? <Spin /> : <RefreshCw size={14} />}
                        onClick={() => loadAttendance(attendanceDate)}
                        disabled={loadingAttendance}
                        variant="secondary"
                    >
                        {loadingAttendance ? 'Loading…' : 'Load Attendance'}
                    </ActionButton>

                    {attendanceLoaded && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {[
                                { label: 'Present', count: presentCount, color: theme.accent.green },
                                { label: 'Absent', count: absentCount, color: theme.accent.red },
                                { label: 'Late', count: lateCount, color: theme.accent.yellow },
                            ].map(item => (
                                <div key={item.label} style={{
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    padding: '5px 12px', borderRadius: theme.radius.full,
                                    background: `${item.color}12`, border: `1px solid ${item.color}20`,
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: item.color }}>
                                        {item.count} {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {students.length === 0 ? (
                <EmptyState
                    icon={<Users size={28} />}
                    title="No students"
                    subtitle="No students found for this group."
                />
            ) : (
                <>
                    <Card noPadding style={{ marginBottom: '16px' }}>
                        {/* header row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr auto',
                            gap: '12px',
                            padding: '10px 16px',
                            borderBottom: `1px solid ${theme.border.subtle}`,
                        }}>
                            {['Student', 'Batch', 'Attendance Status'].map(h => (
                                <span key={h} style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>
                                    {h}
                                </span>
                            ))}
                        </div>

                        {students.map((s, i) => {
                            const name = s.name ?? `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || `Student ${i + 1}`;
                            const current = attendance[s.id];
                            return (
                                <div
                                    key={s.id ?? i}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr auto',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        alignItems: 'center',
                                        borderBottom: i < students.length - 1 ? `1px solid ${theme.border.subtle}` : 'none',
                                        background: current === 'present'
                                            ? `${theme.accent.green}05`
                                            : current === 'absent'
                                                ? `${theme.accent.red}05`
                                                : current === 'late'
                                                    ? `${theme.accent.yellow}05`
                                                    : 'transparent',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    <div>
                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: theme.text.primary }}>{name}</p>
                                        {s.roll_number && (
                                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: theme.text.muted, fontWeight: 500 }}>{s.roll_number}</p>
                                        )}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '12px', color: theme.text.muted, fontWeight: 500 }}>
                                        {s.batch_name ?? '—'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {STATUSES.map(status => (
                                            <AttStatusBtn
                                                key={status}
                                                value={status}
                                                active={current === status}
                                                onClick={val => setAttendance(prev => ({ ...prev, [s.id]: val }))}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </Card>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <ActionButton
                            icon={submittingAttendance ? <Spin /> : <Save size={14} />}
                            onClick={handleSaveAttendance}
                            disabled={submittingAttendance}
                            variant="success"
                        >
                            {submittingAttendance ? 'Saving Attendance…' : 'Save Attendance'}
                        </ActionButton>
                    </div>
                </>
            )}
        </div>
    );
};

export default IOPTrainerGroups;
