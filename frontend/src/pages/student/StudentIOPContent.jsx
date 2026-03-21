import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import theme from './theme';
import {
    PageHeader, Card, LoadingSpinner, EmptyState,
} from './StudentComponents';
import {
    Layers, CheckCircle, Lock, Download, Brain,
} from 'lucide-react';

const TYPE_SLOTS = [
    { key: 'soft_skills', label: 'Soft Skills', color: '#10b981', rgb: '16,185,129' },
    { key: 'aptitude',    label: 'Aptitude',    color: '#fb923c', rgb: '251,146,60' },
];

const FILE_SLOTS = [
    { key: 'concepts',        label: 'Concepts',        color: '#3b82f6' },
    { key: 'sample_problems', label: 'Sample Problems', color: '#8b5cf6' },
    { key: 'worksheet',       label: 'Worksheets',      color: '#f59e0b' },
];

export const StudentIOPContent = () => {
    const [modules, setModules]       = useState(null); // null = loading
    const [isIOP, setIsIOP]           = useState(null);
    const [typeFilter, setTypeFilter] = useState('soft_skills');
    const [loading, setLoading]       = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        studentAPI.getIOPCurriculum()
            .then(r => {
                setModules(r.data.modules || []);
                setIsIOP(true);
            })
            .catch(() => {
                setIsIOP(false);
                setModules([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleDownload = async (fileId, fileName) => {
        try {
            const r = await studentAPI.downloadIOPModuleFile(fileId);
            const url = window.URL.createObjectURL(new Blob([r.data]));
            const a = document.createElement('a');
            a.href = url; a.download = fileName; a.click();
            window.URL.revokeObjectURL(url);
        } catch { alert('Download failed'); }
    };

    if (loading) return <LoadingSpinner label="Loading Soft Skills & Aptitude content..." />;

    // ── JRP Student: not an IOP student ───────────────────────────────────────
    if (!isIOP) {
        return (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                <PageHeader
                    title="Soft Skills & Aptitude"
                    subtitle="IOP program training content"
                    icon={<Layers size={24} />}
                    accentColor="#10b981"
                />
                <div style={{
                    textAlign: 'center', padding: '60px 24px',
                    background: theme.bg.card, border: `1px solid ${theme.border.subtle}`,
                    borderRadius: theme.radius.lg,
                }}>
                    <Layers size={52} color={theme.text.muted} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <h3 style={{ color: theme.text.primary, margin: '0 0 8px', fontSize: '18px' }}>
                        Not Available for JRP Students
                    </h3>
                    <p style={{ color: theme.text.muted, margin: '0 0 24px', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
                        The Soft Skills & Aptitude section is part of the IOP program and is not available for JRP students.
                    </p>
                    <button
                        onClick={() => navigate('/student/materials')}
                        style={{
                            padding: '10px 28px', borderRadius: theme.radius.md,
                            background: theme.accent.blue, color: '#fff', border: 'none',
                            cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                        }}
                    >
                        Go to Course Materials
                    </button>
                </div>
                <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
            </div>
        );
    }

    // ── IOP Student: full content browser ─────────────────────────────────────
    const activeType   = TYPE_SLOTS.find(t => t.key === typeFilter);
    const typeColor    = activeType?.color || '#10b981';
    const typeRgb      = activeType?.rgb   || '16,185,129';

    const filteredMods  = (modules || []).filter(m => m.type === typeFilter);
    const totalUnlocked = filteredMods.filter(m => m.is_unlocked).length;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="Soft Skills & Aptitude"
                subtitle={`${(modules || []).filter(m => m.is_unlocked).length} module${(modules || []).filter(m => m.is_unlocked).length !== 1 ? 's' : ''} unlocked · IOP program content`}
                icon={<Layers size={24} />}
                accentColor="#10b981"
            />

            {/* Type filter pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {TYPE_SLOTS.map(t => (
                    <button key={t.key} onClick={() => setTypeFilter(t.key)} style={{
                        padding: '9px 22px', borderRadius: '24px', fontWeight: 700,
                        fontSize: '13px', cursor: 'pointer', transition: 'all .2s',
                        background: typeFilter === t.key ? `rgba(${t.rgb},0.12)` : 'transparent',
                        color: typeFilter === t.key ? t.color : theme.text.muted,
                        border: `1.5px solid ${typeFilter === t.key ? t.color : theme.border.subtle}`,
                    }}>
                        {t.label} ({(modules || []).filter(m => m.type === t.key).length})
                    </button>
                ))}
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Modules', value: filteredMods.length,                    color: typeColor },
                    { label: 'Unlocked',       value: totalUnlocked,                         color: '#10b981' },
                    { label: 'Locked',         value: filteredMods.length - totalUnlocked,   color: theme.text.muted },
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: theme.bg.card, border: `1px solid ${theme.border.subtle}`,
                        borderRadius: theme.radius.md, padding: '16px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '30px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '11px', color: theme.text.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Module cards */}
            {filteredMods.length === 0 ? (
                <EmptyState
                    icon={<Layers size={36} />}
                    title="No modules yet"
                    subtitle="Your IOP trainer will unlock modules as the program progresses."
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filteredMods.map(mod => {
                        const unlockedTopics = mod.topics.filter(t => t.is_unlocked).length;
                        const totalTopics    = mod.topics.length;
                        const hasFiles       = mod.files && Object.keys(mod.files).length > 0;

                        return (
                            <Card key={mod.id} style={{ opacity: mod.is_unlocked ? 1 : 0.6 }}>

                                {/* Module header */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: (totalTopics > 0 || hasFiles) && mod.is_unlocked ? '14px' : 0 }}>
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: theme.radius.md, flexShrink: 0,
                                        background: `rgba(${typeRgb},0.12)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {mod.is_unlocked
                                            ? <Layers size={18} color={typeColor} />
                                            : <Lock size={18} color={theme.text.muted} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: mod.is_unlocked ? theme.text.primary : theme.text.muted }}>
                                            {mod.sequence_order}. {mod.title}
                                        </div>
                                        <div style={{ fontSize: '12px', color: theme.text.muted, marginTop: '2px' }}>
                                            {mod.is_unlocked
                                                ? `${unlockedTopics} of ${totalTopics} topics unlocked`
                                                : 'Not yet unlocked by your IOP trainer'}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, flexShrink: 0,
                                        background: mod.is_unlocked ? `rgba(${typeRgb},0.12)` : 'rgba(255,255,255,0.04)',
                                        color: mod.is_unlocked ? typeColor : theme.text.muted,
                                        border: `1px solid ${mod.is_unlocked ? typeColor + '40' : 'transparent'}`,
                                    }}>
                                        Day {mod.unlocked_up_to_day}/{totalTopics}
                                    </div>
                                </div>

                                {/* Topics — only for unlocked modules */}
                                {mod.is_unlocked && totalTopics > 0 && (
                                    <div style={{ marginBottom: hasFiles ? '14px' : 0 }}>
                                        {mod.topics.map(t => (
                                            <div key={t.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '8px 10px', borderRadius: '6px', marginBottom: '4px',
                                                background: t.is_unlocked ? `rgba(${typeRgb},0.05)` : 'transparent',
                                                border: `1px solid ${t.is_unlocked ? typeColor + '22' : 'transparent'}`,
                                            }}>
                                                {t.is_unlocked
                                                    ? <CheckCircle size={13} color={typeColor} />
                                                    : <Lock size={13} color={theme.text.muted} style={{ opacity: 0.35 }} />}
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: typeColor, minWidth: '48px' }}>
                                                    Day {t.day_number}
                                                </span>
                                                <span style={{ fontSize: '13px', color: t.is_unlocked ? theme.text.primary : theme.text.muted, flex: 1 }}>
                                                    {t.topic_name}
                                                </span>
                                                {t.notes && (
                                                    <span style={{ fontSize: '11px', color: theme.text.muted, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {t.notes}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* File downloads — only for unlocked modules with uploaded files */}
                                {mod.is_unlocked && hasFiles && (
                                    <div style={{ paddingTop: '12px', borderTop: `1px solid ${theme.border.subtle}` }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: theme.text.muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Study Materials
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {FILE_SLOTS.map(slot => {
                                                const f = mod.files[slot.key];
                                                if (!f) return null;
                                                return (
                                                    <button
                                                        key={slot.key}
                                                        onClick={() => handleDownload(f.id, f.file_name)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            padding: '7px 18px', borderRadius: '7px',
                                                            border: `1px solid ${slot.color}`,
                                                            background: `${slot.color}12`,
                                                            color: slot.color, cursor: 'pointer',
                                                            fontSize: '12px', fontWeight: 600,
                                                            transition: 'opacity 0.15s',
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                                    >
                                                        <Download size={12} /> {slot.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export default StudentIOPContent;
